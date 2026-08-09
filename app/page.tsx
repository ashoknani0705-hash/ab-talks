'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Flame, Trophy, Target, Calendar, ChevronRight, Sparkles, Zap, Users } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { curriculum, candidates } from '@/lib/interview-engine';
import { useInterview } from '@/lib/interview-context';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { fetchSessions, startInterview } = useInterview();
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState(candidates[0].id);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [activeDay, setActiveDay] = useState<number | null>(null);

  const selectedCandidate = useMemo(
    () => candidates.find((c) => c.id === selectedCandidateId) || candidates[0],
    [selectedCandidateId]
  );

  useEffect(() => {
    fetchSessions().then(setSessions);
  }, [fetchSessions]);

  useEffect(() => {
    const target = new Date();
    target.setDate(target.getDate() + 31);
    target.setHours(0, 0, 0, 0);

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = target.getTime() - now;
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const avgScore = sessions.length > 0 && sessions.every((s) => s.overall_score != null)
    ? Math.round(sessions.reduce((sum, s) => sum + (s.overall_score || 0), 0) / sessions.length)
    : 0;

  const stats = [
    { label: 'Current Streak', value: `${selectedCandidate.learningSignals.streakDays}`, suffix: 'days', icon: Flame, color: 'text-orange-400' },
    { label: 'Total Interviews', value: `${sessions.length}`, suffix: '', icon: Trophy, color: 'text-cyan-400' },
    { label: 'Average Score', value: `${avgScore}`, suffix: '/100', icon: Target, color: 'text-emerald-400' },
    { label: 'Days Completed', value: `${selectedCandidate.completedDays.length}`, suffix: '/31', icon: Calendar, color: 'text-purple-400' },
  ];

  return (
    <AppShell>
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-secondary/40 p-6 sm:rounded-3xl sm:p-8 lg:p-12"
      >
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />

        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-400">
              <Sparkles className="h-3 w-3" />
              Enterprise AI Engineering Cohort
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 pulse-glow" />
              Live
            </span>
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl xl:text-5xl">
            Master AI Engineering <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">in 31 Days.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            A structured journey to master RAG, Vector Databases, Agentic AI, MCP, and Production AI Systems. Not a course. A build challenge with personalized AI interviews.
          </p>

          {/* Countdown */}
          <div className="mt-6 grid grid-cols-4 gap-2 sm:flex sm:flex-wrap sm:gap-3">
            {[
              { label: 'Days', value: countdown.days },
              { label: 'Hours', value: countdown.hours },
              { label: 'Minutes', value: countdown.minutes },
              { label: 'Seconds', value: countdown.seconds },
            ].map((unit) => (
              <div
                key={unit.label}
                className="flex flex-col items-center rounded-xl border border-border bg-background/60 px-2 py-2.5 backdrop-blur-sm sm:rounded-2xl sm:px-6 sm:py-3"
              >
                <span className="font-mono text-xl font-bold tabular-nums text-foreground sm:text-2xl lg:text-3xl">
                  {String(unit.value).padStart(2, '0')}
                </span>
                <span className="mt-1 text-[9px] uppercase tracking-widest text-muted-foreground sm:text-[10px]">
                  {unit.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="glass-card glass-card-hover rounded-xl p-4 sm:rounded-2xl sm:p-5"
          >
            <div className="flex items-center justify-between">
              <stat.icon className={cn('h-5 w-5', stat.color)} />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <div className="mt-3">
              <span className="text-xl font-bold text-foreground sm:text-2xl">{stat.value}</span>
              <span className="text-sm text-muted-foreground">{stat.suffix}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 31-Day Journey Grid + Action Area */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3 lg:gap-6">
        {/* Journey Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card rounded-2xl p-5 lg:col-span-2 lg:p-6"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold text-foreground">31-Day Cohort Journey</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs sm:gap-3">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <div className="h-2.5 w-2.5 rounded bg-emerald-500" /> Completed
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <div className="h-2.5 w-2.5 rounded bg-cyan-500" /> Active
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <div className="h-2.5 w-2.5 rounded bg-secondary border border-border" /> Pending
              </span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-4 gap-1.5 sm:grid-cols-6 sm:gap-2 md:grid-cols-8 lg:grid-cols-10">
            {curriculum.map((day) => {
              const isCompleted = selectedCandidate.completedDays.includes(day.day);
              const isSkipped = selectedCandidate.skippedDays.includes(day.day);
              const isPending = !isCompleted && !isSkipped;
              return (
                <button
                  key={day.day}
                  onClick={() => setActiveDay(activeDay === day.day ? null : day.day)}
                  onFocus={() => setActiveDay(day.day)}
                  onBlur={() => setActiveDay(null)}
                  aria-label={`Day ${day.day}: ${day.title} - ${day.module}`}
                  className={cn(
                    'group relative flex aspect-square cursor-pointer items-center justify-center rounded-lg border text-xs font-medium transition-all hover:scale-110 hover:z-10 focus:z-10',
                    isCompleted && 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400',
                    isSkipped && 'border-red-500/20 bg-red-500/5 text-red-400/60',
                    isPending && 'border-border bg-secondary/30 text-muted-foreground'
                  )}
                >
                  {day.day}
                  {/* Tooltip - visible on hover (desktop) and focus/tap (mobile) */}
                  <div
                    className={cn(
                      'pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-popover px-3 py-2 text-xs text-foreground shadow-xl transition-opacity',
                      'hidden lg:group-hover:block',
                      activeDay === day.day && 'block'
                    )}
                  >
                    <span className="font-semibold">Day {day.day}: {day.title}</span>
                    <span className="block text-muted-foreground">{day.module}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active day info for mobile/tablet */}
          {activeDay !== null && (
            <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 lg:hidden">
              {(() => {
                const day = curriculum.find((d) => d.day === activeDay);
                if (!day) return null;
                return (
                  <div>
                    <div className="text-xs font-semibold text-foreground">Day {day.day}: {day.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{day.module}</div>
                    <div className="mt-2 text-xs text-muted-foreground">{day.description}</div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Module legend */}
          <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
            {['RAG', 'Vector Databases', 'Prompt Engineering', 'Agentic AI', 'MCP', 'AI Deployment', 'Production AI'].map((m) => (
              <span key={m} className="rounded-full border border-border bg-secondary/30 px-2.5 py-1 text-[10px] text-muted-foreground">
                {m}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Action Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col gap-4"
        >
          {/* Candidate selector */}
          <div className="glass-card rounded-2xl p-5 lg:p-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-foreground">Select Candidate Profile</h3>
            </div>
            <div className="mt-4 space-y-2">
              {candidates.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCandidateId(c.id)}
                  aria-pressed={selectedCandidateId === c.id}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all',
                    selectedCandidateId === c.id
                      ? 'border-cyan-500/40 bg-cyan-500/10'
                      : 'border-border bg-secondary/20 hover:border-border hover:bg-secondary/40'
                  )}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-xs font-bold text-cyan-400">
                    {c.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">{c.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{c.title}</div>
                  </div>
                  {selectedCandidateId === c.id && (
                    <div className="h-2 w-2 shrink-0 rounded-full bg-cyan-400" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Start Interview CTA */}
          <Link href="/interview" onClick={() => startInterview(selectedCandidate)} aria-label="Start personalized cohort interview">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 p-5 transition-all hover:border-cyan-500/50 sm:p-6"
            >
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-500/20 blur-2xl transition-all group-hover:scale-150" />
              <div className="relative">
                <Zap className="h-7 w-7 text-cyan-400 sm:h-8 sm:w-8" />
                <h3 className="mt-3 text-sm font-semibold text-foreground sm:text-base">
                  Start Personalized Cohort Interview
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  AI interviewer will adapt questions based on {selectedCandidate.name}&apos;s learning journey
                </p>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-cyan-400">
                  Begin Interview
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </motion.div>
          </Link>
        </motion.div>
      </div>

      {/* Recent Reports */}
      {sessions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-4 glass-card rounded-2xl p-5 lg:mt-6 lg:p-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Recent Interview Reports</h2>
            <Link href="/reports" className="flex items-center gap-1 text-xs text-cyan-400 hover:underline">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {sessions.slice(0, 5).map((s) => (
              <Link
                key={s.id}
                href={`/report?session=${s.id}`}
                className="flex items-center justify-between rounded-xl border border-border bg-secondary/20 p-3 transition-all hover:bg-secondary/40 sm:p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-sm font-bold text-cyan-400">
                    {s.candidate_name?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">{s.candidate_name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {s.question_count} questions • {new Date(s.started_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className={cn(
                  'shrink-0 rounded-lg px-3 py-1.5 text-sm font-bold',
                  (s.overall_score || 0) >= 75 ? 'bg-emerald-500/15 text-emerald-400' :
                  (s.overall_score || 0) >= 50 ? 'bg-amber-500/15 text-amber-400' :
                  'bg-red-500/15 text-red-400'
                )}>
                  {s.overall_score || 0}/100
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Footer */}
      <div className="mt-8 border-t border-border pt-6 text-center">
        <p className="text-xs text-muted-foreground">
          Built by Anil Bajpai&apos;s ABTalks community. For any issue or enquiry: team@abtalks.in
        </p>
      </div>
    </AppShell>
  );
}
