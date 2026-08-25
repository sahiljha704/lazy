import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Trophy,
  Medal,
  Crown,
  Sparkles,
  Flame,
  Layers,
  Heart,
  Copy,
  Eye,
  ArrowRight,
  ArrowLeft,
  Search,
  Plus,
  ShieldCheck,
  TrendingUp,
  User,
} from 'lucide-react';
import { CreatorLeaderboardItem, UserSession } from '../types';
import { fetchCreatorLeaderboard } from '../services/api';

interface Props {
  currentUser: UserSession | null;
  onNavigateShowcase: (searchKeyword?: string) => void;
  onOpenUpload: () => void;
  onNavigateBack?: () => void;
}

export function LeaderboardView({
  currentUser,
  onNavigateShowcase,
  onOpenUpload,
  onNavigateBack,
}: Props) {
  const [creators, setCreators] = useState<CreatorLeaderboardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'components' | 'likes' | 'copies' | 'views'>('score');

  useEffect(() => {
    setIsLoading(true);
    fetchCreatorLeaderboard()
      .then((data) => {
        setCreators(data || []);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const filteredCreators = useMemo(() => {
    let list = [...creators];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.bio && c.bio.toLowerCase().includes(q))
      );
    }

    if (sortBy === 'components') {
      list.sort((a, b) => b.componentsCount - a.componentsCount);
    } else if (sortBy === 'likes') {
      list.sort((a, b) => b.totalLikes - a.totalLikes);
    } else if (sortBy === 'copies') {
      list.sort((a, b) => b.totalCopies - a.totalCopies);
    } else if (sortBy === 'views') {
      list.sort((a, b) => b.totalViews - a.totalViews);
    } else {
      // Default: weighted score
      list.sort((a, b) => {
        const scoreA = (a.componentsCount * 60) + (a.totalLikes * 15) + (a.totalCopies * 30) + (a.totalViews * 0.2);
        const scoreB = (b.componentsCount * 60) + (b.totalLikes * 15) + (b.totalCopies * 30) + (b.totalViews * 0.2);
        return scoreB - scoreA;
      });
    }

    return list;
  }, [creators, searchQuery, sortBy]);

  const topThree = creators.slice(0, 3);
  const goldCreator = topThree[0];
  const silverCreator = topThree[1];
  const bronzeCreator = topThree[2];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12 pb-24">
      {/* Top Header */}
      <div className="pb-6 border-b border-zinc-800 space-y-4">
        {onNavigateBack && (
          <div>
            <button
              onClick={onNavigateBack}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold font-mono transition-all cursor-pointer shadow-sm group active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white group-hover:-translate-x-0.5 transition-transform" />
              <span>Back</span>
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 mb-3 shadow-md">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="tracking-wider text-[11px] font-semibold uppercase">
                COMMUNITY LEADERBOARD & TOP ARCHITECTS
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight font-sans">
              Creator Rankings
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Recognizing the world-class designers and engineers crafting high-performance React & Tailwind components for the Lazy UI ecosystem.
            </p>
          </div>

          <button
            onClick={onOpenUpload}
            className="px-5 py-3 rounded-2xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(255,255,255,0.15)] active:scale-95 shrink-0 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Publish & Compete</span>
          </button>
        </div>
      </div>

      {/* TOP 3 PODIUM */}
      {topThree.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono text-zinc-400 uppercase tracking-widest font-semibold flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              Top 3 Masters of the Vault
            </h2>
            <span className="text-[11px] font-mono text-zinc-500">Live Global Ranking</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            {/* #2 SILVER (Left on desktop) */}
            {silverCreator && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="relative p-6 rounded-3xl bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-zinc-700/80 shadow-2xl flex flex-col items-center text-center group hover:border-zinc-500 transition-all"
              >
                <div className="absolute -top-3.5 px-3 py-0.5 rounded-full bg-zinc-800 border border-zinc-600 text-xs font-mono font-bold text-zinc-200 flex items-center gap-1.5 shadow-md">
                  <Medal className="w-3.5 h-3.5 text-zinc-300" />
                  <span>#2 SILVER</span>
                </div>

                <div className="relative mt-2 mb-4">
                  <img
                    src={silverCreator.avatar}
                    alt={silverCreator.name}
                    className="w-20 h-20 rounded-2xl bg-black border-2 border-zinc-600 object-cover shadow-xl"
                  />
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-zinc-700 text-zinc-200 text-xs font-bold font-mono flex items-center justify-center border border-black">
                    2
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white font-sans truncate max-w-full">
                  {silverCreator.name}
                </h3>
                <span className="text-xs font-mono text-zinc-400 mt-0.5">
                  {silverCreator.badge || '🥈 Master Architect'}
                </span>

                <div className="w-full grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-zinc-800 text-center text-xs font-mono">
                  <div>
                    <span className="block text-white font-bold">{silverCreator.componentsCount}</span>
                    <span className="text-[10px] text-zinc-500">Components</span>
                  </div>
                  <div>
                    <span className="block text-rose-400 font-bold">{silverCreator.totalLikes}</span>
                    <span className="text-[10px] text-zinc-500">Likes</span>
                  </div>
                  <div>
                    <span className="block text-emerald-400 font-bold">{silverCreator.totalCopies}</span>
                    <span className="text-[10px] text-zinc-500">Copies</span>
                  </div>
                </div>

                <button
                  onClick={() => onNavigateShowcase(silverCreator.name)}
                  className="w-full mt-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>View UI Components</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}

            {/* #1 GOLD (Center on desktop - elevated) */}
            {goldCreator && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="relative p-7 rounded-3xl bg-gradient-to-b from-zinc-900 to-black border-2 border-amber-500/60 shadow-[0_20px_50px_rgba(245,158,11,0.15),0_0_30px_rgba(245,158,11,0.1)] flex flex-col items-center text-center md:-translate-y-4 group hover:border-amber-400 transition-all"
              >
                <div className="absolute -top-4 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-black text-xs font-mono font-black flex items-center gap-1.5 shadow-lg">
                  <Crown className="w-4 h-4 fill-black" />
                  <span>#1 CHAMPION</span>
                </div>

                <div className="relative mt-2 mb-4">
                  <img
                    src={goldCreator.avatar}
                    alt={goldCreator.name}
                    className="w-24 h-24 rounded-2xl bg-black border-2 border-amber-400 object-cover shadow-[0_0_25px_rgba(245,158,11,0.35)]"
                  />
                  <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-400 text-black text-xs font-black font-mono flex items-center justify-center border-2 border-black">
                    1
                  </span>
                </div>

                <h3 className="text-xl font-extrabold text-white font-sans truncate max-w-full">
                  {goldCreator.name}
                </h3>
                <span className="text-xs font-mono text-amber-300/90 font-semibold mt-0.5">
                  {goldCreator.badge || '👑 Grandmaster Creator'}
                </span>

                <div className="w-full grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-zinc-800 text-center text-xs font-mono">
                  <div>
                    <span className="block text-white font-black text-sm">{goldCreator.componentsCount}</span>
                    <span className="text-[10px] text-zinc-500">Components</span>
                  </div>
                  <div>
                    <span className="block text-rose-400 font-black text-sm">{goldCreator.totalLikes}</span>
                    <span className="text-[10px] text-zinc-500">Likes</span>
                  </div>
                  <div>
                    <span className="block text-emerald-400 font-black text-sm">{goldCreator.totalCopies}</span>
                    <span className="text-[10px] text-zinc-500">Copies</span>
                  </div>
                </div>

                <button
                  onClick={() => onNavigateShowcase(goldCreator.name)}
                  className="w-full mt-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-black text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span>Explore Showcase ({goldCreator.componentsCount} UI)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}

            {/* #3 BRONZE (Right on desktop) */}
            {bronzeCreator && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="relative p-6 rounded-3xl bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-amber-900/40 shadow-2xl flex flex-col items-center text-center group hover:border-amber-800 transition-all"
              >
                <div className="absolute -top-3.5 px-3 py-0.5 rounded-full bg-amber-950 border border-amber-800 text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5 shadow-md">
                  <Medal className="w-3.5 h-3.5 text-amber-500" />
                  <span>#3 BRONZE</span>
                </div>

                <div className="relative mt-2 mb-4">
                  <img
                    src={bronzeCreator.avatar}
                    alt={bronzeCreator.name}
                    className="w-20 h-20 rounded-2xl bg-black border-2 border-amber-800/80 object-cover shadow-xl"
                  />
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-800 text-white text-xs font-bold font-mono flex items-center justify-center border border-black">
                    3
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white font-sans truncate max-w-full">
                  {bronzeCreator.name}
                </h3>
                <span className="text-xs font-mono text-zinc-400 mt-0.5">
                  {bronzeCreator.badge || '🥉 Elite Contributor'}
                </span>

                <div className="w-full grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-zinc-800 text-center text-xs font-mono">
                  <div>
                    <span className="block text-white font-bold">{bronzeCreator.componentsCount}</span>
                    <span className="text-[10px] text-zinc-500">Components</span>
                  </div>
                  <div>
                    <span className="block text-rose-400 font-bold">{bronzeCreator.totalLikes}</span>
                    <span className="text-[10px] text-zinc-500">Likes</span>
                  </div>
                  <div>
                    <span className="block text-emerald-400 font-bold">{bronzeCreator.totalCopies}</span>
                    <span className="text-[10px] text-zinc-500">Copies</span>
                  </div>
                </div>

                <button
                  onClick={() => onNavigateShowcase(bronzeCreator.name)}
                  className="w-full mt-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>View UI Components</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* FULL LEADERBOARD TABLE */}
      <section className="space-y-6">
        {/* Controls Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md flex items-center rounded-2xl bg-zinc-950 border border-zinc-800 focus-within:border-zinc-500 transition-all">
            <Search className="w-4 h-4 text-zinc-500 ml-4 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search creator by name or email..."
              className="w-full py-2.5 px-3 bg-transparent text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none font-sans"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-500 hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-semibold text-zinc-200 focus:outline-none focus:border-zinc-500 cursor-pointer"
            >
              <option value="score" className="bg-zinc-900 text-white">Overall Score</option>
              <option value="components" className="bg-zinc-900 text-white">Most Components</option>
              <option value="likes" className="bg-zinc-900 text-white">Most Likes</option>
              <option value="copies" className="bg-zinc-900 text-white">Most Copies</option>
              <option value="views" className="bg-zinc-900 text-white">Most Views</option>
            </select>
          </div>
        </div>

        {/* Table Container */}
        <div className="rounded-3xl bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/60 border-b border-zinc-800 text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-5">Rank</th>
                  <th className="py-4 px-5">Creator</th>
                  <th className="py-4 px-5 text-center">Components</th>
                  <th className="py-4 px-5 text-center">Total Likes</th>
                  <th className="py-4 px-5 text-center">Code Copies</th>
                  <th className="py-4 px-5 text-center">Views</th>
                  <th className="py-4 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredCreators.map((creator, idx) => {
                  const isCurrent = currentUser?.email.toLowerCase() === creator.email.toLowerCase();
                  return (
                    <tr
                      key={creator.email}
                      className={`hover:bg-zinc-900/40 transition-colors ${
                        isCurrent ? 'bg-zinc-900/30' : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-4 px-5 font-mono font-bold">
                        {creator.rank === 1 ? (
                          <span className="inline-flex items-center gap-1 text-amber-400">
                            <Crown className="w-4 h-4 fill-amber-400" /> #1
                          </span>
                        ) : creator.rank === 2 ? (
                          <span className="inline-flex items-center gap-1 text-zinc-300">
                            <Medal className="w-4 h-4 text-zinc-300" /> #2
                          </span>
                        ) : creator.rank === 3 ? (
                          <span className="inline-flex items-center gap-1 text-amber-500">
                            <Medal className="w-4 h-4 text-amber-500" /> #3
                          </span>
                        ) : (
                          <span className="text-zinc-400">#{creator.rank}</span>
                        )}
                      </td>

                      {/* Creator Profile */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={creator.avatar}
                            alt={creator.name}
                            className="w-9 h-9 rounded-xl bg-black border border-zinc-700 object-cover"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white font-sans truncate">
                                {creator.name}
                              </span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-800 text-[9px] font-mono text-emerald-300 font-semibold">
                                  YOU
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-zinc-400 block truncate">
                              {creator.badge || 'Active Creator'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Components */}
                      <td className="py-4 px-5 text-center font-mono text-zinc-200 font-bold">
                        {creator.componentsCount}
                      </td>

                      {/* Likes */}
                      <td className="py-4 px-5 text-center font-mono text-rose-400 font-semibold">
                        <span className="inline-flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5 fill-rose-400/30" />
                          {creator.totalLikes}
                        </span>
                      </td>

                      {/* Copies */}
                      <td className="py-4 px-5 text-center font-mono text-emerald-400 font-semibold">
                        <span className="inline-flex items-center gap-1">
                          <Copy className="w-3.5 h-3.5" />
                          {creator.totalCopies}
                        </span>
                      </td>

                      {/* Views */}
                      <td className="py-4 px-5 text-center font-mono text-zinc-400">
                        {creator.totalViews.toLocaleString()}
                      </td>

                      {/* Action */}
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => onNavigateShowcase(creator.name)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer"
                        >
                          <span>Showcase</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FOOTER CALL TO ACTION */}
      <section className="p-8 rounded-3xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 text-center space-y-4 shadow-xl">
        <Sparkles className="w-8 h-8 text-amber-400 mx-auto" />
        <h3 className="text-xl sm:text-2xl font-black text-white font-sans">
          Ready to Claim Your Place on the Podium?
        </h3>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
          Publish your custom React & Tailwind animations, procedural shaders, and bionic UI components to build your developer reputation and unlock community badges.
        </p>
        <button
          onClick={onOpenUpload}
          className="mt-2 px-6 py-3 rounded-2xl bg-white text-black font-bold text-xs hover:bg-zinc-200 transition-all cursor-pointer shadow-lg active:scale-95 inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Component Now</span>
        </button>
      </section>
    </div>
  );
}
