import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Search,
  Sparkles,
  Layers,
  X,
  ArrowLeft,
} from 'lucide-react';
import { ComponentCategory, Framework, UIComponentItem, UserSession } from '../types';
import { ComponentCard } from './ComponentCard';

interface Props {
  components: UIComponentItem[];
  currentUser: UserSession | null;
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
  onSelectComponent,
  onRequireAuth,
  onOpenShare,
  onToggleLike,
  onToggleWishlist,
  onDeleteComponent,
  onNavigateBack,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ComponentCategory>('All');
  const [selectedFramework, setSelectedFramework] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'popular' | 'views' | 'copies' | 'likes' | 'newest'>('popular');

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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header with Back Navigation */}
      <div className="pb-6 border-b border-[#1E1E1E] space-y-4">
        {onNavigateBack && (
          <div>
            <button
              onClick={onNavigateBack}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#111111] hover:bg-[#1C1C1C] border border-[#2B2B2B] text-zinc-300 hover:text-white text-xs font-semibold font-mono transition-all cursor-pointer shadow-sm group active:scale-95"
              title="Go back to Home"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white group-hover:-translate-x-0.5 transition-transform" />
              <span>Back</span>
            </button>
          </div>
        )}

        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#121212] border border-[#2B2B2B] text-xs font-mono text-zinc-300 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
            <span className="tracking-wider text-[11px] font-semibold">LIVE COMPONENT VAULT</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-sans">
            Component Showcase
          </h1>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Curated collection of high-craft React & Tailwind UI components with screen recording demos, video/post showcase links, and source code export.
          </p>
        </div>
      </div>

      {/* Robust Search & Filter Toolbar */}
      <div className="space-y-4">
        {/* Top Search Bar with Framework Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 flex items-center rounded-2xl bg-[#0C0C0C] border border-[#242424] focus-within:border-zinc-500 focus-within:shadow-[0_0_20px_rgba(255,255,255,0.08)] transition-all">
            <Search className="w-4 h-4 text-zinc-500 ml-4 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search components by keyword, animation, or author..."
              className="w-full py-3 px-3 bg-transparent text-xs sm:text-sm text-[#E5E5E5] placeholder-zinc-600 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 mr-2 rounded-lg text-zinc-500 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <div className="mr-4 text-[10px] font-mono text-zinc-300 bg-[#161616] px-2 py-0.5 rounded border border-[#2B2B2B] hidden sm:block">
              {filteredComponents.length} ASSETS READY
            </div>
          </div>

          {/* Framework Selector */}
          <div className="flex items-center gap-2">
            <select
              value={selectedFramework}
              onChange={(e) => setSelectedFramework(e.target.value)}
              className="px-3.5 py-3 rounded-2xl bg-[#0C0C0C] border border-[#242424] text-xs font-semibold text-[#E5E5E5] focus:outline-none focus:border-zinc-500 cursor-pointer"
            >
              {FRAMEWORKS.map((f) => (
                <option key={f} value={f} className="bg-[#121212] text-white">
                  {f === 'All' ? 'All Frameworks' : f}
                </option>
              ))}
            </select>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3.5 py-3 rounded-2xl bg-[#0C0C0C] border border-[#242424] text-xs font-semibold text-[#E5E5E5] focus:outline-none focus:border-zinc-500 cursor-pointer"
            >
              <option value="popular" className="bg-[#121212] text-white">Most Popular</option>
              <option value="views" className="bg-[#121212] text-white">Most Views</option>
              <option value="copies" className="bg-[#121212] text-white">Most Copies</option>
              <option value="likes" className="bg-[#121212] text-white">Highest Liked</option>
              <option value="newest" className="bg-[#121212] text-white">Newest First</option>
            </select>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.15)] font-bold'
                    : 'bg-[#0E0E0E] border border-[#222222] text-zinc-400 hover:text-[#E5E5E5] hover:border-[#353535]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Component Cards */}
      {filteredComponents.length === 0 ? (
        <div className="py-20 text-center rounded-2xl bg-[#0C0C0C]/50 border border-dashed border-[#262626] p-8">
          <Layers className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-200">No components match your query</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search terms or category filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setSelectedFramework('All');
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-[#141414] border border-[#2E2E2E] text-xs font-semibold text-[#E5E5E5] hover:text-white cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
