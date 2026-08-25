import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Sparkles,
  Layers,
  X,
  ArrowLeft,
  Filter,
  SlidersHorizontal,
  LayoutGrid,
  Check,
  Command,
} from 'lucide-react';
import { ComponentCategory, Framework, UIComponentItem, UserSession } from '../types';
import { ComponentCard } from './ComponentCard';

interface Props {
  components: UIComponentItem[];
  currentUser: UserSession | null;
  initialCategory?: string;
  onSelectComponent: (comp: UIComponentItem) => void;
  onRequireAuth: (reason?: string) => void;
  onOpenShare: (comp: UIComponentItem) => void;
  onToggleLike: (comp: UIComponentItem) => void;
  onToggleWishlist: (comp: UIComponentItem) => void;
  onDeleteComponent?: (comp: UIComponentItem) => void;
  onNavigateBack?: () => void;
}

const CATEGORIES: ComponentCategory[] = [
  'All',
  'Buttons & Actions',
  'Cards & Bionic UI',
  'Navigation & Menus',
  'Inputs & Forms',
  'Hero & Headers',
  'Modals & Overlays',
  'Badges & Indicators',
  'Text & Typography Animations',
  'Loaders & Spinners',
  'Footers & Bottom Bars',
  'Pricing & Tables',
  'Carousels & Sliders',
  'Bento Grids',
  'Sidebar & Drawers',
  'Tooltips & Popovers',
  'Charts & Visualizations',
];

const FRAMEWORKS = [
  'All',
  'React + Tailwind',
  'Next.js',
  'HTML + Tailwind',
  'Vue 3',
  'Svelte',
  'Framer Motion',
  'Vanilla CSS',
];

export function ShowcaseView({
  components,
  currentUser,
  initialCategory,
  onSelectComponent,
  onRequireAuth,
  onOpenShare,
  onToggleLike,
  onToggleWishlist,
  onDeleteComponent,
  onNavigateBack,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ComponentCategory>(
    (initialCategory as ComponentCategory) || 'All'
  );
  const [selectedFramework, setSelectedFramework] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'popular' | 'views' | 'copies' | 'likes' | 'newest'>('popular');
  const searchRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Cmd/Ctrl + K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: components.length };
    for (const c of components) {
      counts[c.category] = (counts[c.category] || 0) + 1;
    }
    return counts;
  }, [components]);

  const filteredComponents = useMemo(() => {
    let list = [...components];

    if (selectedCategory !== 'All') {
      list = list.filter((c) => c.category === selectedCategory);
    }
    if (selectedFramework !== 'All') {
      list = list.filter((c) => c.framework === selectedFramework);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q)) ||
          c.authorName.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'popular') {
      list.sort((a, b) => (b.likesCount || 0) + (b.copyCount || 0) * 2 + (b.viewsCount || 0) * 0.1 - ((a.likesCount || 0) + (a.copyCount || 0) * 2 + (a.viewsCount || 0) * 0.1));
    } else if (sortBy === 'views') {
      list.sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
    } else if (sortBy === 'copies') {
      list.sort((a, b) => (b.copyCount || 0) - (a.copyCount || 0));
    } else if (sortBy === 'likes') {
      list.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return list;
  }, [components, selectedCategory, selectedFramework, searchQuery, sortBy]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 page-enter">
      {/* Header */}
      <div className="pb-5 border-b border-zinc-800/60 space-y-4">
        {onNavigateBack && (
          <button
            onClick={onNavigateBack}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-transparent hover:bg-white/[0.05] border border-[#262626] hover:border-zinc-600 text-zinc-400 hover:text-white text-[11px] font-medium transition-all cursor-pointer group active:scale-95"
          >
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
            Back
          </button>
        )}

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-zinc-900/60 border border-zinc-800/60 text-[10px] font-mono text-zinc-400 mb-2">
              <Sparkles className="w-3 h-3" />
              <span className="tracking-wider font-semibold uppercase">Component Vault</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Component Showcase
            </h1>
            <p className="text-xs text-zinc-500 mt-1 max-w-2xl leading-relaxed">
              Curated React & Tailwind UI components with video demos and source code export.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 bg-zinc-950/60 px-3 py-1.5 rounded-lg border border-zinc-800/60 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{filteredComponents.length} of {components.length} assets</span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Search */}
          <div className="relative flex-1 flex items-center rounded-xl bg-zinc-950/60 border border-zinc-800/60 focus-within:border-zinc-600 focus-within:shadow-[0_0_15px_rgba(255,255,255,0.04)] transition-all">
            <Search className="w-3.5 h-3.5 text-zinc-500 ml-3.5 shrink-0" />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search components..."
              className="w-full py-2.5 px-2.5 bg-transparent text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 mr-2 rounded text-zinc-500 hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            ) : (
              <div className="mr-3 flex items-center gap-0.5 text-[9px] font-mono text-zinc-600 border border-zinc-800 rounded px-1.5 py-0.5">
                <Command className="w-2.5 h-2.5" />K
              </div>
            )}
          </div>

          {/* Framework & Sort */}
          <div className="flex items-center gap-2">
            <select
              value={selectedFramework}
              onChange={(e) => setSelectedFramework(e.target.value)}
              className="px-2.5 py-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-[11px] font-medium text-zinc-300 focus:outline-none focus:border-zinc-600 cursor-pointer appearance-none"
            >
              {FRAMEWORKS.map((f) => (
                <option key={f} value={f} className="bg-zinc-900 text-white">
                  {f === 'All' ? 'All Frameworks' : f}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-[11px] font-medium text-zinc-300 focus:outline-none focus:border-zinc-600 cursor-pointer appearance-none"
            >
              <option value="popular" className="bg-zinc-900 text-white">Most Popular</option>
              <option value="views" className="bg-zinc-900 text-white">Most Views</option>
              <option value="copies" className="bg-zinc-900 text-white">Most Copies</option>
              <option value="likes" className="bg-zinc-900 text-white">Highest Liked</option>
              <option value="newest" className="bg-zinc-900 text-white">Newest First</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count = categoryCounts[cat] || 0;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-white text-black shadow-[0_0_10px_rgba(255,255,255,0.12)]'
                    : 'bg-zinc-950/60 border border-zinc-800/50 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700/60'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[9px] px-1 py-0.1 rounded font-mono ${
                  isSelected ? 'bg-zinc-200/50 text-black' : 'text-zinc-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {filteredComponents.length === 0 ? (
        <div className="py-16 text-center rounded-xl bg-zinc-950/30 border border-dashed border-zinc-800/50 p-8">
          <Layers className="w-9 h-9 text-zinc-700 mx-auto mb-2.5" />
          <h3 className="text-sm font-bold text-zinc-300">No components found</h3>
          <p className="text-[11px] text-zinc-600 mt-1 max-w-sm mx-auto">
            Try adjusting your search or filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setSelectedFramework('All');
            }}
            className="mt-3 px-3 py-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60 text-[11px] font-medium text-zinc-300 hover:text-white cursor-pointer transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredComponents.map((comp) => (
            <ComponentCard
              key={comp.id}
              component={comp}
              currentUser={currentUser}
              onSelect={onSelectComponent}
              onRequireAuth={onRequireAuth}
              onOpenShare={onOpenShare}
              onToggleLike={onToggleLike}
              onToggleWishlist={onToggleWishlist}
              onDelete={onDeleteComponent}
              isLiked={currentUser?.likedComponentIds?.includes(comp.id)}
              isWishlisted={currentUser?.wishlistComponentIds?.includes(comp.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
