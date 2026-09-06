import type {
  DailyIntelligence,
  TaskItem,
  GoalItem,
  AskHistoryResponse
} from '../types';
import { auth } from './firebase';

export interface AnalyzeDayParams {
  journalText: string;
  date: string;
  existingTasks?: TaskItem[];
  goals?: GoalItem[];
  enableEmotionalAnalysis?: boolean;
}

export interface AnalyzeDayResult {
  intelligence: DailyIntelligence;
  modelUsed?: string;
}

/**
 * Retrieve current Firebase ID token for Authorization header
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Authentication required: please sign in to use Gemini intelligence features.');
  }
  const token = await currentUser.getIdToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

/**
 * Sends journal text to Gemini backend to extract structured Daily Intelligence
 */
export async function analyzeDayWithGemini(params: AnalyzeDayParams): Promise<AnalyzeDayResult> {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/gemini/analyze-day', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      journalText: params.journalText,
      date: params.date,
      existingTasks: (params.existingTasks || []).map(t => ({
        id: t.id,
        title: t.title,
        completed: t.completed
      })),
      goals: (params.goals || []).map(g => ({
        id: g.id,
        title: g.title,
        category: g.category
      })),
      enableEmotionalAnalysis: params.enableEmotionalAnalysis !== false
    })
  });

  if (!response.ok) {
    let errorMsg = 'Failed to analyze reflection';
    try {
      const err = await response.json();
      if (err.error) errorMsg = err.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  return {
    intelligence: {
      ...data.intelligence,
      generatedAt: Date.now(),
      modelUsed: data.modelUsed
    },
    modelUsed: data.modelUsed
  };
}

/**
 * Suggest a concise, thoughtful title for a journal reflection
 */
export async function suggestTitle(text: string): Promise<string> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return 'Daily Reflection';
    const token = await currentUser.getIdToken();

    const response = await fetch('/api/gemini/title', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ text })
    });
    if (!response.ok) return 'Daily Reflection';
    const data = await response.json();
    return data.title || 'Daily Reflection';
  } catch {
    return 'Daily Reflection';
  }
}

/**
 * Ask questions strictly grounded in user's journal history
 */
export async function askPersonalHistory(
  question: string,
  entries: Array<{ date: string; title: string; journalText: string; wins?: string[]; challenges?: string[] }>
): Promise<AskHistoryResponse> {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/gemini/ask-history', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      question,
      entries
    })
  });

  if (!response.ok) {
    let errorMsg = 'Failed to query personal history';
    try {
      const err = await response.json();
      if (err.error) errorMsg = err.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  return {
    answer: data.answer,
    citedDates: data.citedDates || [],
    modelUsed: data.modelUsed || 'gemini-3.8-flash'
  };
}

/**
 * Investigate a significant shift in trend ("Why might this have changed?")
 */
export async function investigateTrend(
  trendTitle: string,
  trendContext: string,
  entries: Array<{ date: string; title: string; journalText: string; stress?: string; mood?: string }>
): Promise<{ explanation: string; modelUsed: string }> {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/gemini/investigate-trend', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      trendTitle,
      trendContext,
      entries
    })
  });

  if (!response.ok) {
    let errorMsg = 'Failed to investigate trend';
    try {
      const err = await response.json();
      if (err.error) errorMsg = err.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  return {
    explanation: data.explanation,
    modelUsed: data.modelUsed || 'gemini-3.8-flash'
  };
}
