import React from 'react';
import {
  Settings as SettingsIcon,
  RefreshCw,
  BarChart3,
  Cloud,
  LogIn,
  LogOut,
} from 'lucide-react';
import { BusinessProfile, User } from '../types';
import { KoraLogo } from './KoraLogo';

interface NavbarProps {
  business: BusinessProfile | null;
  user: User | null;
  firebaseUser?: any | null;
  onOpenSettings: () => void;
  onOpenReports: () => void;
  onLoadDemoStore: () => void;
  onSignInGoogle?: () => void;
  onSignOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  business,
  user,
  firebaseUser,
  onOpenSettings,
  onOpenReports,
  onLoadDemoStore,
  onSignInGoogle,
  onSignOut,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 text-white px-3 sm:px-4 py-1.5 sm:py-2">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Brand & Business Info */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0">
          <KoraLogo size="sm" />
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5 leading-none">
              <h1 className="font-bold text-slate-100 text-xs sm:text-sm truncate tracking-tight">
                {business?.name || 'Kora'}
              </h1>
              {business?.currency && (
                <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-800 text-emerald-400 px-1 py-0.5 rounded border border-slate-700/80 shrink-0">
                  {business.currency}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1 text-[10px] sm:text-[11px] text-slate-400 truncate mt-0.5">
              <span>{business?.type || 'Business'}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300 font-medium truncate">
                {firebaseUser?.displayName || user?.name || user?.role || 'Owner'}
              </span>
            </div>
          </div>
        </div>

        {/* Compact Action Icons & Google Auth */}
        <div className="flex items-center space-x-1 shrink-0">
          {/* Google Auth Status / Button */}
          {firebaseUser ? (
            <div
              className="flex items-center space-x-1 bg-emerald-950/60 border border-emerald-500/30 px-2 py-1 rounded-lg text-[10px] text-emerald-300"
              title={`Logged in as ${firebaseUser.email} (Firestore Synced)`}
            >
              <Cloud className="w-3 h-3 text-emerald-400" />
              <span className="hidden sm:inline">Synced</span>
              <button
                onClick={onSignOut}
                className="text-slate-400 hover:text-rose-400 ml-1 transition"
                title="Sign out of Firebase"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={onSignInGoogle}
              className="flex items-center space-x-1 text-[10px] sm:text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded-lg border border-slate-700 transition active:scale-95"
              title="Sign in with Google to sync data with Firebase Firestore"
            >
              <LogIn className="w-3 h-3 text-emerald-400" />
              <span className="hidden xs:inline sm:inline">Google Sign In</span>
            </button>
          )}

          <button
            onClick={onLoadDemoStore}
            title="Load Demo Fashion Store"
            className="flex items-center space-x-1 text-[10px] sm:text-[11px] bg-slate-800/90 hover:bg-slate-700 text-slate-200 px-2 py-1 sm:py-1.5 rounded-lg border border-slate-700 transition active:scale-95"
          >
            <RefreshCw className="w-3 h-3 text-amber-400" />
            <span className="hidden xs:inline sm:inline">Demo</span>
          </button>

          <button
            onClick={onOpenReports}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition active:scale-95"
            title="Business Reports"
            aria-label="Business Reports"
          >
            <BarChart3 className="w-4 h-4 text-teal-400" />
          </button>

          <button
            onClick={onOpenSettings}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition active:scale-95"
            title="Settings & Tools"
            aria-label="Settings"
          >
            <SettingsIcon className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      </div>
    </header>
  );
};
