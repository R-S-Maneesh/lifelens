import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Circle,
  Plus,
  Calendar,
  Layers,
  Trash2,
  Clock,
  Target
} from 'lucide-react';
import type { TaskItem, TaskScope, GoalItem } from '../types';
import { getTodayDateString } from '../lib/dateUtils';
import { isTaskCompleted } from '../lib/taskUtils';

interface TaskManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  goals: GoalItem[];
  onToggleTask: (taskId: string, currentStatus: boolean) => Promise<void>;
  onAddTask: (title: string, scope: TaskScope, dueDate?: string, goalId?: string) => Promise<void>;
  onDeleteTask?: (taskId: string) => Promise<void>;
  initialDate?: string;
}

export function TaskManagerModal({
  isOpen,
  onClose,
  tasks,
  goals,
  onToggleTask,
  onAddTask,
  onDeleteTask,
  initialDate
}: TaskManagerModalProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
  const [newTitle, setNewTitle] = useState('');
  const [newScope, setNewScope] = useState<TaskScope>('daily');
  const [newDueDate, setNewDueDate] = useState(initialDate || getTodayDateString());
  const [newGoalId, setNewGoalId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Filter tasks based on activeTab
  const filteredTasks = tasks.filter((t) => {
    const scope = t.scope || 'daily';
    if (activeTab === 'all') return true;
    if (activeTab === 'daily') return scope === 'daily' || scope === 'one-time';
    return scope === activeTab;
  });

  const completedCount = filteredTasks.filter((t) => isTaskCompleted(t)).length;
  const totalCount = filteredTasks.length;
  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddTask(
        newTitle.trim(),
        newScope,
        newDueDate || undefined,
        newGoalId || undefined
      );
      setNewTitle('');
    } catch (err) {
      console.error('Failed to add task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div
        className="relative w-full max-w-2xl bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-[#fcfbf9]">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-800" />
              <span>Commitment &amp; Task Manager</span>
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Organize daily, weekly, and monthly commitments
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Add Form */}
        <form onSubmit={handleCreate} className="p-4 bg-[#fcfbf9] border-b border-zinc-200 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Add a new task or commitment..."
              className="flex-1 px-3.5 py-2 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-slate-800"
              required
            />
            <button
              type="submit"
              disabled={!newTitle.trim() || isSubmitting}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors shrink-0 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Scope selector */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-zinc-200">
              {(['daily', 'weekly', 'monthly', 'one-time'] as TaskScope[]).map((scope) => (
                <button
                  type="button"
                  key={scope}
                  onClick={() => setNewScope(scope)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium capitalize transition-colors ${
                    newScope === scope
                      ? 'bg-slate-900 text-white'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {scope}
                </button>
              ))}
            </div>

            {/* Date input */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-zinc-200 rounded-lg text-zinc-700">
              <Calendar className="w-3 h-3 text-zinc-500" />
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="bg-transparent text-[11px] text-zinc-800 focus:outline-none font-mono"
              />
            </div>

            {/* Optional Goal */}
            {goals.length > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-zinc-200 rounded-lg">
                <Target className="w-3 h-3 text-zinc-500" />
                <select
                  value={newGoalId}
                  onChange={(e) => setNewGoalId(e.target.value)}
                  className="bg-transparent text-[11px] text-zinc-800 focus:outline-none"
                >
                  <option value="" className="text-zinc-400">No Goal Assigned</option>
                  {goals.map((g) => (
                    <option key={g.id} value={g.id} className="text-zinc-800">
                      {g.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </form>

        {/* Filter Tabs & Summary */}
        <div className="px-6 py-2.5 bg-[#fcfbf9] border-b border-zinc-200 flex items-center justify-between text-xs">
          <div className="flex space-x-1">
            {[
              { id: 'all', label: 'All Tasks' },
              { id: 'daily', label: 'Daily' },
              { id: 'weekly', label: 'Weekly' },
              { id: 'monthly', label: 'Monthly' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-zinc-500 text-xs">
            <span>
              {completedCount} of {totalCount} completed
            </span>
            <div className="w-16 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-slate-900 rounded-full transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="font-mono text-[11px] text-zinc-700">{percentage}%</span>
          </div>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-zinc-100 space-y-1">
          {filteredTasks.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              <Clock className="w-8 h-8 mx-auto mb-2 text-zinc-400" />
              <p>No {activeTab !== 'all' ? activeTab : ''} tasks found.</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">Use the form above to add a commitment.</p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const scope = task.scope || 'daily';
              const done = isTaskCompleted(task);
              return (
                <div
                  key={task.id}
                  className="py-2.5 px-2 flex items-center justify-between hover:bg-zinc-50 rounded-lg group transition-colors"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => onToggleTask(task.id, task.completed)}
                      className="text-zinc-400 hover:text-slate-900 shrink-0 transition-colors"
                      aria-label={done ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {done ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Circle className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <p
                        className={`text-xs ${
                          done
                            ? 'line-through text-zinc-400'
                            : 'text-zinc-800'
                        } truncate`}
                      >
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-500">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 uppercase font-mono text-[9px]">
                          {scope}
                        </span>
                        {task.dueDate && <span>Due: {task.dueDate}</span>}
                        {task.goalId && (
                          <span className="text-zinc-600 truncate max-w-[120px]">
                            • {goals.find((g) => g.id === task.goalId)?.title || 'Goal'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {onDeleteTask && (
                    <button
                      type="button"
                      onClick={() => onDeleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-rose-600 rounded transition-opacity"
                      aria-label="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-200 bg-[#fcfbf9] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium transition-colors border border-zinc-200"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
