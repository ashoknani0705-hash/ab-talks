'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FileBarChart, ChevronRight, Calendar, MessageSquare, Sparkles, CheckCircle2, AlertTriangle, RotateCw, Clock } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { useInterview, type SessionSummary } from '@/lib/interview-context';
import { cn } from '@/lib/utils';

export default function ReportsPage() {
  const { fetchSessions } = useInterview();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const s = await fetchSessions();
      setSessions(s);
    } catch {
      setLoadError(true);
    }
    setLoading(false);
  }, [fetchSessions]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-2">
          <FileBarChart className="h-5 w-5 text-cyan-400" />
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Interview Reports</h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          All completed interview sessions and their AI-generated evaluations.
        </p>
      </motion.div>

      {loading ? (
        <div className="mt-8 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-2xl border border-border bg-card/40 shimmer" />
          ))}
        </div>
      ) : loadError ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-border bg-card/40 p-8 text-center sm:p-12"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">Something went wrong</h2>
          <p className="mt-2 text-sm text-muted-foreground">We couldn&apos;t load the interview reports.</p>
          <button
            onClick={load}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105"
          >
            <RotateCw className="h-4 w-4" />
            Try Again
          </button>
        </motion.div>
      ) : sessions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-border bg-card/40 p-8 text-center sm:p-12"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/40">
            <FileBarChart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">No Reports Yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">Complete your first AI interview to see your performance report here.</p>
          <Link
            href="/setup"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105"
          >
            <Sparkles className="h-4 w-4" />
            Start Interview
          </Link>
        </motion.div>
      ) : (
        <div className="mt-6 space-y-3">
          {sessions.map((s, i) => {
            const score = s.overall_score || 0;
            const scoreColor =
              score >= 75 ? 'text-emerald-400 bg-emerald-500/15' :
              score >= 50 ? 'text-amber-400 bg-amber-500/15' :
              'text-red-400 bg-red-500/15';
            const isCompleted = s.completed_at != null;
            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Link
                  href={`/report?session=${s.id}`}
                  className="group flex flex-col gap-3 rounded-2xl border border-border bg-card/40 p-4 transition-all hover:border-cyan-500/30 hover:bg-card/60 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                >
                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-base font-bold text-cyan-400 sm:h-12 sm:w-12">
                      {s.candidate_name?.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground">{s.candidate_name}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:gap-3">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {s.question_count} questions
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(s.started_at).toLocaleDateString()}
                        </span>
                        <span className={cn('flex items-center gap-1', isCompleted ? 'text-emerald-400' : 'text-amber-400')}>
                          {isCompleted ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {isCompleted ? 'Completed' : 'In Progress'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <div className={cn('rounded-lg px-3 py-1.5 text-sm font-bold', scoreColor)}>
                      {score}/100
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
