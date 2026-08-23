import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  ExternalLink,
  Video,
  Share2,
  Sparkles,
  Layers,
  Zap,
  Menu,
  Sliders,
  Layout,
  Maximize2,
  Tag,
  RotateCw,
} from 'lucide-react';
import { ComponentCategory, Framework } from '../types';

interface MediaPreviewProps {
  videoUrl?: string;
  screenRecordingUrl?: string;
  postUrl?: string;
  posterUrl?: string;
  title: string;
  category: ComponentCategory;
  framework: Framework;
  tags?: string[];
  mode?: 'card' | 'detail';
  isHovered?: boolean;
}

// Helpers to identify and transform video embeds
function parseVideoEmbedUrl(url: string): { type: 'video' | 'iframe'; embedUrl: string } | null {
  if (!url) return null;
  const clean = url.trim();

  // Direct video formats or data URLs or blob URLs
  if (
    clean.endsWith('.mp4') ||
    clean.endsWith('.webm') ||
    clean.endsWith('.mov') ||
    clean.startsWith('data:video') ||
    clean.startsWith('blob:')
  ) {
    return { type: 'video', embedUrl: clean };
  }

  // YouTube
  const ytMatch = clean.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'iframe',
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&loop=1&playlist=${ytMatch[1]}&controls=1&rel=0&modestbranding=1`,
    };
  }

  // Loom
  const loomMatch = clean.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (loomMatch && loomMatch[1]) {
    return {
      type: 'iframe',
      embedUrl: `https://www.loom.com/embed/${loomMatch[1]}?autoplay=1&hide_owner=true&hide_share=true&hide_title=true&hideEmbedTopBar=true`,
    };
  }

  // Vimeo
  const vimeoMatch = clean.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: 'iframe',
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&loop=1&muted=1&title=0&byline=0&portrait=0`,
    };
  }

  // Streamable
  const streamableMatch = clean.match(/streamable\.com\/(?:e\/)?([a-zA-Z0-9]+)/);
  if (streamableMatch && streamableMatch[1]) {
    return {
      type: 'iframe',
      embedUrl: `https://streamable.com/e/${streamableMatch[1]}?autoplay=1&muted=1&loop=1`,
    };
  }

  // Generic direct fallback
  return { type: 'video', embedUrl: clean };
}

function getCategoryIcon(category: ComponentCategory) {
  switch (category) {
    case 'Buttons & Actions':
      return Zap;
    case 'Cards & Bionic UI':
      return Layers;
    case 'Navigation & Menus':
      return Menu;
    case 'Inputs & Forms':
      return Sliders;
    case 'Hero & Headers':
      return Layout;
    case 'Modals & Overlays':
      return Maximize2;
    case 'Badges & Indicators':
      return Tag;
    default:
      return Sparkles;
  }
}

export function MediaPreview({
  videoUrl,
  screenRecordingUrl,
  postUrl,
  posterUrl,
  title,
  category,
  framework,
  tags = [],
  mode = 'card',
  isHovered = false,
}: MediaPreviewProps) {
  const mediaUrl = (screenRecordingUrl || videoUrl || '').trim();
  const videoInfo = mediaUrl ? parseVideoEmbedUrl(mediaUrl) : null;
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInViewport, setIsInViewport] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const CategoryIcon = getCategoryIcon(category);

  // Performance Optimization for 1000+ Videos: IntersectionObserver
  // Only mount/play videos when in viewport — off-screen videos release their decoder resources
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsInViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsInViewport(entry.isIntersecting);
        });
      },
      {
        rootMargin: '200px 0px',
        threshold: 0.05,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Manage Play / Pause / Src based on viewport visibility
  // For 1000+ videos: strip src when off-screen to free GPU decoders and memory
  useEffect(() => {
    const video = videoRef.current;
    if (!video || videoInfo?.type !== 'video') return;

    if (mode === 'card') {
      if (isInViewport || isHovered) {
        // Lazy-load: assign src only when entering viewport
        if (!video.src || video.src === '' || video.src === window.location.href) {
          video.src = videoInfo.embedUrl;
          video.load();
        }
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {});
        }
      } else {
        // Off-screen: pause and release video decoder resources
        video.pause();
        video.removeAttribute('src');
        video.load(); // Releases the media resource
      }
    } else {
      // In Detail modal, always play
      if (!video.src || video.src === '' || video.src === window.location.href) {
        video.src = videoInfo.embedUrl;
        video.load();
      }
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    }
  }, [isInViewport, isHovered, mode, videoInfo]);

  // 1. Direct Video / Screen Recording Video with Infinite Loop
  if (videoInfo && videoInfo.type === 'video' && !hasError) {
    return (
      <div
        ref={containerRef}
        className="relative w-full h-full bg-[#050505] flex items-center justify-center overflow-hidden select-none"
      >
        <video
          ref={videoRef}
          poster={posterUrl}
          autoPlay
          loop
          muted
          playsInline
          preload={mode === 'card' ? 'none' : 'metadata'}
          controlsList="nodownload nofullscreen noremoteplayback"
          disablePictureInPicture
          onLoadedData={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          onContextMenu={(e) => e.preventDefault()}
          style={{ pointerEvents: mode === 'card' ? 'none' : 'auto' }}
          className={`w-full h-full object-contain ${
            mode === 'card' ? 'transition-transform duration-500 group-hover:scale-[1.02]' : ''
          }`}
        />
      </div>
    );
  }

  // 2. Video Iframe Embed (YouTube, Loom, Vimeo, Streamable)
  if (videoInfo && videoInfo.type === 'iframe') {
    return (
      <div
        ref={containerRef}
        className="relative w-full h-full bg-[#050505] flex items-center justify-center overflow-hidden"
      >
        {mode === 'card' ? (
          <div className="relative w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-[#111111] to-[#080808]">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white mb-2 shadow-lg group-hover:border-zinc-400 group-hover:scale-105 transition-all">
              <Play className="w-5 h-5 fill-white text-white ml-0.5" />
            </div>
            <p className="text-xs font-bold text-white font-sans line-clamp-1">{title}</p>
            <span className="text-[10px] font-mono text-zinc-400 mt-1 flex items-center gap-1">
              <Video className="w-3 h-3 text-zinc-400" /> Video Demo
            </span>
          </div>
        ) : (
          <iframe
            src={videoInfo.embedUrl}
            title={title}
            className="w-full h-[360px] sm:h-[420px] rounded-xl border border-zinc-800"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
          />
        )}
      </div>
    );
  }

  // 3. Post URL (X/Twitter, Social Showcase link)
  if (postUrl && postUrl.trim()) {
    const cleanPost = postUrl.trim();
    return (
      <div
        ref={containerRef}
        className="relative w-full h-full bg-[#070707] flex flex-col items-center justify-center p-5 text-center overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

        <div className="relative z-10 flex flex-col items-center max-w-xs space-y-2.5">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white shadow-xl">
            <Share2 className="w-5 h-5 text-zinc-200" />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold text-white font-sans tracking-wide">
              Social Showcase Video
            </p>
            <p className="text-[11px] text-zinc-400 line-clamp-1 font-mono">{cleanPost}</p>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-semibold bg-[#161616] border border-[#2B2B2B] text-zinc-300">
            <ExternalLink className="w-3 h-3" /> View Video Demo
          </span>
        </div>
      </div>
    );
  }

  // 4. Fallback Video Animation Card (For components awaiting direct recording)
  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#060606] flex flex-col items-center justify-center p-5 text-center overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(#222222_1px,transparent_1px)] [background-size:14px_14px] opacity-30" />

      <div className="relative z-10 flex flex-col items-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-[#111114] border border-[#2B2B36] flex items-center justify-center text-zinc-300 shadow-xl group-hover:scale-105 group-hover:border-zinc-500 transition-all">
          <Video className="w-5 h-5 text-zinc-200" />
        </div>

        <div className="space-y-1">
          <p className="text-xs font-bold text-white font-sans tracking-wide line-clamp-1">
            {title}
          </p>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#141418] border border-[#2B2B36] text-zinc-300 shadow-sm inline-block">
            {category}
          </span>
        </div>
      </div>

      <div className="absolute bottom-2.5 inset-x-3 flex items-center justify-between text-[10px] font-mono text-zinc-500 z-10">
        <span className="text-zinc-500 flex items-center gap-1">
          {category}
        </span>
        <span className="text-zinc-400 font-semibold">{framework}</span>
      </div>
    </div>
  );
}
