import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Copy, Check, Share2, Globe, ExternalLink, Code2 } from 'lucide-react';
import { UIComponentItem } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  component: UIComponentItem | null;
}

export function ShareModal({ isOpen, onClose, component }: Props) {
  const [copied, setCopied] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  if (!isOpen || !component) return null;

  const shareUrl = `${window.location.origin}/?component=${component.id}`;
  const embedCode = `<iframe src="${shareUrl}&embed=true" width="100%" height="450" frameborder="0" style="border-radius: 16px; background: #09090B;"></iframe>`;

  const copyToClipboard = (text: string, isEmbed = false) => {
    navigator.clipboard.writeText(text);
    if (isEmbed) {
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareOnTwitter = () => {
    const text = encodeURIComponent(`Check out "${component.title}" on Lazy UI - the dark & silver UI vault:`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareOnReddit = () => {
    window.open(`https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(component.title)}`, '_blank');
  };

  const shareOnWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out ${component.title} on Lazy UI: ${shareUrl}`)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md rounded-2xl bg-zinc-950 border border-zinc-700 p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Share UI Component</h3>
              <p className="text-xs text-zinc-400 font-mono">{component.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Share URL */}
        <div className="mt-5">
          <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Direct Vault Link</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="w-full px-3 py-2 text-xs font-mono bg-zinc-900 border border-zinc-700/80 rounded-xl text-zinc-300 select-all focus:outline-none"
            />
            <button
              onClick={() => copyToClipboard(shareUrl)}
              className="px-3.5 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-xs font-semibold text-white hover:bg-zinc-700 transition-colors flex items-center gap-1.5 shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Social Buttons */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-zinc-300 mb-2">Social Channels</label>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={shareOnTwitter}
              className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800 text-xs font-medium text-zinc-200 flex flex-col items-center gap-1 transition-all"
            >
              <span className="text-sm font-bold">𝕏</span>
              <span className="text-[10px]">Twitter/X</span>
            </button>
            <button
              onClick={shareOnLinkedIn}
              className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800 text-xs font-medium text-zinc-200 flex flex-col items-center gap-1 transition-all"
            >
              <span className="text-sm font-bold text-sky-400">in</span>
              <span className="text-[10px]">LinkedIn</span>
            </button>
            <button
              onClick={shareOnReddit}
              className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800 text-xs font-medium text-zinc-200 flex flex-col items-center gap-1 transition-all"
            >
              <span className="text-sm font-bold text-orange-400">●</span>
              <span className="text-[10px]">Reddit</span>
            </button>
            <button
              onClick={shareOnWhatsApp}
              className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800 text-xs font-medium text-zinc-200 flex flex-col items-center gap-1 transition-all"
            >
              <span className="text-sm font-bold text-emerald-400">💬</span>
              <span className="text-[10px]">WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Embed code */}
        <div className="mt-4 pt-3 border-t border-zinc-800">
          <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-zinc-400" />
            Embed Specular Card
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={embedCode}
              className="w-full px-3 py-1.5 text-[11px] font-mono bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 select-all focus:outline-none"
            />
            <button
              onClick={() => copyToClipboard(embedCode, true)}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-300 hover:text-white"
            >
              {copiedEmbed ? 'Copied' : 'Embed'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
