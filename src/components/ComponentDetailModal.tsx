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

  useEffect(() => {
    if (component && isOpen) {
      setCurrentCode(component.code || '');
      setLikesCount(component.likesCount || 0);
      setWishlistCount(component.wishlistCount || 0);
      setCopyCount(component.copyCount || 0);
      setViewsCount(component.viewsCount || 0);

      recordComponentView(component.id)
        .then((newViews) => {
          if (typeof newViews === 'number' && newViews > 0) {
            setViewsCount(newViews);
            if (onComponentUpdated) {
              onComponentUpdated({ ...component, viewsCount: newViews });
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

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !component) return null;

  const triggerSilverConfetti = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#FFFFFF', '#E4E4E7', '#A1A1AA', '#71717A'],
      });
    } catch (e) {}
  };

  const handleCopyCode = async () => {
    setErrorMessage(null);
    if (!currentUser || !currentUser.email) {
      onRequireAuth('copy production code to clipboard');
      return;
    }
    if (currentUser.copiedTodayCount >= 2) {
      setErrorMessage('Daily limit reached. Resets at 00:00 UTC.');
      return;
    }

    setIsCopying(true);
    try {
      const result = await unlockAndCopyComponent(component.id, currentUser.email);
      setCurrentCode(result.code);
      setCopyCount(result.copyCount);
      setJustCopied(true);
      triggerSilverConfetti();
      await navigator.clipboard.writeText(result.code);
      setTimeout(() => setJustCopied(false), 3000);

      const updatedUser: UserSession = {
        ...currentUser,
        copiedTodayCount: (currentUser.copiedTodayCount || 0) + 1,
        unlockedComponentIds: [...(currentUser.unlockedComponentIds || []), component.id],
      };
      if (onUserSessionUpdated) onUserSessionUpdated(updatedUser);
      if (onComponentUpdated) onComponentUpdated({ ...component, code: result.code, copyCount: result.copyCount });
    } catch (err: any) {
      setErrorMessage(err.message || 'Daily copy limit reached.');
    } finally {
      setIsCopying(false);
    }
  };

  const handleToggleLike = async () => {
    if (!currentUser) { onRequireAuth('like this component'); return; }
    const next = !isLiked;
    setIsLiked(next);
    setLikesCount((p) => (next ? p + 1 : Math.max(0, p - 1)));
    try { await toggleLikeComponent(component.id, currentUser.email); }
    catch { setIsLiked(!next); setLikesCount((p) => (!next ? p + 1 : Math.max(0, p - 1))); }
  };

  const handleToggleWishlist = async () => {
    if (!currentUser) { onRequireAuth('bookmark this component'); return; }
    const next = !isWishlisted;
    setIsWishlisted(next);
    setWishlistCount((p) => (next ? p + 1 : Math.max(0, p - 1)));
    try { await toggleWishlistComponent(component.id, currentUser.email); }
    catch { setIsWishlisted(!next); setWishlistCount((p) => (!next ? p + 1 : Math.max(0, p - 1))); }
  };

  const creditsLeft = Math.max(0, 2 - (currentUser?.copiedTodayCount || 0));
  const creditsExhausted = currentUser ? currentUser.copiedTodayCount >= 2 : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-xl overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-5xl rounded-xl bg-[#0A0A0A] border border-[#222] shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden my-auto flex flex-col max-h-[92vh]"
      >
        {/* Top specular line */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent z-10" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#1A1A1A] flex items-center justify-between shrink-0 bg-[#0C0C0C]">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-transparent hover:bg-white/[0.05] border border-[#262626] hover:border-zinc-600 text-zinc-300 hover:text-white text-xs font-medium transition-all cursor-pointer active:scale-95 group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back</span>
            </button>

            <div className="h-4 w-px bg-[#222]" />

            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#141414] border border-[#262626] text-zinc-400">
              {component.category}
            </span>
            <span className="hidden sm:inline text-[10px] font-mono text-zinc-600">
              // {component.framework}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {isAuthor && onDelete && (
              <button
                onClick={() => { onClose(); onDelete(component); }}
                className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={handleToggleWishlist}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                isWishlisted ? 'bg-white/10 border-white/15 text-white' : 'bg-transparent border-transparent text-zinc-500 hover:text-white hover:bg-white/[0.05]'
              }`}
              title="Bookmark"
            >
              <Bookmark className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-white' : ''}`} />
            </button>
            <button
              onClick={handleToggleLike}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                isLiked ? 'bg-white/10 border-white/15 text-white' : 'bg-transparent border-transparent text-zinc-500 hover:text-white hover:bg-white/[0.05]'
              }`}
              title="Like"
            >
              <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-white' : ''}`} />
            </button>
            <button
              onClick={() => onOpenShare(component)}
              className="p-1.5 rounded-lg bg-transparent border border-transparent text-zinc-500 hover:text-white hover:bg-white/[0.05] transition-all cursor-pointer"
              title="Share"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-5">
          {/* Title & Meta */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                {component.title}
              </h2>
              <p className="text-xs text-zinc-500 mt-1 max-w-2xl leading-relaxed">
                {component.description}
              </p>
              {/* Stats row */}
              <div className="flex items-center gap-3 mt-2.5 text-[10px] font-mono text-zinc-500">
                <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {(viewsCount || 0).toLocaleString()} views</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {likesCount} likes</span>
                <span>·</span>
                <span className="flex items-center gap-1"><Bookmark className="w-3 h-3" /> {wishlistCount} saves</span>
              </div>
            </div>

            {component.liveDemoUrl && (
              <a
                href={component.liveDemoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-[#141414] border border-[#262626] text-zinc-300 hover:text-white hover:border-zinc-500 transition-all shrink-0"
              >
                <ExternalLink className="w-3 h-3" /> Live Demo
              </a>
            )}
          </div>

          {/* Video Preview */}
          <div className="rounded-xl bg-[#080808] border border-[#1E1E1E] overflow-hidden">
            <div className="px-3.5 py-2 bg-[#0A0A0A] border-b border-[#1A1A1A] flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
                <Video className="w-3 h-3 text-emerald-400" />
                <span>Preview</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-600">
                <span>{(viewsCount || 0).toLocaleString()} views</span>
                <span>·</span>
                <span>{likesCount} likes</span>
              </div>
            </div>
            <div className="min-h-[300px] sm:min-h-[380px] bg-[#050505] flex items-center justify-center p-2 sm:p-3">
              <div className="w-full max-w-3xl h-[300px] sm:h-[380px] rounded-lg overflow-hidden border border-zinc-800/50 flex items-center justify-center bg-black">
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

          {/* Code Export Section */}
          <div className="rounded-xl bg-[#080808] border border-[#1E1E1E] overflow-hidden">
            <div className="px-4 py-3 bg-[#0A0A0A] border-b border-[#1A1A1A] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-xs font-bold text-white">Source Code Export</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#161616] border border-[#262626] text-zinc-500">
                  {component.framework}
                </span>
              </div>
              <span className="text-[10px] font-mono flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                {creditsExhausted ? (
                  <span className="text-red-400">0 credits left</span>
                ) : (
                  <span className="text-emerald-400">{creditsLeft}/2 credits</span>
                )}
              </span>
            </div>

            {errorMessage && (
              <div className="px-4 py-2.5 bg-red-500/5 border-b border-red-500/20 text-[11px] text-red-300 flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="p-5 space-y-3">
              {/* Locked code visual */}
              <div className="relative rounded-lg bg-[#0A0A0A] border border-[#1A1A1A] p-6 flex flex-col items-center justify-center text-center overflow-hidden select-none" style={{ userSelect: 'none' }}>
                <div className="absolute inset-0 bg-[radial-gradient(#1A1A1A_1px,transparent_1px)] [background-size:8px_8px] opacity-30" />
                <Lock className="w-7 h-7 text-zinc-700 mb-2.5 relative z-10" />
                <p className="text-[11px] font-semibold text-zinc-500 relative z-10">Source code is protected</p>
                <p className="text-[10px] text-zinc-600 mt-0.5 max-w-xs relative z-10">
                  Copy to clipboard using the button below. {creditsLeft} credit{creditsLeft !== 1 ? 's' : ''} remaining.
                </p>
              </div>

              {/* Copy Button */}
              {creditsExhausted ? (
                <div className="py-3 px-4 rounded-lg bg-[#0E0E0E] border border-red-500/20 text-[11px] text-zinc-400 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-red-400">
                    <Lock className="w-3.5 h-3.5" />
                    <span className="font-medium">Daily limit reached (2/2)</span>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-600">Resets 00:00 UTC</span>
                </div>
              ) : (
                <button
                  onClick={handleCopyCode}
                  disabled={isCopying}
                  className="w-full py-3 px-5 rounded-lg font-bold text-xs bg-white hover:bg-zinc-200 text-black transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
                >
                  {isCopying ? (
                    <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : justCopied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Code ({creditsLeft}/2 credits today)</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Author & Tags */}
          <div className="pt-1 flex flex-wrap items-center justify-between gap-3 text-[10px] text-zinc-500 border-t border-[#1A1A1A]">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-[9px] text-zinc-300 font-bold">
                {component.authorName ? component.authorName[0] : 'U'}
              </div>
              <span>
                by <strong className="text-zinc-300">{component.authorName}</strong>
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {component.tags?.map((tag) => (
                <span key={tag} className="px-1.5 py-0.5 rounded bg-[#141414] border border-[#222] text-[9px] font-mono text-zinc-500">
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
