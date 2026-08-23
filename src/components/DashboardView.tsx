import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bookmark,
  Upload,
  Clock,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import { UIComponentItem, UserSession } from '../types';
import { ComponentCard } from './ComponentCard';

interface Props {
  currentUser: UserSession | null;
  allComponents: UIComponentItem[];
  onSelectComponent: (comp: UIComponentItem) => void;
  onOpenUpload: () => void;
  onRequireAuth: (reason?: string) => void;
  onOpenShare: (comp: UIComponentItem) => void;
  onToggleLike: (comp: UIComponentItem) => void;
  onToggleWishlist: (comp: UIComponentItem) => void;
  onDeleteComponent?: (comp: UIComponentItem) => void;
  onNavigateShowcase: () => void;
  onNavigateBack?: () => void;
  onUserSessionUpdated?: (updated: UserSession) => void;
  onShowToast?: (msg: string) => void;
}

export function DashboardView({
  currentUser,
  allComponents,
  onSelectComponent,
  onOpenUpload,
  onRequireAuth,
  onOpenShare,
  onToggleLike,
  onToggleWishlist,
  onDeleteComponent,
  onNavigateShowcase,
  onNavigateBack,
  onUserSessionUpdated,
  onShowToast,
}: Props) {
  const [activeTab, setActiveTab] = useState<'uploads' | 'wishlist'>('uploads');
  const [timeToReset, setTimeToReset] = useState('');

  // Live countdown to midnight UTC
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const nextMidnight = new Date();
      nextMidnight.setUTCHours(24, 0, 0, 0);

      const diff = nextMidnight.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeToReset('00h 00m 00s');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeToReset(
        `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto shadow-2xl">
          <Sparkles className="w-8 h-8 text-zinc-300" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tight text-white font-sans">
            Authentication Required
          </h2>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">
            Please authenticate with your email account to access your personal dashboard, manage your daily 2-copy credit, and view your saved components.
          </p>
        </div>
        <button
          onClick={onRequireAuth}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-all shadow-[0_0_25px_rgba(255,255,255,0.15)] cursor-pointer"
        >
          Sign In with Google
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const userEmail = currentUser.email.toLowerCase();
  const myUploads = allComponents.filter(
    (c) => c.authorEmail && c.authorEmail.toLowerCase() === userEmail
  );
  const myWishlist = allComponents.filter((c) =>
    currentUser.wishlistComponentIds?.includes(c.id)
  );

  const usedCopies = currentUser.copiedTodayCount || 0;
  const remainingCredits = Math.max(0, 2 - usedCopies);
  const canCopy = usedCopies < 2;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Top Back Navigation */}
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

      {/* Profile Overview Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#141414] to-[#0A0A0A] border border-[#222222] p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-zinc-800/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* User Info */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-18 h-18 rounded-2xl bg-zinc-950 border-2 border-zinc-700 object-cover shadow-xl"
              />
              <div
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-black flex items-center justify-center"
                title="Verified Account"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-black" />
              </div>
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-black tracking-tight text-white font-sans truncate">
                  {currentUser.name}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-[10px] font-mono text-emerald-300 font-semibold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Verified User
                </span>
              </div>
              <p className="text-xs font-mono text-zinc-400 truncate">{currentUser.email}</p>
              <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-500 pt-1">
                <span>Joined {new Date(currentUser.joinedAt).toLocaleDateString()}</span>
                <span>•</span>
                <span>2 Free Production Exports / Day</span>
              </div>
            </div>
          </div>

          {/* Daily Quota Card */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="p-4 rounded-2xl bg-[#0D0D0D] border border-[#242424] space-y-2 min-w-[240px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" /> Daily Quota
                </span>
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                    canCopy
                      ? 'bg-zinc-900 border-zinc-700 text-zinc-200 shadow-[0_0_10px_rgba(255,255,255,0.05)]'
                      : 'bg-zinc-950 border-zinc-800 text-red-400'
                  }`}
                >
                  {remainingCredits} / 2 Ready
                </span>
              </div>

              <div className="w-full bg-[#1A1A1A] h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    remainingCredits === 2
                      ? 'w-full bg-zinc-200'
                      : remainingCredits === 1
                      ? 'w-1/2 bg-amber-400'
                      : 'w-0 bg-zinc-700'
                  }`}
                />
              </div>

              <p className="text-[10px] font-mono text-zinc-500 flex items-center justify-between">
                <span>Resets in:</span>
                <span className="text-zinc-400 font-semibold">{timeToReset} (UTC)</span>
              </p>
            </div>

            <button
              onClick={onOpenUpload}
              className="px-5 py-3 rounded-2xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Upload UI
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#222222] pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('uploads')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'uploads'
              ? 'bg-zinc-800 text-white border border-zinc-600 shadow-[0_0_15px_rgba(255,255,255,0.08)]'
              : 'text-zinc-400 hover:text-white hover:bg-[#141414]'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          My Uploaded Assets ({myUploads.length})
        </button>

        <button
          onClick={() => setActiveTab('wishlist')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'wishlist'
              ? 'bg-zinc-800 text-white border border-zinc-600 shadow-[0_0_15px_rgba(255,255,255,0.08)]'
              : 'text-zinc-400 hover:text-white hover:bg-[#141414]'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          Saved Wishlist ({myWishlist.length})
        </button>
      </div>

      {/* Tab 1: Uploaded Assets */}
      {activeTab === 'uploads' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white font-sans">
              Authored & Published Components
            </h2>
            <button
              onClick={onOpenUpload}
              className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> New Upload
            </button>
          </div>

          {myUploads.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#262626] p-12 text-center space-y-4 bg-[#0A0A0A]">
              <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
                <Upload className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">No components uploaded yet</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Share your high-craft dark & silver UI animations, buttons, cards, and micro-interactions with the community.
                </p>
              </div>
              <button
                onClick={onOpenUpload}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold cursor-pointer"
              >
                Upload Component
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {myUploads.map((comp) => (
                <ComponentCard
                  key={comp.id}
                  component={comp}
                  onSelect={onSelectComponent}
                  onRequireAuth={onRequireAuth}
                  onOpenShare={onOpenShare}
                  onToggleLike={onToggleLike}
                  onToggleWishlist={onToggleWishlist}
                  onDelete={onDeleteComponent}
                  currentUser={currentUser}
                  isLiked={currentUser?.likedComponentIds?.includes(comp.id)}
                  isWishlisted={currentUser?.wishlistComponentIds?.includes(comp.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Saved Wishlist */}
      {activeTab === 'wishlist' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white font-sans">
              Bookmarked Library
            </h2>
            <button
              onClick={onNavigateShowcase}
              className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
            >
              Browse Showcase Vault <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {myWishlist.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#262626] p-12 text-center space-y-4 bg-[#0A0A0A]">
              <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
                <Bookmark className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Your wishlist is empty</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Bookmark components in the showcase vault to build your custom collection of design inspirations.
                </p>
              </div>
              <button
                onClick={onNavigateShowcase}
                className="px-4 py-2 rounded-xl bg-white text-black text-xs font-semibold hover:bg-zinc-200 cursor-pointer"
              >
                Explore Showcase
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {myWishlist.map((comp) => (
                <ComponentCard
                  key={comp.id}
                  component={comp}
                  onSelect={onSelectComponent}
                  onRequireAuth={onRequireAuth}
                  onOpenShare={onOpenShare}
                  onToggleLike={onToggleLike}
                  onToggleWishlist={onToggleWishlist}
                  onDelete={onDeleteComponent}
                  currentUser={currentUser}
                  isLiked={currentUser?.likedComponentIds?.includes(comp.id)}
                  isWishlisted={currentUser?.wishlistComponentIds?.includes(comp.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
