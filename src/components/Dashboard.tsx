import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  CheckCircle2,
  Clock,
  HeartPulse,
  BookOpen,
  Bell,
  ArrowRight,
  Target,
  AlertCircle,
  Calendar as CalendarIcon,
  Smile,
  Activity,
  ChevronRight,
  Info,
  Flame,
  Plus
} from 'lucide-react';
import type {
  DayEntry,
  TaskItem,
  GoalItem,
  ReminderItem,
  UserSettings,
  UserProfile,
  NavSection
} from '../types';
import {
  getTodayDateString,
  formatDateDisplay,
  getWeekKey,
  getMonthKey,
  addDays,
  getDaysOfCurrentWeek
} from '../lib/dateUtils';
import {
  getTodayTaskStats,
  getWeekTaskStats,
  getMonthTaskStats
} from '../lib/taskUtils';

interface DashboardProps {
  user: UserProfile;
  days: DayEntry[];
  tasks: TaskItem[];
  goals: GoalItem[];
  reminders: ReminderItem[];
  settings: UserSettings;
  onPostQuickJournal: (text: string) => Promise<void>;
  onNavigate: (section: NavSection, dateContext?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  days,
  tasks,
  goals,
  reminders,
  settings,
  onPostQuickJournal,
  onNavigate
}) => {
  const [quickText, setQuickText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [showQuickInput, setShowQuickInput] = useState(false);
  
  const [hoveredMoodPoint, setHoveredMoodPoint] = useState<{
    date: string;
    mood: string;
    title?: string;
  } | null>(null);

  const [hoveredStressPoint, setHoveredStressPoint] = useState<{
    date: string;
    stress: string;
  } | null>(null);

  const todayStr = getTodayDateString();
  const currentWeekKey = getWeekKey(todayStr);
  const currentMonthKey = getMonthKey(todayStr);

  // Time-sensitive personalized greeting
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.displayName?.split(' ')[0] || 'Friend';

  // Today's entry if any
  const todayEntry = days.find((d) => d.date === todayStr);

  // Unified task statistics
  const todayTaskStats = getTodayTaskStats(tasks, todayStr);
  const weekTaskStats = getWeekTaskStats(tasks, currentWeekKey);
  const monthTaskStats = getMonthTaskStats(tasks, currentMonthKey);

  // Reflections this week count
  const reflectionsThisWeekCount = days.filter(
    (d) => getWeekKey(d.date) === currentWeekKey && Boolean(d.journalText?.trim())
  ).length;

  // Latest Available Wellbeing Data (from today or recent days)
  const recentDayWithSignals = days.find((d) => d.intelligence?.emotionalSignals);
  const emotionalData = recentDayWithSignals?.intelligence?.emotionalSignals;
  const isTodaySignal = recentDayWithSignals?.date === todayStr;

  // Emotional Anchor & Contextual Narrative
  const getEmotionalAnchor = () => {
    if (!settings.enableEmotionalAnalysis) {
      return {
        emoji: '🌿',
        label: 'Mindful',
        narrative: 'Emotional analysis is currently paused in settings.',
        accentClass: 'text-emerald-700 bg-emerald-50 border-emerald-200'
      };
    }
    if (!emotionalData) {
      return {
        emoji: '🌱',
        label: 'Calibrating',
        narrative: 'Capture today’s reflection to calibrate your daily wellbeing signals.',
        accentClass: 'text-zinc-700 bg-zinc-100 border-zinc-200'
      };
    }
    const mood = emotionalData.mood?.toLowerCase();
    const stress = emotionalData.stress?.toLowerCase();

    if (stress === 'high' || mood === 'stressed') {
      return {
        emoji: '😮‍💨',
        label: 'Carrying Pressure',
        narrative: 'You’ve been carrying a little more pressure today. Give yourself space to pace and recover.',
        accentClass: 'text-rose-700 bg-rose-50 border-rose-200'
      };
    }
    if (mood === 'positive') {
      return {
        emoji: '😊',
        label: 'Positive Momentum',
        narrative: 'You are moving with clear, buoyant energy today. A strong day to build forward.',
        accentClass: 'text-emerald-700 bg-emerald-50 border-emerald-200'
      };
    }
    if (mood === 'reflective') {
      return {
        emoji: '🙂',
        label: 'Thoughtful Rhythm',
        narrative: 'You’re in a calm, contemplative flow, synthesizing ideas with intentional focus.',
        accentClass: 'text-indigo-700 bg-indigo-50 border-indigo-200'
      };
    }
    if (mood === 'low') {
      return {
        emoji: '😔',
        label: 'Gentle Pacing',
        narrative: 'Energy has been running lighter today. Keep expectations gentle and focus on essentials.',
        accentClass: 'text-amber-800 bg-amber-50 border-amber-200'
      };
    }
    return {
      emoji: '😐',
      label: 'Balanced',
      narrative: 'Grounded and steady today with even baseline pacing.',
      accentClass: 'text-zinc-700 bg-zinc-100 border-zinc-200'
    };
  };

  const anchor = getEmotionalAnchor();

  // 3-Axis Wellbeing Constellation Values
  const getWellbeingAxisValues = () => {
    if (!emotionalData) return { stressPct: 20, energyPct: 50, focusPct: 50, balanceScore: 68 };
    
    // Stress scale: low = 20%, moderate = 55%, high = 90%
    const stressPct = emotionalData.stress === 'high' ? 88 : emotionalData.stress === 'moderate' ? 52 : 22;
    // Energy scale: low = 25%, moderate = 60%, high = 85%
    const energyPct = emotionalData.energy === 'high' ? 85 : emotionalData.energy === 'moderate' ? 62 : 30;
    // Focus scale: low = 30%, moderate = 65%, high = 90%
    const focusPct = emotionalData.focus === 'high' ? 88 : emotionalData.focus === 'moderate' ? 65 : 35;

    // Approximate balance score (higher is healthier balance)
    const balanceScore = Math.round((energyPct * 0.4) + (focusPct * 0.4) + ((100 - stressPct) * 0.2));
    return { stressPct, energyPct, focusPct, balanceScore };
  };

  const { stressPct, energyPct, focusPct, balanceScore } = getWellbeingAxisValues();

  // Last 7 days data for dedicated Mood and Stress charts
  const last7DaysList: string[] = [];
  for (let i = 6; i >= 0; i--) {
    last7DaysList.push(addDays(todayStr, -i));
  }

  // Ordinal value mappings:
  // Mood: Positive = 3, Reflective/Neutral = 2, Low/Stressed = 1
  const mapMoodToValue = (mood?: string): number | null => {
    if (!mood) return null;
    if (mood === 'positive') return 3;
    if (mood === 'reflective' || mood === 'neutral') return 2;
    if (mood === 'stressed' || mood === 'low') return 1;
    return null;
  };

  // Stress: High = 3, Moderate = 2, Low = 1
  const mapStressToValue = (stress?: string): number | null => {
    if (!stress) return null;
    if (stress === 'high') return 3;
    if (stress === 'moderate') return 2;
    if (stress === 'low') return 1;
    return null;
  };

  const trendData = last7DaysList.map((dStr) => {
    const entry = days.find((d) => d.date === dStr);
    const signals = entry?.intelligence?.emotionalSignals;
    const parsedDate = new Date(dStr + 'T12:00:00');
    const shortLabel = parsedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const dayInitial = parsedDate.toLocaleDateString(undefined, { weekday: 'short' });
    return {
      date: dStr,
      shortLabel,
      dayInitial,
      title: entry?.title || 'Daily Entry',
      hasEntry: Boolean(entry?.journalText?.trim()),
      moodVal: mapMoodToValue(signals?.mood),
      stressVal: mapStressToValue(signals?.stress),
      moodLabel: signals?.mood || null,
      stressLabel: signals?.stress || null
    };
  });

  const validMoodPoints = trendData.filter((t) => t.moodVal !== null);
  const validStressPoints = trendData.filter((t) => t.stressVal !== null);

  // Weekly commitment rhythm (Mon-Sun of current week)
  const currentWeekDays = getDaysOfCurrentWeek(todayStr);
  const weeklyFollowThrough = currentWeekDays.map((dStr) => {
    const stats = getTodayTaskStats(tasks, dStr);
    const parsed = new Date(dStr + 'T12:00:00');
    const dayName = parsed.toLocaleDateString(undefined, { weekday: 'short' });
    const isToday = dStr === todayStr;
    return {
      date: dStr,
      dayName,
      isToday,
      total: stats.total,
      completed: stats.completed,
      percentage: stats.percentage,
      hasData: stats.hasData
    };
  });
  const hasAnyWeeklyTasks = weeklyFollowThrough.some((w) => w.hasData);

  // Mood Distribution across available entries (past 30 days)
  const past30DaysCutoff = addDays(todayStr, -30);
  const recentEntries = days.filter(
    (d) => d.date >= past30DaysCutoff && d.intelligence?.emotionalSignals?.mood
  );

  let positiveMoodCount = 0;
  let reflectiveNeutralCount = 0;
  let lowStressedCount = 0;

  recentEntries.forEach((d) => {
    const m = d.intelligence?.emotionalSignals?.mood;
    if (m === 'positive') positiveMoodCount++;
    else if (m === 'reflective' || m === 'neutral') reflectiveNeutralCount++;
    else if (m === 'low' || m === 'stressed') lowStressedCount++;
  });

  const totalMoodEntries = recentEntries.length;
  const positivePct = totalMoodEntries > 0 ? Math.round((positiveMoodCount / totalMoodEntries) * 100) : 0;
  const reflectiveNeutralPct =
    totalMoodEntries > 0 ? Math.round((reflectiveNeutralCount / totalMoodEntries) * 100) : 0;
  const lowStressedPct = totalMoodEntries > 0 ? Math.round((lowStressedCount / totalMoodEntries) * 100) : 0;

  // Determine Dominant State for Donut Center
  let dominantMoodLabel = 'Balanced';
  let dominantMoodPct = 0;
  if (positivePct >= reflectiveNeutralPct && positivePct >= lowStressedPct && positivePct > 0) {
    dominantMoodLabel = 'Positive';
    dominantMoodPct = positivePct;
  } else if (lowStressedPct >= positivePct && lowStressedPct >= reflectiveNeutralPct && lowStressedPct > 0) {
    dominantMoodLabel = 'Stressed';
    dominantMoodPct = lowStressedPct;
  } else if (reflectiveNeutralPct > 0) {
    dominantMoodLabel = 'Reflective';
    dominantMoodPct = reflectiveNeutralPct;
  }

  // Month at a Glance calculations
  const monthDatePrefix = todayStr.slice(0, 7); // "YYYY-MM"
  const currentMonthName = new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const monthEntries = days.filter((d) => d.date.startsWith(monthDatePrefix) && Boolean(d.journalText?.trim()));
  const monthPositiveDays = monthEntries.filter(
    (d) => d.intelligence?.emotionalSignals?.mood === 'positive'
  ).length;
  const monthHighStressDays = monthEntries.filter(
    (d) => d.intelligence?.emotionalSignals?.stress === 'high'
  ).length;

  // Grounded Personal Pattern Insight (Derived authentically from data)
  const getGroundedInsight = (): { title: string; body: string; countStr: string } => {
    if (todayEntry?.intelligence?.observations && todayEntry.intelligence.observations.length > 0) {
      return {
        title: 'Observed from today’s reflection',
        body: todayEntry.intelligence.observations[0],
        countStr: 'Today’s entry'
      };
    }
    const recentObs = days.find((d) => d.intelligence?.observations?.length)?.intelligence?.observations?.[0];
    if (recentObs) {
      return {
        title: 'Recent behavioral pattern',
        body: recentObs,
        countStr: 'Recent reflections'
      };
    }
    if (monthEntries.length >= 3) {
      if (monthPositiveDays > monthHighStressDays) {
        return {
          title: 'Positive momentum detected',
          body: `You have recorded ${monthPositiveDays} positive mood days this month compared to ${monthHighStressDays} high-stress periods. Keep up this reflective rhythm.`,
          countStr: `${monthEntries.length} reflections this month`
        };
      }
      if (monthTaskStats.hasData && monthTaskStats.percentage >= 70) {
        return {
          title: 'Steady commitment follow-through',
          body: `You have completed ${monthTaskStats.percentage}% of scheduled commitments this month, maintaining consistent daily follow-through.`,
          countStr: `${monthTaskStats.completed} completed tasks`
        };
      }
    }
    return {
      title: 'Awaiting pattern synthesis',
      body: 'Record daily reflections in the Journal to enable Gemini to recognize wellbeing trends, task correlations, and personal pacing patterns.',
      countStr: 'Awaiting data'
    };
  };

  const personalInsight = getGroundedInsight();

  // Upcoming Reminders
  const upcomingReminders = reminders
    .filter((r) => !r.completed && r.date >= todayStr)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .slice(0, 3);

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickText.trim() || isPosting) return;

    try {
      setIsPosting(true);
      setPostError(null);
      await onPostQuickJournal(quickText.trim());
      setQuickText('');
      setShowQuickInput(false);
    } catch (err: any) {
      setPostError(err?.message || 'Failed to save reflection. Please retry.');
      setIsPosting(false);
    }
  };

  return (
    <div className="w-full px-6 sm:px-8 lg:px-10 py-8 space-y-8 max-w-7xl mx-auto">
      
      {/* 1. TODAY HERO: Story-Driven Overview */}
      <section className="bg-white border border-[#e8e7e3] rounded-2xl p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6">
        
        {/* Header line: Personalized Greeting & Date */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#e8e7e3] pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#17181c] tracking-tight">
              {greeting}, {firstName}
            </h1>
            <p className="text-xs sm:text-sm text-[#64748b] mt-0.5">
              {formatDateDisplay(todayStr)} &bull; Your day at a glance
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f4f3ef] text-[#17181c] text-xs font-medium self-start sm:self-auto border border-[#e8e7e3]">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>
              {todayEntry?.journalText?.trim()
                ? "Today's reflection recorded"
                : todayTaskStats.total > 0
                ? `${todayTaskStats.remaining} commitment${todayTaskStats.remaining !== 1 ? 's' : ''} left today`
                : 'Ready for today’s reflection'}
            </span>
          </div>
        </div>

        {/* Hero Visual Centerpiece: Emotional Anchor + Personal Balance Constellation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Left Column: Expressive Emotional Anchor (Large Emoji & Human Context) */}
          <div className="lg:col-span-7 flex items-start gap-4 sm:gap-5">
            <div className="text-5xl sm:text-6xl select-none shrink-0 p-3 sm:p-4 rounded-2xl bg-[#fafaf8] border border-[#e8e7e3] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              {anchor.emoji}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${anchor.accentClass}`}>
                  {anchor.label}
                </span>
                <span className="text-[11px] text-[#94a3b8] font-mono">
                  {isTodaySignal ? 'From today’s reflection' : recentDayWithSignals ? `Observed ${recentDayWithSignals.date}` : 'Awaiting entry'}
                </span>
              </div>

              <p className="text-base sm:text-lg font-medium text-[#17181c] leading-snug">
                "{anchor.narrative}"
              </p>

              <p className="text-[11px] text-[#94a3b8]">
                Derived from authenticated private reflection notes &bull; Non-clinical AI estimate
              </p>
            </div>
          </div>

          {/* Right Column: Three-Axis Balance Constellation (Stress, Energy, Focus) */}
          <div className="lg:col-span-5 bg-[#fafaf8] rounded-xl p-4 sm:p-5 border border-[#e8e7e3] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#17181c] uppercase tracking-wider">
                Personal Balance
              </span>
              <span className="text-xs font-semibold text-indigo-700 font-mono bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                {balanceScore} / 100
              </span>
            </div>

            {/* 3 Metric Sliders */}
            <div className="space-y-2 pt-1">
              
              {/* Stress Level */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#64748b] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Stress Load</span>
                  </span>
                  <span className="font-medium text-[#17181c] capitalize">
                    {emotionalData?.stress || 'Low'}
                  </span>
                </div>
                <div className="w-full h-2 bg-[#e8e7e3] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-500"
                    style={{ width: `${stressPct}%` }}
                  />
                </div>
              </div>

              {/* Energy Level */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#64748b] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Energy Level</span>
                  </span>
                  <span className="font-medium text-[#17181c] capitalize">
                    {emotionalData?.energy || 'Moderate'}
                  </span>
                </div>
                <div className="w-full h-2 bg-[#e8e7e3] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${energyPct}%` }}
                  />
                </div>
              </div>

              {/* Focus Level */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#64748b] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    <span>Focus Pacing</span>
                  </span>
                  <span className="font-medium text-[#17181c] capitalize">
                    {emotionalData?.focus || 'Steady'}
                  </span>
                </div>
                <div className="w-full h-2 bg-[#e8e7e3] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${focusPct}%` }}
                  />
                </div>
              </div>

            </div>
          </div>

        </div>

      </section>

      {/* 2. TODAY'S ACTIONS & INTELLIGENCE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1: Commitments Action */}
        <div className="bg-white rounded-2xl border border-[#e8e7e3] p-5 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.015)] hover:border-[#dcdad4] transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                Today's Commitments
              </span>
              <Clock className="w-4 h-4 text-[#94a3b8]" />
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div className="text-2xl font-bold text-[#17181c]">
                {todayTaskStats.completed}{' '}
                <span className="text-xs font-normal text-[#64748b]">
                  of {todayTaskStats.total} done
                </span>
              </div>
              {todayTaskStats.total > 0 && (
                <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  {todayTaskStats.percentage}%
                </span>
              )}
            </div>

            {/* Progress Capsule */}
            <div className="w-full h-2.5 bg-[#f4f3ef] rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${todayTaskStats.percentage}%` }}
              />
            </div>

            <p className="text-xs text-[#64748b]">
              {todayTaskStats.total === 0
                ? 'No specific tasks planned for today.'
                : todayTaskStats.remaining === 0
                ? 'All planned commitments completed for today.'
                : `${todayTaskStats.remaining} remaining task${todayTaskStats.remaining > 1 ? 's' : ''} to complete today.`}
            </p>
          </div>

          <div className="pt-3 border-t border-[#f4f3ef] mt-4">
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 group transition-colors"
            >
              <span>Manage tasks</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Card 2: Daily Reflection Status */}
        <div className="bg-white rounded-2xl border border-[#e8e7e3] p-5 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.015)] hover:border-[#dcdad4] transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                Daily Reflection
              </span>
              <BookOpen className="w-4 h-4 text-[#94a3b8]" />
            </div>

            <div className="pt-1">
              {todayEntry?.journalText?.trim() ? (
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Captured for today</span>
                  </div>
                  <p className="text-xs text-[#64748b] line-clamp-2 italic pt-1">
                    "{todayEntry.journalText}"
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <span className="text-sm font-medium text-[#17181c] block">
                    No reflection recorded yet
                  </span>
                  <p className="text-xs text-[#64748b] leading-relaxed">
                    Write down key moments or feelings to fuel your personal intelligence models.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#f4f3ef] mt-4">
            {todayEntry?.journalText?.trim() ? (
              <button
                onClick={() => onNavigate('journal', todayStr)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 group transition-colors"
              >
                <span>View in Journal</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            ) : (
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowQuickInput(!showQuickInput)}
                  className="text-xs text-[#64748b] hover:text-[#17181c] font-medium transition-colors"
                >
                  {showQuickInput ? 'Cancel quick capture' : 'Capture thought'}
                </button>
                <button
                  onClick={() => onNavigate('journal', todayStr)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 group transition-colors"
                >
                  <span>Open Journal</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Upcoming Reminders Timeline */}
        <div className="bg-white rounded-2xl border border-[#e8e7e3] p-5 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.015)] hover:border-[#dcdad4] transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                Schedule & Reminders
              </span>
              <Bell className="w-4 h-4 text-[#94a3b8]" />
            </div>

            <div className="pt-1">
              {upcomingReminders.length === 0 ? (
                <div className="space-y-1">
                  <span className="text-sm font-medium text-[#17181c] block">
                    Schedule is clear
                  </span>
                  <p className="text-xs text-[#64748b]">
                    No urgent reminders or appointments pending for today.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingReminders.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-[#fafaf8] border border-[#e8e7e3]"
                    >
                      <span className="text-[#17181c] font-medium truncate">{r.title}</span>
                      <span className="text-[11px] font-mono text-indigo-600 shrink-0 ml-2 font-semibold">
                        {r.time}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#f4f3ef] mt-4">
            <button
              onClick={() => onNavigate('calendar')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 group transition-colors"
            >
              <span>View calendar</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

      </div>

      {/* Expandable Quick Capture Composer (Compact & Non-Dominant) */}
      {showQuickInput && !todayEntry?.journalText?.trim() && (
        <section className="bg-white rounded-2xl border border-[#e8e7e3] p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#17181c] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Capture Reflection for Today</span>
            </span>
            <span className="text-[11px] text-[#94a3b8]">
              Saves securely to Cloud Firestore
            </span>
          </div>

          <form onSubmit={handleQuickSubmit} className="space-y-3">
            <textarea
              value={quickText}
              onChange={(e) => setQuickText(e.target.value)}
              placeholder="What took your attention today? Any challenges, wins, or moments worth remembering?..."
              rows={3}
              className="w-full px-3.5 py-2.5 bg-[#fafaf8] border border-[#e8e7e3] rounded-xl text-xs text-[#17181c] placeholder-[#94a3b8] focus:outline-none focus:border-indigo-600 focus:bg-white transition-all resize-y leading-relaxed"
            />

            {postError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{postError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowQuickInput(false)}
                className="px-3 py-1.5 rounded-lg border border-[#e8e7e3] text-xs font-medium text-[#64748b] hover:bg-[#fafaf8]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!quickText.trim() || isPosting}
                className="px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
              >
                {isPosting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3" />
                    <span>Save Reflection</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* 3. DEDICATED TREND CHARTS: Mood Trend & Stress Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Chart 1: Smooth Mood Trend (7-Day) */}
        <section className="bg-white rounded-2xl border border-[#e8e7e3] p-5 sm:p-6 space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.015)]">
          <div className="flex items-center justify-between border-b border-[#f4f3ef] pb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#17181c] flex items-center gap-1.5">
                <Smile className="w-4 h-4 text-indigo-600" />
                <span>Mood over Time</span>
              </h2>
              <p className="text-xs text-[#64748b] mt-0.5">
                7-day trajectory synthesized from written reflections
              </p>
            </div>
            <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
              7-Day Trend
            </span>
          </div>

          {validMoodPoints.length < 2 ? (
            <div className="py-12 text-center text-xs text-[#64748b] bg-[#fafaf8] rounded-xl border border-dashed border-[#dcdad4] space-y-1">
              <p className="font-semibold text-[#17181c]">Awaiting more reflection data</p>
              <p className="text-[11px] text-[#64748b] max-w-xs mx-auto">
                Record reflections on at least 2 separate days to visualize your emotional trajectory.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-full h-44 relative">
                <svg className="w-full h-full" viewBox="0 0 500 140" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="moodAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.16" />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Guideline lines */}
                  <line x1="60" y1="20" x2="480" y2="20" stroke="#f1f0ec" strokeDasharray="3 3" />
                  <text x="14" y="24" fontSize="10" fill="#94a3b8" className="font-sans font-medium">Positive</text>

                  <line x1="60" y1="70" x2="480" y2="70" stroke="#f1f0ec" strokeDasharray="3 3" />
                  <text x="14" y="74" fontSize="10" fill="#94a3b8" className="font-sans font-medium">Neutral</text>

                  <line x1="60" y1="120" x2="480" y2="120" stroke="#f1f0ec" strokeDasharray="3 3" />
                  <text x="14" y="124" fontSize="10" fill="#94a3b8" className="font-sans font-medium">Low</text>

                  {/* Area fill under curve */}
                  {(() => {
                    const validList = trendData
                      .map((d, index) => {
                        if (d.moodVal === null) return null;
                        const x = 70 + index * (410 / 6);
                        const y = 120 - (d.moodVal - 1) * 50;
                        return { x, y };
                      })
                      .filter(Boolean) as Array<{ x: number; y: number }>;

                    if (validList.length < 2) return null;

                    let areaD = `M ${validList[0].x} ${validList[0].y}`;
                    for (let i = 0; i < validList.length - 1; i++) {
                      const p0 = validList[i];
                      const p1 = validList[i + 1];
                      const cpx = (p0.x + p1.x) / 2;
                      areaD += ` C ${cpx} ${p0.y}, ${cpx} ${p1.y}, ${p1.x} ${p1.y}`;
                    }
                    areaD += ` L ${validList[validList.length - 1].x} 125 L ${validList[0].x} 125 Z`;

                    return <path d={areaD} fill="url(#moodAreaGrad)" />;
                  })()}

                  {/* Smooth Bezier Line */}
                  {(() => {
                    const validList = trendData
                      .map((d, index) => {
                        if (d.moodVal === null) return null;
                        const x = 70 + index * (410 / 6);
                        const y = 120 - (d.moodVal - 1) * 50;
                        return { x, y };
                      })
                      .filter(Boolean) as Array<{ x: number; y: number }>;

                    if (validList.length < 2) return null;

                    let pathD = `M ${validList[0].x} ${validList[0].y}`;
                    for (let i = 0; i < validList.length - 1; i++) {
                      const p0 = validList[i];
                      const p1 = validList[i + 1];
                      const cpx = (p0.x + p1.x) / 2;
                      pathD += ` C ${cpx} ${p0.y}, ${cpx} ${p1.y}, ${p1.x} ${p1.y}`;
                    }

                    return (
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#4f46e5"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    );
                  })()}

                  {/* Day Points & Interaction */}
                  {trendData.map((d, index) => {
                    const x = 70 + index * (410 / 6);
                    const y = d.moodVal !== null ? 120 - (d.moodVal - 1) * 50 : null;

                    return (
                      <g key={d.date}>
                        <text x={x} y="138" fontSize="10" textAnchor="middle" fill="#64748b" className="font-sans">
                          {d.shortLabel}
                        </text>

                        {y !== null && (
                          <circle
                            cx={x}
                            cy={y}
                            r="5"
                            fill="#4f46e5"
                            stroke="#ffffff"
                            strokeWidth="2"
                            className="cursor-pointer transition-transform hover:scale-125"
                            onMouseEnter={() =>
                              setHoveredMoodPoint({
                                date: d.date,
                                mood: d.moodLabel || 'Recorded',
                                title: d.title
                              })
                            }
                            onMouseLeave={() => setHoveredMoodPoint(null)}
                          />
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Floating Tooltip */}
                {hoveredMoodPoint && (
                  <div className="absolute top-2 right-2 bg-zinc-900 text-white text-[11px] px-2.5 py-1.5 rounded-lg shadow-md pointer-events-none space-y-0.5">
                    <div className="font-medium">
                      {hoveredMoodPoint.date}: <span className="capitalize text-indigo-200">{hoveredMoodPoint.mood}</span>
                    </div>
                    {hoveredMoodPoint.title && (
                      <div className="text-zinc-300 text-[10px] truncate max-w-[180px]">
                        {hoveredMoodPoint.title}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#64748b] pt-2 border-t border-[#f4f3ef]">
                <span>Solid indigo curve shows self-reported emotional trajectory</span>
                <span className="font-medium">Positive &bull; Reflective &bull; Low</span>
              </div>
            </div>
          )}
        </section>

        {/* Chart 2: Dedicated Stress Trend (7-Day) */}
        <section className="bg-white rounded-2xl border border-[#e8e7e3] p-5 sm:p-6 space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.015)]">
          <div className="flex items-center justify-between border-b border-[#f4f3ef] pb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#17181c] flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-rose-600" />
                <span>Stress over Time</span>
              </h2>
              <p className="text-xs text-[#64748b] mt-0.5">
                Estimated stress signals across recent reflections
              </p>
            </div>
            <span className="text-[11px] font-medium text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
              Signal Pacing
            </span>
          </div>

          {validStressPoints.length < 2 ? (
            <div className="py-12 text-center text-xs text-[#64748b] bg-[#fafaf8] rounded-xl border border-dashed border-[#dcdad4] space-y-1">
              <p className="font-semibold text-[#17181c]">Awaiting more reflection data</p>
              <p className="text-[11px] text-[#64748b] max-w-xs mx-auto">
                Record reflections on at least 2 separate days to chart your stress fluctuations.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-full h-44 relative">
                <svg className="w-full h-full" viewBox="0 0 500 140" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="stressAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#e11d48" stopOpacity="0.14" />
                      <stop offset="100%" stopColor="#e11d48" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Guideline lines */}
                  <line x1="60" y1="20" x2="480" y2="20" stroke="#f1f0ec" strokeDasharray="3 3" />
                  <text x="14" y="24" fontSize="10" fill="#94a3b8" className="font-sans font-medium">High</text>

                  <line x1="60" y1="70" x2="480" y2="70" stroke="#f1f0ec" strokeDasharray="3 3" />
                  <text x="14" y="74" fontSize="10" fill="#94a3b8" className="font-sans font-medium">Moderate</text>

                  <line x1="60" y1="120" x2="480" y2="120" stroke="#f1f0ec" strokeDasharray="3 3" />
                  <text x="14" y="124" fontSize="10" fill="#94a3b8" className="font-sans font-medium">Calm</text>

                  {/* Area fill */}
                  {(() => {
                    const validList = trendData
                      .map((d, index) => {
                        if (d.stressVal === null) return null;
                        const x = 70 + index * (410 / 6);
                        const y = 120 - (d.stressVal - 1) * 50;
                        return { x, y };
                      })
                      .filter(Boolean) as Array<{ x: number; y: number }>;

                    if (validList.length < 2) return null;

                    let areaD = `M ${validList[0].x} ${validList[0].y}`;
                    for (let i = 0; i < validList.length - 1; i++) {
                      const p0 = validList[i];
                      const p1 = validList[i + 1];
                      const cpx = (p0.x + p1.x) / 2;
                      areaD += ` C ${cpx} ${p0.y}, ${cpx} ${p1.y}, ${p1.x} ${p1.y}`;
                    }
                    areaD += ` L ${validList[validList.length - 1].x} 125 L ${validList[0].x} 125 Z`;

                    return <path d={areaD} fill="url(#stressAreaGrad)" />;
                  })()}

                  {/* Smooth Coral Curve */}
                  {(() => {
                    const validList = trendData
                      .map((d, index) => {
                        if (d.stressVal === null) return null;
                        const x = 70 + index * (410 / 6);
                        const y = 120 - (d.stressVal - 1) * 50;
                        return { x, y };
                      })
                      .filter(Boolean) as Array<{ x: number; y: number }>;

                    if (validList.length < 2) return null;

                    let pathD = `M ${validList[0].x} ${validList[0].y}`;
                    for (let i = 0; i < validList.length - 1; i++) {
                      const p0 = validList[i];
                      const p1 = validList[i + 1];
                      const cpx = (p0.x + p1.x) / 2;
                      pathD += ` C ${cpx} ${p0.y}, ${cpx} ${p1.y}, ${p1.x} ${p1.y}`;
                    }

                    return (
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#e11d48"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    );
                  })()}

                  {/* Day Points & Interaction */}
                  {trendData.map((d, index) => {
                    const x = 70 + index * (410 / 6);
                    const y = d.stressVal !== null ? 120 - (d.stressVal - 1) * 50 : null;

                    return (
                      <g key={d.date}>
                        <text x={x} y="138" fontSize="10" textAnchor="middle" fill="#64748b" className="font-sans">
                          {d.shortLabel}
                        </text>

                        {y !== null && (
                          <circle
                            cx={x}
                            cy={y}
                            r="5"
                            fill="#e11d48"
                            stroke="#ffffff"
                            strokeWidth="2"
                            className="cursor-pointer transition-transform hover:scale-125"
                            onMouseEnter={() =>
                              setHoveredStressPoint({
                                date: d.date,
                                stress: d.stressLabel || 'Estimated'
                              })
                            }
                            onMouseLeave={() => setHoveredStressPoint(null)}
                          />
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Floating Tooltip */}
                {hoveredStressPoint && (
                  <div className="absolute top-2 right-2 bg-zinc-900 text-white text-[11px] px-2.5 py-1.5 rounded-lg shadow-md pointer-events-none">
                    <div className="font-medium">
                      {hoveredStressPoint.date}: <span className="capitalize text-rose-300">{hoveredStressPoint.stress} Stress</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#64748b] pt-2 border-t border-[#f4f3ef]">
                <span>Coral curve highlights estimated pressure load</span>
                <span className="font-medium">Calm &bull; Moderate &bull; High</span>
              </div>
            </div>
          )}
        </section>

      </div>

      {/* 4. WEEKLY RHYTHM & MOOD DISTRIBUTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Chart 3: Weekly Commitment Rhythm */}
        <section className="bg-white rounded-2xl border border-[#e8e7e3] p-5 sm:p-6 space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.015)]">
          <div className="flex items-center justify-between border-b border-[#f4f3ef] pb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#17181c] flex items-center gap-1.5">
                <Target className="w-4 h-4 text-emerald-600" />
                <span>Weekly Commitment Rhythm</span>
              </h2>
              <p className="text-xs text-[#64748b] mt-0.5">
                Daily completion rates across the current calendar week
              </p>
            </div>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              <span>Tasks</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {!hasAnyWeeklyTasks ? (
            <div className="py-12 text-center text-xs text-[#64748b] bg-[#fafaf8] rounded-xl border border-dashed border-[#dcdad4] space-y-1">
              <p className="font-semibold text-[#17181c]">No scheduled tasks this week</p>
              <p className="text-[11px] text-[#64748b] max-w-xs mx-auto">
                Add daily or recurring commitments in the Tasks section to track your execution rhythm.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Vertical Growing Capsules */}
              <div className="grid grid-cols-7 gap-2.5 items-end h-36 pt-4 px-2">
                {weeklyFollowThrough.map((day) => {
                  const barHeight = day.hasData ? Math.max(day.percentage, 10) : 6;
                  return (
                    <div key={day.date} className="flex flex-col items-center h-full justify-end group relative">
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-zinc-900 text-white text-[10px] px-2 py-0.5 rounded pointer-events-none whitespace-nowrap z-10">
                        {day.hasData ? `${day.completed}/${day.total} tasks (${day.percentage}%)` : 'No tasks'}
                      </div>

                      {/* Bar Capsule */}
                      <div className="w-full bg-[#f4f3ef] rounded-t-lg overflow-hidden flex flex-col justify-end h-28 border border-[#e8e7e3]">
                        <div
                          className={`w-full transition-all duration-500 rounded-t-lg ${
                            !day.hasData
                              ? 'bg-[#e8e7e3]'
                              : day.percentage === 100
                              ? 'bg-emerald-600'
                              : day.percentage >= 50
                              ? 'bg-indigo-600'
                              : 'bg-zinc-700'
                          }`}
                          style={{ height: `${barHeight}%` }}
                        />
                      </div>

                      {/* Day Label */}
                      <span
                        className={`text-[11px] mt-1.5 font-medium ${
                          day.isToday ? 'text-indigo-600 font-bold' : 'text-[#64748b]'
                        }`}
                      >
                        {day.dayName}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#64748b] pt-2 border-t border-[#f4f3ef]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600" />
                  <span>100% Completed</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600" />
                  <span>50%+ Completed</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#e8e7e3]" />
                  <span>No scheduled tasks</span>
                </span>
              </div>
            </div>
          )}
        </section>

        {/* Chart 4: Segmented Circular Mood Distribution */}
        <section className="bg-white rounded-2xl border border-[#e8e7e3] p-5 sm:p-6 space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.015)]">
          <div className="flex items-center justify-between border-b border-[#f4f3ef] pb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#17181c] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>30-Day Mood Distribution</span>
              </h2>
              <p className="text-xs text-[#64748b] mt-0.5">
                Proportional breakdown of emotional signals
              </p>
            </div>
            <span className="text-[11px] font-medium text-[#64748b] bg-[#f4f3ef] px-2.5 py-0.5 rounded-full border border-[#e8e7e3]">
              {totalMoodEntries} reflection{totalMoodEntries !== 1 ? 's' : ''}
            </span>
          </div>

          {totalMoodEntries < 2 ? (
            <div className="py-12 text-center text-xs text-[#64748b] bg-[#fafaf8] rounded-xl border border-dashed border-[#dcdad4] space-y-1">
              <p className="font-semibold text-[#17181c]">Not enough reflections yet</p>
              <p className="text-[11px] text-[#64748b] max-w-xs mx-auto">
                Record a few more entries to generate your monthly emotional distribution donut.
              </p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6 pt-1">
              
              {/* Circular Segmented Donut Visualization */}
              <div className="w-36 h-36 relative shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#f4f3ef"
                    strokeWidth="12"
                  />
                  {/* Positive Arc (Emerald) */}
                  {positivePct > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#059669"
                      strokeWidth="12"
                      strokeDasharray={`${(positivePct * 251.2) / 100} 251.2`}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                    />
                  )}
                  {/* Reflective Arc (Indigo) */}
                  {reflectiveNeutralPct > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#4f46e5"
                      strokeWidth="12"
                      strokeDasharray={`${(reflectiveNeutralPct * 251.2) / 100} 251.2`}
                      strokeDashoffset={`-${(positivePct * 251.2) / 100}`}
                      strokeLinecap="round"
                    />
                  )}
                  {/* Low/Stressed Arc (Rose) */}
                  {lowStressedPct > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#e11d48"
                      strokeWidth="12"
                      strokeDasharray={`${(lowStressedPct * 251.2) / 100} 251.2`}
                      strokeDashoffset={`-${((positivePct + reflectiveNeutralPct) * 251.2) / 100}`}
                      strokeLinecap="round"
                    />
                  )}
                </svg>

                {/* Donut Center Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
                  <span className="text-xl font-bold text-[#17181c] tracking-tight">
                    {dominantMoodPct > 0 ? `${dominantMoodPct}%` : '—'}
                  </span>
                  <span className="text-[10px] font-semibold text-[#64748b] capitalize">
                    {dominantMoodLabel}
                  </span>
                </div>
              </div>

              {/* Legend & Proportions Breakdown */}
              <div className="flex-1 w-full space-y-2.5">
                <div className="p-2.5 rounded-xl bg-[#fafaf8] border border-[#e8e7e3] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                    <span className="text-xs font-medium text-[#17181c]">Positive</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold text-[#17181c]">{positivePct}%</span>
                    <span className="text-[10px] text-[#94a3b8]">({positiveMoodCount}d)</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#fafaf8] border border-[#e8e7e3] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0" />
                    <span className="text-xs font-medium text-[#17181c]">Reflective</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold text-[#17181c]">{reflectiveNeutralPct}%</span>
                    <span className="text-[10px] text-[#94a3b8]">({reflectiveNeutralCount}d)</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#fafaf8] border border-[#e8e7e3] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0" />
                    <span className="text-xs font-medium text-[#17181c]">Low / Stressed</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold text-[#17181c]">{lowStressedPct}%</span>
                    <span className="text-[10px] text-[#94a3b8]">({lowStressedCount}d)</span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </section>

      </div>

      {/* 5. MONTHLY PICTURE & SIGNATURE GEMINI INTELLIGENCE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Section 5A: Current Month Activity (Asymmetric Layout) */}
        <section className="bg-white rounded-2xl border border-[#e8e7e3] p-5 sm:p-6 space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.015)]">
          <div className="flex items-center justify-between border-b border-[#f4f3ef] pb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#17181c] flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-[#17181c]" />
                <span>{currentMonthName} in Review</span>
              </h2>
              <p className="text-xs text-[#64748b] mt-0.5">
                Aggregated monthly activity and adherence statistics
              </p>
            </div>
            <button
              onClick={() => onNavigate('calendar')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              <span>Calendar</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Asymmetric Layout: 1 Primary Dominant Stat + 3 Supporting Mini-Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
            
            {/* Primary Dominant Stat */}
            <div className="sm:col-span-6 p-4 rounded-xl bg-[#fafaf8] border border-[#e8e7e3] flex flex-col justify-between">
              <div>
                <span className="text-[11px] uppercase font-semibold text-[#64748b] tracking-wider block">
                  Total Reflections
                </span>
                <div className="text-3xl sm:text-4xl font-bold text-[#17181c] mt-1.5 tracking-tight">
                  {monthEntries.length}
                </div>
              </div>
              <p className="text-xs text-[#64748b] mt-3">
                {monthEntries.length > 0
                  ? 'Consistent self-reflection recorded throughout this month.'
                  : 'No reflections logged yet this month.'}
              </p>
            </div>

            {/* 3 Supporting Metrics */}
            <div className="sm:col-span-6 space-y-2.5">
              <div className="p-2.5 rounded-xl bg-[#fafaf8] border border-[#e8e7e3] flex items-center justify-between">
                <span className="text-xs text-[#64748b]">Positive Mood Days</span>
                <span className="text-sm font-bold text-emerald-700">{monthPositiveDays}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#fafaf8] border border-[#e8e7e3] flex items-center justify-between">
                <span className="text-xs text-[#64748b]">High-Stress Periods</span>
                <span className="text-sm font-bold text-rose-700">{monthHighStressDays}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#fafaf8] border border-[#e8e7e3] flex items-center justify-between">
                <span className="text-xs text-[#64748b]">Task Follow-Through</span>
                <span className="text-sm font-bold text-indigo-700">
                  {monthTaskStats.hasData ? `${monthTaskStats.percentage}%` : 'N/A'}
                </span>
              </div>
            </div>

          </div>

          {/* Month Progress Capsule */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs text-[#64748b]">
              <span>Monthly commitment completion rate</span>
              <span className="font-semibold text-[#17181c]">
                {monthTaskStats.completed} / {monthTaskStats.total} tasks
              </span>
            </div>
            <div className="w-full h-2 bg-[#f4f3ef] rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${monthTaskStats.percentage}%` }}
              />
            </div>
          </div>
        </section>

        {/* Section 5B: Signature Gemini Intelligence (Personal Pattern Insight) */}
        <section className="bg-[#fbfafd] rounded-2xl border border-[#ede9fe] p-5 sm:p-6 space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.01)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#ede9fe] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <h2 className="text-sm font-semibold text-[#17181c]">
                  Gemini Intelligence
                </h2>
              </div>
              <span className="text-[10px] font-semibold text-indigo-800 bg-indigo-100/70 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                Pattern Recognition
              </span>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-white border border-[#ede9fe] space-y-2">
              <span className="text-xs font-semibold text-indigo-950 block">
                ✨ Gemini noticed
              </span>
              <p className="text-xs sm:text-sm text-[#17181c] leading-relaxed">
                "{personalInsight.body}"
              </p>
              <div className="pt-2 text-[10px] font-mono text-[#64748b] flex items-center justify-between border-t border-[#f4f3ef]">
                <span>Based on: {personalInsight.countStr}</span>
                <span className="text-indigo-600 font-medium">Authentic personal data</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#ede9fe] flex items-center justify-between text-[11px] text-[#64748b]">
            <span className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-indigo-500" />
              <span>Grounded solely in your authenticated private entries</span>
            </span>
            <button
              onClick={() => onNavigate('analysis')}
              className="text-xs text-indigo-700 hover:text-indigo-900 font-semibold flex items-center gap-1 group"
            >
              <span>Explore Analysis</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </section>

      </div>

      {/* 6. ACTIVE GOALS & EMPTY STATE POLISH */}
      <section className="bg-white rounded-2xl border border-[#e8e7e3] p-5 sm:p-6 space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.015)]">
        <div className="flex items-center justify-between border-b border-[#f4f3ef] pb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-semibold text-[#17181c]">
              Active Life Goals
            </h2>
          </div>
          <button
            onClick={() => onNavigate('tasks')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
          >
            <span>{goals.length > 0 ? 'Manage goals' : 'Create a goal'}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {goals.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#64748b] bg-[#fafaf8] rounded-xl border border-dashed border-[#dcdad4] space-y-2">
            <Target className="w-6 h-6 text-[#94a3b8] mx-auto" />
            <p className="font-semibold text-[#17181c]">No active goals set yet</p>
            <p className="text-[11px] text-[#64748b] max-w-sm mx-auto">
              Set a goal and we'll help you see how your daily actions and commitments connect to it.
            </p>
            <button
              onClick={() => onNavigate('tasks')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 transition-colors shadow-sm mt-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create a Goal</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {goals.slice(0, 3).map((goal) => (
              <div
                key={goal.id}
                className="p-4 rounded-xl bg-[#fafaf8] border border-[#e8e7e3] space-y-2 hover:border-[#dcdad4] transition-all"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#17181c] font-semibold truncate">{goal.title}</span>
                  <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-100 uppercase font-mono px-2 py-0.5 rounded-full">
                    {goal.category}
                  </span>
                </div>
                <div className="w-full h-2 bg-[#e8e7e3] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${goal.progress || 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-[#64748b] pt-1">
                  <span>Progress</span>
                  <span className="font-semibold text-[#17181c]">{goal.progress || 0}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
};
