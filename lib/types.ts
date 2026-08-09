export type CurriculumDay = {
  day: number;
  title: string;
  module: string;
  description: string;
  objectives: string[];
  status: 'completed' | 'pending' | 'active';
};

export type Candidate = {
  id: string;
  name: string;
  title: string;
  avatar: string;
  summary: string;
  completedDays: number[];
  skippedDays: number[];
  attemptedDays: number[];
  strengths: string[];
  weaknesses: string[];
  learningSignals: {
    mostActiveModule: string;
    avgMissionScore: number;
    streakDays: number;
    totalAttempts: number;
    preferredTopics: string[];
  };
};

export type ChatMessage = {
  id: string;
  role: 'agent' | 'user';
  content: string;
  dayCovered?: number;
  topic?: string;
  timestamp: number;
  score?: AnswerScore;
  isFollowUp?: boolean;
};

export type AnswerScore = {
  technicalAccuracy: number; // 0-40
  depth: number; // 0-30
  clarity: number; // 0-30
  total: number; // 0-100
  explanation: string;
  improvement: string;
  modelAnswer: string;
};

export type InterviewSession = {
  id: string;
  candidateId: string;
  candidateName: string;
  conversation: ChatMessage[];
  questionCount: number;
  daysCovered: number[];
  scores: AnswerScore[];
  isComplete: boolean;
  startedAt: number;
  completedAt?: number;
  finalReport?: FinalReport;
};

export type FinalReport = {
  overallScore: number;
  topicScores: { topic: string; score: number; day: number }[];
  strengths: string[];
  growthAreas: string[];
  modelAnswers: { question: string; answer: string; day: number }[];
  summary: string;
  recommendation: string;
};

export type InterviewState = {
  status: 'idle' | 'active' | 'evaluating' | 'complete';
  candidate: Candidate | null;
  conversation: ChatMessage[];
  questionCount: number;
  daysCovered: number[];
  scores: AnswerScore[];
  currentTopic: string | null;
  currentDay: number | null;
  isAgentTyping: boolean;
  isComplete: boolean;
  canEndInterview: boolean;
  error: string | null;
  finalReport: FinalReport | null;
  sessionId: string | null;
};
