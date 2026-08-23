import React, { RefObject, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  ArrowRight,
  Flame,
  BookmarkCheck,
  Layers,
  Compass,
  Play,
  Code2,
  ShieldCheck,
} from 'lucide-react';
import { UIComponentItem, UserSession } from '../types';
import { ComponentCard } from './ComponentCard';
import VariableProximity from './VariableProximity';
import FlashlightText from './FlashlightText';
import MagneticButton from './MagneticButton';

interface Props {
  components: UIComponentItem[];
  currentUser: UserSession | null;
  scrollContainerRef?: RefObject<HTMLElement | null>;
  onNavigateShowcase: () => void;
  onNavigateDashboard: () => void;
  onSelectComponent: (comp: UIComponentItem) => void;
  onRequireAuth: (reason?: string) => void;
  onOpenShare: (comp: UIComponentItem) => void;
  onToggleLike: (comp: UIComponentItem) => void;
  onToggleWishlist: (comp: UIComponentItem) => void;
  onDeleteComponent?: (comp: UIComponentItem) => void;
}

export function HomeView({
  components,
  currentUser,
  scrollContainerRef,
  onNavigateShowcase,
  onNavigateDashboard,
  onSelectComponent,
  onRequireAuth,
  onOpenShare,
  onToggleLike,
  onToggleWishlist,
  onDeleteComponent,
}: Props) {
  const heroTextContainerRef = useRef<HTMLDivElement | null>(null);

  // Sort by likesCount descending to find "Today's Trending" as per community activity
  const trendingComponents = [...components]
    .sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0))
    .slice(0, 6);

  return (
    <div className="w-full space-y-16 pb-20 max-w-7xl mx-auto px-4 sm:px-6">
      {/* CLEAR HERO SECTION IN PURE BLACK WITH BOLD WELCOME LAZY */}
      <section className="relative overflow-hidden rounded-3xl bg-black border border-[#1F1F1F] py-20 sm:py-28 text-center flex flex-col items-center justify-center shadow-2xl min-h-[520px] sm:min-h-[580px]">
        {/* Subtle Specular Ambient Vignette & Top Line */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-500/50 to-transparent" />
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-white/[0.03] blur-[100px] rounded-full" />
        <div className="pointer-events-none absolute inset-0 bg-radial from-zinc-900/10 via-transparent to-black" />

        <div className="relative z-10 flex flex-col items-center justify-center w-full px-4 max-w-5xl mx-auto my-auto">
          {/* Pill Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#111111] border border-[#2B2B2B] text-xs font-mono text-zinc-300 mb-6 shadow-xl"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            <span className="tracking-wider text-[11px] font-semibold text-zinc-200 uppercase">
              Curated React & Tailwind Micro-Interactions Vault
            </span>
          </motion.div>

          {/* MASSIVE BOLD "WELCOME LAZY" DISPLAY TITLE CENTERED */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full flex flex-col items-center justify-center my-2 text-center"
          >
            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight font-sans text-transparent bg-clip-text bg-gradient-to-b from-white via-[#EDEDED] to-[#71717A] select-none leading-none drop-shadow-[0_10px_35px_rgba(255,255,255,0.25)]">
              WELCOME LAZY
            </h1>
          </motion.div>

          {/* Interactive Proximity Text Subtitle */}
          <div
            ref={heroTextContainerRef}
            className="relative max-w-3xl mx-auto px-6 py-2 mt-4 text-center cursor-default"
          >
            <p className="max-w-2xl mx-auto text-sm sm:text-base md:text-lg text-zinc-400 leading-relaxed font-normal">
              <VariableProximity
                label="A curated digital sanctuary of high-craft React & Tailwind micro-interactions, procedural shaders, and instant drop-in UI modules engineered for modern web creators."
                className="text-zinc-300"
                fromFontVariationSettings="'wght' 350, 'opsz' 10"
                toFontVariationSettings="'wght' 700, 'opsz' 28"
                containerRef={heroTextContainerRef}
                radius={120}
                falloff="linear"
              />
            </p>
          </div>

          {/* CTA Button Group with Magnetic Spring Hover */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <MagneticButton
              label="Explore Showcase"
              onClick={onNavigateShowcase}
              fill="#FFFFFF"
              textColor="#000000"
              sweepColor="#0A0A0A"
              sweepTextColor="#FFFFFF"
              border={true}
              borderOptions={{ color: '#E4E4E7', width: 1 }}
              radius={14}
              paddingX={28}
              paddingY={14}
              magnet={8}
              icon={<ArrowRight className="w-4 h-4" />}
            />

            <MagneticButton
              label="My Library & Upload"
              onClick={onNavigateDashboard}
              fill="#121212"
              textColor="#D4D4D8"
              sweepColor="#27272A"
              sweepTextColor="#FFFFFF"
              border={true}
              borderOptions={{ color: '#2B2B2B', width: 1 }}
              radius={14}
              paddingX={28}
              paddingY={14}
              magnet={6}
              icon={<BookmarkCheck className="w-4 h-4 text-zinc-400" />}
            />
          </motion.div>
        </div>
      </section>

      {/* TODAY'S TRENDING SECTION */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#1E1E1E]">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 mb-1">
              <Flame className="w-4 h-4 text-zinc-300" />
              <span className="font-semibold tracking-wider">COMMUNITY FAVORITES</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
              Today's Trending Components
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Ranked dynamically according to community likes, saves, and interaction volume.
            </p>
          </div>

          <button
            onClick={onNavigateShowcase}
            className="text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1.5 self-start sm:self-auto cursor-pointer transition-colors"
          >
            <span>View All Components</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {trendingComponents.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-[#0A0A0A] border border-dashed border-[#222222] p-8">
            <Layers className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-zinc-200">No components added yet</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Go to your dashboard to upload and publish your components.
            </p>
            <button
              onClick={onNavigateDashboard}
              className="mt-4 px-4 py-2 rounded-xl bg-zinc-800 text-white font-semibold text-xs hover:bg-zinc-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingComponents.map((comp, idx) => (
              <div key={comp.id} className="relative">
                {/* Trending Rank Pill */}
                <div className="absolute -top-2.5 left-4 z-20 px-2.5 py-0.5 rounded-full bg-[#141414] border border-[#2E2E2E] text-[10px] font-mono text-zinc-200 font-bold flex items-center gap-1 shadow-md">
                  <Flame className="w-3 h-3 text-zinc-400" />
                  <span>#{idx + 1} Trending • {comp.likesCount} Likes</span>
                </div>
                <ComponentCard
                  component={comp}
                  currentUser={currentUser}
                  onSelect={() => onSelectComponent(comp)}
                  onRequireAuth={onRequireAuth}
                  onOpenShare={() => onOpenShare(comp)}
                  onToggleLike={() => onToggleLike(comp)}
                  onToggleWishlist={() => onToggleWishlist(comp)}
                  onDelete={onDeleteComponent}
                  isLiked={currentUser?.likedComponentIds?.includes(comp.id)}
                  isWishlisted={currentUser?.wishlistComponentIds?.includes(comp.id)}
                />
              </div>
            ))}
          </div>
        )}

        {/* EXPLORE MORE UI COMPONENTS BUTTON */}
        <div className="flex justify-center pt-6">
          <MagneticButton
            label="Explore Full Component Showcase"
            onClick={onNavigateShowcase}
            fill="#121212"
            textColor="#FFFFFF"
            sweepColor="#222225"
            sweepTextColor="#FFFFFF"
            border={true}
            borderOptions={{ color: '#2E2E2E', width: 1 }}
            radius={16}
            paddingX={32}
            paddingY={16}
            magnet={8}
            icon={<ArrowRight className="w-4 h-4 text-white" />}
          />
        </div>
      </section>

      {/* ABOUT SECTION WITH FLASHLIGHT TEXT SPOTLIGHT EFFECT */}
      <section className="p-8 sm:p-12 rounded-3xl bg-[#0A0A0A] border border-[#1E1E1E] space-y-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-500/40 to-transparent" />

        {/* Header Badge */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#121212] border border-[#2B2B2B] text-xs font-mono text-zinc-300">
            <Compass className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-semibold tracking-wider">ABOUT LAZY UI • FLASHLIGHT SPOTLIGHT REVEAL</span>
          </div>

          {/* FlashlightText Component in About section */}
          <div className="w-full my-4 p-4 sm:p-6 rounded-2xl bg-[#060606] border border-[#1C1C1C]">
            <FlashlightText
              text="Lazy UI is a modern component vault engineered for high-performance React and Tailwind interfaces. Explore hand-crafted components, interactive sandboxes, verified daily quotas, and instant ready-to-paste code for your next project."
              font={{
                fontFamily: 'inherit',
                fontSize: 'clamp(18px, 3.2vw, 30px)',
                fontWeight: 800,
                lineHeight: '1.45em',
                letterSpacing: '-0.02em',
                textAlign: 'center',
              }}
              brightColor="#FFFFFF"
              dimColor="#38383F"
              maskSize={200}
              intensity={20}
              transition={{ type: 'tween', duration: 0.25, ease: 'easeInOut' }}
              className="max-w-4xl mx-auto"
            />
            <p className="text-[11px] font-mono text-zinc-500 mt-4 text-center">
              ✦ Hover with your cursor to illuminate text with the interactive spotlight beam
            </p>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[#1C1C1C]">
          <div className="space-y-2 p-5 rounded-2xl bg-[#111111] border border-[#242424]">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-300 mb-2">
              <Play className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white font-sans">Interactive Previews</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Experience responsive animations and code demonstrations directly rendered with live controls.
            </p>
          </div>

          <div className="space-y-2 p-5 rounded-2xl bg-[#111111] border border-[#242424]">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-300 mb-2">
              <Code2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white font-sans">Copy & Go Source</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              One-click code unlock copies full TypeScript and Tailwind source code directly into your clipboard.
            </p>
          </div>

          <div className="space-y-2 p-5 rounded-2xl bg-[#111111] border border-[#242424]">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-300 mb-2">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white font-sans">Author Controlled</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Fair daily quota enforcement and verified sessions ensure only creators can manage or remove their UI.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
