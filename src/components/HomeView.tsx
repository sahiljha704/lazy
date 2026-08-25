import React, { RefObject, useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'motion/react';
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
  Zap,
  TrendingUp,
  Boxes,
  Users,
  Copy,
  Heart,
  Grid,
  Trophy,
} from 'lucide-react';
import { UIComponentItem, UserSession, PlatformStats, ComponentCategory } from '../types';
import { fetchPlatformStats } from '../services/api';
import { ComponentCard } from './ComponentCard';
import VariableProximity from './VariableProximity';
import FlashlightText from './FlashlightText';
import MagneticButton from './MagneticButton';

interface Props {
  components: UIComponentItem[];
  currentUser: UserSession | null;
  scrollContainerRef?: RefObject<HTMLElement | null>;
  onNavigateShowcase: (category?: string) => void;
  onNavigateDashboard: () => void;
  onNavigateLeaderboard?: () => void;
  onSelectComponent: (comp: UIComponentItem) => void;
  onRequireAuth: (reason?: string) => void;
  onOpenShare: (comp: UIComponentItem) => void;
  onToggleLike: (comp: UIComponentItem) => void;
  onToggleWishlist: (comp: UIComponentItem) => void;
  onDeleteComponent?: (comp: UIComponentItem) => void;
}

const FEATURED_CATEGORIES: { name: ComponentCategory; label: string; icon: string; color: string }[] = [
  { name: 'Buttons & Actions', label: 'Buttons & Actions', icon: '⚡', color: '#FBBF24' },
  { name: 'Cards & Bionic UI', label: 'Cards & Bento', icon: '🎴', color: '#A78BFA' },
  { name: 'Navigation & Menus', label: 'Navigation', icon: '🧭', color: '#34D399' },
  { name: 'Text & Typography Animations', label: 'Typography', icon: '✨', color: '#F472B6' },
  { name: 'Loaders & Spinners', label: 'Loaders & Shaders', icon: '🌀', color: '#60A5FA' },
  { name: 'Modals & Overlays', label: 'Modals & Drawers', icon: '🗔', color: '#FB923C' },
  { name: 'Hero & Headers', label: 'Hero Sections', icon: '🚀', color: '#E879F9' },
  { name: 'Pricing & Tables', label: 'Pricing & Stats', icon: '💳', color: '#2DD4BF' },
];

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const duration = 1200;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {displayValue.toLocaleString()}{suffix}
    </span>
  );
}

export function HomeView({
  components,
  currentUser,
  scrollContainerRef,
  onNavigateShowcase,
  onNavigateDashboard,
  onNavigateLeaderboard,
  onSelectComponent,
  onRequireAuth,
  onOpenShare,
  onToggleLike,
  onToggleWishlist,
  onDeleteComponent,
}: Props) {
  const heroTextContainerRef = useRef<HTMLDivElement | null>(null);
  const trendingSectionRef = useRef<HTMLDivElement>(null);
  const isTrendingInView = useInView(trendingSectionRef, { once: true, margin: '-100px' });
  const [stats, setStats] = useState<PlatformStats>({
    totalComponents: components.length,
    totalCopies: 140,
    totalLikes: 350,
    totalViews: 1200,
    activeCreators: 24,
    categoriesCount: 16,
  });

  useEffect(() => {
    fetchPlatformStats().then((data) => {
      if (data) setStats(data);
    });
  }, [components.length]);

  const trendingComponents = [...components]
    .sort((a, b) => (b.likesCount || 0) + (b.copyCount || 0) * 1.5 - ((a.likesCount || 0) + (a.copyCount || 0) * 1.5))
    .slice(0, 6);

  return (
    <div className="w-full space-y-16 pb-24 max-w-7xl mx-auto px-4 sm:px-6 page-enter">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-black border border-zinc-800/60 py-20 sm:py-28 text-center flex flex-col items-center justify-center min-h-[520px] sm:min-h-[600px]">
        {/* Multi-layer ambient lighting */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-400/40 to-transparent" />
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-white/[0.03] blur-[140px] rounded-full" />
        <div className="pointer-events-none absolute top-1/2 left-1/4 -translate-y-1/2 w-[300px] h-[300px] bg-blue-500/[0.02] blur-[100px] rounded-full float-glow" />
        <div className="pointer-events-none absolute top-1/3 right-1/4 w-[250px] h-[250px] bg-purple-500/[0.02] blur-[100px] rounded-full float-glow" style={{ animationDelay: '4s' }} />

        <div className="relative z-10 flex flex-col items-center justify-center w-full px-4 max-w-5xl mx-auto my-auto">
          {/* Version Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-[11px] font-mono text-zinc-300 mb-8 backdrop-blur-md shadow-lg"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="tracking-wider font-semibold text-zinc-200 uppercase">
              LAZY UI • HIGH-CRAFT REACT & TAILWIND MICRO-INTERACTIONS
            </span>
          </motion.div>

          {/* Improved Main Title */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="w-full flex flex-col items-center justify-center my-2 text-center"
          >
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-black tracking-tight font-sans text-center leading-[1.08] select-none">
              <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-100 to-zinc-400 drop-shadow-[0_10px_35px_rgba(255,255,255,0.2)]">
                CRAFT FASTER.
              </span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-white to-zinc-400 drop-shadow-[0_10px_45px_rgba(255,255,255,0.3)]">
                STAY <span className="underline decoration-zinc-600 decoration-wavy decoration-from-font underline-offset-8 text-zinc-100">LAZY</span>.
              </span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <div
            ref={heroTextContainerRef}
            className="relative max-w-3xl mx-auto px-6 py-2 mt-6 text-center cursor-default"
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

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <MagneticButton
              label="Explore Showcase"
              onClick={() => onNavigateShowcase()}
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

            {onNavigateLeaderboard && (
              <MagneticButton
                label="Creator Leaderboard"
                onClick={onNavigateLeaderboard}
                fill="#161618"
                textColor="#FBBF24"
                sweepColor="#26262B"
                sweepTextColor="#FDE68A"
                border={true}
                borderOptions={{ color: '#78350F', width: 1 }}
                radius={14}
                paddingX={26}
                paddingY={14}
                magnet={7}
                icon={<Trophy className="w-4 h-4 text-amber-400" />}
              />
            )}

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
              paddingX={26}
              paddingY={14}
              magnet={6}
              icon={<BookmarkCheck className="w-4 h-4 text-zinc-400" />}
            />
          </motion.div>
        </div>
      </section>

      {/* PLATFORM STATS */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { icon: Boxes, value: stats.totalComponents, suffix: '+', label: 'UI Components', delay: 0 },
          { icon: Copy, value: stats.totalCopies, suffix: '+', label: 'Code Unlocks', delay: 0.05 },
          { icon: Heart, value: stats.totalLikes, suffix: '+', label: 'Community Saves', delay: 0.1, iconColor: 'text-rose-400/80' },
          { icon: Users, value: stats.activeCreators, suffix: '+', label: 'Active Creators', delay: 0.15 },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + stat.delay, duration: 0.4 }}
            className="group relative p-5 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 backdrop-blur-sm flex flex-col items-center text-center hover:border-zinc-700/80 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="w-9 h-9 rounded-xl bg-zinc-900/80 border border-zinc-800/60 flex items-center justify-center text-zinc-300 mb-3 mx-auto group-hover:scale-110 transition-transform duration-300">
                <stat.icon className={`w-4 h-4 ${stat.iconColor || ''}`} />
              </div>
              <span className="text-2xl sm:text-3xl font-black text-white font-mono block">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </span>
              <span className="text-[11px] text-zinc-500 font-medium mt-1.5 block tracking-wide uppercase font-mono">{stat.label}</span>
            </div>
          </motion.div>
        ))}
      </section>

      {/* CATEGORY BROWSE */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-900/80 border border-zinc-800/60 flex items-center justify-center">
              <Grid className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <h3 className="text-sm font-bold text-zinc-200 tracking-wide uppercase font-mono">
              Explore by Category
            </h3>
          </div>
          <button
            onClick={() => onNavigateShowcase()}
            className="text-xs font-medium text-zinc-500 hover:text-white flex items-center gap-1 transition-colors cursor-pointer group"
          >
            <span className="group-hover:underline">All Categories</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {FEATURED_CATEGORIES.map((cat) => {
            const count = components.filter((c) => c.category === cat.name).length;
            return (
              <button
                key={cat.name}
                onClick={() => onNavigateShowcase(cat.name)}
                className="group relative flex items-center justify-between p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-800/50 hover:border-zinc-700/80 hover:bg-zinc-900/40 transition-all duration-300 text-left cursor-pointer overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 flex items-center gap-2.5 min-w-0">
                  <span className="text-base group-hover:scale-110 transition-transform duration-200">{cat.icon}</span>
                  <span className="text-[11px] font-semibold text-zinc-300 group-hover:text-white truncate transition-colors">
                    {cat.label}
                  </span>
                </div>
                <span className="relative z-10 px-2 py-0.5 rounded-md text-[10px] font-mono bg-zinc-900/80 text-zinc-500 group-hover:text-zinc-300 border border-zinc-800/60 transition-colors">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* TRENDING SECTION */}
      <section ref={trendingSectionRef} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-zinc-800/60">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 mb-1.5">
              <Flame className="w-4 h-4 text-amber-400/80" />
              <span className="font-semibold tracking-wider uppercase">Community Favorites</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
              Trending Now
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Ranked by community interaction, likes, and saves.
            </p>
          </div>

          <button
            onClick={() => onNavigateShowcase()}
            className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1.5 self-start sm:self-auto cursor-pointer transition-colors group"
          >
            <span className="group-hover:underline">View All</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {trendingComponents.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-zinc-950/40 border border-dashed border-zinc-800/60 p-8">
            <Layers className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <h3 className="text-base font-bold text-zinc-300">No components yet</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Upload your first component from the dashboard.
            </p>
            <button
              onClick={onNavigateDashboard}
              className="mt-4 px-4 py-2 rounded-xl bg-zinc-800/80 text-white font-semibold text-xs hover:bg-zinc-700/80 transition-colors cursor-pointer border border-zinc-700/50"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={isTrendingInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {trendingComponents.map((comp, idx) => (
              <motion.div
                key={comp.id}
                initial={{ opacity: 0, y: 20 }}
                animate={isTrendingInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: idx * 0.08, duration: 0.4 }}
                className="relative"
              >
                <div className="absolute -top-2.5 left-4 z-20 px-2.5 py-0.5 rounded-full bg-zinc-900/90 border border-zinc-700/60 text-[10px] font-mono text-zinc-200 font-bold flex items-center gap-1 shadow-lg backdrop-blur-sm">
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>#{idx + 1} · {comp.likesCount} Likes</span>
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
              </motion.div>
            ))}
          </motion.div>
        )}

        <div className="flex justify-center pt-6">
          <MagneticButton
            label="Explore Full Showcase"
            onClick={() => onNavigateShowcase()}
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

      {/* ABOUT SECTION */}
      <section className="relative p-8 sm:p-12 rounded-3xl bg-zinc-950/50 border border-zinc-800/40 space-y-10 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-400/30 to-transparent" />

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/60 border border-zinc-800/60 text-xs font-mono text-zinc-400">
            <Compass className="w-3.5 h-3.5" />
            <span className="font-semibold tracking-wider uppercase">About Lazy UI</span>
          </div>

          <div className="w-full my-4 p-4 sm:p-6 rounded-2xl bg-black/60 border border-zinc-900/60">
            <FlashlightText
              text="Lazy UI is a modern component vault engineered for high-performance React and Tailwind interfaces. Explore hand-crafted components, interactive demos, and instant ready-to-paste code for your next project."
              font={{
                fontFamily: 'inherit',
                fontSize: 'clamp(18px, 3.2vw, 30px)',
                fontWeight: 800,
                lineHeight: '1.45em',
                letterSpacing: '-0.02em',
                textAlign: 'center',
              }}
              brightColor="#FFFFFF"
              dimColor="#3F3F46"
              maskSize={220}
              intensity={25}
              transition={{ type: 'tween', duration: 0.25, ease: 'easeInOut' }}
              className="max-w-4xl mx-auto"
            />
            <p className="text-[11px] font-mono text-zinc-600 mt-4 text-center">
              Move your cursor to illuminate the text
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-zinc-900/60">
          {[
            { icon: Play, title: 'Interactive Previews', desc: 'Experience responsive animations and code demos rendered with live controls.' },
            { icon: Code2, title: 'One-Click Copy', desc: 'Copy full TypeScript and Tailwind source code directly to your clipboard.' },
            { icon: ShieldCheck, title: 'Author Controlled', desc: 'Fair daily quotas and verified sessions ensure creators manage their UI.' },
          ].map((feature) => (
            <div key={feature.title} className="group space-y-2.5 p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800/40 hover:border-zinc-700/60 hover:bg-zinc-900/50 transition-all duration-300">
              <div className="w-9 h-9 rounded-xl bg-zinc-900/60 border border-zinc-800/40 flex items-center justify-center text-zinc-300 mb-1 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white font-sans">{feature.title}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
