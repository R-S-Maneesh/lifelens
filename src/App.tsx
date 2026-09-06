import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { AuthLanding } from './components/AuthLanding';
import { Dashboard } from './components/Dashboard';
import { TasksSection } from './components/TasksSection';
import { JournalSection } from './components/JournalSection';
import { CalendarSection } from './components/CalendarSection';
import { AnalysisSection } from './components/AnalysisSection';
import { SettingsSection } from './components/SettingsSection';
import type {
  NavSection,
  DayEntry,
  TaskItem,
  GoalItem,
  ReminderItem,
  UserSettings,
  UserProfile,
  PossibleTaskCompletion
} from './types';
import {
  auth,
  onAuthStateChanged,
  logOut,
  formatUserProfile,
  saveDayEntry,
  subscribeToUserDays,
  saveTask,
  deleteTask,
  subscribeToUserTasks,
  saveGoal,
  subscribeToUserGoals,
  saveReminder,
  deleteReminder,
  subscribeToUserReminders,
  saveUserSettings,
  subscribeToUserSettings,
  DEFAULT_USER_SETTINGS
} from './lib/firebase';
import {
  getTodayDateString,
  getWeekKey,
  getMonthKey
} from './lib/dateUtils';
import {
  toggleTask
} from './lib/taskUtils';
import { analyzeDayWithGemini } from './lib/gemini';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Active Navigation: Exactly the 6 requested sections
  const [currentSection, setCurrentSection] = useState<NavSection>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());

  // Firestore Data State
  const [days, setDays] = useState<DayEntry[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);

  // Network / Sync State
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 1. Auth Subscription
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(formatUserProfile(firebaseUser));
      } else {
        setUser(null);
        setDays([]);
        setTasks([]);
        setGoals([]);
        setReminders([]);
        setSettings(DEFAULT_USER_SETTINGS);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time Firestore Subscriptions when User is Authenticated
  useEffect(() => {
    if (!user) return;

    const unsubDays = subscribeToUserDays(
      user.uid,
      (fetched) => setDays(fetched),
      (err) => setSaveError('Error syncing reflections: ' + (err?.message || 'Database error'))
    );

    const unsubTasks = subscribeToUserTasks(
      user.uid,
      (fetched) => setTasks(fetched),
      (err) => console.error('Tasks sync error:', err)
    );

    const unsubGoals = subscribeToUserGoals(
      user.uid,
      (fetched) => setGoals(fetched),
      (err) => console.error('Goals sync error:', err)
    );

    const unsubReminders = subscribeToUserReminders(
      user.uid,
      (fetched) => setReminders(fetched),
      (err) => console.error('Reminders sync error:', err)
    );

    const unsubSettings = subscribeToUserSettings(user.uid, (fetched) => {
      setSettings(fetched);
    });

    return () => {
      unsubDays();
      unsubTasks();
      unsubGoals();
      unsubReminders();
      unsubSettings();
    };
  }, [user]);

  // Handle Logout
  const handleLogout = async () => {
    await logOut();
    setUser(null);
    setCurrentSection('dashboard');
  };

  // Section Navigation handler
  const handleNavigate = (section: NavSection, dateContext?: string) => {
    if (dateContext) {
      setSelectedDate(dateContext);
    }
    setCurrentSection(section);
  };

  // Handle Saving Day Entry
  const handleSaveDayEntry = async (entry: DayEntry) => {
    if (!user) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await saveDayEntry(user.uid, entry);
    } catch (err: any) {
      console.error('Save failed:', err);
      setSaveError(err?.message || 'Failed to save entry. Please retry.');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Analyzing Day with Gemini
  const handleAnalyzeDay = async (dateKey: string, text: string) => {
    if (!user || !text.trim()) return;
    setIsAnalyzing(true);
    try {
      const activeTasks = tasks.filter((t) => !t.completed);
      const activeGoals = goals;

      const result = await analyzeDayWithGemini({
        journalText: text,
        date: dateKey,
        existingTasks: activeTasks,
        goals: activeGoals,
        enableEmotionalAnalysis: settings.enableEmotionalAnalysis
      });

      // Prepare detected task completions for user confirmation
      const existingEntry = days.find((d) => d.date === dateKey);
      const detectedItems: PossibleTaskCompletion[] = (result.intelligence.detectedTaskCompletions || []).map(
        (det, idx) => ({
          id: `det-${Date.now()}-${idx}`,
          taskId: det.taskId,
          taskTitle: det.taskTitle,
          reason: det.reason,
          status: 'pending' as const
        })
      );

      const updatedEntry: DayEntry = {
        id: dateKey,
        date: dateKey,
        userId: user.uid,
        title: existingEntry?.title || 'Daily Reflection',
        journalText: text,
        createdAt: existingEntry?.createdAt || Date.now(),
        updatedAt: Date.now(),
        sleepHours: existingEntry?.sleepHours,
        exerciseMinutes: existingEntry?.exerciseMinutes,
        exerciseType: existingEntry?.exerciseType,
        intelligence: result.intelligence,
        possibleTaskCompletions: detectedItems
      };

      await handleSaveDayEntry(updatedEntry);
    } catch (err: any) {
      console.error('AI Analysis failed:', err);
      // User input is safely preserved even if AI fails!
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Quick Journal Posting from Dashboard
  const handlePostQuickJournal = async (text: string) => {
    if (!user) return;
    const today = getTodayDateString();
    setSelectedDate(today);

    const existing = days.find((d) => d.date === today);
    const updatedEntry: DayEntry = {
      id: today,
      date: today,
      userId: user.uid,
      title: existing?.title || 'Quick Reflection',
      journalText: text,
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now(),
      sleepHours: existing?.sleepHours,
      exerciseMinutes: existing?.exerciseMinutes,
      exerciseType: existing?.exerciseType,
      intelligence: existing?.intelligence,
      possibleTaskCompletions: existing?.possibleTaskCompletions
    };

    // 1. Save user text safely first
    await handleSaveDayEntry(updatedEntry);

    // 2. Switch view to journal so user can inspect today's detailed state
    setCurrentSection('journal');

    // 3. Trigger analysis in the background
    handleAnalyzeDay(today, text);
  };

  // Authoritative Task Completion Toggle with Recurrence Support
  const handleToggleTask = async (taskId: string, targetDate?: string) => {
    if (!user) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const dateToUse = targetDate || selectedDate || getTodayDateString();
    const updated = toggleTask(task, dateToUse);
    await saveTask(user.uid, updated);
  };

  // Save / Update Task
  const handleSaveTask = async (task: TaskItem) => {
    if (!user) return;
    await saveTask(user.uid, task);
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    if (!user) return;
    await deleteTask(user.uid, taskId);
  };

  // AI Task Detection Confirmation
  const handleConfirmTaskCompletion = async (dateKey: string, completion: PossibleTaskCompletion) => {
    if (!user) return;

    // 1. Authoritative task update
    if (completion.taskId) {
      await handleToggleTask(completion.taskId, dateKey);
    }

    // 2. Update detection state to 'confirmed'
    const entry = days.find((d) => d.date === dateKey);
    if (entry && entry.possibleTaskCompletions) {
      const updatedCompletions = entry.possibleTaskCompletions.map((c) =>
        c.id === completion.id ? { ...c, status: 'confirmed' as const } : c
      );
      await saveDayEntry(user.uid, {
        ...entry,
        possibleTaskCompletions: updatedCompletions
      });
    }
  };

  // AI Task Detection Dismissal
  const handleDismissTaskCompletion = async (dateKey: string, completionId: string) => {
    if (!user) return;
    const entry = days.find((d) => d.date === dateKey);
    if (entry && entry.possibleTaskCompletions) {
      const updatedCompletions = entry.possibleTaskCompletions.map((c) =>
        c.id === completionId ? { ...c, status: 'dismissed' as const } : c
      );
      await saveDayEntry(user.uid, {
        ...entry,
        possibleTaskCompletions: updatedCompletions
      });
    }
  };

  // Add Reminder
  const handleAddReminder = async (rem: Omit<ReminderItem, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    const newReminder: ReminderItem = {
      ...rem,
      id: `rem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: user.uid,
      createdAt: Date.now()
    };
    await saveReminder(user.uid, newReminder);
  };

  // Delete Reminder
  const handleDeleteReminder = async (reminderId: string) => {
    if (!user) return;
    await deleteReminder(user.uid, reminderId);
  };

  // Update Settings
  const handleUpdateSettings = async (newSettings: UserSettings) => {
    if (!user) return;
    setSettings(newSettings);
    await saveUserSettings(user.uid, newSettings);
  };

  // Loading Screen: Clean Light Warm-Neutral Design
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#fbfbfa] text-zinc-700 flex flex-col items-center justify-center space-y-3">
        <div className="w-7 h-7 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
        <p className="text-xs text-zinc-500 font-medium">
          Loading Life Intelligence...
        </p>
      </div>
    );
  }

  // Unauthenticated Screen
  if (!user) {
    return <AuthLanding onSignInSuccess={() => setCurrentSection('dashboard')} />;
  }

  // Authenticated Screen with Fixed Sidebar + Main Content (No duplicate padding gap!)
  return (
    <div className="min-h-screen bg-[#f8f8f6] text-[#17181c] flex flex-col md:flex-row">
      
      {/* 1. Persistent Sidebar Navigation (Desktop: fixed width column; Mobile: top bar + drawer) */}
      <Sidebar
        currentSection={currentSection}
        onNavigate={handleNavigate}
        user={user}
        onLogout={handleLogout}
        isSaving={isSaving}
        saveError={saveError}
        onRetrySave={() => setSaveError(null)}
      />

      {/* 2. Main Content Area (Starts immediately after Sidebar, no md:pl-64 offset) */}
      <main className="flex-1 min-w-0 pb-16">
        {currentSection === 'dashboard' && (
          <Dashboard
            user={user}
            days={days}
            tasks={tasks}
            goals={goals}
            reminders={reminders}
            settings={settings}
            onPostQuickJournal={handlePostQuickJournal}
            onNavigate={handleNavigate}
          />
        )}

        {currentSection === 'journal' && (
          <JournalSection
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            days={days}
            tasks={tasks}
            goals={goals}
            reminders={reminders}
            settings={settings}
            onSaveEntry={handleSaveDayEntry}
            onAnalyzeDay={handleAnalyzeDay}
            onToggleTask={(taskId) => handleToggleTask(taskId, selectedDate)}
            onConfirmTaskCompletion={handleConfirmTaskCompletion}
            onDismissTaskCompletion={handleDismissTaskCompletion}
            onAddTask={async (title, dueDate) => {
              if (!user) return;
              const newTask: TaskItem = {
                id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                userId: user.uid,
                title,
                scope: 'daily',
                dueDate: dueDate || selectedDate,
                weekKey: getWeekKey(dueDate || selectedDate),
                monthKey: getMonthKey(dueDate || selectedDate),
                completed: false,
                createdAt: Date.now()
              };
              await saveTask(user.uid, newTask);
            }}
            isAnalyzing={isAnalyzing}
          />
        )}

        {currentSection === 'tasks' && (
          <TasksSection
            user={user}
            tasks={tasks}
            goals={goals}
            onSaveTask={handleSaveTask}
            onDeleteTask={handleDeleteTask}
          />
        )}

        {currentSection === 'calendar' && (
          <CalendarSection
            days={days}
            tasks={tasks}
            reminders={reminders}
            settings={settings}
            onSelectDate={setSelectedDate}
            onNavigate={handleNavigate}
            onAddReminder={handleAddReminder}
            onDeleteReminder={handleDeleteReminder}
            onToggleTask={(taskId, _curr, targetDate) => handleToggleTask(taskId, targetDate || selectedDate)}
            onAddTask={async (title, dueDate) => {
              if (!user) return;
              const newTask: TaskItem = {
                id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                userId: user.uid,
                title,
                scope: 'one-time',
                dueDate: dueDate || selectedDate,
                weekKey: getWeekKey(dueDate || selectedDate),
                monthKey: getMonthKey(dueDate || selectedDate),
                completed: false,
                createdAt: Date.now()
              };
              await saveTask(user.uid, newTask);
            }}
          />
        )}

        {currentSection === 'analysis' && (
          <AnalysisSection
            days={days}
            tasks={tasks}
            goals={goals}
            settings={settings}
            onNavigate={handleNavigate}
          />
        )}

        {currentSection === 'settings' && (
          <SettingsSection
            user={user}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        )}
      </main>

    </div>
  );
}
