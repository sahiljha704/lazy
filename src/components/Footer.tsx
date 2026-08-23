import React from 'react';
import { Sparkles, Heart } from 'lucide-react';

interface Props {
  onNavigate: (view: 'home' | 'showcase' | 'dashboard') => void;
}

export function Footer({ onNavigate }: Props) {
  return (
    <footer className="w-full bg-[#050505] border-t border-[#1C1C1C] text-zinc-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#121212] border border-[#262626] flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
              </div>
              <span className="text-sm font-extrabold text-white">
                LAZY <span className="text-zinc-400">UI</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Automated live code execution vault for interactive React & Tailwind components with automatic real-time preview and 1 daily copy credit.
            </p>
          </div>

          {/* Vault Sections */}
          <div className="space-y-2">
            <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-300 font-bold">
              Vault Directory
            </p>
            <ul className="space-y-1.5">
              <li>
                <button
                  onClick={() => onNavigate('showcase')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Component Showcase
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  User Dashboard & Uploads
                </button>
              </li>
            </ul>
          </div>

          {/* Tech Specs */}
          <div className="space-y-2">
            <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-300 font-bold">
              Engine & Sandbox
            </p>
            <ul className="space-y-1 text-[11px] font-mono text-zinc-400">
              <li>• Real-Time Babel Transpiler</li>
              <li>• React 18+ & Tailwind CSS</li>
              <li>• GSAP Physics & Particle Engine</li>
              <li>• Firestore Auth & Quota Guard</li>
            </ul>
          </div>

          {/* Security */}
          <div className="space-y-2">
            <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-300 font-bold">
              Security Protocol
            </p>
            <p className="text-xs text-zinc-400 leading-relaxed">
              All logins require valid @gmail.com accounts. Immediate security confirmation alerts logged on every session.
            </p>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 border-t border-[#1C1C1C] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-zinc-400">
          <span>© {new Date().getFullYear()} Lazy UI. Live Sandbox Engine.</span>
          <span className="flex items-center gap-1">
            Engineered with <Heart className="w-3 h-3 text-zinc-300 fill-zinc-300" /> for modern developers
          </span>
        </div>

        {/* Large Typography Statement at the very bottom of Footer: LAZY */}
        <div className="pt-8 pb-2 overflow-hidden select-none pointer-events-none flex items-center justify-center w-full">
          <span className="text-[17vw] sm:text-[19vw] md:text-[21vw] font-black tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-b from-zinc-300/70 via-zinc-500/50 to-zinc-700/20 font-sans">
            LAZY
          </span>
        </div>
      </div>
    </footer>
  );
}
