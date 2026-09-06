export type NavSection = 'dashboard' | 'journal' | 'tasks' | 'analysis' | 'calendar' | 'settings';

export type MoodSignal = 'positive' | 'reflective' | 'neutral' | 'stressed' | 'low';
export type LevelSignal = 'low' | 'moderate' | 'high';

export interface EmotionalSignals {
  mood: MoodSignal;
  moodLabel: string;
  stress: LevelSignal;
  energy: LevelSignal;
  focus: LevelSignal;
  confidenceScore: number;
}

export interface PossibleTaskCompletion {
  id: string;
  taskId?: string;
  taskTitle: string;
  reason: string;
  status: 'pending' | 'confirmed' | 'dismissed';
}

export interface DailyIntelligence {
  summary: string;
  emotionalSignals?: EmotionalSignals;
  keyMoments: string[];
  wins: string[];
  challenges: string[];
  topics: string[];
  activities: string[];
  observations: string[];
  suggestion?: string;
  detectedTaskCompletions?: Array<{
    taskId: string;
    taskTitle: string;
    reason: string;
  }>;
  modelUsed?: string;
  generatedAt?: number;
}

export interface DayEntry {
  id: string; // usually YYYY-MM-DD
  date: string; // YYYY-MM-DD
  userId: string;
  journalText: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  sleepHours?: number;
  exerciseMinutes?: number;
  exerciseType?: string;
  intelligence?: DailyIntelligence;
  possibleTaskCompletions?: PossibleTaskCompletion[];
}

export type TaskScope = 'daily' | 'weekly' | 'monthly' | 'one-time';

export interface TaskItem {
  id: string;
  userId: string;
  title: string;
  completed: boolean; // Authoritative state for one-time or today's status
  completedAt?: number;
  scope?: TaskScope;
  dueDate?: string; // YYYY-MM-DD
  weekKey: string; // e.g. "2026-W36"
  monthKey: string; // e.g. "2026-09"
  goalId?: string;
  createdAt: number;
  completedDates?: string[]; // Array of YYYY-MM-DD for daily recurring completion
  completedWeeks?: string[]; // Array of YYYY-Wxx for weekly recurring completion
  completedMonths?: string[]; // Array of YYYY-MM for monthly recurring completion
  priority?: 'low' | 'medium' | 'high';
}

export interface GoalItem {
  id: string;
  userId: string;
  title: string;
  category: string;
  targetDate?: string;
  progress: number; // 0 to 100
  createdAt: number;
}

export interface ReminderItem {
  id: string;
  userId: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  completed: boolean;
  createdAt: number;
}

export interface UserSettings {
  enableEmotionalAnalysis: boolean;
  enableAISuggestions: boolean;
  enableOptionalMetrics: boolean;
  enableReminders: boolean;
  theme: 'obsidian' | 'twilight' | 'midnight';
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

// Helper types for Analysis
export interface AskHistoryResponse {
  answer: string;
  citedDates: string[];
  modelUsed: string;
}

export interface InvestigationResponse {
  explanation: string;
  contributingSignals: string[];
  groundedQuoteOrTheme?: string;
}
