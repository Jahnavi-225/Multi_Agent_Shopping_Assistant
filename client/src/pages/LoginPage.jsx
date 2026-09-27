import React, { useState } from 'react';
import { Smartphone, Mail, ArrowRight, UserCheck, Key, ArrowLeft, ShoppingBag, Moon, Sun, Tag, Sparkles, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

export default function LoginPage({ onBackToHome, onSuccess }) {
  const {
    hasFirebaseKeys,
    loginGoogle,
    verifyGoogleEmailOtp,
    requestPhoneSMS,
    loginPhone
  } = useAuth();

  const { theme, setTheme } = useTheme();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('google'); // 'google' | 'phone'

  const googleAccounts = [
    { name: "Alex Shopper", email: "alex.shopper@gmail.com", avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80" },
    { name: "Sarah Jenkins", email: "sarah.j@google.com", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80" }
  ];

  const [phone, setPhone] = useState('+91 9876543210');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleOtpPending, setGoogleOtpPending] = useState(false);
  const [googleOtpEmail, setGoogleOtpEmail] = useState('');
  const [googleOtp, setGoogleOtp] = useState('');

  const formatFirebaseError = (err) => {
    if (!err) return 'An unexpected error occurred.';
    let rawStr = typeof err === 'string' ? err : (err.message || JSON.stringify(err));
    let friendly = rawStr;
    if (rawStr.includes('auth/operation-not-allowed')) {
      friendly = 'Phone sign-in is disabled in Firebase Console.';
    } else if (rawStr.includes('auth/invalid-phone-number')) {
      friendly = 'Invalid phone number format. Please include country code (+91).';
    } else if (rawStr.includes('auth/quota-exceeded')) {
      friendly = 'SMS request limit reached.';
    } else if (rawStr.includes('auth/invalid-verification-code')) {
      friendly = 'Invalid 6-digit OTP code.';
    } else if (rawStr.includes('auth/popup-closed-by-user')) {
      friendly = 'The Google sign-in window closed before finishing. Check Firebase Console → Authentication → Settings → Authorized domains.';
    } else if (rawStr.includes('auth/unauthorized-domain')) {
      friendly = 'This domain is not authorized for Google sign-in.';
    } else if (rawStr.includes('auth/popup-blocked')) {
      friendly = 'Your browser blocked the sign-in popup. Allow popups for this site.';
    }
    return friendly;
  };

  const handleGoogleResult = (res) => {
    if (!res.success) {
      const err = formatFirebaseError(res.error);
      setErrorMsg(err);
      if (addToast) addToast(err, 'error');
      return;
    }
    if (res.requiresOtp) {
      setGoogleOtpEmail(res.email);
      setGoogleOtpPending(true);
      setStatusMsg(res.demo_otp ? `${res.message} (demo code: ${res.demo_otp})` : res.message);
    } else if (onSuccess) {
      onSuccess();
    }
  };

  const handleRealGoogleClick = async () => {
    setErrorMsg('');
    setLoading(true);
    const res = await loginGoogle();
    setLoading(false);
    handleGoogleResult(res);
  };

  const handleDemoGoogleAccount = async (acc) => {
    setErrorMsg('');
    setLoading(true);
    const res = await loginGoogle(acc.name, acc.email);
    setLoading(false);
    handleGoogleResult(res);
  };

  const handleVerifyGoogleOtp = async (e) => {
    e.preventDefault();
    if (!googleOtp.trim()) return;
    setErrorMsg('');
    setLoading(true);
    const res = await verifyGoogleEmailOtp(googleOtp.trim());
    setLoading(false);
    if (!res.success) {
      const err = formatFirebaseError(res.error);
      setErrorMsg(err);
      if (addToast) addToast(err, 'error');
    } else {
      setGoogleOtpPending(false);
      if (onSuccess) onSuccess();
    }
  };

  const handleSendSMS = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setErrorMsg('');
    setLoading(true);
    const res = await requestPhoneSMS(phone.trim());
    setLoading(false);
    if (res.success) {
      setOtpSent(true);
      setStatusMsg(res.message || 'OTP sent!');
      if (addToast) addToast('Verification code sent!', 'info');
    } else {
      const err = formatFirebaseError(res.error);
      setErrorMsg(err);
      if (addToast) addToast(err, 'error');
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp.trim()) return;
    setErrorMsg('');
    setLoading(true);
    const res = await loginPhone(phone.trim(), otp.trim());
    setLoading(false);
    if (!res.success) {
      const err = formatFirebaseError(res.error);
      setErrorMsg(err);
      if (addToast) addToast(err, 'error');
    } else {
      if (onSuccess) onSuccess();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between font-sans relative overflow-hidden transition-colors">

      <div id="recaptcha-container"></div>

      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15], x: [-20, 20, -20] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.12, 0.22, 0.12], y: [-20, 20, -20] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"
      />

      <motion.div
        animate={{ y: [0, -12, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-24 left-[12%] text-indigo-500/15 pointer-events-none hidden sm:block"
      >
        <ShoppingBag className="w-12 h-12" />
      </motion.div>

      <motion.div
        animate={{ y: [0, 14, 0], rotate: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-24 right-[12%] text-emerald-500/15 pointer-events-none hidden sm:block"
      >
        <Tag className="w-10 h-10" />
      </motion.div>

      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/3 right-[18%] text-amber-500/20 pointer-events-none hidden sm:block"
      >
        <Sparkles className="w-8 h-8" />
      </motion.div>

      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-1/3 left-[15%] text-purple-500/15 pointer-events-none hidden sm:block"
      >
        <TrendingDown className="w-10 h-10" />
      </motion.div>

      <header className="p-4 sm:px-8 flex items-center justify-between relative z-10">
        {onBackToHome ? (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onBackToHome}
            className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-500 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </motion.button>
        ) : <div />}

        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
          </motion.button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 20 }}
          className="glass-card w-full max-w-md p-6 sm:p-8 relative shadow-2xl border-indigo-500/30 text-left my-auto"
        >

          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
              className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center mx-auto mb-3 text-indigo-500"
            >
              <ShoppingBag className="w-6 h-6 text-emerald-400" />
            </motion.div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              Sign In to ShopWiseAI
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Google OAuth & Phone SMS OTP authentication.
            </p>
          </div>

          {!hasFirebaseKeys && (
            <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <Key className="w-4 h-4 text-amber-500" />
                <span>Demo Mode Active</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Configure Firebase API keys in <code className="bg-amber-500/20 px-1 py-0.5 rounded font-mono text-[10px]">client/.env</code> to enable Google popups and SMS messages. Quick demo logins work instantly!
              </p>
            </div>
          )}

          <div className="flex border-b border-slate-200 dark:border-slate-800 mb-5 relative">
            <button
              onClick={() => { setActiveTab('google'); setErrorMsg(''); setStatusMsg(''); }}
              className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2 relative transition-colors ${
                activeTab === 'google'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mail className="w-4 h-4" /> Google Account
              {activeTab === 'google' && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
            <button
              onClick={() => { setActiveTab('phone'); setErrorMsg(''); setStatusMsg(''); }}
              className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2 relative transition-colors ${
                activeTab === 'phone'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-4 h-4" /> Phone SMS OTP
              {activeTab === 'phone' && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium text-center">
              {errorMsg}
            </div>
          )}

          <AnimatePresence mode="wait">
            {activeTab === 'google' ? (
              <motion.div
                key="google-tab"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.16 }}
                className="space-y-4"
              >
                {!googleOtpPending ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleRealGoogleClick}
                      disabled={loading}
                      className="w-full py-3 px-4 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold text-xs rounded-xl border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-3 shadow-md transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      <span>{loading ? 'Opening Google Window...' : 'Sign in with Google'}</span>
                    </motion.button>

                    {!hasFirebaseKeys && (
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                        <span className="text-[11px] font-semibold text-slate-400 block">Instant Demo Preview Accounts:</span>
                        {googleAccounts.map((acc, idx) => (
                          <motion.button
                            key={idx}
                            whileHover={{ scale: 1.01, x: 2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleDemoGoogleAccount(acc)}
                            className="w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-left transition-all"
                          >
                            <div className="flex items-center gap-2.5">
                              <img src={acc.avatar} alt={acc.name} className="w-7 h-7 rounded-full border border-indigo-500" />
                              <div>
                                <span className="font-bold text-xs text-slate-900 dark:text-white block">{acc.name}</span>
                                <span className="text-[10px] text-slate-400">{acc.email}</span>
                              </div>
                            </div>
                            <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <form onSubmit={handleVerifyGoogleOtp} className="space-y-4">
                    {statusMsg && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-medium flex items-center gap-2">
                        <span>{statusMsg}</span>
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Enter the 6-digit code sent to {googleOtpEmail}
                      </label>
                      <input
                        type="text"
                        value={googleOtp}
                        onChange={(e) => setGoogleOtp(e.target.value)}
                        placeholder="Check your inbox"
                        maxLength={6}
                        className="w-full px-3 py-2.5 rounded-xl text-sm bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white tracking-widest text-center font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={!googleOtp.trim() || loading}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-all"
                    >
                      <span>{loading ? 'Verifying...' : 'Verify & Sign In'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                    <button
                      type="button"
                      onClick={() => { setGoogleOtpPending(false); setGoogleOtp(''); setStatusMsg(''); }}
                      className="w-full text-[11px] text-slate-400 hover:text-slate-200"
                    >
                      Use a different account
                    </button>
                  </form>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="phone-tab"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.16 }}
                className="space-y-4"
              >
                {!otpSent ? (
                  <form onSubmit={handleSendSMS} className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Mobile Phone Number (with Country Code)
                      </label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 9876543210"
                        className="w-full px-3 py-2.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={!phone.trim() || loading}
                      className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 transition-all"
                    >
                      <span>{loading ? 'Sending OTP...' : 'Send OTP'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOTP} className="space-y-4">
                    {statusMsg && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-medium flex items-center gap-2">
                        <span>{statusMsg}</span>
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Enter 6-Digit SMS OTP Code
                      </label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder={hasFirebaseKeys ? "Check your phone SMS" : "Use demo code: 123456"}
                        maxLength={6}
                        className="w-full px-3 py-2.5 rounded-xl text-sm bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white tracking-widest text-center font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={!otp.trim() || loading}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-all"
                    >
                      <span>{loading ? 'Verifying OTP...' : 'Verify & Sign In'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </main>

      <footer className="py-4 text-center text-[11px] text-slate-500 relative z-10">
        ShopWiseAI • Secure Multi-Store Price Intelligence
      </footer>

    </div>
  );
}