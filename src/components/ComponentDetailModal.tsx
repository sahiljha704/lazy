import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  X,
  Lock,
  Copy,
  Check,
  Heart,
  Bookmark,
  Share2,
  ExternalLink,
  ShieldAlert,
  FileCode,
  Clock,
  Eye,
  Video,
  Sparkles,
  ArrowLeft,
  Trash2,
} from 'lucide-react';
import { UIComponentItem, UserSession } from '../types';
import { unlockAndCopyComponent, toggleLikeComponent, toggleWishlistComponent, recordComponentView } from '../services/api';
import { MediaPreview } from './MediaPreview';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  component: UIComponentItem | null;
  currentUser: UserSession | null;
  onRequireAuth: (reason?: string) => void;
  onOpenShare: (comp: UIComponentItem) => void;
  onDelete?: (comp: UIComponentItem) => void;
  onComponentUpdated?: (updated: UIComponentItem) => void;
  onUserSessionUpdated?: (user: UserSession) => void;
}

export function ComponentDetailModal({
  isOpen,
  onClose,
  component,
  currentUser,
  onRequireAuth,
  onOpenShare,
  onDelete,
  onComponentUpdated,
  onUserSessionUpdated,
}: Props) {
  const [currentCode, setCurrentCode] = useState<string>('');
  const [isCopying, setIsCopying] = useState(false);
  const [justCopied, setJustCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [copyCount, setCopyCount] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);

  const isAuthor = Boolean(
    currentUser?.email &&
    component?.authorEmail &&
    currentUser.email.trim().toLowerCase() === component.authorEmail.trim().toLowerCase()
  );

  // Sync state and track real view when component changes
  useEffect(() => {
    if (component && isOpen) {
      setCurrentCode(component.code || '');
      setLikesCount(component.likesCount || 0);
      setWishlistCount(component.wishlistCount || 0);
      setCopyCount(component.copyCount || 0);
      setViewsCount(component.viewsCount || 0);

      // Record strictly real unique view on server
      recordComponentView(component.id)
        .then((newViews) => {
          if (typeof newViews === 'number' && newViews > 0) {
            setViewsCount(newViews);
            if (onComponentUpdated) {
              onComponentUpdated({
                ...component,
                viewsCount: newViews,
              });
            }
          }
        })
        .catch(() => {});

      if (currentUser) {
        setIsLiked(currentUser.likedComponentIds?.includes(component.id) || false);
        setIsWishlisted(currentUser.wishlistComponentIds?.includes(component.id) || false);
      }
      setErrorMessage(null);
      setJustCopied(false);
    }
  }, [component, isOpen, currentUser]);

  // Keyboard navigation: Escape key closes modal / goes back
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !component) return null;

  const triggerSilverConfetti = () => {
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#FFFFFF', '#E4E4E7', '#A1A1AA', '#71717A', '#3F3F46'],
      });
    } catch (e) {
      // ignore
    }
  };

  const handleCopyCode = async () => {
    setErrorMessage(null);

    // 1. Check if logged in with @gmail.com
    if (!currentUser || !currentUser.email.endsWith('@gmail.com')) {
      onRequireAuth('copy component source code');
      return;
    }

    // 2. Strict credit enforcement: if already copied 2 times today, blocked!
    if (currentUser.copiedTodayCount >= 2) {
      setErrorMessage('Daily Limit Exhausted: You have used your 2 daily copy credits. You cannot copy this code or any other code until credit resets at 00:00 UTC.');
      return;
    }

    setIsCopying(true);
    try {
      const result = await unlockAndCopyComponent(component.id, currentUser.email);
      setCurrentCode(result.code);
      setCopyCount(result.copyCount);
      setJustCopied(true);
      triggerSilverConfetti();

      // Write to clipboard
      await navigator.clipboard.writeText(result.code);
      setTimeout(() => setJustCopied(false), 3000);

      // Update user state locally
      const updatedUser: UserSession = {
        ...currentUser,
        copiedTodayCount: (currentUser.copiedTodayCount || 0) + 1,
        unlockedComponentIds: [...(currentUser.unlockedComponentIds || []), component.id],
      };
      if (onUserSessionUpdated) {
        onUserSessionUpdated(updatedUser);
      }

      if (onComponentUpdated) {
        onComponentUpdated({
          ...component,
          code: result.code,
          copyCount: result.copyCount,
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Daily copy limit reached (2/2 copies used today).');
    } finally {
      setIsCopying(false);
    }
  };

  const handleToggleLike = async () => {
    if (!currentUser) {
      onRequireAuth('like this component');
      return;
    }
    const nextState = !isLiked;
    setIsLiked(nextState);
    setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    try {
      await toggleLikeComponent(component.id, currentUser.email);
    } catch (e) {
      setIsLiked(!nextState);
      setLikesCount((prev) => (!nextState ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  const handleToggleWishlist = async () => {
    if (!currentUser) {
      onRequireAuth('bookmark this component');
      return;
    }
    const nextState = !isWishlisted;
    setIsWishlisted(nextState);
    setWishlistCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    try {
      await toggleWishlistComponent(component.id, currentUser.email);
    } catch (e) {
      setIsWishlisted(!nextState);
      setWishlistCount((prev) => (!nextState ? prev + 1 : Math.max(0, prev - 1)));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-xl overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-5xl rounded-2xl bg-[#0A0A0A] border border-[#262626] shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_40px_rgba(255,255,255,0.06)] overflow-hidden my-auto flex flex-col max-h-[92vh]"
      >
        {/* Specular Rim Light */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-400 to-transparent z-10" />

        {/* Modal Top Header with Working Back Button */}
        <div className="p-4 sm:p-5 border-b border-[#1E1E1E] flex items-center justify-between shrink-0 bg-[#0E0E0E]">
          {/* Back Button and Category Meta */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#161616] hover:bg-zinc-800 border border-[#2C2C2C] text-white hover:text-white text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95 group"
              title="Go Back to Components"
            >
              <ArrowLeft className="w-4 h-4 text-zinc-400 group-hover:text-white group-hover:-translate-x-0.5 transition-transform" />
              <span>Back</span>
            </button>

            <div className="h-4 w-px bg-[#262626]" />

            <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-[#141414] border border-[#262626] text-zinc-300">
              {component.category}
            </span>
            <span className="hidden sm:inline text-xs font-mono text-zinc-400 font-medium">
              // {component.framework}
            </span>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-2">
            {isAuthor && onDelete && component && (
              <button
                onClick={() => {
                  onClose();
                  onDelete(component);
                }}
                className="p-2 rounded-xl bg-red-950/40 border border-red-900/60 text-red-400 hover:text-red-300 hover:bg-red-900/50 hover:border-red-700 transition-all cursor-pointer shadow-sm"
                title="Delete My UI"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleToggleWishlist}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isWishlisted
                  ? 'bg-zinc-800 border-zinc-600 text-white shadow-[0_0_12px_rgba(255,255,255,0.1)]'
                  : 'bg-[#141414] border-[#252525] text-zinc-400 hover:text-white hover:border-zinc-600'
              }`}
              title="Bookmark to Wishlist"
            >
              <Bookmark className={`w-4 h-4 ${isWishlisted ? 'fill-white' : ''}`} />
            </button>

            <button
              onClick={handleToggleLike}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isLiked
                  ? 'bg-zinc-800 border-zinc-600 text-white shadow-[0_0_12px_rgba(255,255,255,0.1)]'
                  : 'bg-[#141414] border-[#252525] text-zinc-400 hover:text-white hover:border-zinc-600'
              }`}
              title="Like Component"
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-white' : ''}`} />
            </button>

            <button
              onClick={() => onOpenShare(component)}
              className="p-2 rounded-xl bg-[#141414] border border-[#252525] text-zinc-400 hover:text-white hover:border-zinc-600 transition-all cursor-pointer"
              title="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-6">
          {/* Title & Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-sans">
                {component.title}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                {component.description}
              </p>
            </div>

            {component.liveDemoUrl && (
              <a
                href={component.liveDemoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#161616] border border-[#2B2B2B] text-[#E5E5E5] hover:text-white hover:border-zinc-500 transition-all shrink-0 self-start sm:self-auto"
              >
                <ExternalLink className="w-3.5 h-3.5" /> External Demo
              </a>
            )}
          </div>

          {/* VIDEO RECORDING SHOWCASE CONTAINER */}
          <div className="rounded-2xl bg-[#0D0D0D] border border-[#242424] overflow-hidden shadow-2xl">
            {/* Top Video Showcase Bar */}
            <div className="px-4 py-2.5 bg-[#080808] border-b border-[#1E1E1E] flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-zinc-900 border border-zinc-700 text-white shadow-sm">
                  <Video className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Video Recording Showcase</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
                <span className="flex items-center gap-1 text-zinc-300" title="Total Views">
                  <Eye className="w-3.5 h-3.5 text-zinc-400" /> {(viewsCount || 0).toLocaleString()} Views
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-zinc-300">
                  <Heart className="w-3.5 h-3.5 text-zinc-300 fill-zinc-300" /> {likesCount} Likes
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Bookmark className="w-3.5 h-3.5 text-zinc-500" /> {wishlistCount} Saves
                </span>
              </div>
            </div>

            {/* Video Player Display Area */}
            <div className="min-h-[340px] sm:min-h-[420px] bg-[#050505] flex items-center justify-center p-2 sm:p-4">
              <div className="w-full max-w-3xl h-[340px] sm:h-[420px] rounded-xl overflow-hidden border border-zinc-800/80 shadow-2xl flex items-center justify-center bg-black">
                <MediaPreview
                  videoUrl={component.videoUrl}
                  screenRecordingUrl={component.screenRecordingUrl}
                  postUrl={component.postUrl}
                  posterUrl={component.posterUrl}
                  title={component.title}
                  category={component.category}
                  framework={component.framework}
                  tags={component.tags}
                  mode="detail"
                />
              </div>
            </div>
          </div>

          {/* SOURCE CODE COPY & CREDIT SECTION (NO RAW CODE DISPLAYED, DIRECT CLIPBOARD EXPORT) */}
          <div className="rounded-2xl bg-[#0D0D0D] border border-[#242424] overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3.5 bg-[#080808] border-b border-[#1E1E1E] flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-zinc-300" />
                <span className="text-xs sm:text-sm font-bold text-white tracking-wide font-sans">
                  Production Source Code Export
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161616] border border-[#2B2B2B] text-zinc-400">
                  {component.framework}
                </span>
              </div>

              {/* Status or Quota tag */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  {currentUser?.copiedTodayCount && currentUser.copiedTodayCount >= 2 ? (
                    <span className="text-red-400 font-semibold">0/2 Credits Left Today</span>
                  ) : (
                    <span className="text-emerald-400 font-semibold">
                      {Math.max(0, 2 - (currentUser?.copiedTodayCount || 0))}/2 Credits Ready
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-4 bg-red-950/40 border-b border-red-900/80 text-xs text-red-200 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-100">Daily Copy Limit Exhausted</p>
                  <p className="mt-0.5 text-red-300 leading-relaxed">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Code Copy Action Area */}
            <div className="p-6 bg-[#080808] space-y-4">
              <div className="p-4 rounded-xl bg-[#0E0E0E] border border-[#262626] text-xs text-zinc-300 font-mono">
                <div className="flex items-center justify-between mb-3">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Direct 1-Click Clipboard Ready Export</span>
                  </span>
                  <span className="text-[11px] text-zinc-500">{component.framework}</span>
                </div>
                {/* Code is HIDDEN - users cannot view/inspect it, only copy to clipboard */}
                <div className="relative rounded-lg bg-[#080808] border border-[#1A1A1A] p-6 flex flex-col items-center justify-center text-center overflow-hidden select-none" style={{ userSelect: 'none' }}>
                  <div className="absolute inset-0 bg-[radial-gradient(#1A1A1A_1px,transparent_1px)] [background-size:10px_10px] opacity-40" />
                  <Lock className="w-8 h-8 text-zinc-600 mb-3 relative z-10" />
                  <p className="text-xs font-semibold text-zinc-400 relative z-10">Source Code is Protected</p>
                  <p className="text-[10px] text-zinc-500 mt-1 max-w-xs relative z-10">
                    Code is encrypted and hidden. Use the copy button below to export directly to your clipboard. You get 2 free copy credits per day.
                  </p>
                </div>
              </div>

              {/* Action Button: Copy Source Code */}
              <div className="pt-2">
                {currentUser && currentUser.copiedTodayCount >= 2 ? (
                  <div className="p-3.5 rounded-xl bg-[#111111] border border-red-900/40 text-xs text-zinc-400 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-red-400">
                      <Lock className="w-4 h-4" />
                      <span className="font-semibold">Daily Copy Credits Exhausted (2/2 Used Today)</span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">Resets 00:00 UTC</span>
                  </div>
                ) : (
                  <button
                    onClick={handleCopyCode}
                    disabled={isCopying}
                    className="w-full py-3.5 px-6 rounded-xl font-bold text-xs sm:text-sm bg-white hover:bg-zinc-200 text-black transition-all shadow-[0_0_25px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
                  >
                    {isCopying ? (
                      <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    ) : justCopied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Source Code Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-black" />
                        <span>
                          Copy Production Code ({Math.max(0, 2 - (currentUser?.copiedTodayCount || 0))}/2 Daily Credits)
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Author Details & Tags */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-400 border-t border-[#1E1E1E]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-zinc-200 font-bold">
                {component.authorName ? component.authorName[0] : 'U'}
              </div>
              <span>
                Shared by <strong className="text-white">{component.authorName}</strong>
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {component.tags?.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md bg-[#161616] border border-[#2B2B2B] text-[10px] font-mono text-zinc-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
