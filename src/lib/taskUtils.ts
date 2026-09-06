import type { TaskItem } from '../types';
import {
  getTodayDateString,
  getWeekKey,
  getMonthKey
} from './dateUtils';

/**
 * Checks if a task is considered completed for a given date context.
 * Supports recurring daily, weekly, monthly commitments alongside legacy/one-time tasks.
 */
export function isTaskCompleted(task: TaskItem, contextDate: string = getTodayDateString()): boolean {
  if (!task) return false;

  const scope = task.scope || 'one-time';

  if (scope === 'daily') {
    if (Array.isArray(task.completedDates)) {
      return task.completedDates.includes(contextDate);
    }
    // Backward compatibility for legacy tasks
    return Boolean(task.completed && (!task.dueDate || task.dueDate === contextDate));
  }

  if (scope === 'weekly') {
    const weekKey = getWeekKey(contextDate);
    if (Array.isArray(task.completedWeeks)) {
      return task.completedWeeks.includes(weekKey);
    }
    // Backward compatibility
    return Boolean(task.completed && (!task.weekKey || task.weekKey === weekKey));
  }

  if (scope === 'monthly') {
    const monthKey = getMonthKey(contextDate);
    if (Array.isArray(task.completedMonths)) {
      return task.completedMonths.includes(monthKey);
    }
    // Backward compatibility
    return Boolean(task.completed && (!task.monthKey || task.monthKey === monthKey));
  }

  // One-time task
  return Boolean(task.completed);
}

/**
 * Toggles a task's completion status for a specific date context.
 * Returns a new TaskItem object ready for Firestore update without mutating the input.
 */
export function toggleTask(task: TaskItem, contextDate: string = getTodayDateString()): TaskItem {
  const scope = task.scope || 'one-time';
  const todayStr = getTodayDateString();

  if (scope === 'daily') {
    const currentList = Array.isArray(task.completedDates) ? [...task.completedDates] : [];
    const isCurrentlyDone = currentList.includes(contextDate);
    const updatedDates = isCurrentlyDone
      ? currentList.filter((d) => d !== contextDate)
      : [...currentList, contextDate];

    const isDoneForToday = updatedDates.includes(todayStr);

    const updated: TaskItem = {
      ...task,
      completedDates: updatedDates,
      completed: isDoneForToday,
      completedAt: isDoneForToday ? Date.now() : undefined
    };
    return updated;
  }

  if (scope === 'weekly') {
    const currentWeek = getWeekKey(contextDate);
    const thisWeek = getWeekKey(todayStr);
    const currentList = Array.isArray(task.completedWeeks) ? [...task.completedWeeks] : [];
    const isCurrentlyDone = currentList.includes(currentWeek);
    const updatedWeeks = isCurrentlyDone
      ? currentList.filter((w) => w !== currentWeek)
      : [...currentList, currentWeek];

    const isDoneForThisWeek = updatedWeeks.includes(thisWeek);

    const updated: TaskItem = {
      ...task,
      completedWeeks: updatedWeeks,
      completed: isDoneForThisWeek,
      completedAt: isDoneForThisWeek ? Date.now() : undefined
    };
    return updated;
  }

  if (scope === 'monthly') {
    const currentMonth = getMonthKey(contextDate);
    const thisMonth = getMonthKey(todayStr);
    const currentList = Array.isArray(task.completedMonths) ? [...task.completedMonths] : [];
    const isCurrentlyDone = currentList.includes(currentMonth);
    const updatedMonths = isCurrentlyDone
      ? currentList.filter((m) => m !== currentMonth)
      : [...currentList, currentMonth];

    const isDoneForThisMonth = updatedMonths.includes(thisMonth);

    const updated: TaskItem = {
      ...task,
      completedMonths: updatedMonths,
      completed: isDoneForThisMonth,
      completedAt: isDoneForThisMonth ? Date.now() : undefined
    };
    return updated;
  }

  // One-time task toggle
  const nextStatus = !task.completed;
  const updated: TaskItem = {
    ...task,
    completed: nextStatus,
    completedAt: nextStatus ? Date.now() : undefined
  };
  return updated;
}

/**
 * Determines whether a task applies to a specific calendar date.
 */
export function isTaskApplicableForDate(task: TaskItem, dateStr: string): boolean {
  const scope = task.scope || 'one-time';

  if (scope === 'daily') {
    return true; // Recurring daily commitment
  }

  if (scope === 'weekly') {
    const weekKey = getWeekKey(dateStr);
    return task.weekKey === weekKey || !task.dueDate;
  }

  if (scope === 'monthly') {
    const monthKey = getMonthKey(dateStr);
    return task.monthKey === monthKey || !task.dueDate;
  }

  // One-time task
  if (task.dueDate === dateStr) return true;
  // If no due date or overdue and not completed, it shows for today
  if (!task.dueDate && dateStr === getTodayDateString()) return true;
  if (task.dueDate && task.dueDate < dateStr && !task.completed && dateStr === getTodayDateString()) {
    return true; // Overdue tasks carry over into today's view
  }

  return false;
}

/**
 * Computes unified progress statistics for today.
 */
export function getTodayTaskStats(tasks: TaskItem[], todayStr: string = getTodayDateString()) {
  const applicable = tasks.filter((t) => isTaskApplicableForDate(t, todayStr));
  if (applicable.length === 0) {
    return { total: 0, completed: 0, remaining: 0, percentage: 0, hasData: false, tasks: [] };
  }

  const completedCount = applicable.filter((t) => isTaskCompleted(t, todayStr)).length;
  const total = applicable.length;
  const percentage = Math.round((completedCount / total) * 100);

  return {
    total,
    completed: completedCount,
    remaining: total - completedCount,
    percentage,
    hasData: true,
    tasks: applicable
  };
}

/**
 * Computes unified progress statistics for a week.
 */
export function getWeekTaskStats(tasks: TaskItem[], targetWeekKey: string) {
  // Weekly tasks + daily tasks (aggregated) + one-time tasks due this week
  const weekTasks = tasks.filter((t) => {
    if (t.scope === 'weekly') return true;
    if (t.scope === 'daily') return true;
    return t.weekKey === targetWeekKey;
  });

  if (weekTasks.length === 0) {
    return { total: 0, completed: 0, remaining: 0, percentage: 0, hasData: false };
  }

  // A task is considered completed for this week if:
  // - weekly: completed in this week
  // - daily: completed at least once this week (or today)
  // - one-time: completed
  let completedCount = 0;
  weekTasks.forEach((t) => {
    const scope = t.scope || 'one-time';
    if (scope === 'weekly') {
      if (t.completedWeeks?.includes(targetWeekKey) || (t.completed && t.weekKey === targetWeekKey)) {
        completedCount++;
      }
    } else if (scope === 'daily') {
      const today = getTodayDateString();
      if (isTaskCompleted(t, today)) {
        completedCount++;
      }
    } else if (t.completed) {
      completedCount++;
    }
  });

  const total = weekTasks.length;
  const percentage = Math.round((completedCount / total) * 100);

  return {
    total,
    completed: completedCount,
    remaining: total - completedCount,
    percentage,
    hasData: true
  };
}

/**
 * Computes unified progress statistics for a month.
 */
export function getMonthTaskStats(tasks: TaskItem[], targetMonthKey: string) {
  const monthTasks = tasks.filter((t) => {
    if (t.scope === 'monthly') return true;
    if (t.scope === 'weekly' || t.scope === 'daily') return true;
    return t.monthKey === targetMonthKey;
  });

  if (monthTasks.length === 0) {
    return { total: 0, completed: 0, remaining: 0, percentage: 0, hasData: false };
  }

  let completedCount = 0;
  monthTasks.forEach((t) => {
    const scope = t.scope || 'one-time';
    if (scope === 'monthly') {
      if (t.completedMonths?.includes(targetMonthKey) || (t.completed && t.monthKey === targetMonthKey)) {
        completedCount++;
      }
    } else if (scope === 'daily' || scope === 'weekly') {
      const today = getTodayDateString();
      if (isTaskCompleted(t, today)) {
        completedCount++;
      }
    } else if (t.completed) {
      completedCount++;
    }
  });

  const total = monthTasks.length;
  const percentage = Math.round((completedCount / total) * 100);

  return {
    total,
    completed: completedCount,
    remaining: total - completedCount,
    percentage,
    hasData: true
  };
}
