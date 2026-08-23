import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Upload,
  Sparkles,
  AlertCircle,
  FileCode,
  Film,
  Check,
  RotateCcw,
  ArrowLeft,
  Video,
} from 'lucide-react';
import { ComponentCategory, Framework, UIComponentItem, UserSession } from '../types';
import { uploadComponent } from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession | null;
  onRequireAuth: (reason?: string) => void;
  onUploadSuccess: (newComp: UIComponentItem) => void;
}

const CATEGORY_OPTIONS: ComponentCategory[] = [
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

const FRAMEWORK_OPTIONS: Framework[] = [
  'React + Tailwind',
  'Next.js',
  'HTML + Tailwind',
  'Vue 3',
  'Svelte',
  'Framer Motion',
  'Vanilla CSS',
];

const TEMPLATES = [
  {
    name: 'Dia Text Reveal',
    code: `import React, { useEffect, useState } from "react";

export function DiaTextReveal({
  text = "Magic UI",
  colors = ["#A97CF8", "#F38CB8", "#FDCC92"],
  className = "",
}: {
  text?: string;
  colors?: string[];
  className?: string;
}) {
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsRevealed(true), 120);
    return () => clearTimeout(timer);
  }, []);

  const letters = Array.from(text);
  const gradient = \`linear-gradient(135deg, \${colors.join(", ")})\`;

  return (
    <div className={\`inline-flex flex-wrap items-center justify-center gap-[0.03em] overflow-hidden select-none font-sans \${className}\`}>
      {letters.map((char, index) => (
        <span
          key={index}
          className="inline-block transition-all duration-700 ease-out"
          style={{
            backgroundImage: gradient,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            opacity: isRevealed ? 1 : 0,
            transform: isRevealed
              ? "translateY(0px) rotate(0deg) scale(1)"
              : "translateY(24px) rotate(6deg) scale(0.85)",
            transitionDelay: \`\${index * 70}ms\`,
            filter: isRevealed
              ? "drop-shadow(0 0 20px rgba(169, 124, 248, 0.4))"
              : "none",
          }}
        >
          {char === " " ? "\\u00A0" : char}
        </span>
      ))}
    </div>
  );
}

export default DiaTextReveal;`,
  },
  {
    name: 'Specular Button',
    code: `import React from 'react';

export function SpecularButton({ label = 'Get Started' }: { label?: string }) {
  return (
    <button className="relative group px-7 py-3 rounded-xl bg-black border border-zinc-700 text-white font-sans text-sm font-semibold overflow-hidden transition-all duration-300 hover:border-zinc-400 hover:shadow-[0_0_30px_rgba(255,255,255,0.18)] cursor-pointer">
      <div className="absolute -inset-px bg-gradient-to-r from-transparent via-zinc-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm pointer-events-none" />
      <span className="relative z-10 flex items-center gap-2">
        <span>{label}</span>
      </span>
    </button>
  );
}

export default SpecularButton;`,
  },
];

const STARTER_CODE = TEMPLATES[0].code;

export function UploadModal({ isOpen, onClose, currentUser, onRequireAuth, onUploadSuccess }: Props) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ComponentCategory>('Buttons & Actions');
  const [framework, setFramework] = useState<Framework>('React + Tailwind');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState(STARTER_CODE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Video File Upload state only
  const [videoFileBase64, setVideoFileBase64] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState<string>('');
  const [liveDemoUrl, setLiveDemoUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processVideoFile = (file: File) => {
    if (!file.type.startsWith('video/')) {
      setErrorMsg('Please select a valid video file (.mp4, .webm, or .mov).');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg('Video file exceeds 50MB. Please select a shorter clip (< 50MB).');
      return;
    }

    setErrorMsg('');
    setVideoFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setVideoFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processVideoFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processVideoFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!currentUser || !currentUser.email.endsWith('@gmail.com')) {
      onRequireAuth('upload UI components to Lazy UI');
      return;
    }

    if (!title.trim()) {
      setErrorMsg('Please specify a component title.');
      return;
    }

    if (!code.trim()) {
      setErrorMsg('Please input your component source code.');
      return;
    }

    if (!videoFileBase64) {
      setErrorMsg('A video file is required. Please upload an .mp4, .webm, or .mov video file of your component.');
      return;
    }

    // Auto-derive relevant tags
    const derivedTags = [
      category.split(' ')[0],
      framework.split(' ')[0],
      'UIComponent',
      'DarkTheme',
    ];

    setIsSubmitting(true);
    try {
      const newComp = await uploadComponent({
        title: title.trim(),
        category,
        framework,
        description: description.trim() || 'High-craft UI component with looping video showcase.',
        authorEmail: currentUser.email,
        authorName: currentUser.name || currentUser.email.split('@')[0],
        screenRecordingUrl: videoFileBase64,
        videoUrl: videoFileBase64,
        liveDemoUrl: liveDemoUrl.trim() || undefined,
        code: code.trim(),
        tags: derivedTags,
      });

      setIsSubmitting(false);
      onUploadSuccess(newComp);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Failed to upload component.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-3xl rounded-2xl bg-[#0A0A0A] border border-[#262626] p-5 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_35px_rgba(255,255,255,0.06)] my-auto max-h-[90vh] overflow-y-auto"
      >
        {/* Specular Top Rim */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-400 to-transparent" />

        {/* Header with Back Button */}
        <div className="flex items-start justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white text-xs font-semibold transition-all cursor-pointer group active:scale-95"
              title="Go Back"
            >
              <ArrowLeft className="w-4 h-4 text-zinc-400 group-hover:text-white group-hover:-translate-x-0.5 transition-transform" />
              <span>Back</span>
            </button>

            <div>
              <h2 className="text-lg font-bold text-white tracking-wide font-sans">
                Upload Component & Video Showcase
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Upload your video clip to showcase your component in a smooth, infinite loop.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Component Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Specular Glow Button"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-sans"
            />
          </div>

          {/* Category & Framework */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ComponentCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 cursor-pointer"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Framework *</label>
              <select
                value={framework}
                onChange={(e) => setFramework(e.target.value as Framework)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 cursor-pointer"
              >
                {FRAMEWORK_OPTIONS.map((fw) => (
                  <option key={fw} value={fw}>
                    {fw}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* REQUIRED VIDEO FILE UPLOAD ONLY */}
          <div className="p-4 rounded-xl bg-[#0F0F12] border border-[#2B2B36] space-y-3">
            <div>
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Film className="w-4 h-4 text-emerald-400" />
                <span>Upload Video File <span className="text-emerald-400 font-semibold text-[11px]">(Mandatory Video Showcase)</span></span>
              </label>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Upload an .mp4, .webm, or .mov video file (&lt; 50MB) to power the looping component preview.
              </p>
            </div>

            {/* Drag & Drop File Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-950/20'
                  : videoFileBase64
                  ? 'border-emerald-800/80 bg-zinc-950'
                  : 'border-[#2D2D38] hover:border-zinc-500 bg-zinc-950/60 hover:bg-zinc-900/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleFileUpload}
                className="hidden"
              />

              {videoFileBase64 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 text-xs font-mono text-emerald-400">
                    <Check className="w-4 h-4" />
                    <span className="font-semibold truncate max-w-sm">{videoFileName || 'Video File Ready'}</span>
                  </div>

                  <div className="max-w-xs mx-auto aspect-video rounded-lg overflow-hidden border border-zinc-800 bg-black shadow-lg">
                    <video
                      src={videoFileBase64}
                      autoPlay
                      loop
                      muted
                      playsInline
                      controlsList="nodownload nofullscreen noremoteplayback"
                      disablePictureInPicture
                      onContextMenu={(e) => e.preventDefault()}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-mono transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Change Video File
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-300">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-white">
                      Click to upload or drag & drop video
                    </p>
                    <p className="text-[11px] font-mono text-zinc-500">
                      MP4, WebM, or MOV up to 50MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SOURCE CODE INPUT */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-zinc-300" />
                <span>Production Source Code * (Exportable via Copy Button)</span>
              </label>

              {/* Template quick-pickers */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-mono text-zinc-500 mr-1">Load Preset:</span>
                {TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.name}
                    type="button"
                    onClick={() => {
                      setCode(tpl.code);
                      if (!title) setTitle(tpl.name);
                    }}
                    className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-[10px] font-mono text-zinc-400 hover:text-white cursor-pointer transition-colors"
                  >
                    {tpl.name}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              required
              rows={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste full component code here..."
              className="w-full p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-500 leading-relaxed select-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe animations, styling, and design details..."
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 leading-relaxed"
            />
          </div>

          {/* External Link (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Live Demo / Docs URL <span className="text-zinc-500 font-normal">(Optional)</span>
            </label>
            <input
              type="url"
              value={liveDemoUrl}
              onChange={(e) => setLiveDemoUrl(e.target.value)}
              placeholder="https://codepen.io or github.com"
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 font-mono"
            />
          </div>

          {/* Submit & Cancel Buttons */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-white text-black hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {isSubmitting ? 'Publishing Component...' : 'Publish Component with Video'}
              <Sparkles className="w-4 h-4 text-black" />
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
