import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Layers,
  Upload,
  LogOut,
  Clock,
  ShieldCheck,
  Menu,
  X,
  Plus,
  Compass,
  Zap,
  Code2,
  Trophy,
} from 'lucide-react';
import { UserSession } from '../types';

interface Props {
  currentView: 'home' | 'showcase' | 'dashboard' | 'leaderboard';
  onNavigate: (view: 'home' | 'showcase' | 'dashboard' | 'leaderboard') => void;
  currentUser: UserSession | null;
  onOpenAuth: () => void;
  onOpenUpload: () => void;
  onLogout: () => void;
}

export function Navbar({
  currentView,
  onNavigate,
  currentUser,
  onOpenAuth,
  onOpenUpload,
  onLogout,
}: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const canCopy = !currentUser || (currentUser.copiedTodayCount || 0) < 2;
  const remainingCredits = currentUser ? Math.max(0, 2 - (currentUser.copiedTodayCount || 0)) : 2;

  return (
    <header className="sticky top-0 z-50 w-full bg-black/80 backdrop-blur-2xl border-b border-zinc-800/80 shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
      {/* Specular Rim Light */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-400/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          onClick={() => {
            onNavigate('home');
            setMobileMenuOpen(false);
          }}
          className="flex items-center gap-3 cursor-pointer group shrink-0 select-none"
        >
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-b from-zinc-800 to-zinc-950 border border-zinc-700/80 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.07)] group-hover:border-zinc-400 group-hover:shadow-[0_0_25px_rgba(255,255,255,0.18)] transition-all duration-300">
            <Sparkles className="w-4 h-4 text-zinc-300 group-hover:text-white transition-colors" />
            <span className="absolute -bottom-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-tight font-sans text-white">
                LAZY<span className="text-zinc-400 ml-1">UI</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-zinc-900 border border-zinc-700 text-zinc-300 tracking-wider">
                v2.0
              </span>
            </div>
            <p className="text-[9px] text-zinc-500 font-mono tracking-[0.15em] uppercase hidden sm:block">
              REACT & TAILWIND VAULT
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-zinc-950/90 p-1 rounded-2xl border border-zinc-800 shadow-inner">
          <button
            onClick={() => onNavigate('home')}
            className={`relative px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none ${
              currentView === 'home'
                ? 'bg-zinc-800 text-white border border-zinc-700 shadow-[0_0_15px_rgba(255,255,255,0.08)]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Home
          </button>

          <button
            onClick={() => onNavigate('showcase')}
            className={`relative px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none ${
              currentView === 'showcase'
                ? 'bg-zinc-800 text-white border border-zinc-700 shadow-[0_0_15px_rgba(255,255,255,0.08)]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Showcase
          </button>

          <button
            onClick={() => onNavigate('leaderboard')}
            className={`relative px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none flex items-center gap-1.5 ${
              currentView === 'leaderboard'
                ? 'bg-zinc-800 text-white border border-zinc-700 shadow-[0_0_15px_rgba(255,255,255,0.08)]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Leaderboard</span>
          </button>

          <button
            onClick={() => onNavigate('dashboard')}
            className={`relative px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none ${
              currentView === 'dashboard'
                ? 'bg-zinc-800 text-white border border-zinc-700 shadow-[0_0_15px_rgba(255,255,255,0.08)]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Dashboard
          </button>
        </nav>

        {/* Right Section: Daily Quota Badge & Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Daily Quota Indicator Pill */}
          <div
            onClick={() => onNavigate('dashboard')}
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer text-xs font-mono group"
            title="Daily Copy Quota: 2 free copies per day (resets at midnight UTC)"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                canCopy ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-zinc-300 text-[11px] font-semibold tracking-wide group-hover:text-white">
              {canCopy ? `${remainingCredits}/2 CREDITS LEFT` : '0/2 USED TODAY'}
            </span>
          </div>

          {/* Upload Button */}
          <button
            onClick={onOpenUpload}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-semibold text-zinc-200 hover:text-white hover:border-zinc-500 hover:bg-zinc-800 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-zinc-300" />
            <span>Upload</span>
          </button>

          {/* User Auth or Sign In Button */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex items-center gap-2 p-1 pl-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-600 transition-all cursor-pointer"
              >
                <span className="text-xs font-mono text-zinc-200 hidden sm:inline max-w-[120px] truncate">
                  {currentUser.name || currentUser.email.split('@')[0]}
                </span>
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-lg bg-black border border-zinc-800 object-cover"
                />
              </button>

              <button
                onClick={onLogout}
                className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-xl font-bold text-xs bg-white text-black hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 text-black fill-current" />
              <span>Sign In</span>
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden p-4 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800 space-y-2 overflow-hidden"
          >
            <button
              onClick={() => {
                onNavigate('home');
                setMobileMenuOpen(false);
              }}
              className={`w-full py-2.5 px-4 rounded-xl text-left text-xs font-semibold transition-all ${
                currentView === 'home' ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-400'
              }`}
            >
              Home
            </button>

            <button
              onClick={() => {
                onNavigate('showcase');
                setMobileMenuOpen(false);
              }}
              className={`w-full py-2.5 px-4 rounded-xl text-left text-xs font-semibold transition-all ${
                currentView === 'showcase' ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-400'
              }`}
            >
              Showcase Vault
            </button>

            <button
              onClick={() => {
                onNavigate('leaderboard');
                setMobileMenuOpen(false);
              }}
              className={`w-full py-2.5 px-4 rounded-xl text-left text-xs font-semibold transition-all flex items-center gap-2 ${
                currentView === 'leaderboard' ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-400'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Leaderboard</span>
            </button>

            <button
              onClick={() => {
                onNavigate('dashboard');
                setMobileMenuOpen(false);
              }}
              className={`w-full py-2.5 px-4 rounded-xl text-left text-xs font-semibold transition-all ${
                currentView === 'dashboard' ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-400'
              }`}
            >
              My Dashboard & Library
            </button>

            <button
              onClick={() => {
                onOpenUpload();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 border border-zinc-700 text-left text-xs font-semibold text-zinc-200 flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-zinc-300" /> Share UI Component
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
