import React, { useState } from 'react';
import {
  BrainCircuit,
  Sliders,
  Bell,
  Download,
  Shield,
  Check,
  AlertCircle,
  Sparkles,
  HeartPulse
} from 'lucide-react';
import type { UserSettings, UserProfile } from '../types';
import { exportUserData } from '../lib/firebase';

interface SettingsSectionProps {
  user: UserProfile;
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => Promise<void>;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  user,
  settings,
  onUpdateSettings
}) => {
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleToggle = async (key: keyof UserSettings) => {
    const updated = {
      ...localSettings,
      [key]: !localSettings[key]
    };
    setLocalSettings(updated);
    setIsSaving(true);
    try {
      await onUpdateSettings(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      const jsonData = await exportUserData(user.uid);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gemini-life-intelligence-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setExportError(err?.message || 'Failed to export data archive.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full px-6 sm:px-8 lg:px-10 py-8 space-y-6 max-w-4xl">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-zinc-900 tracking-tight">
            Application Settings
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Real preferences that directly govern AI intelligence behavior, metrics, and data privacy
          </p>
        </div>

        {saveSuccess && (
          <span className="text-xs text-emerald-800 font-medium flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            <Check className="w-3.5 h-3.5" />
            <span>Preferences Saved</span>
          </span>
        )}
      </div>

      {/* 2. Intelligence & AI Analysis Preferences */}
      <section className="bg-white rounded-xl border border-zinc-200 p-6 space-y-5 shadow-2xs">
        <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
          <BrainCircuit className="w-4 h-4 text-slate-800" />
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">AI &amp; Intelligence Controls</h2>
            <p className="text-xs text-zinc-500">Configure how Gemini processes your journal reflections</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Emotional Analysis Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#fcfbf9] border border-zinc-200">
            <div className="space-y-0.5 max-w-xl pr-4">
              <label className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-slate-700" />
                <span>Emotional &amp; Wellbeing Analysis</span>
              </label>
              <p className="text-[11px] text-zinc-600 leading-relaxed">
                When enabled, Gemini extracts approximate stress, mood, and focus ranges. Disabling completely removes emotional inference from Journal, Calendar, Dashboard, and Analysis.
              </p>
            </div>
            <button
              onClick={() => handleToggle('enableEmotionalAnalysis')}
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                localSettings.enableEmotionalAnalysis ? 'bg-slate-900' : 'bg-zinc-300'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  localSettings.enableEmotionalAnalysis ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* AI Suggestions Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#fcfbf9] border border-zinc-200">
            <div className="space-y-0.5 max-w-xl pr-4">
              <label className="text-xs font-semibold text-zinc-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-slate-700" />
                <span>Proactive Suggestions</span>
              </label>
              <p className="text-[11px] text-zinc-600 leading-relaxed">
                Generate practical, concise pacing and execution suggestions based on your daily reflections.
              </p>
            </div>
            <button
              onClick={() => handleToggle('enableAISuggestions')}
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                localSettings.enableAISuggestions ? 'bg-slate-900' : 'bg-zinc-300'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  localSettings.enableAISuggestions ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* 3. Personal Metrics & Reminders */}
      <section className="bg-white rounded-xl border border-zinc-200 p-6 space-y-5 shadow-2xs">
        <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
          <Sliders className="w-4 h-4 text-slate-800" />
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Journaling Inputs &amp; Reminders</h2>
            <p className="text-xs text-zinc-500">Configure optional metrics and reminder integrations</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Optional Metrics (Sleep & Exercise) Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#fcfbf9] border border-zinc-200">
            <div className="space-y-0.5 max-w-xl pr-4">
              <label className="text-xs font-semibold text-zinc-900 block">
                Optional Personal Metrics (Sleep &amp; Exercise)
              </label>
              <p className="text-[11px] text-zinc-600 leading-relaxed">
                Show optional numeric context fields in the Journal editor for sleep hours and physical exercise minutes.
              </p>
            </div>
            <button
              onClick={() => handleToggle('enableOptionalMetrics')}
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                localSettings.enableOptionalMetrics ? 'bg-slate-900' : 'bg-zinc-300'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  localSettings.enableOptionalMetrics ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Reminders Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-lg bg-[#fcfbf9] border border-zinc-200">
            <div className="space-y-0.5 max-w-xl pr-4">
              <label className="text-xs font-semibold text-zinc-900 block">
                Calendar Reminders System
              </label>
              <p className="text-[11px] text-zinc-600 leading-relaxed">
                Display scheduled reminders across the Calendar and Dashboard widgets.
              </p>
            </div>
            <button
              onClick={() => handleToggle('enableReminders')}
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                localSettings.enableReminders ? 'bg-slate-900' : 'bg-zinc-300'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  localSettings.enableReminders ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* 4. Privacy & Data Sovereignty */}
      <section className="bg-white rounded-xl border border-zinc-200 p-6 space-y-5 shadow-2xs">
        <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
          <Shield className="w-4 h-4 text-emerald-700" />
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Privacy &amp; Data Sovereignty</h2>
            <p className="text-xs text-zinc-500">Your journal entries and commitments belong strictly to you</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="p-3.5 rounded-lg bg-[#fcfbf9] border border-zinc-200 space-y-1.5">
            <h3 className="text-xs font-semibold text-zinc-900">Firestore Owner Isolation</h3>
            <p className="text-[11px] text-zinc-600 leading-relaxed">
              All journal reflections, daily intelligence, and task documents are isolated under your Firebase UID:
            </p>
            <code className="block bg-white text-zinc-800 p-2 rounded border border-zinc-200 font-mono text-[10px]">
              /users/{user.uid}/*
            </code>
            <p className="text-[10px] text-zinc-500">
              Enforced by strict Firestore security rules requiring <code className="text-slate-800 font-semibold">request.auth.uid == userId</code>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-lg bg-[#fcfbf9] border border-zinc-200">
            <div>
              <h3 className="text-xs font-semibold text-zinc-900">Export All Data (JSON)</h3>
              <p className="text-[11px] text-zinc-600">
                Download a clean, portable JSON archive of all your reflections, daily intelligence, tasks, and settings.
              </p>
            </div>
            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors self-start sm:self-auto shrink-0 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Exporting...' : 'Export Archive'}</span>
            </button>
          </div>

          {exportError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{exportError}</span>
            </div>
          )}
        </div>
      </section>

    </div>
  );
};
