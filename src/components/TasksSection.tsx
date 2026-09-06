import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Trash2,
  Calendar,
  Repeat,
  Target,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';
import type { TaskItem, GoalItem, TaskScope, UserProfile } from '../types';
import {
  getTodayDateString,
  getWeekKey,
  getMonthKey,
  formatDateDisplay,
  formatShortDate
} from '../lib/dateUtils';
import {
  isTaskCompleted,
  toggleTask,
  getTodayTaskStats,
  getWeekTaskStats,
  getMonthTaskStats
} from '../lib/taskUtils';

interface TasksSectionProps {
  user: UserProfile;
  tasks: TaskItem[];
  goals: GoalItem[];
  onSaveTask: (task: TaskItem) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

type FilterTab = 'today' | 'upcoming' | 'recurring' | 'completed' | 'all';

export const TasksSection: React.FC<TasksSectionProps> = ({
  user,
  tasks,
  goals,
  onSaveTask,
  onDeleteTask
}) => {
  const todayStr = getTodayDateString();
  const currentWeekKey = getWeekKey(todayStr);

  // Form State
  const [title, setTitle] = useState('');
  const [scope, setScope] = useState<TaskScope>('daily');
  const [dueDate, setDueDate] = useState<string>(todayStr);
  const [goalId, setGoalId] = useState<string>('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>('today');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Stats
  const todayStats = getTodayTaskStats(tasks, todayStr);
  const weekStats = getWeekTaskStats(tasks, currentWeekKey);
  const totalCompleted = tasks.filter((t) => isTaskCompleted(t, todayStr)).length;
  const upcomingCount = tasks.filter((t) => {
    const isDone = isTaskCompleted(t, todayStr);
    return !isDone && (t.dueDate ? t.dueDate > todayStr : false);
  }).length;

  // Filter Tasks
  const filteredTasks = tasks.filter((task) => {
    const isDone = isTaskCompleted(task, todayStr);

    if (activeTab === 'today') {
      if (task.scope === 'daily') return true;
      if (task.dueDate === todayStr) return true;
      if (!task.dueDate && !isDone) return true;
      if (task.dueDate && task.dueDate < todayStr && !isDone) return true; // overdue
      return false;
    }

    if (activeTab === 'upcoming') {
      if (task.dueDate && task.dueDate > todayStr && !isDone) return true;
      return false;
    }

    if (activeTab === 'recurring') {
      return task.scope === 'daily' || task.scope === 'weekly' || task.scope === 'monthly';
    }

    if (activeTab === 'completed') {
      return isDone;
    }

    // 'all'
    return true;
  });

  const handleToggle = async (task: TaskItem) => {
    try {
      const updated = toggleTask(task, todayStr);
      await onSaveTask(updated);
    } catch (err: any) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await onDeleteTask(taskId);
    } catch (err: any) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setFormError(null);
    setIsSubmitting(true);

    try {
      const targetDate = scope === 'daily' ? todayStr : dueDate || todayStr;
      const newTask: TaskItem = {
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: user.uid,
        title: title.trim(),
        scope,
        dueDate: targetDate,
        weekKey: getWeekKey(targetDate),
        monthKey: getMonthKey(targetDate),
        goalId: goalId || undefined,
        priority,
        completed: false,
        completedDates: [],
        completedWeeks: [],
        completedMonths: [],
        createdAt: Date.now()
      };

      await onSaveTask(newTask);
      setTitle('');
      setIsFormOpen(false);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save task. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full px-6 sm:px-8 lg:px-10 py-8 space-y-8">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 tracking-tight">
            Tasks
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Manage your commitments, routines, and recurring daily habits.
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isFormOpen ? 'Cancel' : 'New Commitment'}</span>
        </button>
      </div>

      {/* 2. Top Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Today's Progress */}
        <div className="bg-white rounded-xl border border-zinc-200/80 p-4 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="font-medium">Today's Routine</span>
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="text-lg font-semibold text-zinc-900">
            {todayStats.completed} <span className="text-xs font-normal text-zinc-500">/ {todayStats.total}</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-900 rounded-full transition-all duration-300"
              style={{ width: `${todayStats.percentage}%` }}
            />
          </div>
          <div className="text-[11px] text-zinc-500 flex justify-between">
            <span>{todayStats.percentage}% complete</span>
            <span>{todayStats.remaining} pending</span>
          </div>
        </div>

        {/* This Week's Progress */}
        <div className="bg-white rounded-xl border border-zinc-200/80 p-4 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="font-medium">This Week</span>
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="text-lg font-semibold text-zinc-900">
            {weekStats.completed} <span className="text-xs font-normal text-zinc-500">/ {weekStats.total}</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-700 rounded-full transition-all duration-300"
              style={{ width: `${weekStats.percentage}%` }}
            />
          </div>
          <div className="text-[11px] text-zinc-500 flex justify-between">
            <span>{weekStats.percentage}% velocity</span>
            <span>Week {currentWeekKey.split('-W')[1]}</span>
          </div>
        </div>

        {/* Upcoming Commitments */}
        <div className="bg-white rounded-xl border border-zinc-200/80 p-4 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="font-medium">Upcoming</span>
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="text-lg font-semibold text-zinc-900">
            {upcomingCount}
          </div>
          <p className="text-[11px] text-zinc-500">
            Scheduled for future dates
          </p>
        </div>

        {/* Total Completed */}
        <div className="bg-white rounded-xl border border-zinc-200/80 p-4 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="font-medium">All Completed</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-semibold text-zinc-900">
            {totalCompleted}
          </div>
          <p className="text-[11px] text-zinc-500">
            Recorded completions
          </p>
        </div>

      </div>

      {/* 3. Add Task Form (Expandable or Inline) */}
      {isFormOpen && (
        <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h2 className="text-sm font-semibold text-zinc-900">
              Create New Task or Commitment
            </h2>
            <span className="text-xs text-zinc-500">
              Supports recurring and one-time tasks
            </span>
          </div>

          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-zinc-700 block mb-1">
                Commitment Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Read 20 pages of architecture book, Submit proposal, 30m gym session"
                className="w-full px-3.5 py-2 bg-[#fcfbf9] border border-zinc-200 rounded-lg text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-slate-800 transition-colors"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Frequency / Scope */}
              <div>
                <label className="text-xs font-medium text-zinc-700 block mb-1">
                  Frequency
                </label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as TaskScope)}
                  className="w-full px-3 py-2 bg-[#fcfbf9] border border-zinc-200 rounded-lg text-xs text-zinc-800 focus:outline-none focus:border-slate-800"
                >
                  <option value="daily">Daily routine (Repeats every day)</option>
                  <option value="weekly">Weekly routine (Repeats weekly)</option>
                  <option value="monthly">Monthly routine (Repeats monthly)</option>
                  <option value="one-time">One-time task</option>
                </select>
              </div>

              {/* Due Date Context */}
              <div>
                <label className="text-xs font-medium text-zinc-700 block mb-1">
                  Target Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#fcfbf9] border border-zinc-200 rounded-lg text-xs text-zinc-800 focus:outline-none focus:border-slate-800 font-mono"
                />
              </div>

              {/* Optional Goal Connection */}
              <div>
                <label className="text-xs font-medium text-zinc-700 block mb-1">
                  Connected Goal (Optional)
                </label>
                <select
                  value={goalId}
                  onChange={(e) => setGoalId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#fcfbf9] border border-zinc-200 rounded-lg text-xs text-zinc-800 focus:outline-none focus:border-slate-800"
                >
                  <option value="">None (Independent)</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {formError && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || isSubmitting}
                className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-medium transition-colors shadow-xs"
              >
                {isSubmitting ? 'Saving...' : 'Save Commitment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Task Navigation & Filtering Tabs */}
      <div className="space-y-4">
        <div className="flex items-center space-x-1 border-b border-zinc-200 overflow-x-auto pb-1">
          {[
            { id: 'today', label: `Today's Commitments (${todayStats.tasks.length})` },
            { id: 'recurring', label: 'Recurring Routines' },
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'all', label: `All (${tasks.length})` },
            { id: 'completed', label: 'Completed' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as FilterTab)}
              className={`px-3.5 py-2 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap relative ${
                activeTab === tab.id
                  ? 'text-zinc-900 font-semibold border-b-2 border-slate-900'
                  : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 5. Tasks List Display */}
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-xl border border-zinc-200 p-8 text-center space-y-2">
            <CheckSquare className="w-6 h-6 text-zinc-400 mx-auto" />
            <p className="text-xs font-medium text-zinc-700">
              No tasks match this filter.
            </p>
            <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
              Create a new commitment or change tabs to review other schedules.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100 shadow-2xs overflow-hidden">
            {filteredTasks.map((task) => {
              const isDone = isTaskCompleted(task, todayStr);
              const connectedGoal = goals.find((g) => g.id === task.goalId);

              return (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-3.5 sm:p-4 hover:bg-zinc-50/70 transition-colors group ${
                    isDone ? 'bg-zinc-50/40' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0 pr-4">
                    {/* Completion Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggle(task)}
                      className={`shrink-0 transition-colors ${
                        isDone ? 'text-emerald-600' : 'text-zinc-400 hover:text-slate-800'
                      }`}
                      aria-label="Toggle task status"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 fill-emerald-100" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>

                    <div className="min-w-0 space-y-0.5">
                      <p
                        className={`text-xs font-medium truncate ${
                          isDone ? 'line-through text-zinc-400' : 'text-zinc-800'
                        }`}
                      >
                        {task.title}
                      </p>

                      <div className="flex items-center gap-2 text-[11px] text-zinc-500 flex-wrap">
                        {/* Recurrence Scope Badge */}
                        <span className="inline-flex items-center gap-1 font-medium capitalize px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 text-[10px]">
                          <Repeat className="w-2.5 h-2.5" />
                          <span>{task.scope || 'one-time'}</span>
                        </span>

                        {/* Date Context */}
                        {task.dueDate && (
                          <span className="font-mono text-[10px] text-zinc-400">
                            Due {task.dueDate}
                          </span>
                        )}

                        {/* Connected Goal */}
                        {connectedGoal && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-700">
                            <Target className="w-2.5 h-2.5 text-zinc-400" />
                            <span>{connectedGoal.title}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Delete */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="p-1.5 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-80 group-hover:opacity-100"
                      title="Delete task"
                      aria-label="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
