import React, { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  BarChart3,
  Calendar as CalendarIcon,
  Settings as SettingsIcon,
  LogOut,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Menu,
  X
} from 'lucide-react';
import type { NavSection, UserProfile } from '../types';

interface SidebarProps {
  currentSection: NavSection;
  onNavigate: (section: NavSection) => void;
  user: UserProfile | null;
  onLogout: () => void;
  isSaving?: boolean;
  saveError?: string | null;
  onRetrySave?: () => void;
}

export function Sidebar({
  currentSection,
  onNavigate,
  user,
  onLogout,
  isSaving,
  saveError,
  onRetrySave
}: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems: Array<{ id: NavSection; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'journal', label: 'Journal', icon: BookOpen },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'analysis', label: 'Analysis', icon: BarChart3 },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const handleSelect = (section: NavSection) => {
    onNavigate(section);
    setIsMobileOpen(false);
  };

  const navContent = (
    <div className="flex flex-col h-full bg-[#fcfbf9] border-r border-zinc-200 text-zinc-700 select-none">
      {/* Top Branding */}
      <div className="p-5 border-b border-[#e8e7e3] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-medium shadow-[0_1px_3px_rgba(0,0,0,0.1)] shrink-0">
            <Sparkles className="w-4 h-4 text-indigo-300" />
          </div>
          <div>
            <span className="font-semibold text-sm tracking-tight text-zinc-900 block">
              Life Intelligence
            </span>
            <span className="text-[11px] text-zinc-500 font-normal block tracking-tight">
              Personal AI Workspace
            </span>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Sync Status Micro-Badge */}
      <div className="px-3.5 pt-3 pb-1">
        {saveError ? (
          <div className="px-3 py-1.5 rounded-xl bg-rose-50/90 border border-rose-200/80 text-[11px] text-rose-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5 truncate">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span className="truncate font-medium">Sync paused</span>
            </span>
            {onRetrySave && (
              <button
                onClick={onRetrySave}
                className="underline font-semibold hover:text-rose-900 ml-1 shrink-0"
              >
                Retry
              </button>
            )}
          </div>
        ) : isSaving ? (
          <div className="px-3 py-1.5 rounded-xl bg-zinc-100/90 border border-zinc-200/80 text-[11px] text-zinc-600 flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin shrink-0" />
            <span className="text-zinc-600 font-medium">Saving updates...</span>
          </div>
        ) : (
          <div className="px-3 py-1.5 rounded-xl bg-[#f4f7f4] border border-[#d9e5d9] text-[11px] text-emerald-800 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate font-medium text-emerald-800">Firestore Connected</span>
          </div>
        )}
      </div>

      {/* Primary Navigation Links */}
      <nav className="flex-1 px-3 py-3 space-y-1">
        <p className="px-3 pb-2 text-[10px] font-semibold tracking-wider uppercase text-zinc-400">
          Navigation
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left relative group ${
                isActive
                  ? 'bg-white text-zinc-900 font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-[#e8e7e3]'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-[#f4f3ef] border border-transparent'
              }`}
            >
              {isActive && (
                <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-indigo-600 rounded-full" />
              )}
              <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-indigo-600' : 'text-zinc-400 group-hover:text-zinc-600'}`} />
              <span className="tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom User Profile & Sign Out */}
      <div className="p-3 border-t border-[#e8e7e3] bg-[#f8f7f4]">
        {user ? (
          <div className="space-y-2">
            <div className="flex items-center space-x-2.5 px-2 py-1">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-7 h-7 rounded-full border border-zinc-200 object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-zinc-800 text-white text-xs font-medium flex items-center justify-center shrink-0">
                  {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-zinc-900 truncate tracking-tight">
                  {user.displayName || 'Personal Account'}
                </p>
                <p className="text-[10px] text-zinc-500 truncate">
                  {user.email || 'Authenticated'}
                </p>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center space-x-2 px-3 py-1.5 rounded-lg text-xs text-zinc-600 hover:text-rose-700 hover:bg-rose-50/80 border border-zinc-200/80 hover:border-rose-200 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <div className="text-center py-2 text-xs text-zinc-500">
            Guest mode
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar: Fixed width column */}
      <aside className="hidden md:flex flex-col w-60 h-screen sticky top-0 shrink-0 z-30">
        {navContent}
      </aside>

      {/* Mobile Top Navigation Bar */}
      <div className="md:hidden sticky top-0 z-40 bg-[#fcfbf9]/95 backdrop-blur-sm border-b border-zinc-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            </div>
            <span className="font-semibold text-xs text-zinc-900">Life Intelligence</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-medium capitalize text-zinc-700">
          <span className="px-2.5 py-1 rounded-md bg-zinc-200/80 text-zinc-800 text-[11px] font-semibold">
            {currentSection}
          </span>
        </div>
      </div>

      {/* Mobile Sidebar Overlay Drawer */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative w-64 max-w-[80vw] h-full shadow-xl z-10 animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
}
