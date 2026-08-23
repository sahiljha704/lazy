import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';
import { UserSession } from '../types';
import { loginWithEmail } from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserSession, isFirstLogin?: boolean) => void;
  defaultEmail?: string;
  actionReason?: string;
}

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  defaultEmail = '',
  actionReason = 'access the Lazy UI component vault and copy production code',
}: Props) {
  const [emailInput, setEmailInput] = useState(defaultEmail || '');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginNotice, setIsLoginNotice] = useState<{ active: boolean; isFirst: boolean }>({
    active: false,
    isFirst: false,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanEmail = emailInput.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (!passwordInput || passwordInput.length < 4) {
      setErrorMsg('Please enter a password with at least 4 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginWithEmail(cleanEmail, passwordInput, nameInput || undefined);
      setIsLoading(false);

      setIsLoginNotice({ active: true, isFirst: !!res.isFirstLogin });
      setTimeout(() => {
        onSuccess(res.user, res.isFirstLogin);
        onClose();
      }, 1200);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Failed to authenticate account.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md rounded-2xl bg-[#0A0A0A] border border-[#333333] p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_35px_rgba(192,192,192,0.06)] max-h-[92vh] overflow-y-auto"
      >
        {/* Specular Silver Top Rim */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#C0C0C0] to-transparent" />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#111111] border border-[#333333] flex items-center justify-center shadow-inner">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-wide font-sans">
                Authentication
              </h3>
              <p className="text-xs text-[#888888] font-mono">LAZY-UI-AUTH</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#888888] hover:text-white hover:bg-[#111111] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Notice */}
        <AnimatePresence>
          {isLoginNotice.active && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-200">
                  Authentication Successful!
                </p>
                <p className="text-[11px] text-emerald-300/90 mt-0.5">
                  Welcome to Lazy UI Live Code Vault.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 mt-6">
          <div>
            <label className="block text-xs font-semibold text-[#888888] uppercase tracking-wider mb-1 font-mono">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-[#888888] absolute left-3.5" />
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="your.name@example.com"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#111111] border border-[#333333] text-sm text-white placeholder-[#555555] focus:outline-none focus:border-[#C0C0C0] transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#888888] uppercase tracking-wider mb-1 font-mono">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-[#888888] absolute left-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#111111] border border-[#333333] text-sm text-white placeholder-[#555555] focus:outline-none focus:border-[#C0C0C0] transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-[#888888] hover:text-white transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#888888] uppercase tracking-wider mb-1 font-mono">
              Display Name <span className="text-[#555555] font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="e.g. Alex Mercer"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#111111] border border-[#333333] text-sm text-white placeholder-[#555555] focus:outline-none focus:border-[#C0C0C0] transition-all"
            />
          </div>

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs"
            >
              {errorMsg}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isLoading || isLoginNotice.active}
            className="w-full py-2.5 rounded-xl bg-[#1A1A1A] hover:bg-[#262626] border border-[#3A3A3A] text-white font-bold text-xs active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer mt-1 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-[#222222] text-center text-[10px] text-[#666666] font-mono">
          Lazy UI • Secure Authentication
        </div>
      </motion.div>
    </div>
  );
}
