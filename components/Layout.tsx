
import React, { useState, useEffect } from 'react';
import { FileBadge, Github, Twitter, Languages, LogOut, History, User } from 'lucide-react';
import { translations, Language } from '../constants/translations';
import { AuthModal } from './AuthModal';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onHistoryClick?: () => void;
  onHomeClick?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, lang, onLanguageChange, onHistoryClick, onHomeClick }) => {
  const t = translations[lang];
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<string>('individual_user');
  const navigate = useNavigate();

  useEffect(() => {
    if (!isFirebaseConfigured) return;

    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            setUserRole(snap.data().role || 'individual_user');
          } else {
            // Register new user in DB
            await setDoc(userDocRef, {
              email: currentUser.email,
              role: 'individual_user',
              createdAt: new Date().toISOString()
            });
            setUserRole('individual_user');
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      } else {
        setUserRole('individual_user');
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    if (isFirebaseConfigured) {
      await auth.signOut();
    }
  };

  const scrollToSection = (id: string) => {
    if (onHomeClick) onHomeClick();
    navigate('/');
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen flex flex-col" dir={t.dir}>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} lang={lang} />

      <nav className="bg-white border-b border-indigo-50 sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <Link to="/" className="flex items-center gap-3 cursor-pointer" onClick={() => {
              if (onHomeClick) onHomeClick();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}>
              <div className="bg-[#4D2B8C] p-2 rounded-xl shadow-lg shadow-indigo-200">
                <FileBadge className="text-[#FFEF5F] w-7 h-7" />
              </div>
              <span className="text-2xl font-black text-[#4D2B8C] tracking-tight">
                {t.brand.name}<span className="text-[#EEA727] ml-0.5">{t.brand.suffix}</span>
              </span>
            </Link>

            <div className="flex items-center gap-4 md:gap-8">
              <div className="hidden lg:flex items-center gap-8">
                <button
                  onClick={() => scrollToSection('how-it-works')}
                  className="text-sm font-bold text-slate-600 hover:text-[#85409D] transition-colors"
                >
                  {t.nav.howItWorks}
                </button>
                <button
                  onClick={() => scrollToSection('pricing')}
                  className="text-sm font-bold text-slate-600 hover:text-[#85409D] transition-colors"
                >
                  {t.nav.pricing}
                </button>
                <Link
                  to="/blog"
                  className="text-sm font-bold text-slate-600 hover:text-[#85409D] transition-colors"
                >
                  {t.nav.blog}
                </Link>
                {user && userRole !== 'individual_user' && (
                  <Link
                    to="/admin"
                    className="text-sm font-bold text-[#85409D] hover:text-[#4D2B8C] transition-colors"
                  >
                    Admin Panel
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-2 border-l border-slate-100 pl-6 h-8">
                <button
                  onClick={() => onLanguageChange(lang === 'en' ? 'ar' : 'en')}
                  className="flex items-center gap-2 text-sm font-extrabold text-[#4D2B8C] hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-all"
                >
                  <Languages className="w-4 h-4" />
                  {lang === 'en' ? 'العربية' : 'English'}
                </button>
              </div>

              {user ? (
                <div className="flex items-center gap-4">
                  <button
                    onClick={onHistoryClick}
                    className="hidden md:flex items-center gap-2 text-sm font-extrabold text-[#85409D] hover:bg-purple-50 px-3 py-1.5 rounded-lg transition-all"
                  >
                    <History className="w-4 h-4" />
                    {t.nav.history}
                  </button>
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                    <User className="w-4 h-4 text-[#4D2B8C]" />
                    <span className="text-xs font-black text-[#4D2B8C] truncate max-w-[100px]">{user.email?.split('@')[0]}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title={t.nav.signOut}
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="bg-[#4D2B8C] text-white px-6 py-2.5 rounded-xl text-sm font-extrabold hover:bg-[#85409D] transition-all shadow-md"
                >
                  {t.nav.signIn}
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-100 py-12 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-[#4D2B8C] font-black text-xl">10-x<span className="text-[#EEA727]">.online</span></span>
            <span className="text-slate-200">|</span>
            <p className="text-slate-400 text-sm font-bold">
              {lang === 'en' ? '© 2024. All Rights Reserved.' : '© 2024. جميع الحقوق محفوظة.'}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/privacy-policy" className="text-sm font-bold text-slate-400 hover:text-[#85409D] transition-colors">{t.nav.privacyPolicy}</Link>
            <Link to="/refund-policy" className="text-sm font-bold text-slate-400 hover:text-[#EEA727] transition-colors">{t.nav.refundPolicy}</Link>
            <div className="w-px h-4 bg-slate-200 mx-2"></div>
            <Twitter className="w-5 h-5 text-slate-400 cursor-pointer hover:text-[#EEA727] transition-colors" />
            <Github className="w-5 h-5 text-slate-400 cursor-pointer hover:text-[#85409D] transition-colors" />
          </div>
        </div>
      </footer>
    </div>
  );
};
