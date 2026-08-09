'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Award, BookOpen, ChevronDown, ChevronRight, Sparkles, ArrowLeft, CheckCircle2, AlertTriangle, RotateCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { AppShell } from '@/components/app-shell';
import { useInterview } from '@/lib/interview-context';
import type { FinalReport } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function ReportPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  const { finalReport: liveReport, candidate, resetInterview } = useInterview();
  const [report, setReport] = useState<FinalReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    strengths: true,
    growth: true,
    modelAnswers: false,
  });
  const [expandedAnswers, setExpandedAnswers] = useState<Record<number, boolean>>({});

  const loadReport = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    if (liveReport) {
      setReport(liveReport);
      setLoading(false);
    } else if (sessionId) {
      try {
        const { supabase } = await import('@/lib/supabase');
        const { data, error } = await supabase
          .from('interview_sessions')
          .select('final_report')
          .eq('id', sessionId)
          .maybeSingle();

        if (error || !data?.final_report) {
          setLoadError(true);
          setReport(null);
        } else {
          setReport(data.final_report as FinalReport);
        }
        setLoading(false);
      } catch {
        setLoadError(true);
        setReport(null);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [liveReport, sessionId]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAnswer = (idx: number) => {
    setExpandedAnswers((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/20">
              <Sparkles className="h-8 w-8 animate-pulse text-cyan-400" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Loading report...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (loadError) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-foreground">Something went wrong</h2>
            <p className="mt-2 text-sm text-muted-foreground">We couldn&apos;t load this interview report.</p>
            <button
              onClick={loadReport}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105"
            >
              <RotateCw className="h-4 w-4" />
              Try Again
            </button>
          </motion.div>
        </div>
      </AppShell>
    );
  }

  if (!report) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary/40">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-foreground">No Report Available</h2>
            <p className="mt-2 text-sm text-muted-foreground">Complete an interview to see your personalized report.</p>
            <Link
              href="/setup"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105"
            >
              <Sparkles className="h-4 w-4" />
              Start Interview
            </Link>
          </motion.div>
        </div>
      </AppShell>
    );
  }

  // Build chart data
  const topicChartData = report.topicScores.map((t) => ({
    topic: t.topic.length > 12 ? t.topic.slice(0, 10) + '...' : t.topic,
    score: t.score,
    fullTopic: t.topic,
  }));

  // Radar chart data
  const radarData = [
    { dimension: 'Technical', value: report.topicScores.length > 0 ? Math.round(report.topicScores.reduce((s, t) => s + t.score, 0) / report.topicScores.length) : 0 },
    { dimension: 'Depth', value: report.topicScores.length > 0 ? Math.round(report.topicScores.reduce((s, t) => s + Math.min(t.score + 5, 100), 0) / report.topicScores.length) : 0 },
    { dimension: 'Clarity', value: report.topicScores.length > 0 ? Math.round(report.topicScores.reduce((s, t) => s + Math.min(t.score + 8, 100), 0) / report.topicScores.length) : 0 },
  ];

  const scoreColor = report.overallScore >= 75 ? '#10b981' : report.overallScore >= 50 ? '#f59e0b' : '#ef4444';
  const scoreLabel = report.overallScore >= 80 ? 'Excellent' : report.overallScore >= 65 ? 'Good' : report.overallScore >= 50 ? 'Developing' : 'Early Stage';

  return (
    <AppShell>
      {/* Back link */}
      <Link href="/" onClick={() => resetInterview()} className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Dashboard
      </Link>

      {/* Score Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid gap-4 lg:grid-cols-3"
      >
        {/* Big Score Gauge */}
        <div className="glass-card rounded-2xl p-5 sm:p-6 lg:col-span-1">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-foreground">Overall Technical Fit</h2>
          </div>

          <div className="mt-6 flex flex-col items-center">
            <div className="relative h-36 w-36 sm:h-40 sm:w-40 lg:h-44 lg:w-44">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(31,41,55,0.6)" strokeWidth="8" />
                <motion.circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 52}
                  initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - report.overallScore / 100) }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  style={{ filter: `drop-shadow(0 0 8px ${scoreColor}80)` }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="text-3xl font-bold sm:text-4xl"
                  style={{ color: scoreColor }}
                >
                  {report.overallScore}
                </motion.span>
                <span className="text-xs text-muted-foreground">out of 100</span>
              </div>
            </div>
            <div className="mt-4 rounded-full border px-3 py-1 text-xs font-medium" style={{ borderColor: `${scoreColor}40`, backgroundColor: `${scoreColor}15`, color: scoreColor }}>
              {scoreLabel}
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">{candidate?.name || 'Candidate'}</p>
        </div>

        {/* Summary & Recommendation */}
        <div className="glass-card rounded-2xl p-5 sm:p-6 lg:col-span-2">
          <h2 className="text-sm font-semibold text-foreground">Interview Summary</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{report.summary}</p>

          <div className="mt-5 rounded-xl border border-border bg-secondary/20 p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-medium text-cyan-400">Recommendation</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-foreground">{report.recommendation}</p>
          </div>

          {/* Quick stats */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-secondary/20 p-3 text-center">
              <div className="text-lg font-bold text-cyan-400">{report.topicScores.length}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Topics</div>
            </div>
            <div className="rounded-xl border border-border bg-secondary/20 p-3 text-center">
              <div className="text-lg font-bold text-emerald-400">{report.strengths.length}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Strengths</div>
            </div>
            <div className="rounded-xl border border-border bg-secondary/20 p-3 text-center">
              <div className="text-lg font-bold text-amber-400">{report.growthAreas.length}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Growth Areas</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mt-4 grid gap-4 lg:grid-cols-2 lg:mt-6"
      >
        {/* Topic Bar Chart */}
        <div className="glass-card rounded-2xl p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-foreground">Topic-wise Performance</h2>
          <div className="mt-4 h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topicChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(31,41,55,0.5)" />
                <XAxis
                  dataKey="topic"
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(31,41,55,0.8)' }}
                  interval={0}
                  angle={topicChartData.length > 4 ? -25 : 0}
                  textAnchor={topicChartData.length > 4 ? 'end' : 'middle'}
                  height={topicChartData.length > 4 ? 50 : 30}
                />
                <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(31,41,55,0.8)' }} />
                <Tooltip
                  cursor={{ fill: 'rgba(6,182,212,0.05)' }}
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #1F2937', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Bar dataKey="score" radius={[6, 6, 0, 0]} fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="glass-card rounded-2xl p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-foreground">Skill Breakdown</h2>
          <div className="mt-4 h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
                <PolarGrid stroke="rgba(31,41,55,0.6)" />
                <PolarAngleAxis dataKey="dimension" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 9 }} axisLine={false} />
                <Radar dataKey="value" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} strokeWidth={2} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #1F2937', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Strengths & Growth Areas */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2 lg:mt-6">
        {/* Strengths */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="glass-card rounded-2xl p-5 sm:p-6"
        >
          <button onClick={() => toggleSection('strengths')} className="flex w-full items-center justify-between" aria-expanded={expandedSections.strengths}>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-foreground">Strengths</h2>
            </div>
            {expandedSections.strengths ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </button>

          {expandedSections.strengths && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-4 space-y-2"
            >
              {report.strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span className="text-sm leading-relaxed text-foreground">{s}</span>
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Growth Areas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="glass-card rounded-2xl p-5 sm:p-6"
        >
          <button onClick={() => toggleSection('growth')} className="flex w-full items-center justify-between" aria-expanded={expandedSections.growth}>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-foreground">Areas for Growth</h2>
            </div>
            {expandedSections.growth ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </button>

          {expandedSections.growth && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="mt-4 space-y-2"
            >
              {report.growthAreas.map((g, i) => (
                <div key={i} className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                  <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <span className="text-sm leading-relaxed text-foreground">{g}</span>
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Model Answers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="mt-4 glass-card rounded-2xl p-5 sm:p-6 lg:mt-6"
      >
        <button onClick={() => toggleSection('modelAnswers')} className="flex w-full items-center justify-between" aria-expanded={expandedSections.modelAnswers}>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-foreground">Ideal Model Answers ({report.modelAnswers.length})</h2>
          </div>
          {expandedSections.modelAnswers ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </button>

        {expandedSections.modelAnswers && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mt-4 space-y-3"
          >
            {report.modelAnswers.map((ma, i) => (
              <div key={i} className="rounded-xl border border-border bg-secondary/20 p-4">
                <button
                  onClick={() => toggleAnswer(i)}
                  className="flex w-full items-start gap-2 text-left"
                  aria-expanded={expandedAnswers[i] || false}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-cyan-500/15 text-xs font-bold text-cyan-400">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-medium text-foreground">{ma.question}</span>
                    <span className="mt-1 inline-block rounded-full border border-border bg-secondary/30 px-2 py-0.5 text-[10px] text-muted-foreground">
                      Day {ma.day}
                    </span>
                  </span>
                  <ChevronDown className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform', expandedAnswers[i] && 'rotate-180')} />
                </button>
                {expandedAnswers[i] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 border-t border-border pt-3"
                  >
                    <p className="text-sm leading-relaxed text-muted-foreground">{ma.answer}</p>
                  </motion.div>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Next Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="mt-4 flex flex-col gap-4 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 lg:mt-6"
      >
        <div>
          <h3 className="text-sm font-semibold text-foreground">Ready for another interview?</h3>
          <p className="mt-1 text-xs text-muted-foreground">Try a different candidate profile or target specific modules.</p>
        </div>
        <Link
          href="/setup"
          onClick={resetInterview}
          className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105"
        >
          <Sparkles className="h-4 w-4" />
          New Interview
        </Link>
      </motion.div>
    </AppShell>
  );
}
