import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  BrainCircuit,
  Lock,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

interface AuthLandingProps {
  onSignInSuccess: () => void;
}

export const AuthLanding: React.FC<AuthLandingProps> = ({ onSignInSuccess }) => {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
      onSignInSuccess();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in cancelled. Please try again.');
      } else {
        setAuthError(err?.message || 'Failed to authenticate with Google.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfbfa] text-zinc-900 flex flex-col justify-between">
      {/* Top minimal header */}
      <header className="border-b border-zinc-200 bg-white py-4 px-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-medium shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-200" />
          </div>
          <span className="font-semibold text-base text-zinc-900 tracking-tight">
            Gemini Life Intelligence
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>Firestore User-Isolated</span>
        </div>
      </header>

      {/* Hero Content */}
      <main className="max-w-3xl mx-auto px-6 py-16 text-center space-y-6 my-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200 text-xs font-medium">
          <BrainCircuit className="w-3.5 h-3.5 text-slate-800" />
          <span>Personal AI Intelligence &bull; Non-Clinical Wellbeing Workspace</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-zinc-900 max-w-2xl mx-auto leading-tight">
          Your daily reflections transformed into personal clarity.
        </h1>

        <p className="text-sm sm:text-base text-zinc-600 max-w-xl mx-auto leading-relaxed">
          Capture daily reflections, track commitments across schedules, and let Gemini extract meaningful wellbeing signals, wins, and patterns grounded strictly in your life.
        </p>

        {authError && (
          <div className="max-w-md mx-auto p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{authError}</span>
          </div>
        )}

        {/* Sign In CTA Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            id="google-signin-button"
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm flex items-center justify-center gap-2.5 transition-colors shadow-xs active:scale-[0.99] cursor-pointer"
          >
            {isSigningIn ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Signing in with Google...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </>
            )}
          </button>
        </div>

        {/* 6-step loop pills */}
        <div className="pt-6 max-w-xl mx-auto flex flex-wrap items-center justify-center gap-1.5 text-xs text-zinc-500 font-medium">
          <span className="px-2 py-0.5 rounded bg-white border border-zinc-200">Capture</span>
          <span>&rarr;</span>
          <span className="px-2 py-0.5 rounded bg-white border border-zinc-200">Understand</span>
          <span>&rarr;</span>
          <span className="px-2 py-0.5 rounded bg-white border border-zinc-200">Remember</span>
          <span>&rarr;</span>
          <span className="px-2 py-0.5 rounded bg-white border border-zinc-200">Analyze</span>
          <span>&rarr;</span>
          <span className="px-2 py-0.5 rounded bg-white border border-zinc-200">Explain</span>
          <span>&rarr;</span>
          <span className="px-2 py-0.5 rounded bg-white border border-zinc-200">Act</span>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-4 px-6 text-center text-xs text-zinc-500">
        <p>
          Powered by Gemini &bull; Cloud Firestore Per-User Isolation &bull; Private &amp; Non-Clinical
        </p>
      </footer>
    </div>
  );
};
