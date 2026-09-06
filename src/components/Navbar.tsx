import React from 'react';
import {
  Sparkles,
  LayoutDashboard,
  BookOpen,
  LineChart,
  CalendarDays,
  Settings,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import type { NavSection, UserProfile } from '../types';

interface NavbarProps {
  currentSection: NavSection;
  onNavigate: (section: NavSection) => void;
  user: UserProfile | null;
  onLogout: () => void;
  isSaving?: boolean;
  saveError?: string | null;
  onRetrySave?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentSection,
  onNavigate,
  user,
  onLogout,
  isSaving,
  saveError,
  onRetrySave
}) => {
  const navItems: Array<{ key: NavSection; label: string; icon: React.ReactNode }> = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: 'journal', label: 'Journal', icon: <BookOpen className="w-4 h-4" /> },
    { key: 'analysis', label: 'Analysis', icon: <LineChart className="w-4 h-4" /> },
    { key: 'calendar', label: 'Calendar', icon: <CalendarDays className="w-4 h-4" /> },
    { key: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#080811]/85 backdrop-blur-xl border-b border-white/10 shadow-lg text-[#e0e0e6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 border border-indigo-400/30 flex items-center justify-center text-white shadow-[0_0_20px_rgba(99,102,241,0.35)] group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-base sm:text-lg tracking-tight text-white group-hover:text-indigo-200 transition-colors">
                Gemini Life Intelligence
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-950/70 text-indigo-300 border border-indigo-800/60 shadow-xs">
                GenAI 3.6
              </span>
            </div>
            <p className="text-[10px] text-stone-400 hidden sm:block">
              Capture &bull; Understand &bull; Remember &bull; Act
            </p>
          </div>
        </div>

        {/* Primary Navigation - Exactly 5 Sections */}
        {user && (
          <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/10 backdrop-blur-md">
            {navItems.map((item) => {
              const isActive = currentSection === item.key;
              return (
                <button
                  key={item.key}
                  id={`nav-${item.key}-tab`}
                  onClick={() => onNavigate(item.key)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25'
                      : 'text-stone-300 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Status & Profile / Auth */}
        <div className="flex items-center gap-3">
          {/* Sync status */}
          {saveError ? (
            <div className="flex items-center gap-2 px-2.5 py-1 bg-rose-950/80 border border-rose-800 text-rose-300 text-xs rounded-lg shadow-xs">
              <span>Save error</span>
              {onRetrySave && (
                <button
                  onClick={onRetrySave}
                  className="underline hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
              )}
            </div>
          ) : isSaving ? (
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 text-stone-300 text-xs bg-white/[0.04] rounded-lg border border-white/10 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shadow-[0_0_8px_#818cf8]" />
              <span>Syncing...</span>
            </div>
          ) : user ? (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 text-stone-400 text-xs bg-white/[0.03] rounded-lg border border-white/5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Isolated to UID</span>
            </div>
          ) : null}

          {/* User badge & Logout */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-8 h-8 rounded-full border border-white/20 object-cover shadow-xs"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/[0.07] border border-white/15 flex items-center justify-center text-stone-200 text-xs font-semibold">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                </div>
              )}
              <button
                id="nav-logout-button"
                onClick={onLogout}
                title="Sign Out"
                className="p-1.5 text-stone-400 hover:text-rose-400 hover:bg-white/[0.05] rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-stone-400 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/5">
              <span>Sign in required</span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      {user && (
        <div className="md:hidden border-t border-white/10 px-2 py-1.5 flex items-center justify-around bg-black/40">
          {navItems.map((item) => {
            const isActive = currentSection === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                  isActive
                    ? 'text-indigo-400 font-semibold'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {item.icon}
                <span className="text-[10px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
