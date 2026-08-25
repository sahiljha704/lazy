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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative rounded-xl bg-[#0A0A0A] border border-[#1E1E1E] hover:border-[#333] transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.6)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.04)] flex flex-col overflow-hidden"
    >
      {/* Top specular line on hover */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />

      {/* Media Preview */}
      <div
        onClick={() => onSelect(component)}
        className="relative h-48 sm:h-52 w-full bg-[#050505] overflow-hidden cursor-pointer flex items-center justify-center border-b border-[#1A1A1A]"
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
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
          <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-medium bg-black/70 backdrop-blur-md border border-white/10 text-zinc-300">
            {component.category}
          </span>

          {(component.videoUrl || component.screenRecordingUrl) ? (
            <span className="px-2 py-0.5 rounded-md text-[9px] font-mono bg-black/70 backdrop-blur-md border border-white/10 text-zinc-300 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          ) : component.postUrl ? (
            <span className="px-2 py-0.5 rounded-md text-[9px] font-mono bg-black/70 backdrop-blur-md border border-white/10 text-zinc-300 flex items-center gap-1">
              <Share2 className="w-2.5 h-2.5" />
              Link
            </span>
          ) : null}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center pointer-events-none z-20">
          <div className="px-4 py-2 rounded-lg bg-white text-black font-bold text-[11px] shadow-2xl flex items-center gap-1.5 scale-90 group-hover:scale-100 transition-transform duration-300">
            <Eye className="w-3.5 h-3.5" /> Inspect & Copy Source
          </div>
        </div>

        {/* Bottom info strip */}
        <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/5 flex items-center justify-between text-[9px] font-mono z-10">
          <span className="text-zinc-400 flex items-center gap-1">
            <FileCode className="w-2.5 h-2.5" />
            {component.framework}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 flex items-center gap-1">
              <Eye className="w-2.5 h-2.5" />
              {(component.viewsCount || 0).toLocaleString()}
            </span>
            <span className="text-zinc-500 flex items-center gap-1">
              <Heart className={`w-2.5 h-2.5 ${isLiked ? 'text-white fill-white' : ''}`} />
              {component.likesCount}
            </span>
          </div>
        </div>
      </div>

      {/* Card Details */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3
              onClick={() => onSelect(component)}
              className="text-[13px] sm:text-sm font-bold text-white hover:text-zinc-300 transition-colors cursor-pointer line-clamp-1"
            >
              {component.title}
            </h3>
          </div>

          <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
            {component.description}
          </p>
        </div>

        {/* Tags */}
        <div className="mt-2.5 flex flex-wrap gap-1">
          <span className="px-1.5 py-0.5 rounded bg-[#141414] border border-[#222] text-[9px] font-mono text-zinc-400">
            {component.framework}
          </span>
          {component.tags?.slice(0, 2).map((t) => (
            <span
              key={t}
              className="px-1.5 py-0.5 rounded bg-[#0F0F0F] border border-[#1A1A1A] text-[9px] font-mono text-zinc-600"
            >
              #{t}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-3 pt-2.5 border-t border-[#1A1A1A] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleLike(component);
              }}
              className={`p-1.5 rounded-md border transition-all duration-200 cursor-pointer ${
                isLiked
                  ? 'bg-white/10 border-white/15 text-white'
                  : 'bg-transparent border-transparent text-zinc-500 hover:text-white hover:bg-white/[0.05]'
              }`}
              title="Like"
            >
              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-white text-white' : ''}`} />
            </button>
            <span className="text-[10px] font-mono text-zinc-500 tabular-nums">{component.likesCount}</span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleWishlist(component);
              }}
              className={`p-1.5 rounded-md border transition-all duration-200 cursor-pointer ${
                isWishlisted
                  ? 'bg-white/10 border-white/15 text-white'
                  : 'bg-transparent border-transparent text-zinc-500 hover:text-white hover:bg-white/[0.05]'
              }`}
              title="Bookmark"
            >
              <Bookmark className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-white text-white' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-1">
            {onDelete && isAuthor && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(component);
                }}
                className="p-1.5 rounded-md bg-transparent border border-transparent text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenShare(component);
              }}
              className="p-1.5 rounded-md bg-transparent border border-transparent text-zinc-500 hover:text-white hover:bg-white/[0.05] transition-all cursor-pointer"
              title="Share"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onSelect(component)}
              className="px-2.5 py-1.5 rounded-md bg-white text-black font-semibold text-[10px] hover:bg-zinc-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Eye className="w-3 h-3" />
              Preview
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
