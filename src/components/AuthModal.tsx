import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  User,
  Shield,
  Zap,
  Code2,
} from 'lucide-react';
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
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [emailInput, setEmailInput] = useState(defaultEmail || '');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginNotice, setIsLoginNotice] = useState<{ active: boolean; isFirst: boolean; userName: string }>({
    active: false,
    isFirst: false,
    userName: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanEmail = emailInput.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    if (!passwordInput || passwordInput.length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }

    if (authMode === 'signup' && !nameInput.trim()) {
      setErrorMsg('Please enter your creator display name.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginWithEmail(
        cleanEmail,
        passwordInput,
        nameInput.trim() || undefined
      );
      setIsLoading(false);

      const isFirst = authMode === 'signup' || !!res.isFirstLogin;
      setIsLoginNotice({
        active: true,
        isFirst,
        userName: res.user.name || cleanEmail.split('@')[0],
      });

      setTimeout(() => {
        onSuccess(res.user, isFirst);
        onClose();
      }, 1000);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Failed to authenticate account.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="relative w-full max-w-lg rounded-3xl bg-[#0B0B0C] border border-[#262626] p-6 sm:p-8 shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_45px_rgba(255,255,255,0.03)] max-h-[94vh] overflow-y-auto"
      >
        {/* Specular Ambient Glow & Silver Top Rim */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#E2E8F0] to-transparent opacity-60" />
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 bg-white/5 blur-3xl rounded-full pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-b from-[#1E1E20] to-[#121214] border border-[#333336] flex items-center justify-center shadow-inner">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight font-sans">
                  {authMode === 'signin' ? 'Welcome Back' : 'Join Lazy UI Vault'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] font-mono text-zinc-300">
                  v2.0
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-sans mt-0.5">
                {authMode === 'signin'
                  ? 'Sign in to access your saved components and copy credits'
                  : 'Create an account to copy code and publish components'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer border border-transparent hover:border-zinc-700"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Reason Callout (if triggered by copying or uploading) */}
        {actionReason && (
          <div className="mt-4 px-3.5 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800/80 text-xs text-zinc-300 flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-zinc-400 shrink-0" />
            <span className="text-[11px] leading-snug">
              Sign in is required to <span className="text-white font-medium">{actionReason}</span>.
            </span>
          </div>
        )}

        {/* Mode Switcher Tabs */}
        <div className="mt-5 p-1 rounded-xl bg-[#141416] border border-[#242426] flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setAuthMode('signin');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold font-sans transition-all cursor-pointer ${
              authMode === 'signin'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('signup');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold font-sans transition-all cursor-pointer ${
              authMode === 'signup'
                ? 'bg-white text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Success Notice */}
        <AnimatePresence>
          {isLoginNotice.active && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-200 text-sm">
                  {isLoginNotice.isFirst ? 'Account Created Successfully!' : 'Signed In Successfully!'}
                </p>
                <p className="text-xs text-emerald-300/90 mt-0.5">
                  Welcome {isLoginNotice.userName}! Syncing your vault data...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          {/* Display Name (Only in Sign Up mode) */}
          {authMode === 'signup' && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              <label className="block text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                Display Name <span className="text-zinc-500 font-normal">(Required)</span>
              </label>
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Sahil Jha"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#141416] border border-[#2B2B2E] text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-400 transition-all font-sans"
                />
              </div>
            </motion.div>
          )}

          {/* Email Address */}
          <div>
            <label className="block text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 pointer-events-none" />
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="your.name@example.com"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#141416] border border-[#2B2B2E] text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-400 transition-all font-mono"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">
                Password
              </label>
              <span className="text-[10px] font-mono text-zinc-500">Min 4 characters</span>
            </div>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#141416] border border-[#2B2B2E] text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-400 transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 p-1 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || isLoginNotice.active}
            className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs sm:text-sm active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.15)] disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{authMode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </>
            )}
          </button>
        </form>

        {/* Feature Highlights Footer */}
        <div className="mt-6 pt-4 border-t border-[#1C1C1F] grid grid-cols-3 gap-2 text-center text-[10px] font-mono text-zinc-500">
          <div className="flex flex-col items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-zinc-400" />
            <span>2 Free Copies/Day</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-zinc-400" />
            <span>Data Saved to Vault</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Code2 className="w-3.5 h-3.5 text-zinc-400" />
            <span>React + Tailwind Ready</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
