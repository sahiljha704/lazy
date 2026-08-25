import React from 'react';
import { Sparkles, Heart, ArrowUpRight } from 'lucide-react';

interface Props {
  onNavigate: (view: 'home' | 'showcase' | 'dashboard' | 'leaderboard') => void;
}

export function Footer({ onNavigate }: Props) {
  return (
    <footer className="w-full bg-[#050505] border-t border-[#1A1A1A] text-zinc-500 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#121212] border border-[#262626] flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-zinc-400" />
              </div>
              <span className="text-xs font-extrabold text-white">
                LAZY <span className="text-zinc-500">UI</span>
              </span>
            </div>
            <p className="text-[11px] text-zinc-600 leading-relaxed">
              Live code vault for interactive React & Tailwind components with instant preview and source export.
            </p>
          </div>

          {/* Vault Directory */}
          <div className="space-y-2.5">
            <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-zinc-400 font-bold">
              Vault
            </p>
            <ul className="space-y-1.5">
              <li>
                <button
                  onClick={() => onNavigate('showcase')}
                  className="text-[11px] hover:text-white transition-colors cursor-pointer flex items-center gap-1 group"
                >
                  Component Showcase
                  <ArrowUpRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('leaderboard')}
                  className="text-[11px] hover:text-white transition-colors cursor-pointer flex items-center gap-1 group"
                >
                  Creator Leaderboard
                  <ArrowUpRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="text-[11px] hover:text-white transition-colors cursor-pointer flex items-center gap-1 group"
                >
                  Dashboard & Uploads
                  <ArrowUpRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </li>
            </ul>
          </div>

          {/* Tech Stack */}
          <div className="space-y-2.5">
            <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-zinc-400 font-bold">
              Stack
            </p>
            <ul className="space-y-1 text-[10px] font-mono text-zinc-600">
              <li>React 19 & TypeScript</li>
              <li>Tailwind CSS v4</li>
              <li>GSAP & Three.js</li>
              <li>Vite & Express</li>
            </ul>
          </div>

          {/* Info */}
          <div className="space-y-2.5">
            <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-zinc-400 font-bold">
              Info
            </p>
            <p className="text-[11px] text-zinc-600 leading-relaxed">
              2 free copy credits per day. Code is exported directly to clipboard.
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-5 border-t border-[#1A1A1A] flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono text-zinc-600">
          <span>© {new Date().getFullYear()} Lazy UI</span>
          <span className="flex items-center gap-1">
            Built with <Heart className="w-2.5 h-2.5 text-zinc-500 fill-zinc-500" /> for developers
          </span>
        </div>

        {/* LAZY watermark */}
        <div className="pt-6 pb-1 overflow-hidden select-none pointer-events-none flex items-center justify-center w-full">
          <span className="text-[17vw] sm:text-[19vw] md:text-[21vw] font-black tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-b from-zinc-800/40 via-zinc-800/20 to-transparent font-sans">
            LAZY
          </span>
        </div>
      </div>
    </footer>
  );
}
