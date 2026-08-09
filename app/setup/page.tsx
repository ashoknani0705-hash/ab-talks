'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, Zap, Target, TrendingUp, AlertCircle } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { candidates, curriculum } from '@/lib/interview-engine';
import { useInterview } from '@/lib/interview-context';
import { cn } from '@/lib/utils';

export default function SetupPage() {
  const router = useRouter();
  const { startInterview } = useInterview();
  const [selectedId, setSelectedId] = useState(candidates[0].id);
  const [targetMode, setTargetMode] = useState<'full' | 'specific'>('full');
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  const candidate = useMemo(
    () => candidates.find((c) => c.id === selectedId) || candidates[0],
    [selectedId]
  );

  const modules = useMemo(() => {
    const unique = Array.from(new Set(curriculum.map((d) => d.module)));
    return unique;
  }, []);

  const toggleModule = (mod: string) => {
    setSelectedModules((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    );
  };

  const handleStart = () => {
    startInterview(candidate);
    router.push('/interview');
  };

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Candidate Setup & Profile
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose a candidate profile and configure the interview scope. The AI interviewer will personalize questions based on this profile.
        </p>
      </motion.div>

      {/* Candidate Cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {candidates.map((c, i) => (
          <motion.button
            key={c.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            onClick={() => setSelectedId(c.id)}
            aria-pressed={selectedId === c.id}
            aria-label={`Select candidate ${c.name}`}
            className={cn(
              'group relative overflow-hidden rounded-2xl border p-4 text-left transition-all sm:p-6',
              selectedId === c.id
                ? 'border-cyan-500/50 bg-cyan-500/5 glow-cyan'
                : 'border-border bg-card/60 hover:border-border hover:bg-card'
            )}
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 text-base font-bold text-cyan-400 sm:h-14 sm:w-14 sm:text-lg">
                {c.avatar}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground sm:text-base">{c.name}</h3>
                  {selectedId === c.id && (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-400" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{c.title}</p>
                <p className="mt-2 text-xs text-muted-foreground">{c.summary}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4">
              <div>
                <div className="text-base font-bold text-foreground sm:text-lg">{c.completedDays.length}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Completed</div>
              </div>
              <div>
                <div className="text-base font-bold text-red-400 sm:text-lg">{c.skippedDays.length}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Skipped</div>
              </div>
              <div>
                <div className="text-base font-bold text-cyan-400 sm:text-lg">{c.learningSignals.avgMissionScore}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg Score</div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Selected candidate detail */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="mt-6 glass-card rounded-2xl p-6"
      >
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-foreground">Profile Analysis: {candidate.name}</h2>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {/* Strengths */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
              <TrendingUp className="h-3 w-3" /> Strengths
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {candidate.strengths.map((s) => (
                <span key={s} className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Weaknesses */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-red-400">
              <AlertCircle className="h-3 w-3" /> Areas to Probe
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {candidate.weaknesses.map((w) => (
                <span key={w} className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-400">
                  {w}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Learning signals */}
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-4">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <div>
              <div className="text-xs font-medium text-foreground">{candidate.learningSignals.streakDays} days</div>
              <div className="text-[10px] text-muted-foreground">Streak</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-muted-foreground" />
            <div>
              <div className="text-xs font-medium text-foreground">{candidate.learningSignals.totalAttempts}</div>
              <div className="text-[10px] text-muted-foreground">Attempts</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-muted-foreground" />
            <div>
              <div className="text-xs font-medium text-foreground">{candidate.learningSignals.mostActiveModule}</div>
              <div className="text-[10px] text-muted-foreground">Top Module</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
            <div>
              <div className="text-xs font-medium text-foreground">{candidate.learningSignals.avgMissionScore}/100</div>
              <div className="text-[10px] text-muted-foreground">Mission Avg</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Interview scope */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="mt-6 glass-card rounded-2xl p-6"
      >
        <h2 className="text-sm font-semibold text-foreground">Interview Scope</h2>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => setTargetMode('full')}
            aria-pressed={targetMode === 'full'}
            aria-label="Full 31-day evaluation scope"
            className={cn(
              'flex-1 rounded-xl border p-4 text-left transition-all',
              targetMode === 'full'
                ? 'border-cyan-500/40 bg-cyan-500/10'
                : 'border-border bg-secondary/20 hover:bg-secondary/40'
            )}
          >
            <div className="text-sm font-medium text-foreground">Full 31-Day Evaluation</div>
            <div className="mt-1 text-xs text-muted-foreground">Covers all completed topics across the cohort</div>
          </button>
          <button
            onClick={() => setTargetMode('specific')}
            aria-pressed={targetMode === 'specific'}
            aria-label="Target specific modules scope"
            className={cn(
              'flex-1 rounded-xl border p-4 text-left transition-all',
              targetMode === 'specific'
                ? 'border-cyan-500/40 bg-cyan-500/10'
                : 'border-border bg-secondary/20 hover:bg-secondary/40'
            )}
          >
            <div className="text-sm font-medium text-foreground">Target Specific Modules</div>
            <div className="mt-1 text-xs text-muted-foreground">Focus on selected curriculum modules</div>
          </button>
        </div>

        {targetMode === 'specific' && (
          <div className="mt-4 flex flex-wrap gap-2">
            {modules.map((mod) => (
              <button
                key={mod}
                onClick={() => toggleModule(mod)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs transition-all',
                  selectedModules.includes(mod)
                    ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400'
                    : 'border-border bg-secondary/20 text-muted-foreground hover:bg-secondary/40'
                )}
              >
                {mod}
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Interview preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="mt-6 flex flex-col gap-4 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 p-6 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-foreground">Ready to start</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Minimum 8 questions across 4+ curriculum days. Adaptive follow-ups based on your answers.
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-400" /> 8+ Questions</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-400" /> 4+ Curriculum Days</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-400" /> Real-time Scoring</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-400" /> Final Report</span>
          </div>
        </div>
        <button
          onClick={handleStart}
          aria-label="Start the AI interview"
          className="flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-105 glow-cyan sm:w-auto"
        >
          <Zap className="h-4 w-4" />
          Start Interview
        </button>
      </motion.div>
    </AppShell>
  );
}
