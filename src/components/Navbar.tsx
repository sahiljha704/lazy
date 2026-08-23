import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Layers,
  Palette,
  Upload,
  User,
  LogOut,
  Clock,
  Unlock,
  ShieldCheck,
  Menu,
  X,
  Plus,
  Compass,
} from 'lucide-react';
import { UserSession } from '../types';

interface Props {
  currentView: 'home' | 'showcase' | 'themes' | 'dashboard';
  onNavigate: (view: 'home' | 'showcase' | 'themes' | 'dashboard') => void;
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
    <header className="sticky top-0 z-40 w-full bg-[#050505]/90 backdrop-blur-xl border-b border-[#222222] shadow-[0_4px_30px_rgba(0,0,0,0.9)]">
      {/* Specular Rim Light */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#C0C0C0] to-transparent opacity-40" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div
          onClick={() => {
            onNavigate('home');
            setMobileMenuOpen(false);
          }}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-[#1A1A1A] to-[#0A0A0A] border border-[#333333] flex items-center justify-center shadow-[0_0_15px_rgba(192,192,192,0.12)] group-hover:border-[#C0C0C0] transition-colors">
            <Sparkles className="w-4 h-4 text-[#C0C0C0] group-hover:text-white transition-colors" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold tracking-tight font-sans">
                <span className="text-white">LAZY</span> <span className="text-[#C0C0C0]">UI</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#111111] border border-[#333333] text-[#C0C0C0] tracking-wider">
                PRO
              </span>
            </div>
            <p className="text-[9px] text-[#888888] font-mono tracking-[0.15em] uppercase hidden sm:block">
              PREMIUM COMPONENT LIBRARY
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-[#0A0A0A] p-1 rounded-2xl border border-[#222222] shadow-inner">
          <button
            onClick={() => onNavigate('home')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              currentView === 'home'
                ? 'bg-[#1A1A1A] text-white border border-[#333333] shadow-[0_0_15px_rgba(255,255,255,0.08)]'
                : 'text-[#888888] hover:text-[#E5E5E5]'
            }`}
          >
            Home
          </button>

          <button
            onClick={() => onNavigate('showcase')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              currentView === 'showcase'
                ? 'bg-[#1A1A1A] text-white border border-[#333333] shadow-[0_0_15px_rgba(255,255,255,0.08)]'
                : 'text-[#888888] hover:text-[#E5E5E5]'
            }`}
          >
            Showcase
          </button>

          <button
            onClick={() => onNavigate('themes')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              currentView === 'themes'
                ? 'bg-[#1A1A1A] text-white border border-[#333333] shadow-[0_0_15px_rgba(255,255,255,0.08)]'
                : 'text-[#888888] hover:text-[#E5E5E5]'
            }`}
          >
            Theme Sandbox
          </button>

          <button
            onClick={() => onNavigate('dashboard')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              currentView === 'dashboard'
                ? 'bg-[#1A1A1A] text-white border border-[#333333] shadow-[0_0_15px_rgba(255,255,255,0.08)]'
                : 'text-[#888888] hover:text-[#E5E5E5]'
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
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0A0A0A] border border-[#333333] hover:border-[#444444] transition-all cursor-pointer text-xs font-mono"
            title="Daily Copy Quota: Max 2 code copies per 24 hours"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                canCopy ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-[#C0C0C0] text-[11px] tracking-wide">
              {canCopy ? `${remainingCredits}/2 AVAILABLE` : '0/2 USED TODAY'}
            </span>
          </div>

          {/* Upload Button */}
          <button
            onClick={onOpenUpload}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#111111] border border-[#333333] text-xs font-semibold text-[#E5E5E5] hover:text-white hover:border-[#C0C0C0] hover:bg-[#1A1A1A] transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#C0C0C0]" />
            <span>Upload</span>
          </button>

          {/* User Auth or Sign In Button */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex items-center gap-2 p-1 pl-2.5 rounded-xl bg-[#0A0A0A] border border-[#333333] hover:border-[#C0C0C0] transition-all cursor-pointer"
              >
                <span className="text-xs font-mono text-[#E5E5E5] hidden sm:inline max-w-[120px] truncate">
                  {currentUser.email.split('@')[0]}
                </span>
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-lg bg-[#050505] border border-[#333333]"
                />
              </button>

              <button
                onClick={onLogout}
                className="p-2 rounded-xl bg-[#0A0A0A] border border-[#333333] text-[#888888] hover:text-white hover:bg-[#1A1A1A] transition-colors cursor-pointer"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-xl font-bold text-xs bg-white text-black hover:bg-[#C0C0C0] transition-all shadow-[0_0_15px_rgba(192,192,192,0.25)] flex items-center gap-1.5 cursor-pointer"
            >
              {/* Google G small */}
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.1-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2c0 2.8.7 5.5 1.9 7.8l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16.5C3.7 20.3 7.5 23.5 12 23.5z"
                />
              </svg>
              <span>Gmail Login</span>
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-[#0A0A0A] border border-[#333333] text-[#E5E5E5]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden p-4 bg-[#050505] border-b border-[#222222] space-y-2">
          <button
            onClick={() => {
              onNavigate('home');
              setMobileMenuOpen(false);
            }}
            className={`w-full py-2.5 px-4 rounded-xl text-left text-xs font-semibold ${
              currentView === 'home' ? 'bg-[#1A1A1A] text-white border border-[#333333]' : 'text-[#888888]'
            }`}
          >
            Home
          </button>

          <button
            onClick={() => {
              onNavigate('showcase');
              setMobileMenuOpen(false);
            }}
            className={`w-full py-2.5 px-4 rounded-xl text-left text-xs font-semibold ${
              currentView === 'showcase' ? 'bg-[#1A1A1A] text-white border border-[#333333]' : 'text-[#888888]'
            }`}
          >
            Showcase Vault
          </button>

          <button
            onClick={() => {
              onNavigate('themes');
              setMobileMenuOpen(false);
            }}
            className={`w-full py-2.5 px-4 rounded-xl text-left text-xs font-semibold ${
              currentView === 'themes' ? 'bg-[#1A1A1A] text-white border border-[#333333]' : 'text-[#888888]'
            }`}
          >
            Theme Sandbox
          </button>

          <button
            onClick={() => {
              onNavigate('dashboard');
              setMobileMenuOpen(false);
            }}
            className={`w-full py-2.5 px-4 rounded-xl text-left text-xs font-semibold ${
              currentView === 'dashboard' ? 'bg-[#1A1A1A] text-white border border-[#333333]' : 'text-[#888888]'
            }`}
          >
            My Dashboard & Wishlist
          </button>

          <button
            onClick={() => {
              onOpenUpload();
              setMobileMenuOpen(false);
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-[#111111] border border-[#333333] text-left text-xs font-semibold text-[#E5E5E5] flex items-center gap-2"
          >
            <Plus className="w-4 h-4 text-[#C0C0C0]" /> Share UI Component
          </button>
        </div>
      )}
    </header>
  );
}
