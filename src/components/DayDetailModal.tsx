import React, { useState } from 'react';
import {
  X,
  BookOpen,
  CheckCircle2,
  Circle,
  Bell,
  Sparkles,
  ArrowRight,
  Plus,
  Calendar,
  Layers,
  HeartPulse,
  Clock,
  PenLine
} from 'lucide-react';
import type {
  DayEntry,
  TaskItem,
  ReminderItem,
  UserSettings
} from '../types';
import { formatDateDisplay, getWeekKey } from '../lib/dateUtils';
import { isTaskCompleted } from '../lib/taskUtils';

interface DayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  entry?: DayEntry;
  tasks: TaskItem[];
  reminders: ReminderItem[];
  settings: UserSettings;
  onOpenInJournal: (date: string) => void;
  onToggleTask: (taskId: string, currentStatus: boolean, targetDate?: string) => Promise<void>;
  onAddTaskForDay?: (title: string, date: string) => Promise<void>;
}

export function DayDetailModal({
  isOpen,
  onClose,
  date,
  entry,
  tasks,
  reminders,
  settings,
  onOpenInJournal,
  onToggleTask,
  onAddTaskForDay
}: DayDetailModalProps) {
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  if (!isOpen) return null;

  // Filter tasks belonging directly to this date or daily tasks
  const dayTasks = tasks.filter((t) => t.dueDate === date || (!t.dueDate && t.scope === 'daily'));
  const weekKey = getWeekKey(date);
  const weeklyTasks = tasks.filter((t) => t.scope === 'weekly' && t.weekKey === weekKey);
  const dayReminders = reminders.filter((r) => r.date === date);

  const completedDayTasks = dayTasks.filter((t) => isTaskCompleted(t, date)).length;
  const dayTaskPercentage =
    dayTasks.length > 0 ? Math.round((completedDayTasks / dayTasks.length) * 100) : 0;

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim() || !onAddTaskForDay || isSubmittingTask) return;
    setIsSubmittingTask(true);
    try {
      await onAddTaskForDay(quickTaskTitle.trim(), date);
      setQuickTaskTitle('');
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const signals = entry?.intelligence?.emotionalSignals;
  const parsedDate = new Date(date + 'T12:00:00');
  const dayOfWeekName = parsedDate.toLocaleDateString(undefined, { weekday: 'long' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-white border border-[#e8e7e3] rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#e8e7e3] flex items-center justify-between bg-[#fafaf8]">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 rounded-xl bg-white text-zinc-800 border border-[#e8e7e3] shadow-xs shrink-0">
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-semibold text-[#17181c] tracking-tight">
                  {dayOfWeekName}, {formatDateDisplay(date)}
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#f4f3ef] text-[#64748b] font-mono border border-[#e8e7e3]">
                  W{weekKey.split('-W')[1]}
                </span>
              </div>
              <p className="text-xs text-[#64748b] mt-0.5">
                {date} &bull; Daily record and intelligence summary
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onClose();
                onOpenInJournal(date);
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-300" />
              <span>Open in Journal</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#94a3b8] hover:text-[#17181c] hover:bg-[#f4f3ef] transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* 1. Journal Reflection Section */}
          <div className="p-5 rounded-2xl bg-[#fafaf8] border border-[#e8e7e3] space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#64748b] flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Journal Reflection</span>
              </span>
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                  entry?.journalText?.trim()
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-[#f4f3ef] text-[#64748b] border border-[#e8e7e3]'
                }`}
              >
                {entry?.journalText?.trim() ? 'Recorded' : 'Not Recorded'}
              </span>
            </div>

            {entry?.journalText?.trim() ? (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[#17181c]">{entry.title}</h3>
                
                {entry.intelligence?.summary ? (
                  <div className="bg-white p-3.5 rounded-xl border border-[#e8e7e3] space-y-1 shadow-xs">
                    <span className="text-[11px] font-semibold text-indigo-700 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                      <span>Gemini Intelligence Summary</span>
                    </span>
                    <p className="text-xs text-[#17181c] leading-relaxed">
                      {entry.intelligence.summary}
                    </p>
                  </div>
                ) : (
                  <div className="bg-white p-3.5 rounded-xl border border-[#e8e7e3] shadow-xs">
                    <p className="text-xs text-[#64748b] italic leading-relaxed">
                      "{entry.journalText}"
                    </p>
                  </div>
                )}

                <div className="pt-1 flex justify-end">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenInJournal(date);
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>View full reflection &amp; edit</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center space-y-2 bg-white rounded-xl border border-dashed border-[#dcdad4] p-4">
                <PenLine className="w-5 h-5 text-[#94a3b8] mx-auto" />
                <p className="text-xs font-medium text-[#17181c]">No reflection recorded for this day</p>
                <p className="text-[11px] text-[#64748b] max-w-sm mx-auto">
                  Capture thoughts, challenges, or milestones from this day to enrich your personal patterns.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    onOpenInJournal(date);
                  }}
                  className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors shadow-xs"
                >
                  <PenLine className="w-3.5 h-3.5" />
                  <span>Write Reflection for this Day</span>
                </button>
              </div>
            )}
          </div>

          {/* 2. Tasks & Commitments for this Date */}
          <div className="p-5 rounded-2xl bg-[#fafaf8] border border-[#e8e7e3] space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#64748b] flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Day's Commitments</span>
              </span>
              <span className="text-xs text-[#17181c] font-medium">
                {completedDayTasks} of {dayTasks.length} done ({dayTaskPercentage}%)
              </span>
            </div>

            {/* Progress Capsule */}
            {dayTasks.length > 0 && (
              <div className="w-full h-2 bg-[#e8e7e3] rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${dayTaskPercentage}%` }}
                />
              </div>
            )}

            {/* Quick Add Task Input */}
            {onAddTaskForDay && (
              <form onSubmit={handleCreateTask} className="flex gap-2">
                <input
                  type="text"
                  value={quickTaskTitle}
                  onChange={(e) => setQuickTaskTitle(e.target.value)}
                  placeholder={`Add a commitment for ${date}...`}
                  className="flex-1 px-3.5 py-2 bg-white border border-[#e8e7e3] rounded-xl text-xs text-[#17181c] placeholder-[#94a3b8] focus:outline-none focus:border-indigo-600 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!quickTaskTitle.trim() || isSubmittingTask}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white text-xs font-medium rounded-xl flex items-center gap-1 shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </form>
            )}

            {/* Task list items */}
            {dayTasks.length === 0 ? (
              <p className="text-xs text-[#64748b] italic py-1">No commitments scheduled for this specific day.</p>
            ) : (
              <div className="space-y-1.5 pt-1">
                {dayTasks.map((t) => {
                  const done = isTaskCompleted(t, date);
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between py-2 px-3 rounded-xl bg-white border border-[#e8e7e3] shadow-2xs hover:border-[#dcdad4] transition-all"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <button
                          type="button"
                          onClick={() => onToggleTask(t.id, t.completed, date)}
                          className="text-[#94a3b8] hover:text-indigo-600 transition-colors shrink-0"
                        >
                          {done ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Circle className="w-4 h-4 text-[#94a3b8]" />
                          )}
                        </button>
                        <span
                          className={`text-xs ${
                            done ? 'line-through text-[#94a3b8]' : 'text-[#17181c] font-medium'
                          } truncate`}
                        >
                          {t.title}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Associated Weekly Tasks Context */}
            {weeklyTasks.length > 0 && (
              <div className="pt-3 border-t border-[#e8e7e3]">
                <p className="text-[11px] font-semibold text-[#64748b] mb-1.5">
                  Associated Weekly Commitments ({weekKey}):
                </p>
                <div className="space-y-1.5">
                  {weeklyTasks.map((wt) => {
                    const done = isTaskCompleted(wt, date);
                    return (
                      <div
                        key={wt.id}
                        className="flex items-center space-x-2 text-xs py-1 px-2 rounded-lg bg-white/70 border border-[#e8e7e3]"
                      >
                        <button
                          type="button"
                          onClick={() => onToggleTask(wt.id, wt.completed, date)}
                          className="text-[#94a3b8] hover:text-indigo-600 shrink-0"
                        >
                          {done ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-[#94a3b8]" />
                          )}
                        </button>
                        <span className={`truncate ${done ? 'line-through text-[#94a3b8]' : 'text-[#17181c]'}`}>
                          {wt.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 3. Wellbeing Inferences & AI Signals (if enabled) */}
          {settings.enableEmotionalAnalysis && signals && (
            <div className="p-5 rounded-2xl bg-[#fafaf8] border border-[#e8e7e3] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#64748b] flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-indigo-600" />
                  <span>Wellbeing Inferences (AI Estimates)</span>
                </span>
                <span className="text-[10px] text-[#94a3b8] font-mono">Non-clinical</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-xl bg-white border border-[#e8e7e3] text-center shadow-2xs">
                  <span className="text-[10px] uppercase font-semibold text-[#64748b] block">Stress</span>
                  <span
                    className={`text-xs font-bold capitalize mt-0.5 block ${
                      signals.stress === 'high'
                        ? 'text-rose-700'
                        : signals.stress === 'moderate'
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {signals.stress}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-[#e8e7e3] text-center shadow-2xs">
                  <span className="text-[10px] uppercase font-semibold text-[#64748b] block">Mood</span>
                  <span
                    className={`text-xs font-bold capitalize mt-0.5 block ${
                      signals.mood === 'positive'
                        ? 'text-emerald-700'
                        : signals.mood === 'reflective'
                        ? 'text-indigo-700'
                        : 'text-[#17181c]'
                    }`}
                  >
                    {signals.mood}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-[#e8e7e3] text-center shadow-2xs">
                  <span className="text-[10px] uppercase font-semibold text-[#64748b] block">Energy</span>
                  <span className="text-xs font-bold text-[#17181c] capitalize mt-0.5 block">
                    {signals.energy}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-[#e8e7e3] text-center shadow-2xs">
                  <span className="text-[10px] uppercase font-semibold text-[#64748b] block">Focus</span>
                  <span className="text-xs font-bold text-[#17181c] capitalize mt-0.5 block">
                    {signals.focus}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-[#94a3b8] pt-1">
                Estimates derived from self-reported reflection text. Non-diagnostic.
              </p>
            </div>
          )}

          {/* 4. Reminders for this date */}
          <div className="p-5 rounded-2xl bg-[#fafaf8] border border-[#e8e7e3] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#64748b] flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-indigo-600" />
                <span>Day's Reminders</span>
              </span>
              <span className="text-xs text-[#64748b] font-mono">{dayReminders.length}</span>
            </div>

            {dayReminders.length === 0 ? (
              <p className="text-xs text-[#64748b] italic py-1">No reminders scheduled for this date.</p>
            ) : (
              <div className="space-y-1.5 pt-1">
                {dayReminders.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between text-xs py-2 px-3 bg-white rounded-xl border border-[#e8e7e3] shadow-2xs"
                  >
                    <span className="text-[#17181c] font-medium">{r.title}</span>
                    <span className="text-[11px] font-mono text-indigo-600 font-semibold">{r.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e8e7e3] bg-[#fafaf8] flex justify-between items-center">
          <span className="text-[11px] text-[#64748b]">
            Use "Open in Journal" to review or update your reflection for {date}.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-white hover:bg-[#f4f3ef] text-[#17181c] text-xs font-medium transition-colors border border-[#e8e7e3]"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenInJournal(date);
              }}
              className="sm:hidden px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors"
            >
              Journal &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
