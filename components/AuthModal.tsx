
import React, { useState } from 'react';
import { X, Mail, Lock, Loader2, ArrowRight, AlertTriangle, Database } from 'lucide-react';
import { auth, isFirebaseConfigured } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { translations, Language } from '../constants/translations';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, lang }) => {
  const t = translations[lang];
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseConfigured) return;

    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || t.auth.error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!isFirebaseConfigured) return;

    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onClose();
    } catch (err: any) {
      setError(err.message || t.auth.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300" dir={t.dir}>
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden relative border border-white/20">
        <button
          onClick={onClose}
          className={`absolute top-6 ${lang === 'ar' ? 'left-6' : 'right-6'} p-3 text-slate-400 hover:text-[#4D2B8C] hover:bg-slate-100 rounded-full transition-all`}
        >
          <X className="w-6 h-6" />
        </button>

        {!isFirebaseConfigured ? (
          <div className="p-10 space-y-8 text-center animate-in zoom-in-95">
            <div className="bg-amber-50 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto shadow-sm">
              <Database className="w-10 h-10 text-[#EEA727]" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-black text-[#4D2B8C] tracking-tight">Setup Required</h2>
              <p className="text-slate-500 font-bold leading-relaxed">
                To enable authentication and history, please configure your Firebase environment variables:
              </p>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl text-left font-mono text-xs space-y-2 border border-slate-100">
              <div className="text-[#85409D]">VITE_FIREBASE_API_KEY</div>
              <div className="text-slate-400">VITE_FIREBASE_PROJECT_ID</div>
            </div>
            <button
              onClick={onClose}
              className="w-full py-4 bg-[#4D2B8C] text-white rounded-2xl font-black text-lg hover:bg-[#85409D] transition-all shadow-xl shadow-indigo-100"
            >
              Got it
            </button>
          </div>
        ) : (
          <div className="p-10 space-y-8">
            <div className="text-center space-y-3">
              <h2 className="text-4xl font-black text-[#4D2B8C] tracking-tight">{t.auth.title}</h2>
              <p className="text-slate-500 font-bold leading-relaxed">{t.auth.subtitle}</p>
            </div>

            <form onSubmit={handleAuth} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-black text-[#4D2B8C] uppercase tracking-widest px-1">{t.auth.email}</label>
                <div className="relative">
                  <input
                    required
                    type="email"
                    className={`w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#85409D] focus:border-transparent transition-all outline-none font-bold placeholder:text-slate-300 ${lang === 'ar' ? 'pr-14' : 'pl-14'}`}
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Mail className={`absolute top-1/2 -translate-y-1/2 text-[#4D2B8C] w-6 h-6 opacity-40 ${lang === 'ar' ? 'right-5' : 'left-5'}`} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-[#4D2B8C] uppercase tracking-widest px-1">{t.auth.password}</label>
                <div className="relative">
                  <input
                    required
                    type="password"
                    className={`w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-[#85409D] focus:border-transparent transition-all outline-none font-bold placeholder:text-slate-300 ${lang === 'ar' ? 'pr-14' : 'pl-14'}`}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Lock className={`absolute top-1/2 -translate-y-1/2 text-[#4D2B8C] w-6 h-6 opacity-40 ${lang === 'ar' ? 'right-5' : 'left-5'}`} />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-700 text-sm font-bold rounded-xl border border-red-100">
                  {error}
                </div>
              )}

              <button
                disabled={loading}
                type="submit"
                className="w-full py-5 bg-[#4D2B8C] text-white rounded-2xl font-black text-xl hover:bg-[#85409D] transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (isSignUp ? t.auth.signUp : t.auth.signIn)}
                {!loading && <ArrowRight className={`w-6 h-6 ${lang === 'ar' ? 'rotate-180' : ''}`} />}
              </button>
            </form>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink-0 mx-4 text-slate-300 text-sm font-bold">OR</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            <button
              disabled={loading}
              onClick={handleGoogleSignIn}
              type="button"
              className="w-full py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-black text-lg hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {lang === 'ar' ? 'المتابعة باستخدام Google' : 'Continue with Google'}
            </button>

            <div className="text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm font-bold text-[#85409D] hover:text-[#4D2B8C] transition-colors"
              >
                {isSignUp ? t.auth.hasAccount : t.auth.noAccount}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
