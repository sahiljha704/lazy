import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Heart,
  Bookmark,
  Share2,
  Eye,
  FileCode,
  Video,
  Trash2,
} from 'lucide-react';
import { UIComponentItem, UserSession } from '../types';
import { MediaPreview } from './MediaPreview';

interface Props {
  key?: React.Key;
  component: UIComponentItem;
  currentUser: UserSession | null;
  onSelect: (comp: UIComponentItem) => void;
  onRequireAuth: (reason?: string) => void;
  onOpenShare: (comp: UIComponentItem) => void;
  onToggleLike: (comp: UIComponentItem) => void;
  onToggleWishlist: (comp: UIComponentItem) => void;
  onDelete?: (comp: UIComponentItem) => void;
  isLiked?: boolean;
  isWishlisted?: boolean;
}

export function ComponentCard({
  component,
  currentUser,
  onSelect,
  onRequireAuth,
  onOpenShare,
  onToggleLike,
  onToggleWishlist,
  onDelete,
  isLiked = false,
  isWishlisted = false,
}: Props) {
  const [isHovered, setIsHovered] = useState(false);
  const isAuthor = Boolean(
    currentUser?.email &&
    component.authorEmail &&
    currentUser.email.trim().toLowerCase() === component.authorEmail.trim().toLowerCase()
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative rounded-2xl bg-[#0C0C0C] border border-[#222222] hover:border-zinc-500 transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.8)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.95),0_0_20px_rgba(255,255,255,0.06)] flex flex-col overflow-hidden"
    >
      {/* Specular Edge highlight on hover */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />

      {/* Media / Video / Showcase Header */}
      <div
        onClick={() => onSelect(component)}
        className="relative h-52 sm:h-56 w-full bg-[#050505] overflow-hidden cursor-pointer flex items-center justify-center border-b border-[#1E1E1E]"
      >
        <MediaPreview
          videoUrl={component.videoUrl}
          screenRecordingUrl={component.screenRecordingUrl}
          postUrl={component.postUrl}
          posterUrl={component.posterUrl}
          title={component.title}
          category={component.category}
          framework={component.framework}
          tags={component.tags}
          mode="card"
          isHovered={isHovered}
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-black/80 backdrop-blur-md border border-[#333333] text-zinc-300 shadow-md">
            {component.category}
          </span>

          {(component.videoUrl || component.screenRecordingUrl) ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-[#141414]/90 backdrop-blur-md border border-[#333333] text-zinc-300 flex items-center gap-1.5 shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Recording / Video
            </span>
          ) : component.postUrl ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-[#141414]/90 backdrop-blur-md border border-[#333333] text-zinc-300 flex items-center gap-1.5 shadow-md">
              <Share2 className="w-3 h-3 text-zinc-300" />
              Post Link
            </span>
          ) : null}
        </div>

        {/* Center Hover Action Hint */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none z-20">
          <span className="px-4 py-2 rounded-xl bg-white text-black font-bold text-xs shadow-2xl flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-black" /> Inspect & Copy Source
          </span>
        </div>

        {/* Code indicator strip at bottom of preview */}
        <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1 rounded-lg bg-[#0A0A0A]/90 backdrop-blur-md border border-[#222222] flex items-center justify-between text-[10px] font-mono z-10">
          <span className="text-zinc-400 flex items-center gap-1">
            <FileCode className="w-3 h-3 text-zinc-300" />
            {component.framework}
          </span>
          <div className="flex items-center gap-2.5">
            <span className="text-zinc-400 flex items-center gap-1" title="Real Views">
              <Eye className="w-3 h-3 text-zinc-400" />
              {(component.viewsCount || 0).toLocaleString()}
            </span>
            <span className="text-zinc-400 flex items-center gap-1">
              <Heart className={`w-3 h-3 ${isLiked ? 'text-white fill-white' : 'text-zinc-400'}`} />
              {component.likesCount}
            </span>
          </div>
        </div>
      </div>

      {/* Card Details */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3
              onClick={() => onSelect(component)}
              className="text-sm sm:text-base font-bold text-white hover:text-zinc-300 transition-colors cursor-pointer line-clamp-1 font-sans"
            >
              {component.title}
            </h3>
          </div>

          <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
            {component.description}
          </p>
        </div>

        {/* Framework & Tags */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="px-2 py-0.5 rounded bg-[#141414] border border-[#262626] text-[10px] font-mono text-zinc-300">
            {component.framework}
          </span>
          {component.tags?.slice(0, 2).map((t) => (
            <span
              key={t}
              className="px-2 py-0.5 rounded bg-[#101010] border border-[#202020] text-[10px] font-mono text-zinc-500"
            >
              #{t}
            </span>
          ))}
        </div>

        {/* Bottom Actions Toolbar */}
        <div className="mt-4 pt-3 border-t border-[#1E1E1E] flex items-center justify-between gap-2">
          {/* Likes & Bookmarks */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleLike(component);
              }}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isLiked
                  ? 'bg-zinc-800 border-zinc-600 text-white shadow-[0_0_10px_rgba(255,255,255,0.1)]'
                  : 'bg-[#121212] border-[#242424] text-zinc-400 hover:text-white hover:border-zinc-600'
              }`}
              title="Like"
            >
              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-white text-white' : ''}`} />
            </button>
            <span className="text-[11px] font-mono text-zinc-400">{component.likesCount}</span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleWishlist(component);
              }}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isWishlisted
                  ? 'bg-zinc-800 border-zinc-600 text-white'
                  : 'bg-[#121212] border-[#242424] text-zinc-400 hover:text-white hover:border-zinc-600'
              }`}
              title="Bookmark"
            >
              <Bookmark className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-white text-white' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onDelete && isAuthor && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(component);
                }}
                className="p-1.5 rounded-lg bg-red-950/40 border border-red-900/60 text-red-400 hover:text-red-300 hover:bg-red-900/50 hover:border-red-700 transition-colors cursor-pointer"
                title="Delete My UI"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenShare(component);
              }}
              className="p-1.5 rounded-lg bg-[#121212] border border-[#242424] text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors cursor-pointer"
              title="Share"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onSelect(component)}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs border border-zinc-700 transition-all flex items-center gap-1 cursor-pointer"
            >
              <Eye className="w-3 h-3 text-zinc-300" />
              Preview
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
