'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Square, Clock, Tag, AlertCircle, CheckCircle2, Lock, Sparkles, Lightbulb, ChevronDown } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { useInterview, MIN_QUESTIONS, MIN_DAYS } from '@/lib/interview-context';
import { curriculum } from '@/lib/interview-engine';
import { cn } from '@/lib/utils';

export default function InterviewPage() {
  const router = useRouter();
  const {
    status,
    candidate,
    conversation,
    questionCount,
    daysCovered,
    currentTopic,
    currentDay,
    isAgentTyping,
    isComplete,
    canEndInterview,
    error,
    submitAnswer,
    endInterview,
    resetInterview,
  } = useInterview();

  const [input, setInput] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Timer
  useEffect(() => {
    if (status !== 'active' && status !== 'evaluating') return;
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation, isAgentTyping]);

  // Redirect if no interview started
  useEffect(() => {
    if (status === 'idle') {
      router.push('/setup');
    }
  }, [status, router]);

  // Redirect when complete
  useEffect(() => {
    if (status === 'complete') {
      const timer = setTimeout(() => router.push('/report'), 2000);
      return () => clearTimeout(timer);
    }
  }, [status, router]);

  const handleSubmit = async () => {
    if (!input.trim() || isAgentTyping) return;
    const answer = input;
    setInput('');
    setShowHint(false);
    await submitAnswer(answer);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // Timer state: normal < 10min, warning 10-20min, critical > 20min
  const timerState = elapsed > 1200 ? 'critical' : elapsed > 600 ? 'warning' : 'normal';
  const timerClass = timerState === 'critical' ? 'timer-critical' : timerState === 'warning' ? 'timer-warning' : 'timer-normal';

  if (status === 'idle') {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Redirecting to setup...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (status === 'complete') {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 glow-emerald">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-foreground">Interview Complete!</h2>
            <p className="mt-2 text-sm text-muted-foreground">Generating your personalized report...</p>
            <div className="mt-4 flex justify-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-2 w-2 rounded-full bg-cyan-400 typing-dot"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </AppShell>
    );
  }

  const progress = Math.min(100, (questionCount / MIN_QUESTIONS) * 100);
  const currentDayInfo = currentDay ? curriculum.find((d) => d.day === currentDay) : null;
  const hint = currentDayInfo
    ? `Hint: Think about ${currentDayInfo.objectives[0]?.toLowerCase() || currentDayInfo.description.toLowerCase()}`
    : '';

  const answeredScores = conversation.filter((m) => m.role === 'user' && m.score);

  return (
    <AppShell>
      <div className="flex flex-col gap-4 lg:flex-row">
        {/* Main Chat Area */}
        <div className="min-w-0 flex-1">
          {/* Top Bar */}
          <div className="glass-card sticky top-0 z-20 rounded-2xl p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 sm:h-10 sm:w-10">
                  <Sparkles className="h-4 w-4 text-white sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-foreground">AI Interviewer</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {candidate?.name || 'Candidate'}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                {/* Timer */}
                <div className={cn('flex items-center gap-1.5 rounded-lg border border-border bg-secondary/30 px-2.5 py-1.5 sm:px-3', timerClass)}>
                  <Clock className="h-3.5 w-3.5" />
                  <span className="font-mono text-sm tabular-nums text-foreground">{formatTime(elapsed)}</span>
                </div>

                {/* Question counter */}
                <div className="rounded-lg border border-border bg-secondary/30 px-2.5 py-1.5 text-xs font-medium text-foreground sm:px-3">
                  Q {questionCount}/{MIN_QUESTIONS}+
                </div>

                {/* Mobile panel toggle */}
                <button
                  onClick={() => setShowMobilePanel(!showMobilePanel)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-secondary/30 text-muted-foreground transition-colors hover:text-foreground lg:hidden"
                  aria-label="Toggle session progress panel"
                  aria-expanded={showMobilePanel}
                >
                  <ChevronDown className={cn('h-4 w-4 transition-transform', showMobilePanel && 'rotate-180')} />
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div
            ref={scrollRef}
            className="mt-4 h-[calc(100vh-22rem)] overflow-y-auto rounded-2xl border border-border bg-card/40 p-3 sm:p-4 lg:h-[calc(100vh-22rem)]"
          >
            <AnimatePresence initial={false}>
              {conversation.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    'mb-4 flex gap-2 sm:gap-3',
                    msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
                      msg.role === 'agent'
                        ? 'bg-gradient-to-br from-cyan-500 to-purple-600 text-white'
                        : 'bg-secondary border border-border text-muted-foreground'
                    )}
                  >
                    {msg.role === 'agent' ? <Sparkles className="h-4 w-4" /> : (candidate?.avatar || 'U')}
                  </div>

                  {/* Message bubble */}
                  <div className={cn('min-w-0 max-w-[85%] sm:max-w-[80%]', msg.role === 'user' && 'flex flex-col items-end')}>
                    {/* Topic label */}
                    {msg.role === 'agent' && msg.topic && (
                      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-400">
                          <Tag className="h-2.5 w-2.5" />
                          {msg.topic}
                        </span>
                        {msg.isFollowUp && (
                          <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-400">
                            Follow-up
                          </span>
                        )}
                      </div>
                    )}

                    <div
                      className={cn(
                        'break-words-anywhere rounded-2xl px-3 py-3 text-sm sm:px-4',
                        msg.role === 'agent'
                          ? 'rounded-tl-sm bg-secondary/60 text-foreground'
                          : 'rounded-tr-sm bg-gradient-to-br from-cyan-500/15 to-purple-500/15 text-foreground'
                      )}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>

                    {/* Score badge for user messages */}
                    {msg.role === 'user' && msg.score && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            'rounded-lg px-2 py-0.5 text-xs font-bold',
                            msg.score.total >= 75
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : msg.score.total >= 50
                              ? 'bg-amber-500/15 text-amber-400'
                              : 'bg-red-500/15 text-red-400'
                          )}
                        >
                          {msg.score.total}/100
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Acc: {msg.score.technicalAccuracy}/40 • Depth: {msg.score.depth}/30 • Clarity: {msg.score.clarity}/30
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            {isAgentTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 flex gap-2 sm:gap-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-secondary/60 px-4 py-3">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-2 w-2 rounded-full bg-cyan-400 typing-dot"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Input Area */}
          <div className="mt-4">
            {/* Hint */}
            {showHint && hint && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-2 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2.5"
              >
                <Lightbulb className="h-4 w-4 shrink-0 text-amber-400" />
                <p className="text-xs text-amber-400/90">{hint}</p>
              </motion.div>
            )}

            <div className="flex items-end gap-2">
              <button
                onClick={() => setShowHint(!showHint)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-secondary/30 text-muted-foreground transition-all hover:text-amber-400"
                title="Toggle hint"
                aria-label="Toggle hint"
              >
                <Lightbulb className="h-4 w-4" />
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isAgentTyping}
                placeholder={isAgentTyping ? 'AI is typing...' : 'Type your answer here...'}
                rows={1}
                aria-label="Your answer"
                className="min-w-0 flex-1 resize-none rounded-xl border border-border bg-card/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 disabled:opacity-50"
                style={{ maxHeight: '120px' }}
              />
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || isAgentTyping}
                aria-label="Submit answer"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 text-white transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>

            {/* End Interview button */}
            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={() => setShowHint(!showHint)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {showHint ? 'Hide hint' : 'Need a hint?'}
              </button>

              {canEndInterview ? (
                <button
                  onClick={() => setShowEndConfirm(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-all hover:bg-red-500/20"
                >
                  <Square className="h-3 w-3" />
                  End Interview
                </button>
              ) : (
                <div
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary/20 px-3 py-1.5 text-xs text-muted-foreground"
                  title={`Need ${MIN_QUESTIONS} questions and ${MIN_DAYS} days. Currently: ${questionCount} questions, ${daysCovered.length} days.`}
                >
                  <Lock className="h-3 w-3" />
                  End ({questionCount}/{MIN_QUESTIONS} Q, {daysCovered.length}/{MIN_DAYS} D)
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Progress (desktop always visible, mobile collapsible) */}
        <div className={cn('w-full lg:w-72 lg:shrink-0', !showMobilePanel && 'hidden lg:block')}>
          <div className="glass-card rounded-2xl p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-foreground">Session Progress</h3>

            {/* Current topic */}
            {currentTopic && (
              <div className="mt-4">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Active Topic</div>
                <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-400">
                  <Tag className="h-3 w-3" />
                  {currentTopic}
                </div>
                {currentDayInfo && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Day {currentDayInfo.day}: {currentDayInfo.title}
                  </p>
                )}
              </div>
            )}

            {/* Requirements */}
            <div className="mt-5 space-y-3 border-t border-border pt-4">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Requirements</div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Questions asked</span>
                <span className={cn('text-xs font-bold', questionCount >= MIN_QUESTIONS ? 'text-emerald-400' : 'text-foreground')}>
                  {questionCount}/{MIN_QUESTIONS}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Days covered</span>
                <span className={cn('text-xs font-bold', daysCovered.length >= MIN_DAYS ? 'text-emerald-400' : 'text-foreground')}>
                  {daysCovered.length}/{MIN_DAYS}
                </span>
              </div>
            </div>

            {/* Days covered */}
            <div className="mt-5 border-t border-border pt-4">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Days Covered</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {daysCovered.map((d) => (
                  <span
                    key={d}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/10 text-[10px] font-bold text-emerald-400"
                  >
                    {d}
                  </span>
                ))}
                {daysCovered.length === 0 && (
                  <span className="text-xs text-muted-foreground">No days covered yet</span>
                )}
              </div>
            </div>

            {/* Live scores */}
            {answeredScores.length > 0 && (
              <div className="mt-5 border-t border-border pt-4">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Answer Scores</div>
                <div className="mt-2 space-y-1.5">
                  {answeredScores.map((msg, i) => (
                    <div key={msg.id} className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Q{i + 1}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-12 overflow-hidden rounded-full bg-secondary sm:w-16">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              msg.score!.total >= 75 ? 'bg-emerald-400' :
                              msg.score!.total >= 50 ? 'bg-amber-400' : 'bg-red-400'
                            )}
                            style={{ width: `${msg.score!.total}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-foreground">{msg.score!.total}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* End Interview Confirmation */}
      <AnimatePresence>
        {showEndConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setShowEndConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card mx-auto max-w-md rounded-2xl p-5 sm:p-6"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <h3 className="text-base font-semibold text-foreground">End Interview?</h3>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                You&apos;ve answered {questionCount} questions across {daysCovered.length} curriculum days. Ending now will generate your final report.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => setShowEndConfirm(false)}
                  className="flex-1 rounded-xl border border-border bg-secondary/30 px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-secondary/50"
                >
                  Continue Interview
                </button>
                <button
                  onClick={() => {
                    setShowEndConfirm(false);
                    endInterview();
                  }}
                  className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105"
                >
                  End & Generate Report
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
