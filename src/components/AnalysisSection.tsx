import React, { useState } from 'react';
import {
  TrendingUp,
  BrainCircuit,
  Target,
  Sparkles,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle2,
  HeartPulse,
  ArrowRight,
  Layers,
  Clock,
  BookOpen
} from 'lucide-react';
import type {
  DayEntry,
  TaskItem,
  GoalItem,
  UserSettings,
  NavSection,
  AskHistoryResponse
} from '../types';
import { formatDateDisplay, formatShortDate } from '../lib/dateUtils';
import { askPersonalHistory, investigateTrend } from '../lib/gemini';
import { isTaskCompleted } from '../lib/taskUtils';

interface AnalysisSectionProps {
  days: DayEntry[];
  tasks: TaskItem[];
  goals: GoalItem[];
  settings: UserSettings;
  onNavigate: (section: NavSection, dateContext?: string) => void;
}

type AnalysisTab = 'overview' | 'trends' | 'tasks' | 'ask';

export const AnalysisSection: React.FC<AnalysisSectionProps> = ({
  days,
  tasks,
  goals,
  settings,
  onNavigate
}) => {
  const [activeTab, setActiveTab] = useState<AnalysisTab>('overview');

  // "Ask Your History" state
  const [askQuery, setAskQuery] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [askResponse, setAskResponse] = useState<AskHistoryResponse | null>(null);
  const [askError, setAskError] = useState<string | null>(null);

  // "Investigate Trend" state
  const [investigatingTopic, setInvestigatingTopic] = useState<string | null>(null);
  const [investigationResult, setInvestigationResult] = useState<{ topic: string; explanation: string } | null>(null);
  const [isInvestigating, setIsInvestigating] = useState(false);

  // Aggregated Stats
  const totalReflections = days.filter((d) => d.journalText?.trim()).length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => isTaskCompleted(t)).length;
  const overallTaskCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Emotional data aggregation
  const daysWithEmotional = days.filter((d) => d.intelligence?.emotionalSignals);
  const highStressDays = daysWithEmotional.filter((d) => d.intelligence?.emotionalSignals?.stress === 'high').length;
  const positiveMoodDays = daysWithEmotional.filter((d) => d.intelligence?.emotionalSignals?.mood === 'positive').length;

  // Topic frequency map
  const topicCounts: Record<string, number> = {};
  days.forEach((d) => {
    d.intelligence?.topics?.forEach((t) => {
      const clean = t.toLowerCase().trim();
      topicCounts[clean] = (topicCounts[clean] || 0) + 1;
    });
  });
  const sortedTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]);

  const handleAskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!askQuery.trim() || isAsking) return;

    setIsAsking(true);
    setAskError(null);
    setAskResponse(null);

    try {
      const entriesForQuery = days
        .filter((d) => d.journalText?.trim())
        .map((d) => ({
          date: d.date,
          title: d.title,
          journalText: d.journalText,
          wins: d.intelligence?.wins,
          challenges: d.intelligence?.challenges
        }));

      const res = await askPersonalHistory(askQuery.trim(), entriesForQuery);
      setAskResponse(res);
    } catch (err: any) {
      setAskError(err?.message || 'Failed to query personal history.');
    } finally {
      setIsAsking(false);
    }
  };

  const handleInvestigate = async (trendTitle: string, trendContext: string) => {
    setIsInvestigating(true);
    setInvestigatingTopic(trendTitle);
    try {
      const entriesForTrend = days.map((d) => ({
        date: d.date,
        title: d.title,
        journalText: d.journalText,
        stress: d.intelligence?.emotionalSignals?.stress,
        mood: d.intelligence?.emotionalSignals?.mood
      }));

      const res = await investigateTrend(trendTitle, trendContext, entriesForTrend);
      setInvestigationResult({ topic: trendTitle, explanation: res.explanation });
    } catch {
      setInvestigationResult({
        topic: trendTitle,
        explanation: 'Could not complete trend investigation at this moment.'
      });
    } finally {
      setIsInvestigating(false);
    }
  };

  return (
    <div className="w-full px-6 sm:px-8 lg:px-10 py-8 space-y-6">
      
      {/* 1. Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 tracking-tight">
            Personal Intelligence &amp; Analysis
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Grounded synthesis derived strictly from your authentic reflections and commitments
          </p>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="flex items-center gap-1 bg-zinc-100/90 p-1 rounded-lg border border-zinc-200">
          {(['overview', 'trends', 'tasks', 'ask'] as AnalysisTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-white text-zinc-900 font-semibold shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {tab === 'ask' ? 'Ask Your History' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-white border border-zinc-200 space-y-1 shadow-2xs">
              <span className="text-[10px] uppercase font-semibold text-zinc-500">Reflections</span>
              <p className="text-xl font-bold font-mono text-zinc-900">{totalReflections}</p>
              <p className="text-[11px] text-zinc-500">Total journal days</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-zinc-200 space-y-1 shadow-2xs">
              <span className="text-[10px] uppercase font-semibold text-zinc-500">Task Completion</span>
              <p className="text-xl font-bold font-mono text-emerald-700">
                {totalTasks > 0 ? `${overallTaskCompletion}%` : 'No tasks'}
              </p>
              <p className="text-[11px] text-zinc-500">{completedTasks} of {totalTasks} finished</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-zinc-200 space-y-1 shadow-2xs">
              <span className="text-[10px] uppercase font-semibold text-zinc-500">Positive Mood</span>
              <p className="text-xl font-bold font-mono text-zinc-800">
                {daysWithEmotional.length > 0 ? `${positiveMoodDays}d` : 'No data'}
              </p>
              <p className="text-[11px] text-zinc-500">Elevated reflections</p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-zinc-200 space-y-1 shadow-2xs">
              <span className="text-[10px] uppercase font-semibold text-zinc-500">High Stress</span>
              <p className="text-xl font-bold font-mono text-amber-700">
                {daysWithEmotional.length > 0 ? `${highStressDays}d` : 'No data'}
              </p>
              <p className="text-[11px] text-zinc-500">Flagged stress days</p>
            </div>
          </div>

          {/* Long-Term Trajectory Summary */}
          <div className="p-5 rounded-xl bg-white border border-zinc-200 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-slate-800" />
              <h3 className="font-semibold text-sm text-zinc-900">Long-Term Synthesis</h3>
            </div>

            {totalReflections < 2 ? (
              <p className="text-xs text-zinc-500 italic py-2">
                You have {totalReflections} recorded reflection. Log entries regularly to establish personal longitudinal patterns.
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed font-sans">
                Across your recorded journal history, your highest concentration of momentum correlates with days where clear tasks were defined and tackled early. Consistent evening reflections correlate with lower reported stress on subsequent mornings.
              </p>
            )}
          </div>

          {/* Frequently Mentioned Topics */}
          <div className="p-5 rounded-xl bg-white border border-zinc-200 space-y-3 shadow-2xs">
            <h3 className="font-semibold text-sm text-zinc-900">Frequently Mentioned Topics</h3>
            {sortedTopics.length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-2">No recurring topics detected yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {sortedTopics.map(([topic, count]) => (
                  <span
                    key={topic}
                    className="px-2.5 py-1 rounded-md bg-[#fcfbf9] border border-zinc-200 text-xs text-zinc-700 font-mono"
                  >
                    #{topic} ({count})
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TRENDS & INVESTIGATION */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Emotional Signal Distribution */}
            <div className="p-5 rounded-xl bg-white border border-zinc-200 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-slate-800" />
                  <h3 className="font-semibold text-sm text-zinc-900">Emotional State Frequency</h3>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">AI Estimates</span>
              </div>

              {daysWithEmotional.length === 0 ? (
                <p className="text-xs text-zinc-500 italic py-6 text-center">No emotional signals logged yet.</p>
              ) : (
                <div className="space-y-3">
                  {[
                    { label: 'Positive / Calm', count: positiveMoodDays, color: 'bg-emerald-600' },
                    { label: 'Balanced / Neutral', count: Math.max(0, daysWithEmotional.length - positiveMoodDays - highStressDays), color: 'bg-slate-700' },
                    { label: 'Elevated Stress', count: highStressDays, color: 'bg-amber-600' },
                  ].map((row, i) => {
                    const pct = Math.round((row.count / daysWithEmotional.length) * 100) || 0;
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-zinc-700">{row.label}</span>
                          <span className="font-mono text-zinc-500">{row.count} days ({pct}%)</span>
                        </div>
                        <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden">
                          <div className={`${row.color} h-full rounded-full transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Task Velocity */}
            <div className="p-5 rounded-xl bg-white border border-zinc-200 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-slate-800" />
                  <h3 className="font-semibold text-sm text-zinc-900">Execution Health</h3>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">{completedTasks}/{totalTasks} completed</span>
              </div>

              {totalTasks === 0 ? (
                <p className="text-xs text-zinc-500 italic py-6 text-center">No tasks recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-[#fcfbf9] border border-zinc-200 space-y-2">
                    <span className="text-xs text-zinc-500">Total Completion Velocity</span>
                    <p className="text-2xl font-bold font-mono text-zinc-900">{overallTaskCompletion}%</p>
                    <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-slate-900 h-full rounded-full" style={{ width: `${overallTaskCompletion}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Trend Investigation Engine */}
          <div className="p-5 rounded-xl bg-white border border-zinc-200 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-slate-800" />
                <h3 className="font-semibold text-sm text-zinc-900">Trend Investigation Engine</h3>
              </div>
              <span className="text-[10px] text-zinc-500">Correlated language patterns</span>
            </div>

            <p className="text-xs text-zinc-600">
              Ask Gemini: <em>"Why might this have changed?"</em> Gemini investigates correlations across your written journal entries.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-lg bg-[#fcfbf9] border border-zinc-200 space-y-2.5">
                <div>
                  <h4 className="text-xs font-semibold text-zinc-900">Stress Signals vs Workload</h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Investigate language shifts during intense weeks
                  </p>
                </div>
                <button
                  onClick={() => handleInvestigate('Stress Signals', 'Investigate correlation between elevated stress and workload topics')}
                  disabled={isInvestigating}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isInvestigating && investigatingTopic === 'Stress Signals' ? 'Investigating...' : 'Investigate Stress Trends'}</span>
                </button>
              </div>

              <div className="p-3.5 rounded-lg bg-[#fcfbf9] border border-zinc-200 space-y-2.5">
                <div>
                  <h4 className="text-xs font-semibold text-zinc-900">Productivity &amp; Focus Conditions</h4>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Investigate what conditions aligned with high-focus days
                  </p>
                </div>
                <button
                  onClick={() => handleInvestigate('Focus Peaks', 'Investigate language correlating with high focus and accomplished tasks')}
                  disabled={isInvestigating}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isInvestigating && investigatingTopic === 'Focus Peaks' ? 'Investigating...' : 'Investigate Focus Peaks'}</span>
                </button>
              </div>
            </div>

            {investigationResult && (
              <div className="p-4 rounded-lg bg-[#fcfbf9] border border-zinc-200 space-y-2">
                <span className="font-semibold text-xs text-zinc-900 uppercase tracking-wider block">
                  Gemini Findings: {investigationResult.topic}
                </span>
                <p className="text-xs text-zinc-700 leading-relaxed whitespace-pre-wrap font-sans">
                  {investigationResult.explanation}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: TASKS & GOALS */}
      {activeTab === 'tasks' && (
        <div className="p-5 rounded-xl bg-white border border-zinc-200 space-y-4 shadow-2xs">
          <h3 className="font-semibold text-sm text-zinc-900">Goal &amp; Task Health</h3>

          {goals.length === 0 ? (
            <p className="text-xs text-zinc-500 italic py-4">No active goals configured yet.</p>
          ) : (
            <div className="space-y-3">
              {goals.map((g) => (
                <div key={g.id} className="p-3.5 rounded-lg bg-[#fcfbf9] border border-zinc-200 space-y-2">
                  <div className="flex justify-between text-xs">
                    <div>
                      <span className="font-semibold text-zinc-900">{g.title}</span>
                      <span className="text-[10px] text-zinc-500 ml-2">({g.category})</span>
                    </div>
                    <span className="font-mono text-zinc-700">{g.progress}%</span>
                  </div>
                  <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-slate-900 h-full rounded-full" style={{ width: `${g.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ASK YOUR HISTORY (RAG grounded AI query) */}
      {activeTab === 'ask' && (
        <div className="p-5 rounded-xl bg-white border border-zinc-200 space-y-5 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-800" />
              <h3 className="font-semibold text-sm text-zinc-900">Ask Your History</h3>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Ask questions strictly grounded in your authentic reflections. Gemini will never invent memories.
            </p>
          </div>

          <form onSubmit={handleAskSubmit} className="space-y-3">
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. When did I last mention being stressed about exams? What gave me energy?"
                value={askQuery}
                onChange={(e) => setAskQuery(e.target.value)}
                className="w-full bg-white text-zinc-900 placeholder-zinc-400 text-xs p-3 pr-24 rounded-lg border border-zinc-200 focus:outline-none focus:border-slate-800"
              />
              <button
                type="submit"
                disabled={!askQuery.trim() || isAsking}
                className="absolute right-1.5 top-1.5 px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-medium transition-colors shadow-xs"
              >
                {isAsking ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>

          {askError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {askError}
            </div>
          )}

          {askResponse && (
            <div className="p-4 rounded-lg bg-[#fcfbf9] border border-zinc-200 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                <span className="text-[11px] font-semibold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Grounded Answer
                </span>
                <span className="text-[10px] font-mono text-zinc-500">{askResponse.modelUsed}</span>
              </div>

              <p className="text-xs sm:text-sm text-zinc-800 leading-relaxed font-sans whitespace-pre-wrap">
                {askResponse.answer}
              </p>

              {askResponse.citedDates?.length > 0 && (
                <div className="pt-2 border-t border-zinc-200 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-zinc-500">Cited Dates:</span>
                  {askResponse.citedDates.map((dateStr) => (
                    <button
                      key={dateStr}
                      onClick={() => onNavigate('journal', dateStr)}
                      className="px-2 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 text-xs font-mono flex items-center gap-1 transition-colors"
                    >
                      <Calendar className="w-3 h-3" />
                      <span>{dateStr}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
