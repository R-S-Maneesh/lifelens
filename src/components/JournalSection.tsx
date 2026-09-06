import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Save,
  Check,
  CheckCircle2,
  AlertCircle,
  Moon,
  Dumbbell,
  HeartPulse,
  BrainCircuit,
  Trophy,
  RefreshCw,
  X
} from 'lucide-react';
import type {
  DayEntry,
  TaskItem,
  GoalItem,
  ReminderItem,
  UserSettings,
  PossibleTaskCompletion
} from '../types';
import {
  getTodayDateString,
  formatDateDisplay,
  formatShortDate,
  addDays,
  getSurroundingDays
} from '../lib/dateUtils';
import { suggestTitle } from '../lib/gemini';

interface JournalSectionProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  days: DayEntry[];
  tasks: TaskItem[];
  goals: GoalItem[];
  reminders: ReminderItem[];
  settings: UserSettings;
  onSaveEntry: (entry: DayEntry) => Promise<void>;
  onAnalyzeDay: (date: string, text: string) => Promise<void>;
  onToggleTask: (taskId: string, currentStatus: boolean) => Promise<void>;
  onConfirmTaskCompletion: (date: string, completion: PossibleTaskCompletion) => Promise<void>;
  onDismissTaskCompletion: (date: string, completionId: string) => Promise<void>;
  onAddTask: (title: string, dueDate?: string) => Promise<void>;
  isAnalyzing?: boolean;
}

export const JournalSection: React.FC<JournalSectionProps> = ({
  selectedDate,
  onSelectDate,
  days,
  tasks,
  reminders,
  settings,
  onSaveEntry,
  onAnalyzeDay,
  onToggleTask,
  onConfirmTaskCompletion,
  onDismissTaskCompletion,
  onAddTask,
  isAnalyzing = false
}) => {
  const currentDayEntry = days.find((d) => d.date === selectedDate);

  const [title, setTitle] = useState(currentDayEntry?.title || '');
  const [journalText, setJournalText] = useState(currentDayEntry?.journalText || '');
  const [sleepHours, setSleepHours] = useState<string>(
    currentDayEntry?.sleepHours ? String(currentDayEntry.sleepHours) : ''
  );
  const [exerciseMins, setExerciseMins] = useState<string>(
    currentDayEntry?.exerciseMinutes ? String(currentDayEntry.exerciseMinutes) : ''
  );
  const [exerciseType, setExerciseType] = useState(currentDayEntry?.exerciseType || '');

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSuggestingTitle, setIsSuggestingTitle] = useState(false);

  // Sync state when selectedDate changes or entry updates
  useEffect(() => {
    if (currentDayEntry) {
      setTitle(currentDayEntry.title || '');
      setJournalText(currentDayEntry.journalText || '');
      setSleepHours(currentDayEntry.sleepHours ? String(currentDayEntry.sleepHours) : '');
      setExerciseMins(currentDayEntry.exerciseMinutes ? String(currentDayEntry.exerciseMinutes) : '');
      setExerciseType(currentDayEntry.exerciseType || '');
    } else {
      setTitle('');
      setJournalText('');
      setSleepHours('');
      setExerciseMins('');
      setExerciseType('');
    }
    setSaveSuccess(false);
    setSaveError(null);
  }, [selectedDate, currentDayEntry?.updatedAt]);

  const todayStr = getTodayDateString();
  const surroundingDays = getSurroundingDays(selectedDate, 3);

  const handleSaveAndAnalyze = async () => {
    if (!journalText.trim()) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const updatedEntry: DayEntry = {
      id: selectedDate,
      date: selectedDate,
      userId: currentDayEntry?.userId || '',
      title: title.trim() || 'Daily Reflection',
      journalText: journalText.trim(),
      createdAt: currentDayEntry?.createdAt || Date.now(),
      updatedAt: Date.now(),
      sleepHours: sleepHours ? parseFloat(sleepHours) : undefined,
      exerciseMinutes: exerciseMins ? parseInt(exerciseMins, 10) : undefined,
      exerciseType: exerciseType.trim() || undefined,
      intelligence: currentDayEntry?.intelligence,
      possibleTaskCompletions: currentDayEntry?.possibleTaskCompletions
    };

    try {
      // 1. Authoritative persistence FIRST
      await onSaveEntry(updatedEntry);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);

      // 2. Trigger Gemini Intelligence
      await onAnalyzeDay(selectedDate, journalText.trim());
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save reflection. Please retry.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSuggestTitle = async () => {
    if (!journalText.trim()) return;
    setIsSuggestingTitle(true);
    try {
      const suggested = await suggestTitle(journalText);
      setTitle(suggested);
    } catch {
      // Gracefully handle failure
    } finally {
      setIsSuggestingTitle(false);
    }
  };

  const intelligence = currentDayEntry?.intelligence;
  const pendingTaskDetections = (currentDayEntry?.possibleTaskCompletions || []).filter(
    (c) => c.status === 'pending'
  );

  return (
    <div className="w-full px-6 sm:px-8 lg:px-10 py-8 space-y-6 max-w-5xl">
      
      {/* 1. Date Navigation Bar */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onSelectDate(addDays(selectedDate, -1))}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
              aria-label="Previous day"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-slate-700" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => onSelectDate(e.target.value)}
                className="bg-[#fcfbf9] border border-zinc-200 rounded-lg px-2.5 py-1 text-xs text-zinc-900 font-mono focus:outline-none focus:border-slate-800"
              />
              <span className="text-xs font-semibold text-zinc-900 ml-1">
                {formatDateDisplay(selectedDate)}
              </span>
            </div>

            <button
              onClick={() => onSelectDate(addDays(selectedDate, 1))}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
              aria-label="Next day"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {selectedDate !== todayStr && (
              <button
                onClick={() => onSelectDate(todayStr)}
                className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium transition-colors"
              >
                Jump to Today
              </button>
            )}
            <span
              className={`text-xs px-2.5 py-1 rounded-md font-mono ${
                currentDayEntry?.journalText?.trim()
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
              }`}
            >
              {currentDayEntry?.journalText?.trim() ? 'Entry Recorded' : 'Not Recorded'}
            </span>
          </div>
        </div>

        {/* Surrounding Days Quick Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-zinc-100">
          {surroundingDays.map((d) => {
            const hasEntry = days.some((day) => day.date === d && day.journalText?.trim());
            const isCurrent = d === selectedDate;
            const isToday = d === todayStr;
            return (
              <button
                key={d}
                onClick={() => onSelectDate(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors shrink-0 flex items-center gap-1.5 ${
                  isCurrent
                    ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                    : 'bg-[#fcfbf9] text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border border-zinc-200/80'
                }`}
              >
                <span>{formatShortDate(d)}</span>
                {isToday && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                {hasEntry && !isToday && (
                  <span className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-amber-300' : 'bg-slate-500'}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Primary Writing Space */}
      <section className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4 shadow-2xs">
        
        {/* Title input with AI Suggestion button */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title your reflection or day's focus..."
            className="flex-1 text-base font-semibold text-zinc-900 bg-transparent border-b border-zinc-200 pb-2 placeholder-zinc-400 focus:outline-none focus:border-slate-800"
          />
          <button
            type="button"
            onClick={handleSuggestTitle}
            disabled={!journalText.trim() || isSuggestingTitle}
            className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 disabled:opacity-40 text-xs text-zinc-700 flex items-center gap-1.5 transition-colors shrink-0 border border-zinc-200"
            title="Suggest title from reflection content"
          >
            <Sparkles className="w-3 h-3 text-slate-700" />
            <span>{isSuggestingTitle ? 'Suggesting...' : 'Suggest Title'}</span>
          </button>
        </div>

        {/* Main Content Area */}
        <textarea
          value={journalText}
          onChange={(e) => setJournalText(e.target.value)}
          placeholder="Reflect on your day, achievements, challenges, decisions, and mindset. (Gemini will automatically extract wellbeing patterns, key moments, and task observations upon saving...)"
          rows={12}
          className="w-full p-4 bg-[#fcfbf9] border border-zinc-200 rounded-lg text-sm text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-slate-800 focus:bg-white leading-relaxed resize-y font-sans transition-colors"
        />

        {/* Optional Context Metrics (Sleep, Exercise) */}
        {settings.enableOptionalMetrics && (
          <div className="p-3.5 rounded-lg bg-[#fcfbf9] border border-zinc-200 space-y-2">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider block">
              Optional Context Metrics
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center space-x-2">
                <Moon className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(e.target.value)}
                  placeholder="Sleep (hours)"
                  className="w-full px-2.5 py-1 bg-white border border-zinc-200 rounded text-xs text-zinc-800 focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Dumbbell className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <input
                  type="number"
                  min="0"
                  max="720"
                  value={exerciseMins}
                  onChange={(e) => setExerciseMins(e.target.value)}
                  placeholder="Exercise (mins)"
                  className="w-full px-2.5 py-1 bg-white border border-zinc-200 rounded text-xs text-zinc-800 focus:outline-none focus:border-slate-800"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={exerciseType}
                  onChange={(e) => setExerciseType(e.target.value)}
                  placeholder="Activity (Run, Yoga, Gym)"
                  className="w-full px-2.5 py-1 bg-white border border-zinc-200 rounded text-xs text-zinc-800 focus:outline-none focus:border-slate-800"
                />
              </div>
            </div>
          </div>
        )}

        {/* Error notification if save failed */}
        {saveError && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{saveError}</span>
            </div>
            <button
              onClick={handleSaveAndAnalyze}
              className="underline font-semibold hover:text-rose-900 ml-2 shrink-0"
            >
              Retry Save
            </button>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
          <div className="flex items-center space-x-2 text-xs text-zinc-500">
            {saveSuccess && (
              <span className="text-emerald-700 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Saved to Firestore</span>
              </span>
            )}
            {isAnalyzing && (
              <span className="text-slate-700 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Gemini analyzing reflection...</span>
              </span>
            )}
          </div>

          <button
            onClick={handleSaveAndAnalyze}
            disabled={!journalText.trim() || isSaving || isAnalyzing}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-2 transition-colors shadow-xs"
          >
            {isSaving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : isAnalyzing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save &amp; Generate Intelligence</span>
              </>
            )}
          </button>
        </div>

      </section>

      {/* 3. AI-Detected Task Completions (User authoritatively confirms/rejects) */}
      {pendingTaskDetections.length > 0 && (
        <section className="bg-amber-50/60 rounded-xl border border-amber-200 p-5 space-y-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-amber-600" />
              <span>Possible Task Completion Detected</span>
            </h3>
            <span className="text-[11px] text-amber-700 font-medium">Requires your approval</span>
          </div>

          <p className="text-xs text-amber-800">
            Gemini noticed you may have completed the following task from your journal:
          </p>

          <div className="space-y-2 pt-1">
            {pendingTaskDetections.map((detection) => (
              <div
                key={detection.id}
                className="p-3 bg-white border border-amber-200/80 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
              >
                <div>
                  <p className="text-xs font-semibold text-zinc-900">{detection.taskTitle}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">{detection.reason}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onConfirmTaskCompletion(selectedDate, detection)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1 transition-colors shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Mark Complete</span>
                  </button>
                  <button
                    onClick={() => onDismissTaskCompletion(selectedDate, detection.id)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium transition-colors border border-zinc-200"
                  >
                    Not this task
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Structured Daily Intelligence Report */}
      {intelligence ? (
        <section className="bg-white rounded-xl border border-zinc-200 p-6 space-y-6 shadow-2xs">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-slate-800" />
                <span>Daily Intelligence</span>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Structured insights generated by Gemini from your reflection
              </p>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">
              {intelligence.modelUsed || 'Gemini'}
            </span>
          </div>

          {/* AI Summary */}
          <div className="p-4 rounded-lg bg-[#fcfbf9] border border-zinc-200/80 space-y-1">
            <span className="text-[10px] uppercase font-semibold text-zinc-500 block tracking-wider">
              Reflection Synthesis
            </span>
            <p className="text-xs sm:text-sm text-zinc-800 leading-relaxed font-sans">
              {intelligence.summary}
            </p>
          </div>

          {/* Emotional Inferences (if enabled) */}
          {settings.enableEmotionalAnalysis && intelligence.emotionalSignals && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-semibold text-zinc-500 tracking-wider flex items-center gap-1.5">
                  <HeartPulse className="w-3.5 h-3.5 text-zinc-700" />
                  <span>Wellbeing Inferences</span>
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">Approximate • Non-clinical</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-lg bg-[#fcfbf9] border border-zinc-200/80 text-center">
                  <span className="text-[10px] uppercase font-semibold text-zinc-500 block">
                    Stress
                  </span>
                  <span
                    className={`text-xs font-semibold capitalize mt-1 block ${
                      intelligence.emotionalSignals.stress === 'high'
                        ? 'text-amber-700'
                        : intelligence.emotionalSignals.stress === 'moderate'
                        ? 'text-zinc-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {intelligence.emotionalSignals.stress}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#fcfbf9] border border-zinc-200/80 text-center">
                  <span className="text-[10px] uppercase font-semibold text-zinc-500 block">
                    Mood
                  </span>
                  <span className="text-xs font-semibold text-emerald-800 capitalize mt-1 block">
                    {intelligence.emotionalSignals.mood}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#fcfbf9] border border-zinc-200/80 text-center">
                  <span className="text-[10px] uppercase font-semibold text-zinc-500 block">
                    Energy
                  </span>
                  <span className="text-xs font-semibold text-zinc-800 capitalize mt-1 block">
                    {intelligence.emotionalSignals.energy}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#fcfbf9] border border-zinc-200/80 text-center">
                  <span className="text-[10px] uppercase font-semibold text-zinc-500 block">
                    Focus
                  </span>
                  <span className="text-xs font-semibold text-zinc-800 capitalize mt-1 block">
                    {intelligence.emotionalSignals.focus}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Wins & Challenges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Wins */}
            <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-200/70 space-y-2">
              <span className="text-[11px] uppercase font-semibold text-emerald-900 flex items-center gap-1.5 tracking-wider">
                <Trophy className="w-3.5 h-3.5 text-emerald-700" />
                <span>Day's Wins &amp; Progress</span>
              </span>
              {intelligence.wins?.length > 0 ? (
                <ul className="space-y-1 text-xs text-emerald-950">
                  {intelligence.wins.map((w, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-zinc-500 italic">No specific wins recorded.</p>
              )}
            </div>

            {/* Challenges */}
            <div className="p-4 rounded-lg bg-amber-50/50 border border-amber-200/70 space-y-2">
              <span className="text-[11px] uppercase font-semibold text-amber-900 flex items-center gap-1.5 tracking-wider">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                <span>Obstacles &amp; Friction</span>
              </span>
              {intelligence.challenges?.length > 0 ? (
                <ul className="space-y-1 text-xs text-amber-950">
                  {intelligence.challenges.map((c, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-zinc-500 italic">No specific challenges highlighted.</p>
              )}
            </div>
          </div>

          {/* Key Moments & Topics */}
          <div className="p-4 rounded-lg bg-[#fcfbf9] border border-zinc-200/80 space-y-2.5">
            <span className="text-[10px] uppercase font-semibold text-zinc-500 block tracking-wider">
              Identified Topics &amp; Activities
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(intelligence.topics || []).map((t, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded bg-zinc-100 text-zinc-700 text-xs font-medium border border-zinc-200"
                >
                  #{t}
                </span>
              ))}
              {(intelligence.activities || []).map((act, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200"
                >
                  {act}
                </span>
              ))}
            </div>
          </div>

          {/* Useful AI Suggestion */}
          {settings.enableAISuggestions && intelligence.suggestion && (
            <div className="p-4 rounded-lg bg-[#fcfbf9] border border-zinc-200 space-y-1.5">
              <span className="text-[11px] uppercase font-semibold text-zinc-800 flex items-center gap-1.5 tracking-wider">
                <BrainCircuit className="w-3.5 h-3.5 text-slate-800" />
                <span>Suggested Action / Next Step</span>
              </span>
              <p className="text-xs text-zinc-700 leading-relaxed">
                {intelligence.suggestion}
              </p>
            </div>
          )}

        </section>
      ) : (
        currentDayEntry?.journalText?.trim() && !isAnalyzing && (
          <div className="p-5 rounded-xl bg-white border border-zinc-200 text-center space-y-1 shadow-2xs">
            <p className="text-xs text-zinc-600">
              Entry saved. Click "Save &amp; Generate Intelligence" to generate a structured AI intelligence breakdown.
            </p>
          </div>
        )
      )}

    </div>
  );
};
