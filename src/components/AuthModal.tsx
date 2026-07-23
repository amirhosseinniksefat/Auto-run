import React, { useState, useEffect } from 'react';
import { X, User, Lock, Mail, Phone, LogIn, UserPlus, Sparkles, AlertCircle, CheckCircle2, ShieldCheck, KeyRound, ArrowRight, Send, Check } from 'lucide-react';
import { loginUser, registerUser, forgotPassword, sendEmailOtp } from '../services/api';
import { User as UserType } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserType, token: string) => void;
  initialMode?: 'login' | 'register';
  isClosable?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  initialMode = 'login',
  isClosable = true
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Login Form
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // OTP Verification State
  const [regOtpCode, setRegOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Forgot Form
  const [forgotIdentifier, setForgotIdentifier] = useState('');

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  if (!isOpen) return null;

  const handleSendOtp = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = regEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'proton.me', 'protonmail.com', 'live.com', 'yandex.com', 'zoho.com'];
    const emailDomain = cleanEmail.split('@')[1]?.toLowerCase();

    if (!cleanEmail || !emailRegex.test(cleanEmail) || !emailDomain || !allowedDomains.includes(emailDomain)) {
      setErrorMsg('ثبت‌نام فقط با سرویس‌های ایمیل معتبر (Gmail، Yahoo، Outlook، Hotmail، iCloud) امکان‌پذیر است.');
      return;
    }

    setSendingOtp(true);
    try {
      const res = await sendEmailOtp(cleanEmail);
      setOtpSent(true);
      setRegOtpCode('');
      setSuccessMsg(res.message);
      setCountdown(120);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ارسال کد تایید ایمیل.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setErrorMsg('لطفاً نام کاربری و رمز عبور را وارد کنید.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await loginUser({
        identifier: loginIdentifier.trim(),
        password: loginPassword.trim(),
      });
      setSuccessMsg(`خوش آمدید، ${res.user.fullName || res.user.username}!`);
      setTimeout(() => {
        onSuccess(res.user, res.token);
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ورود به حساب کاربری.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = regEmail.trim();
    const cleanPassword = regPassword.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'proton.me', 'protonmail.com', 'live.com', 'yandex.com', 'zoho.com'];
    const emailDomain = cleanEmail.split('@')[1]?.toLowerCase();

    if (!regUsername.trim() || !cleanPassword) {
      setErrorMsg('نام کاربری و رمز عبور الزامی است.');
      return;
    }

    if (!cleanEmail || !emailRegex.test(cleanEmail) || !emailDomain || !allowedDomains.includes(emailDomain)) {
      setErrorMsg('ثبت‌نام فقط با سرویس‌های ایمیل معتبر (Gmail، Yahoo، Outlook، Hotmail، iCloud) امکان‌پذیر است.');
      return;
    }

    const hasLetter = /[a-zA-Z\u0600-\u06FF]/.test(cleanPassword);
    const hasNumber = /[0-9]/.test(cleanPassword);
    if (cleanPassword.length < 8 || !hasLetter || !hasNumber) {
      setErrorMsg('رمز عبور باید حداقل ۸ کاراکتر و ترکیبی از حروف و اعداد باشد.');
      return;
    }

    if (cleanPassword !== regConfirmPassword.trim()) {
      setErrorMsg('رمز عبور و تکرار آن یکسان نیستند.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await registerUser({
        fullName: regFullName.trim(),
        username: regUsername.trim(),
        email: cleanEmail,
        phone: regPhone.trim(),
        password: cleanPassword,
        otpCode: regOtpCode.trim(),
      });
      setSuccessMsg('ثبت‌نام و تایید ایمیل با موفقیت انجام شد! در حال انتقال...');
      setTimeout(() => {
        onSuccess(res.user, res.token);
        onClose();
      }, 800);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در ثبت‌نام حساب.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!forgotIdentifier.trim()) {
      setErrorMsg('لطفاً ایمیل یا شماره موبایل را وارد کنید.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await forgotPassword(forgotIdentifier.trim());
      setSuccessMsg(res.message);
    } catch (err: any) {
      setErrorMsg(err.message || 'خطا در بازیابی رمز عبور.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md animate-fade-in dir-rtl">
      <div className="relative w-full max-w-md neu-flat border border-white/10 rounded-2xl overflow-hidden shadow-2xl bg-[#0e121a] text-white">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-gradient-to-r from-purple-950/40 via-blue-950/30 to-black/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 neu-inset rounded-xl text-yellow-400 bg-yellow-400/10 border border-yellow-400/20">
              <ShieldCheck className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {mode === 'login' ? 'ورود به حساب کاربری' : mode === 'register' ? 'ثبت‌نام حساب جدید' : 'بازیابی رمز عبور'}
              </h3>
              <p className="text-[11px] text-slate-400">سامانه مدیریت ربات Auto run</p>
            </div>
          </div>

          {isClosable && (
            <button
              onClick={onClose}
              className="p-1.5 neu-button rounded-xl text-slate-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tab Switcher */}
        {mode !== 'forgot' && (
          <div className="flex border-b border-white/10 bg-black/40 p-1.5 gap-1.5">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mode === 'login'
                  ? 'bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>ورود به حساب</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMsg(null); setSuccessMsg(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>ثبت‌نام حساب جدید</span>
            </button>
          </div>
        )}

        {/* Alerts */}
        <div className="px-5 pt-4 space-y-2">
          {errorMsg && (
            <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-xl flex items-center gap-2 text-xs text-red-300 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Form Body */}
        <div className="p-5">
          {/* 1. LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-yellow-400" />
                  <span>نام کاربری / ایمیل / شماره موبایل:</span>
                </label>
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="مثال: admin یا Amir.R.AN37@gmail.com"
                  className="w-full bg-black/60 border border-white/15 px-3.5 py-2.5 text-xs rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400 transition-all font-mono dir-ltr text-right"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-yellow-400" />
                    <span>رمز عبور:</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setErrorMsg(null); setSuccessMsg(null); }}
                    className="text-[11px] text-yellow-400 hover:underline font-semibold"
                  >
                    فراموشی رمز عبور؟
                  </button>
                </div>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/60 border border-white/15 px-3.5 py-2.5 text-xs rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400 transition-all font-mono dir-ltr text-right"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 neu-button bg-yellow-400 text-black font-black text-xs rounded-xl hover:bg-yellow-300 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                {isLoading ? (
                  <span>در حال ورود...</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>ورود به سامانه</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* 2. REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-purple-400" />
                  <span>نام و نام خانوادگی:</span>
                </label>
                <input
                  type="text"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="مثال: امیررضا انصاری"
                  className="w-full bg-black/60 border border-white/15 px-3.5 py-2 text-xs rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300 flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                    <span>نام کاربری (تگ آیدی):</span>
                  </label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="مثال: amiran"
                    className="w-full bg-black/60 border border-white/15 px-3 py-2 text-xs rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 font-mono dir-ltr text-right"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-purple-400" />
                    <span>شماره همراه (اختیاری):</span>
                  </label>
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="۰۹۱۲۰۰۰۰۰۰۰"
                    className="w-full bg-black/60 border border-white/15 px-3 py-2 text-xs rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 font-mono dir-ltr text-right"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-purple-400" />
                  <span>ایمیل آدرس (فقط Gmail / Yahoo / Outlook):</span>
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="مثال: name@gmail.com"
                  className="w-full bg-black/60 border border-white/15 px-3.5 py-2 text-xs rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 font-mono dir-ltr text-right"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-purple-400" />
                    <span>رمز عبور (حداقل ۸ کاراکتر شامل حرف و عدد):</span>
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black/60 border border-white/15 px-3 py-2 text-xs rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 font-mono dir-ltr text-right"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-purple-400" />
                    <span>تکرار رمز عبور:</span>
                  </label>
                  <input
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-black/60 border border-white/15 px-3 py-2 text-xs rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 font-mono dir-ltr text-right"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 neu-button bg-purple-600 text-white font-bold text-xs rounded-xl hover:bg-purple-500 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <span>در حال ثبت‌نام...</span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>تکمیل ثبت‌نام و ساخت حساب</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* 3. FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                لطفاً ایمیل یا شماره همراه ثبت‌شده هنگام ساخت حساب کاربری خود را وارد کنید تا لینک بازیابی ارسال شود:
              </p>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-yellow-400" />
                  <span>ایمیل یا شماره همراه:</span>
                </label>
                <input
                  type="text"
                  value={forgotIdentifier}
                  onChange={(e) => setForgotIdentifier(e.target.value)}
                  placeholder="ایمیل یا ۰۹۱۲..."
                  className="w-full bg-black/60 border border-white/15 px-3.5 py-2.5 text-xs rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-yellow-400 font-mono dir-ltr text-right"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setErrorMsg(null); setSuccessMsg(null); }}
                  className="px-4 py-2.5 bg-black/40 border border-white/10 text-xs font-bold text-slate-300 rounded-xl hover:bg-white/5 transition-all flex items-center gap-1"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>بازگشت به ورود</span>
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2.5 bg-yellow-400 text-black font-bold text-xs rounded-xl hover:bg-yellow-300 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {isLoading ? 'در حال ارسال...' : 'ارسال لینک بازیابی'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Note */}
        <div className="p-3 bg-black/60 border-t border-white/10 text-center text-xs font-bold text-slate-300 flex items-center justify-center gap-1.5">
          <span>🔒</span>
          <span>تمامی اطلاعات شما به صورت رمزنگاری‌شده در سرور Auto run حفاظت می‌شود.</span>
        </div>
      </div>
    </div>
  );
};
