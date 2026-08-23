import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { UIComponentItem } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  component: UIComponentItem | null;
  isDeleting?: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  component,
  isDeleting = false,
}: Props) {
  if (!isOpen || !component) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-md rounded-2xl bg-[#0E0E0E] border border-red-900/50 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_30px_rgba(239,68,68,0.1)] overflow-hidden"
        >
          {/* Top Red Rim Highlight */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent" />

          {/* Header */}
          <div className="p-5 border-b border-[#222222] flex items-center justify-between bg-[#121212]">
            <div className="flex items-center gap-2.5 text-red-400">
              <div className="w-8 h-8 rounded-xl bg-red-950/60 border border-red-900/80 flex items-center justify-center text-red-400 shadow-sm">
                <Trash2 className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white font-sans">
                Delete UI Component
              </h3>
            </div>

            <button
              onClick={onClose}
              disabled={isDeleting}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div className="p-3.5 rounded-xl bg-[#171717] border border-[#2B2B2B] flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-zinc-300 space-y-1">
                <p className="font-semibold text-white">Permanent Deletion Warning</p>
                <p className="text-zinc-400 leading-relaxed">
                  Are you sure you want to delete <strong className="text-white font-semibold">"{component.title}"</strong>?
                  This action cannot be undone and will permanently remove this component from the Lazy UI showcase and database.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#0A0A0A] border border-[#202020] text-xs font-mono text-zinc-400 flex items-center justify-between">
              <span>Category: {component.category}</span>
              <span>{component.framework}</span>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-[#181818] border border-[#2E2E2E] text-xs font-semibold text-zinc-300 hover:text-white hover:bg-[#222222] transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={onConfirm}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {isDeleting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Permanently Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
