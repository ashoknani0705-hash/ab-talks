'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { InterviewState, ChatMessage, Candidate, AnswerScore, FinalReport } from './types';
import {
  generateQuestion,
  evaluateAnswer,
  generateFinalReport,
  canEndInterview,
  retrieveNextTopic,
  curriculum,
  MIN_QUESTIONS,
  MIN_DAYS,
} from './interview-engine';
import { supabase } from './supabase';

type InterviewContextValue = InterviewState & {
  startInterview: (candidate: Candidate) => Promise<void>;
  submitAnswer: (answer: string) => Promise<void>;
  endInterview: () => Promise<void>;
  resetInterview: () => void;
  loadReport: (sessionId: string) => Promise<FinalReport | null>;
  fetchSessions: () => Promise<SessionSummary[]>;
};

export type SessionSummary = {
  id: string;
  candidate_id: string;
  candidate_name: string;
  overall_score: number | null;
  question_count: number;
  started_at: string;
  completed_at: string | null;
  final_report: FinalReport | null;
};

const initialState: InterviewState = {
  status: 'idle',
  candidate: null,
  conversation: [],
  questionCount: 0,
  daysCovered: [],
  scores: [],
  currentTopic: null,
  currentDay: null,
  isAgentTyping: false,
  isComplete: false,
  canEndInterview: false,
  error: null,
  finalReport: null,
  sessionId: null,
};

const InterviewContext = createContext<InterviewContextValue | null>(null);

export function InterviewProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<InterviewState>(initialState);
  const sessionIdRef = useRef<string | null>(null);

  const startInterview = useCallback(async (candidate: Candidate) => {
    sessionIdRef.current = crypto.randomUUID();
    setState({
      ...initialState,
      candidate,
      status: 'active',
      sessionId: sessionIdRef.current,
    });

    // Generate first question
    const retrieval = retrieveNextTopic(candidate, []);
    if (!retrieval) return;

    setState((prev) => ({ ...prev, isAgentTyping: true }));

    // Simulate agent thinking time
    await new Promise((r) => setTimeout(r, 1200));

    const result = generateQuestion(candidate, [], [], retrieval.contextChunks);
    const firstMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'agent',
      content: `Hi ${candidate.name.split(' ')[0]}, welcome to your AB TALKS technical interview. I'll be asking you questions based on your cohort journey. Let's start.\n\n${result.question}`,
      dayCovered: result.day,
      topic: result.topic,
      timestamp: Date.now(),
    };

    setState((prev) => ({
      ...prev,
      conversation: [firstMessage],
      currentTopic: result.topic,
      currentDay: result.day,
      questionCount: 1,
      isAgentTyping: false,
    }));
  }, []);

  const submitAnswer = useCallback(async (answer: string) => {
    const trimmed = answer.trim();
    if (!trimmed) return;

    setState((prev) => {
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
        dayCovered: prev.currentDay || undefined,
        topic: prev.currentTopic || undefined,
        timestamp: Date.now(),
      };
      return {
        ...prev,
        conversation: [...prev.conversation, userMessage],
        isAgentTyping: true,
      };
    });

    // Evaluate the answer (Agent 3 - background)
    await new Promise((r) => setTimeout(r, 400));

    setState((prev) => {
      const candidate = prev.candidate;
      if (!candidate) return prev;

      const day = curriculum.find((d) => d.day === prev.currentDay);
      if (!day) return prev;

      const score = evaluateAnswer(
        prev.conversation[prev.conversation.length - 2]?.content || '',
        trimmed,
        day,
        candidate
      );

      const updatedScores = [...prev.scores, score];
      const updatedConversation = [...prev.conversation];
      updatedConversation[updatedConversation.length - 1].score = score;

      return {
        ...prev,
        scores: updatedScores,
        conversation: updatedConversation,
      };
    });

    // Generate next question
    await new Promise((r) => setTimeout(r, 1000));

    setState((prev) => {
      const candidate = prev.candidate;
      if (!candidate) return prev;

      const retrieval = retrieveNextTopic(candidate, prev.daysCovered);
      const contextChunks = retrieval?.contextChunks || [];
      const result = generateQuestion(candidate, prev.daysCovered, prev.conversation, contextChunks);

      const agentMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'agent',
        content: result.question,
        dayCovered: result.day,
        topic: result.topic,
        timestamp: Date.now(),
        isFollowUp: result.isFollowUp,
      };

      const newDaysCovered = prev.daysCovered.includes(result.day)
        ? prev.daysCovered
        : [...prev.daysCovered, result.day];

      const newQuestionCount = result.isFollowUp ? prev.questionCount : prev.questionCount + 1;
      const canEnd = canEndInterview(newQuestionCount, newDaysCovered);

      return {
        ...prev,
        conversation: [...prev.conversation, agentMessage],
        currentTopic: result.topic,
        currentDay: result.day,
        questionCount: newQuestionCount,
        daysCovered: newDaysCovered,
        isAgentTyping: false,
        canEndInterview: canEnd,
      };
    });
  }, []);

  const endInterview = useCallback(async () => {
    setState((prev) => ({ ...prev, status: 'evaluating', isAgentTyping: true }));

    await new Promise((r) => setTimeout(r, 1500));

    setState((prev) => {
      const candidate = prev.candidate;
      if (!candidate) return prev;

      const report = generateFinalReport(candidate, prev.conversation, prev.scores, prev.daysCovered);

      return {
        ...prev,
        status: 'complete',
        isComplete: true,
        isAgentTyping: false,
        finalReport: report,
      };
    });

    // Persist to Supabase
    setState((prev) => {
      if (prev.sessionId && prev.candidate) {
        supabase
          .from('interview_sessions')
          .insert({
            id: prev.sessionId,
            candidate_id: prev.candidate.id,
            candidate_name: prev.candidate.name,
            conversation: JSON.parse(JSON.stringify(prev.conversation)),
            question_count: prev.questionCount,
            days_covered: prev.daysCovered,
            scores: JSON.parse(JSON.stringify(prev.scores)),
            final_report: prev.finalReport,
            overall_score: prev.finalReport?.overallScore || null,
            started_at: new Date(prev.conversation[0]?.timestamp || Date.now()).toISOString(),
            completed_at: new Date().toISOString(),
          })
          .then(({ error }) => {
            if (error) console.error('Failed to save session:', error);
          });
      }
      return prev;
    });
  }, []);

  const resetInterview = useCallback(() => {
    sessionIdRef.current = null;
    setState(initialState);
  }, []);

  const loadReport = useCallback(async (sessionId: string): Promise<FinalReport | null> => {
    const { data, error } = await supabase
      .from('interview_sessions')
      .select('final_report')
      .eq('id', sessionId)
      .maybeSingle();

    if (error || !data?.final_report) return null;
    return data.final_report as FinalReport;
  }, []);

  const fetchSessions = useCallback(async (): Promise<SessionSummary[]> => {
    const { data, error } = await supabase
      .from('interview_sessions')
      .select('id, candidate_id, candidate_name, overall_score, question_count, started_at, completed_at, final_report')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !data) return [];
    return data as SessionSummary[];
  }, []);

  return (
    <InterviewContext.Provider
      value={{
        ...state,
        startInterview,
        submitAnswer,
        endInterview,
        resetInterview,
        loadReport,
        fetchSessions,
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
}

export function useInterview() {
  const ctx = useContext(InterviewContext);
  if (!ctx) throw new Error('useInterview must be used within InterviewProvider');
  return ctx;
}

export { MIN_QUESTIONS, MIN_DAYS };
