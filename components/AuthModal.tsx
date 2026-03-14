
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#150D30]/60 backdrop-blur-sm animate-fade-in" dir={t.dir}>
      <div className="bg-white w-full max-w-md rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.12)] overflow-hidden relative border border-[#E8E2F0]">
        <button
          onClick={onClose}
          className={`absolute top-5 ${lang === 'ar' ? 'left-5' : 'right-5'} p-2 text-slate-400 hover:text-[#2D1065] hover:bg-slate-100 rounded-lg transition-all`}
        >
          <X className="w-5 h-5" />
        </button>

        {!isFirebaseConfigured ? (
          <div className="p-8 space-y-6 text-center">
            <div className="bg-amber-50 w-14 h-14 rounded-xl flex items-center justify-center mx-auto">
              <Database className="w-7 h-7 text-[#C9984A]" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-[#2D1065]">Setup Required</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                To enable authentication and history, please configure your Firebase environment variables.
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl text-left font-mono text-xs space-y-1.5 border border-slate-100">
              <div className="text-[#9B4DCA]">VITE_FIREBASE_API_KEY</div>
              <div className="text-slate-400">VITE_FIREBASE_PROJECT_ID</div>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 bg-[#2D1065] text-white rounded-xl font-medium text-base hover:bg-[#220C4E] transition-colors shadow-[0_2px_8px_rgba(45,16,101,0.25)]"
            >
              Got it
            </button>
          </div>
        ) : (
          <div className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-[#150D30]">{t.auth.title}</h2>
              <p className="text-slate-500 text-sm leading-relaxed">{t.auth.subtitle}</p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#150D30]">{t.auth.email}</label>
                <div className="relative">
                  <input
                    required
                    type="email"
                    className={`w-full px-4 py-2.5 bg-[#FAF9F7] border border-[#E8E2F0] rounded-xl focus:ring-2 focus:ring-[#9B4DCA]/30 focus:border-[#9B4DCA] transition-all outline-none text-sm text-[#150D30] placeholder:text-slate-400 ${lang === 'ar' ? 'pr-11' : 'pl-11'}`}
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Mail className={`absolute top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5 ${lang === 'ar' ? 'right-4' : 'left-4'}`} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#150D30]">{t.auth.password}</label>
                <div className="relative">
                  <input
                    required
                    type="password"
                    className={`w-full px-4 py-2.5 bg-[#FAF9F7] border border-[#E8E2F0] rounded-xl focus:ring-2 focus:ring-[#9B4DCA]/30 focus:border-[#9B4DCA] transition-all outline-none text-sm text-[#150D30] placeholder:text-slate-400 ${lang === 'ar' ? 'pr-11' : 'pl-11'}`}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Lock className={`absolute top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5 ${lang === 'ar' ? 'right-4' : 'left-4'}`} />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">
                  {error}
                </div>
              )}

              <button
                disabled={loading}
                type="submit"
                className="w-full py-3 bg-[#2D1065] text-white rounded-xl font-medium text-base hover:bg-[#220C4E] transition-colors shadow-[0_2px_8px_rgba(45,16,101,0.25)] flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? t.auth.signUp : t.auth.signIn)}
                {!loading && <ArrowRight className={`w-5 h-5 ${lang === 'ar' ? 'rotate-180' : ''}`} />}
              </button>
            </form>

            <div className="relative flex items-center">
              <div className="flex-grow border-t border-[#E8E2F0]"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-medium">OR</span>
              <div className="flex-grow border-t border-[#E8E2F0]"></div>
            </div>

            <button
              disabled={loading}
              onClick={handleGoogleSignIn}
              type="button"
              className="w-full py-3 bg-white border border-[#E8E2F0] text-[#150D30] rounded-xl font-medium text-sm hover:bg-[#FAF9F7] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5">
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
                className="text-sm font-medium text-[#9B4DCA] hover:text-[#2D1065] transition-colors"
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
