import type { TaskItem } from '../types';

/**
 * Returns YYYY-MM-DD for today in local time
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses YYYY-MM-DD safely to Date at local midnight
 */
export function parseDateString(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Formats YYYY-MM-DD into human readable form, e.g. "Friday, Sep 4, 2026"
 */
export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const date = parseDateString(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Returns clean short date e.g. "Sep 4"
 */
export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = parseDateString(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

/**
 * ISO 8601 Week Key: "YYYY-Www"
 * A week starting on Monday. A week crossing months remains the same week unit.
 */
export function getWeekKey(d: Date | string): string {
  const date = typeof d === 'string' ? parseDateString(d) : new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

/**
 * Returns month key: "YYYY-MM"
 */
export function getMonthKey(d: Date | string): string {
  if (typeof d === 'string') {
    return d.slice(0, 7);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Adjust date by delta days (e.g. -1 for previous day, +1 for next day)
 */
export function addDays(dateStr: string, days: number): string {
  const d = parseDateString(dateStr);
  d.setDate(d.getDate() + days);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns an array of surrounding days (e.g. 5 days centered on selected date)
 */
export function getSurroundingDays(selectedDate: string, count = 7): string[] {
  const offset = Math.floor(count / 2);
  const result: string[] = [];
  for (let i = -offset; i <= count - offset - 1; i++) {
    result.push(addDays(selectedDate, i));
  }
  return result;
}

/**
 * Computes week task statistics consistently across Dashboard, Calendar, and Analysis.
 * Never treats missing tasks as zero completion; accurately reports completed vs total.
 */
export function calculateWeekTaskStats(tasks: TaskItem[], targetWeekKey: string): {
  total: number;
  completed: number;
  remaining: number;
  percentage: number;
  hasData: boolean;
} {
  const weekTasks = tasks.filter(t => t.weekKey === targetWeekKey);
  if (weekTasks.length === 0) {
    return { total: 0, completed: 0, remaining: 0, percentage: 0, hasData: false };
  }
  const completed = weekTasks.filter(t => t.completed).length;
  const total = weekTasks.length;
  const percentage = Math.round((completed / total) * 100);
  return {
    total,
    completed,
    remaining: total - completed,
    percentage,
    hasData: true
  };
}

/**
 * Computes month task statistics consistently across Dashboard, Calendar, and Analysis.
 */
export function calculateMonthTaskStats(tasks: TaskItem[], targetMonthKey: string): {
  total: number;
  completed: number;
  remaining: number;
  percentage: number;
  hasData: boolean;
} {
  const monthTasks = tasks.filter(t => t.monthKey === targetMonthKey);
  if (monthTasks.length === 0) {
    return { total: 0, completed: 0, remaining: 0, percentage: 0, hasData: false };
  }
  const completed = monthTasks.filter(t => t.completed).length;
  const total = monthTasks.length;
  const percentage = Math.round((completed / total) * 100);
  return {
    total,
    completed,
    remaining: total - completed,
    percentage,
    hasData: true
  };
}

/**
 * Returns date range for a given ISO week
 */
export function getWeekDateRange(weekKey: string): { start: string; end: string } {
  const [yearStr, weekStr] = weekKey.split('-W');
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);

  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dayOfWeek = simple.getDay();
  const ISOweekStart = new Date(simple);
  if (dayOfWeek <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }

  const ISOweekEnd = new Date(ISOweekStart);
  ISOweekEnd.setDate(ISOweekStart.getDate() + 6);

  const format = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  return {
    start: format(ISOweekStart),
    end: format(ISOweekEnd)
  };
}

/**
 * Computes daily task statistics for a specific date
 */
export function calculateDailyTaskStats(tasks: TaskItem[], targetDate: string): {
  total: number;
  completed: number;
  remaining: number;
  percentage: number;
  hasData: boolean;
} {
  const dailyTasks = tasks.filter(t => t.dueDate === targetDate || (!t.dueDate && t.scope === 'daily'));
  if (dailyTasks.length === 0) {
    return { total: 0, completed: 0, remaining: 0, percentage: 0, hasData: false };
  }
  const completed = dailyTasks.filter(t => t.completed).length;
  const total = dailyTasks.length;
  const percentage = Math.round((completed / total) * 100);
  return {
    total,
    completed,
    remaining: total - completed,
    percentage,
    hasData: true
  };
}

/**
 * Computes overall task statistics
 */
export function calculateOverallTaskStats(tasks: TaskItem[]): {
  total: number;
  completed: number;
  remaining: number;
  percentage: number;
  hasData: boolean;
} {
  if (tasks.length === 0) {
    return { total: 0, completed: 0, remaining: 0, percentage: 0, hasData: false };
  }
  const completed = tasks.filter(t => t.completed).length;
  const total = tasks.length;
  const percentage = Math.round((completed / total) * 100);
  return {
    total,
    completed,
    remaining: total - completed,
    percentage,
    hasData: true
  };
}

/**
 * Returns an array of 7 date strings (YYYY-MM-DD) representing Monday through Sunday
 * for the week containing the given date string.
 */
export function getDaysOfCurrentWeek(dateStr: string = getTodayDateString()): string[] {
  const d = parseDateString(dateStr);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);

  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const curr = new Date(monday);
    curr.setDate(monday.getDate() + i);
    const y = curr.getFullYear();
    const m = String(curr.getMonth() + 1).padStart(2, '0');
    const dayNum = String(curr.getDate()).padStart(2, '0');
    days.push(`${y}-${m}-${dayNum}`);
  }
  return days;
}


