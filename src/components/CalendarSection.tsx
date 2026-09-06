import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Bell,
  Sparkles,
  TrendingUp,
  Plus,
  Trash2,
  ArrowRight,
  X,
  Layers,
  HeartPulse,
  BookOpen
} from 'lucide-react';
import type {
  DayEntry,
  TaskItem,
  ReminderItem,
  UserSettings,
  NavSection
} from '../types';
import {
  getTodayDateString,
  formatDateDisplay,
  formatShortDate,
  getWeekKey,
  getMonthKey,
  calculateWeekTaskStats,
  calculateMonthTaskStats,
  getWeekDateRange
} from '../lib/dateUtils';
import { DayDetailModal } from './DayDetailModal';
import { isTaskCompleted } from '../lib/taskUtils';

interface CalendarSectionProps {
  days: DayEntry[];
  tasks: TaskItem[];
  reminders: ReminderItem[];
  settings: UserSettings;
  onSelectDate: (date: string) => void;
  onNavigate: (section: NavSection, dateContext?: string) => void;
  onAddReminder: (reminder: Omit<ReminderItem, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  onDeleteReminder: (reminderId: string) => Promise<void>;
  onToggleTask?: (taskId: string, currentStatus: boolean, targetDate?: string) => Promise<void>;
  onAddTask?: (title: string, dueDate?: string) => Promise<void>;
}

export const CalendarSection: React.FC<CalendarSectionProps> = ({
  days,
  tasks,
  reminders,
  settings,
  onSelectDate,
  onNavigate,
  onAddReminder,
  onDeleteReminder,
  onToggleTask,
  onAddTask
}) => {
  const todayStr = getTodayDateString();
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); // 0-indexed
  
  // Secondary view tabs inside Calendar
  const [calendarSubView, setCalendarSubView] = useState<'month' | 'weekly' | 'reminders'>('month');

  // Day detail modal state
  const [activeDateModal, setActiveDateModal] = useState<string | null>(null);

  // Reminders panel state
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderDate, setNewReminderDate] = useState(todayStr);
  const [newReminderTime, setNewReminderTime] = useState('18:00');
  const [isSubmittingReminder, setIsSubmittingReminder] = useState(false);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Month Key: "YYYY-MM"
  const formattedMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const monthStats = calculateMonthTaskStats(tasks, formattedMonthStr);

  // Calculate calendar grid days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const calendarDays: Array<{
    dateStr: string;
    dayNum: number;
    isCurrentMonth: boolean;
    entry?: DayEntry;
    dayTasks: TaskItem[];
    dayReminders: ReminderItem[];
  }> = [];

  // Previous month trailing padding
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const dayNum = prevMonthDays - i;
    const prevMonthNum = currentMonth === 0 ? 12 : currentMonth;
    const prevYearNum = currentMonth === 0 ? currentYear - 1 : currentYear;
    const dStr = `${prevYearNum}-${String(prevMonthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    calendarDays.push({
      dateStr: dStr,
      dayNum,
      isCurrentMonth: false,
      entry: days.find((d) => d.date === dStr),
      dayTasks: tasks.filter((t) => t.dueDate === dStr || (!t.dueDate && t.scope === 'daily')),
      dayReminders: reminders.filter((r) => r.date === dStr)
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    calendarDays.push({
      dateStr: dStr,
      dayNum: i,
      isCurrentMonth: true,
      entry: days.find((d) => d.date === dStr),
      dayTasks: tasks.filter((t) => t.dueDate === dStr || (!t.dueDate && t.scope === 'daily')),
      dayReminders: reminders.filter((r) => r.date === dStr)
    });
  }

  // Next month trailing padding to fill 35 or 42 grid cells
  const remaining = 35 - calendarDays.length > 0 ? 35 - calendarDays.length : (42 - calendarDays.length);
  for (let i = 1; i <= remaining; i++) {
    const nextMonthNum = currentMonth === 11 ? 1 : currentMonth + 2;
    const nextYearNum = currentMonth === 11 ? currentYear + 1 : currentYear;
    const dStr = `${nextYearNum}-${String(nextMonthNum).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    calendarDays.push({
      dateStr: dStr,
      dayNum: i,
      isCurrentMonth: false,
      entry: days.find((d) => d.date === dStr),
      dayTasks: tasks.filter((t) => t.dueDate === dStr || (!t.dueDate && t.scope === 'daily')),
      dayReminders: reminders.filter((r) => r.date === dStr)
    });
  }

  // Group weeks for weekly summary cards
  const weeksInMonth: string[] = [];
  calendarDays.forEach((cell) => {
    if (cell.isCurrentMonth) {
      const wk = getWeekKey(cell.dateStr);
      if (!weeksInMonth.includes(wk)) {
        weeksInMonth.push(wk);
      }
    }
  });

  const handleDateClick = (dateStr: string) => {
    setActiveDateModal(dateStr);
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderTitle.trim()) return;
    setIsSubmittingReminder(true);
    try {
      await onAddReminder({
        title: newReminderTitle.trim(),
        date: newReminderDate,
        time: newReminderTime,
        completed: false
      });
      setNewReminderTitle('');
      setShowReminderForm(false);
    } finally {
      setIsSubmittingReminder(false);
    }
  };

  const selectedEntry = activeDateModal ? days.find((d) => d.date === activeDateModal) : undefined;

  return (
    <div className="w-full px-6 sm:px-8 lg:px-10 py-8 space-y-6 max-w-7xl mx-auto">
      
      {/* 1. Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e8e7e3] pb-5">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl sm:text-2xl font-semibold text-[#17181c] tracking-tight">
              {monthNames[currentMonth]} {currentYear}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#f4f3ef] text-[#17181c] font-medium border border-[#e8e7e3]">
              {monthStats.percentage}% Tasks Done
            </span>
          </div>
          <p className="text-xs text-[#64748b] mt-1">
            Temporal activity grid &bull; Click any date to view commitments, reflection, and wellbeing details
          </p>
        </div>

        {/* Month Navigation Buttons & Reminder trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-white hover:bg-[#f4f3ef] text-[#17181c] transition-colors border border-[#e8e7e3] shadow-2xs"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              const now = new Date();
              setCurrentYear(now.getFullYear());
              setCurrentMonth(now.getMonth());
            }}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#f4f3ef] text-[#17181c] text-xs font-medium transition-colors border border-[#e8e7e3] shadow-2xs"
          >
            Today
          </button>

          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl bg-white hover:bg-[#f4f3ef] text-[#17181c] transition-colors border border-[#e8e7e3] shadow-2xs"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setCalendarSubView('reminders');
              setShowReminderForm(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors ml-2 shadow-sm"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>New Reminder</span>
          </button>
        </div>
      </div>

      {/* 2. Secondary View Navigation Tabs (Month Grid | Weekly Progress | Reminders) */}
      <div className="flex items-center space-x-2 border-b border-[#e8e7e3] pb-3 text-xs">
        <button
          onClick={() => setCalendarSubView('month')}
          className={`px-4 py-1.5 rounded-xl font-medium transition-all ${
            calendarSubView === 'month'
              ? 'bg-white text-[#17181c] font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#e8e7e3]'
              : 'text-[#64748b] hover:text-[#17181c] hover:bg-[#f4f3ef] border border-transparent'
          }`}
        >
          Month Grid
        </button>
        <button
          onClick={() => setCalendarSubView('weekly')}
          className={`px-4 py-1.5 rounded-xl font-medium transition-all ${
            calendarSubView === 'weekly'
              ? 'bg-white text-[#17181c] font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#e8e7e3]'
              : 'text-[#64748b] hover:text-[#17181c] hover:bg-[#f4f3ef] border border-transparent'
          }`}
        >
          Weekly Summaries ({weeksInMonth.length})
        </button>
        <button
          onClick={() => setCalendarSubView('reminders')}
          className={`px-4 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
            calendarSubView === 'reminders'
              ? 'bg-white text-[#17181c] font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#e8e7e3]'
              : 'text-[#64748b] hover:text-[#17181c] hover:bg-[#f4f3ef] border border-transparent'
          }`}
        >
          <span>Reminders</span>
          {reminders.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#f4f3ef] text-[#17181c] text-[10px] flex items-center justify-center font-mono border border-[#e8e7e3]">
              {reminders.length}
            </span>
          )}
        </button>
      </div>

      {/* 3. MONTH GRID VIEW */}
      {calendarSubView === 'month' && (
        <section className="bg-white rounded-2xl border border-[#e8e7e3] p-4 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.015)] space-y-4">
          
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-2.5 text-center text-[11px] font-semibold tracking-wider text-[#64748b] uppercase border-b border-[#f4f3ef] pb-3">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Calendar Cells Grid */}
          <div className="grid grid-cols-7 gap-2.5">
            {calendarDays.map((cell) => {
              const isToday = cell.dateStr === todayStr;
              const hasJournal = !!cell.entry?.journalText?.trim();
              const emotional = cell.entry?.intelligence?.emotionalSignals;
              const hasReminders = cell.dayReminders.length > 0;
              const completedTasks = cell.dayTasks.filter((t) => isTaskCompleted(t, cell.dateStr)).length;
              const totalTasks = cell.dayTasks.length;
              const taskPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => handleDateClick(cell.dateStr)}
                  className={`min-h-[102px] sm:min-h-[114px] p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                    isToday
                      ? 'bg-white border-2 border-indigo-600 shadow-[0_2px_8px_rgba(79,70,229,0.12)]'
                      : cell.isCurrentMonth
                      ? 'bg-white border-[#e8e7e3] hover:border-[#b8b5ad] hover:shadow-[0_2px_6px_rgba(0,0,0,0.03)]'
                      : 'bg-[#fafaf8] border-[#f1f0ec] opacity-35 hover:opacity-75'
                  }`}
                >
                  {/* Top: Day Number and Micro Badges */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-medium ${
                        isToday
                          ? 'text-indigo-600 font-bold'
                          : cell.isCurrentMonth
                          ? 'text-[#17181c]'
                          : 'text-[#94a3b8]'
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    <div className="flex items-center space-x-1.5">
                      {hasJournal && (
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            emotional?.mood === 'positive'
                              ? 'bg-emerald-600'
                              : emotional?.mood === 'reflective'
                              ? 'bg-indigo-600'
                              : emotional?.stress === 'high'
                              ? 'bg-rose-600'
                              : 'bg-emerald-600'
                          }`}
                          title="Journal Reflection recorded"
                        />
                      )}
                      {hasReminders && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"
                          title={`${cell.dayReminders.length} reminder(s)`}
                        />
                      )}
                      {isToday && (
                        <span className="text-[9px] font-semibold text-indigo-600 uppercase font-sans">
                          Today
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle: Emotional Mood Indicator (if enabled) */}
                  {settings.enableEmotionalAnalysis && emotional && (
                    <div className="py-1">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md capitalize block truncate font-medium border ${
                          emotional.mood === 'positive'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : emotional.mood === 'reflective'
                            ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                            : emotional.mood === 'stressed' || emotional.stress === 'high'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-[#f4f3ef] text-[#17181c] border-[#e8e7e3]'
                        }`}
                      >
                        {emotional.mood}
                      </span>
                    </div>
                  )}

                  {/* Bottom: Task Progress Capsule */}
                  <div className="pt-1">
                    {totalTasks > 0 ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-mono text-[#64748b]">
                            {completedTasks}/{totalTasks}
                          </span>
                          <span
                            className={`font-mono text-[9px] font-semibold ${
                              completedTasks === totalTasks ? 'text-emerald-700' : 'text-[#64748b]'
                            }`}
                          >
                            {taskPct}%
                          </span>
                        </div>
                        <div className="w-full h-1 bg-[#f4f3ef] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              completedTasks === totalTasks ? 'bg-emerald-600' : 'bg-indigo-600'
                            }`}
                            style={{ width: `${taskPct}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-zinc-300 group-hover:text-zinc-400">
                        &bull;
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grid Legend */}
          <div className="flex items-center justify-between pt-3 border-t border-[#f4f3ef] text-[11px] text-[#64748b] flex-wrap gap-3">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>Positive Reflection</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                <span>Reflective Day</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600" />
                <span>Elevated Stress</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Reminder</span>
              </span>
            </div>
            <span>Click any day to view details &amp; reflections</span>
          </div>

        </section>
      )}

      {/* 4. WEEKLY SUMMARIES VIEW */}
      {calendarSubView === 'weekly' && (
        <section className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weeksInMonth.map((wk) => {
              const weekStat = calculateWeekTaskStats(tasks, wk);
              const range = getWeekDateRange(wk);
              const weekNum = wk.split('-W')[1];

              // Count entries in this week
              const weekDaysWithEntries = days.filter(
                (d) => getWeekKey(d.date) === wk && Boolean(d.journalText?.trim())
              ).length;

              return (
                <div
                  key={wk}
                  className="bg-white rounded-2xl border border-[#e8e7e3] p-5 space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.015)]"
                >
                  <div className="flex items-center justify-between border-b border-[#f4f3ef] pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-[#fafaf8] text-indigo-700 flex items-center justify-center font-bold text-xs border border-[#e8e7e3]">
                        W{weekNum}
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-[#17181c]">
                          Week {weekNum} ({wk})
                        </h3>
                        <p className="text-[11px] text-[#64748b] font-mono">
                          {formatShortDate(range.start)} &ndash; {formatShortDate(range.end)}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-semibold text-[#17181c] bg-[#f4f3ef] px-2.5 py-0.5 rounded-full border border-[#e8e7e3]">
                      {weekStat.percentage}% Complete
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="w-full h-2 bg-[#f4f3ef] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${weekStat.percentage}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#64748b]">
                      <span>{weekStat.completed} of {weekStat.total} weekly commitments</span>
                      <span>{weekDaysWithEntries} daily reflections logged</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-[#f4f3ef] flex items-center justify-between">
                    <button
                      onClick={() => {
                        onSelectDate(range.start);
                        onNavigate('journal', range.start);
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                    >
                      <span>Jump to week start</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onNavigate('tasks')}
                      className="text-xs text-[#64748b] hover:text-[#17181c] font-medium"
                    >
                      View tasks &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. REMINDERS MANAGEMENT VIEW */}
      {calendarSubView === 'reminders' && (
        <section className="bg-white rounded-2xl border border-[#e8e7e3] p-6 space-y-6 shadow-[0_1px_2px_rgba(0,0,0,0.015)]">
          <div className="flex items-center justify-between border-b border-[#f4f3ef] pb-4">
            <div>
              <h2 className="text-sm font-semibold text-[#17181c] flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-600" />
                <span>Scheduled Reminders</span>
              </h2>
              <p className="text-xs text-[#64748b] mt-0.5">
                Time-based contextual alerts integrated directly with your calendar dates
              </p>
            </div>

            <button
              onClick={() => setShowReminderForm(!showReminderForm)}
              className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showReminderForm ? 'Cancel' : 'Add Reminder'}</span>
            </button>
          </div>

          {/* New Reminder Form */}
          {showReminderForm && (
            <form onSubmit={handleCreateReminder} className="p-4 bg-[#fafaf8] border border-[#e8e7e3] rounded-2xl space-y-3">
              <span className="text-xs font-semibold text-[#17181c] block">
                Create Context Reminder
              </span>

              <div className="space-y-2">
                <input
                  type="text"
                  value={newReminderTitle}
                  onChange={(e) => setNewReminderTitle(e.target.value)}
                  placeholder="Reminder label (e.g., Weekly sprint planning, Doctor appointment)..."
                  className="w-full px-3.5 py-2 bg-white border border-[#e8e7e3] rounded-xl text-xs text-[#17181c] placeholder-[#94a3b8] focus:outline-none focus:border-indigo-600"
                  autoFocus
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[#64748b] block mb-1">Target Date</label>
                    <input
                      type="date"
                      value={newReminderDate}
                      onChange={(e) => setNewReminderDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-[#e8e7e3] rounded-xl text-xs text-[#17181c] focus:outline-none focus:border-indigo-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-[#64748b] block mb-1">Time</label>
                    <input
                      type="time"
                      value={newReminderTime}
                      onChange={(e) => setNewReminderTime(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-[#e8e7e3] rounded-xl text-xs text-[#17181c] focus:outline-none focus:border-indigo-600 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowReminderForm(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs text-[#64748b] hover:bg-[#f4f3ef] transition-colors border border-[#e8e7e3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newReminderTitle.trim() || isSubmittingReminder}
                  className="px-4 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white text-xs font-medium transition-colors shadow-sm"
                >
                  {isSubmittingReminder ? 'Saving...' : 'Save Reminder'}
                </button>
              </div>
            </form>
          )}

          {/* List of Reminders */}
          {reminders.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#64748b] bg-[#fafaf8] rounded-xl border border-dashed border-[#dcdad4]">
              No active reminders. Click "Add Reminder" above to create an alert.
            </div>
          ) : (
            <div className="divide-y divide-[#f4f3ef]">
              {reminders
                .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
                .map((rem) => {
                  const isPast = rem.date < todayStr;
                  return (
                    <div
                      key={rem.id}
                      className="py-3 px-2 flex items-center justify-between hover:bg-[#fafaf8] rounded-xl transition-colors group"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <Bell className={`w-4 h-4 shrink-0 ${isPast ? 'text-[#94a3b8]' : 'text-indigo-600'}`} />
                        <div className="min-w-0">
                          <p className={`text-xs font-medium truncate ${isPast ? 'line-through text-[#94a3b8]' : 'text-[#17181c]'}`}>
                            {rem.title}
                          </p>
                          <p className="text-[11px] font-mono text-[#64748b]">
                            {formatDateDisplay(rem.date)} at {rem.time}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            onSelectDate(rem.date);
                            handleDateClick(rem.date);
                          }}
                          className="px-2.5 py-1 text-[11px] text-[#64748b] hover:text-[#17181c] bg-[#f4f3ef] hover:bg-[#e8e7e3] rounded-lg transition-colors"
                        >
                          View Day
                        </button>
                        <button
                          onClick={() => onDeleteReminder(rem.id)}
                          className="p-1.5 text-[#94a3b8] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete reminder"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </section>
      )}

      {/* 6. Day Detail Modal */}
      {activeDateModal && (
        <DayDetailModal
          isOpen={true}
          onClose={() => setActiveDateModal(null)}
          date={activeDateModal}
          entry={selectedEntry}
          tasks={tasks}
          reminders={reminders}
          settings={settings}
          onOpenInJournal={(date) => {
            onSelectDate(date);
            onNavigate('journal', date);
          }}
          onToggleTask={async (taskId, current, targetDate) => {
            if (onToggleTask) await onToggleTask(taskId, current, targetDate || activeDateModal || undefined);
          }}
          onAddTaskForDay={async (title, date) => {
            if (onAddTask) await onAddTask(title, date);
          }}
        />
      )}

    </div>
  );
};
