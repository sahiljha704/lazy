import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home,
  LayoutGrid,
  BookmarkCheck,
  Sparkles,
  LogOut,
  Mail,
  Clock,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Zap,
  Trophy,
} from 'lucide-react';
import { UserSession } from '../types';
import { getStoredSidebarCollapsed, saveStoredSidebarCollapsed } from '../services/api';

interface Props {
  currentView: 'home' | 'showcase' | 'dashboard' | 'leaderboard';
  onNavigate: (view: 'home' | 'showcase' | 'dashboard' | 'leaderboard') => void;
  currentUser: UserSession | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  currentView,
  onNavigate,
  currentUser,
  onOpenAuth,
  onLogout,
  isCollapsed: controlledCollapsed,
  onToggleCollapse: controlledToggle,
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [internalCollapsed, setInternalCollapsed] = useState(getStoredSidebarCollapsed());

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    if (controlledToggle) {
      controlledToggle();
    } else {
      const next = !internalCollapsed;
      setInternalCollapsed(next);
      saveStoredSidebarCollapsed(next);
    }
  };

  const canCopy = currentUser ? currentUser.copiedTodayCount < 2 : true;
  const remainingCredits = currentUser ? Math.max(0, 2 - currentUser.copiedTodayCount) : 2;

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'showcase', label: 'Showcase', icon: LayoutGrid },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'dashboard', label: 'Library', icon: BookmarkCheck },
  ] as const;

  const handleNavClick = (view: 'home' | 'showcase' | 'dashboard' | 'leaderboard') => {
    onNavigate(view);
    setMobileOpen(false);
  };

  const desktopSidebarContent = (
    <div className={`h-full flex flex-col justify-between p-3 bg-[#080808] text-[#E5E5E5] border-r border-[#1A1A1A] transition-all duration-300 ${
      isCollapsed ? 'items-center' : ''
    }`}>
      {/* Top Brand & Links */}
      <div className={`space-y-4 w-full ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
        {/* Brand Header */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-1`}>
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 cursor-pointer group"
            title="Lazy UI Home"
          >
            <div className="relative w-8 h-8 rounded-lg bg-[#121212] border border-[#262626] flex items-center justify-center group-hover:border-zinc-500 transition-all duration-300 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-zinc-300 group-hover:rotate-12 transition-transform duration-300" />
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-400/40 to-transparent" />
            </div>
            {!isCollapsed && (
              <div>
                <span className="text-sm font-black tracking-tight text-white font-sans">
                  LAZY <span className="text-zinc-500">UI</span>
                </span>
                <span className="block text-[9px] font-mono text-zinc-500 tracking-wider uppercase">
                  Component Vault
                </span>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={toggleCollapse}
              className="p-1.5 rounded-lg bg-transparent border border-transparent text-zinc-500 hover:text-white hover:border-zinc-700 transition-all cursor-pointer"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Collapsed Expand Toggle */}
        {isCollapsed && (
          <button
            onClick={toggleCollapse}
            className="p-2 rounded-lg bg-[#121212] border border-[#262626] text-zinc-500 hover:text-white hover:border-zinc-600 transition-all cursor-pointer"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Navigation */}
        <div className={`space-y-1 w-full ${isCollapsed ? '' : 'pt-1'}`}>
          {!isCollapsed && (
            <p className="px-2.5 mb-2 text-[9px] font-mono uppercase tracking-[0.15em] text-zinc-500 font-bold">
              Navigate
            </p>
          )}
          <nav className="space-y-0.5 w-full">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id as any)}
                  title={item.label}
                  className={`w-full flex items-center ${
                    isCollapsed ? 'justify-center px-0 py-2.5' : 'justify-start px-2.5 py-2'
                  } rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-white/10 text-white border border-white/10'
                      : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-white' : 'text-zinc-500'
                      }`}
                    />
                    {!isCollapsed && <span>{item.label}</span>}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Daily Credits */}
        {!isCollapsed ? (
          <div className="p-3 rounded-xl bg-[#0D0D0D] border border-[#1E1E1E] space-y-2 w-full">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3 h-3" /> Credits
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                canCopy
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
              }`}>
                {canCopy ? `${remainingCredits}/2` : '0/2'}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1 rounded-full bg-zinc-800/80 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${((currentUser?.copiedTodayCount || 0) / 2) * 100}%`,
                  background: canCopy ? 'linear-gradient(90deg, #34d399, #10b981)' : '#52525b',
                }}
              />
            </div>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              {canCopy
                ? `${remainingCredits} credit${remainingCredits !== 1 ? 's' : ''} remaining today.`
                : 'Resets at midnight UTC.'}
            </p>
          </div>
        ) : (
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center cursor-help transition-all ${
              canCopy
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-500'
            }`}
            title={canCopy ? `${remainingCredits}/2 credits remaining` : '0/2 credits used today'}
          >
            <Zap className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {/* Bottom User Area */}
      <div className={`pt-3 border-t border-[#1A1A1A] space-y-2 w-full ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
        {currentUser ? (
          <div className="space-y-1.5 w-full">
            {!isCollapsed ? (
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[#0D0D0D] border border-[#1E1E1E]">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700/50 object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-white truncate">{currentUser.name}</p>
                  <p className="text-[9px] font-mono text-zinc-500 truncate">{currentUser.email}</p>
                </div>
              </div>
            ) : (
              <div className="flex justify-center" title={`${currentUser.name}`}>
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/50 object-cover"
                />
              </div>
            )}

            <button
              onClick={onLogout}
              title="Log Out"
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center p-2' : 'justify-center gap-2 px-2.5 py-1.5'
              } rounded-lg bg-transparent hover:bg-white/[0.03] border border-transparent hover:border-zinc-800 text-[11px] font-medium text-zinc-500 hover:text-zinc-300 transition-all cursor-pointer`}
            >
              <LogOut className="w-3.5 h-3.5" />
              {!isCollapsed && <span>Log Out</span>}
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            title="Sign In"
            className={`w-full py-2 ${
              isCollapsed ? 'px-2 flex justify-center' : 'px-3 flex items-center justify-center gap-2'
            } rounded-lg bg-white hover:bg-zinc-200 text-[11px] font-semibold text-black transition-all cursor-pointer active:scale-[0.98]`}
          >
            <Mail className="w-3.5 h-3.5 text-black" />
            {!isCollapsed && <span>Sign In</span>}
          </button>
        )}

        {!isCollapsed && (
          <p className="text-[9px] text-center text-zinc-600 font-mono pt-1">
            v4.9.0 · Live Code Vault
          </p>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col h-screen sticky top-0 z-30 shrink-0 transition-all duration-300 ${
          isCollapsed ? 'w-[60px]' : 'w-56 lg:w-60'
        }`}
      >
        {desktopSidebarContent}
      </aside>

      {/* Mobile Top Header Bar */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between px-3 py-2.5 bg-[#080808]/95 backdrop-blur-md border-b border-[#1A1A1A]">
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div className="w-6 h-6 rounded-md bg-[#121212] border border-[#262626] flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-zinc-300" />
          </div>
          <span className="text-xs font-extrabold text-white">
            LAZY <span className="text-zinc-500">UI</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {currentUser ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              referrerPolicy="no-referrer"
              className="w-6 h-6 rounded-md border border-zinc-700/50 object-cover"
            />
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-2 py-1 rounded-md bg-white text-[10px] font-semibold text-black"
            >
              Sign In
            </button>
          )}
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-md bg-[#141414] border border-[#262626] text-zinc-300"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative w-[280px] h-full z-10"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-3 right-3 p-1.5 rounded-md bg-[#1A1A1A] text-zinc-400 hover:text-white z-20"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="h-full flex flex-col justify-between p-4 bg-[#080808] text-[#E5E5E5] border-r border-[#1A1A1A]">
                <div className="space-y-5">
                  <div
                    onClick={() => handleNavClick('home')}
                    className="flex items-center gap-2.5 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#121212] border border-[#262626] flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
                    </div>
                    <div>
                      <span className="text-sm font-black tracking-tight text-white font-sans">
                        LAZY <span className="text-zinc-500">UI</span>
                      </span>
                      <span className="block text-[9px] font-mono text-zinc-500 tracking-wider uppercase">
                        Component Vault
                      </span>
                    </div>
                  </div>

                  <nav className="space-y-0.5">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentView === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavClick(item.id as any)}
                          className={`w-full flex items-center justify-start px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                            isActive
                              ? 'bg-white/10 text-white border border-white/10'
                              : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03] border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                            <span>{item.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </nav>

                  {/* Credits in mobile */}
                  <div className="p-3 rounded-xl bg-[#0D0D0D] border border-[#1E1E1E] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Zap className="w-3 h-3" /> Credits
                      </span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                        canCopy
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                      }`}>
                        {canCopy ? `${remainingCredits}/2` : '0/2'}
                      </span>
                    </div>
                    <div className="w-full h-1 rounded-full bg-zinc-800/80 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${((currentUser?.copiedTodayCount || 0) / 2) * 100}%`,
                          background: canCopy ? 'linear-gradient(90deg, #34d399, #10b981)' : '#52525b',
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#1A1A1A] space-y-2">
                  {currentUser ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[#0D0D0D] border border-[#1E1E1E]">
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.name}
                          referrerPolicy="no-referrer"
                          className="w-7 h-7 rounded-lg object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-bold text-white truncate">{currentUser.name}</p>
                          <p className="text-[9px] font-mono text-zinc-500 truncate">{currentUser.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setMobileOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center justify-center gap-2 px-2.5 py-1.5 rounded-lg bg-transparent hover:bg-white/[0.03] text-[11px] text-zinc-500 hover:text-zinc-300 transition-all"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Log Out
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setMobileOpen(false);
                        onOpenAuth();
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-white text-[11px] font-semibold text-black flex items-center justify-center gap-2"
                    >
                      <Mail className="w-3.5 h-3.5 text-black" /> Sign In
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
