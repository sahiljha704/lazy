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
} from 'lucide-react';
import { UserSession } from '../types';
import { getStoredSidebarCollapsed, saveStoredSidebarCollapsed } from '../services/api';

interface Props {
  currentView: 'home' | 'showcase' | 'dashboard';
  onNavigate: (view: 'home' | 'showcase' | 'dashboard') => void;
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
    { id: 'home', label: 'Home & About', icon: Home, badge: 'Hub' },
    { id: 'showcase', label: 'Showcase Vault', icon: LayoutGrid, badge: 'Live' },
    {
      id: 'dashboard',
      label: 'My Library & Upload',
      icon: BookmarkCheck,
      badge: currentUser?.wishlistComponentIds?.length ? `${currentUser.wishlistComponentIds.length}` : undefined,
    },
  ];

  const handleNavClick = (view: 'home' | 'showcase' | 'dashboard') => {
    onNavigate(view);
    setMobileOpen(false);
  };

  const desktopSidebarContent = (
    <div className={`h-full flex flex-col justify-between p-4 bg-[#080808] text-[#E5E5E5] border-r border-[#1E1E1E] transition-all duration-300 ${
      isCollapsed ? 'items-center' : ''
    }`}>
      {/* Top Brand & Links */}
      <div className={`space-y-5 w-full ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
        {/* Brand Header + Collapse Button */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-1`}>
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 cursor-pointer group"
            title="Lazy UI Home"
          >
            <div className="relative w-9 h-9 rounded-xl bg-[#121212] border border-[#2A2A2A] flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.05)] group-hover:border-zinc-400 transition-colors shrink-0">
              <Sparkles className="w-4 h-4 text-zinc-300 group-hover:rotate-12 transition-transform" />
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-400 to-transparent opacity-60" />
            </div>
            {!isCollapsed && (
              <div>
                <span className="text-base font-black tracking-tight text-white font-sans">
                  LAZY <span className="text-zinc-400">UI</span>
                </span>
                <span className="block text-[9px] font-mono text-zinc-400 tracking-wider uppercase">
                  Live Code Vault
                </span>
              </div>
            )}
          </div>

          {/* Desktop Compress/Expand Button */}
          {!isCollapsed && (
            <button
              onClick={toggleCollapse}
              className="p-1.5 rounded-lg bg-[#121212] border border-[#262626] text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors cursor-pointer"
              title="Compress menu sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Collapsed Expand Toggle Button */}
        {isCollapsed && (
          <button
            onClick={toggleCollapse}
            className="p-2 rounded-xl bg-[#121212] border border-[#262626] text-zinc-400 hover:text-white hover:border-zinc-400 transition-all cursor-pointer shadow-sm"
            title="Expand menu sidebar"
          >
            <PanelLeftOpen className="w-4 h-4 text-zinc-300" />
          </button>
        )}

        {/* Navigation Menu */}
        <div className="space-y-1.5 pt-2 w-full">
          {!isCollapsed && (
            <p className="px-3 text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
              Navigation
            </p>
          )}
          <nav className="space-y-1 w-full">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id as any)}
                  title={item.label}
                  className={`w-full flex items-center ${
                    isCollapsed ? 'justify-center px-0 py-3' : 'justify-between px-3 py-2.5'
                  } rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-zinc-800 text-white border border-zinc-600 shadow-[0_0_15px_rgba(255,255,255,0.08)]'
                      : 'text-zinc-400 hover:text-white hover:bg-[#141414]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-white' : 'text-zinc-400'
                      }`}
                    />
                    {!isCollapsed && <span>{item.label}</span>}
                  </div>
                  {!isCollapsed && item.badge && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                        isActive
                          ? 'bg-zinc-900 text-zinc-200 border-zinc-700'
                          : 'bg-[#101010] text-zinc-400 border-[#222222]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Daily Credit Status Indicator */}
        {!isCollapsed ? (
          <div className="p-3.5 rounded-xl bg-[#0F0F0F] border border-[#222222] space-y-2 w-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-400" /> Daily Credits
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  canCopy
                    ? 'bg-zinc-900 border-zinc-700 text-zinc-200'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                }`}
              >
                {canCopy ? `${remainingCredits}/2 Ready` : '0/2 Used'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {canCopy
                ? `${remainingCredits} credit${remainingCredits > 1 ? 's' : ''} available to copy source code today.`
                : 'Daily copy limit reached. Resets at midnight UTC.'}
            </p>
          </div>
        ) : (
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border cursor-help ${
              canCopy
                ? 'bg-zinc-900 border-zinc-700 text-zinc-200'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400'
            }`}
            title={canCopy ? `${remainingCredits}/2 Daily Copy Credits Available` : '0/2 Daily Copy Credits Used Today'}
          >
            <Clock className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Bottom User Area */}
      <div className={`pt-4 border-t border-[#1E1E1E] space-y-2.5 w-full ${isCollapsed ? 'flex flex-col items-center' : ''}`}>
        {currentUser ? (
          <div className="space-y-2 w-full">
            {!isCollapsed ? (
              <div className="flex items-center gap-3 p-2 rounded-xl bg-[#111111] border border-[#242424]">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate font-sans">{currentUser.name}</p>
                  <p className="text-[10px] font-mono text-zinc-400 truncate">{currentUser.email}</p>
                </div>
              </div>
            ) : (
              <div className="flex justify-center" title={`${currentUser.name} (${currentUser.email})`}>
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700 object-cover"
                />
              </div>
            )}

            <button
              onClick={onLogout}
              title="Log Out"
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center p-2.5' : 'justify-center gap-2 px-3 py-2'
              } rounded-xl bg-[#111111] hover:bg-zinc-900 border border-[#242424] hover:border-zinc-600 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer`}
            >
              <LogOut className="w-3.5 h-3.5" />
              {!isCollapsed && <span>Log Out</span>}
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            title="Sign In with Gmail / Google"
            className={`w-full py-2.5 ${
              isCollapsed ? 'px-2 flex justify-center' : 'px-3 flex items-center justify-center gap-2'
            } rounded-xl bg-white hover:bg-zinc-200 border border-white text-xs font-semibold text-black transition-colors cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.15)] active:scale-95`}
          >
            <Mail className="w-4 h-4 text-black" />
            {!isCollapsed && <span>Sign In with Gmail</span>}
          </button>
        )}

        {!isCollapsed && (
          <p className="text-[10px] text-center text-zinc-500 font-mono">
            Lazy UI Live Code Vault
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
          isCollapsed ? 'w-20' : 'w-64 lg:w-72'
        }`}
      >
        {desktopSidebarContent}
      </aside>

      {/* Mobile Top Header Bar */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-[#080808]/95 backdrop-blur-md border-b border-[#1E1E1E]">
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <div className="w-7 h-7 rounded-lg bg-[#121212] border border-[#2A2A2A] flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
          </div>
          <span className="text-sm font-extrabold text-white">
            LAZY <span className="text-zinc-400">UI</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {currentUser ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              referrerPolicy="no-referrer"
              className="w-7 h-7 rounded-lg border border-[#2F2F2F] object-cover"
            />
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-2.5 py-1.5 rounded-lg bg-white text-xs font-semibold text-black"
            >
              Sign In
            </button>
          )}
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg bg-[#141414] border border-[#282828] text-[#E5E5E5]"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-4/5 max-w-xs h-full z-10"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-[#1A1A1A] text-zinc-400 hover:text-white z-20"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="h-full flex flex-col justify-between p-5 bg-[#080808] text-[#E5E5E5] border-r border-[#1E1E1E]">
                <div className="space-y-6">
                  <div
                    onClick={() => handleNavClick('home')}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#121212] border border-[#2A2A2A] flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-zinc-300" />
                    </div>
                    <div>
                      <span className="text-base font-black tracking-tight text-white font-sans">
                        LAZY <span className="text-zinc-400">UI</span>
                      </span>
                      <span className="block text-[10px] font-mono text-zinc-400 tracking-wider uppercase">
                        Live Code Vault
                      </span>
                    </div>
                  </div>

                  <nav className="space-y-1">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentView === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavClick(item.id as any)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold ${
                            isActive
                              ? 'bg-zinc-800 text-white border border-zinc-600'
                              : 'text-zinc-400 hover:text-[#E5E5E5]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#161616] text-zinc-200 border border-zinc-700">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                <div className="pt-4 border-t border-[#1E1E1E] space-y-2">
                  {currentUser ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-2 rounded-xl bg-[#121212] border border-[#262626]">
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.name}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                          <p className="text-[10px] font-mono text-zinc-400 truncate">{currentUser.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setMobileOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[#121212] text-xs text-zinc-400 hover:text-white"
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
                      className="w-full py-2.5 px-3 rounded-xl bg-white text-xs font-semibold text-black flex items-center justify-center gap-2"
                    >
                      <Mail className="w-4 h-4 text-black" /> Sign In with Gmail
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
