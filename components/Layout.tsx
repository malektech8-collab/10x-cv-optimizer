
import React, { useState, useEffect } from 'react';
import { Languages, LogOut, History, User, Menu, X, BookOpen, Sparkles, MessageSquare } from 'lucide-react';
import { translations, Language } from '../constants/translations';
import { AuthModal } from './AuthModal';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { ContactModal } from './ContactModal';

interface LayoutProps {
  children: React.ReactNode;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onHomeClick?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, lang, onLanguageChange, onHomeClick }) => {
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

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col" dir={t.dir}>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} lang={lang} />
      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} lang={lang} />

      {/* Announcement Banner */}
      <div className="bg-[#2D1065] py-2 px-4 no-print text-center">
        <p className="text-white text-xs font-medium flex items-center justify-center gap-2 tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-[#E8D48B] flex-shrink-0" />
          {t.nav.announcement}
        </p>
      </div>

      {/* Navigation */}
      <nav className="bg-white border-b border-[#E8E2F0] sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">

            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2.5 cursor-pointer shrink-0"
              onClick={() => {
                if (onHomeClick) onHomeClick();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setIsMenuOpen(false);
              }}
            >
              <img src="/brand-assets/10-x logo.png" alt="10-x" className="w-9 h-9 rounded-lg" />
              <span className="text-[17px] font-bold text-[#150D30] tracking-tight">
                {t.brand.name}<span className="text-[#C9984A]">{t.brand.suffix}</span>
              </span>
            </Link>

            {/* Right side */}
            <div className="flex items-center gap-1 sm:gap-2">

              {/* Desktop nav links */}
              <div className="hidden lg:flex items-center gap-1 me-2">
                <Link
                  to="/blog"
                  className="text-sm font-medium text-slate-600 hover:text-[#2D1065] hover:bg-[#F2EEF9] px-3 py-2 rounded-lg transition-all"
                >
                  {t.nav.blog}
                </Link>
                {user && userRole !== 'individual_user' && (
                  <Link
                    to="/admin"
                    className="text-sm font-medium text-[#9B4DCA] hover:text-[#2D1065] hover:bg-[#F2EEF9] px-3 py-2 rounded-lg transition-all"
                  >
                    {t.nav.adminPanel}
                  </Link>
                )}
              </div>

              {/* Language toggle */}
              <div className="hidden sm:block border-s border-[#E8E2F0] ps-2">
                <button
                  onClick={() => onLanguageChange(lang === 'en' ? 'ar' : 'en')}
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-[#2D1065] hover:bg-[#F2EEF9] px-3 py-2 rounded-lg transition-all"
                >
                  <Languages className="w-4 h-4" />
                  {lang === 'en' ? 'العربية' : 'English'}
                </button>
              </div>

              {/* Auth area */}
              {user ? (
                <div className="flex items-center gap-1.5 ms-1">
                  <Link
                    to="/dashboard"
                    className="hidden md:flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-[#2D1065] hover:bg-[#F2EEF9] px-3 py-2 rounded-lg transition-all"
                  >
                    <History className="w-4 h-4" />
                    {t.nav.dashboard}
                  </Link>
                  <div className="hidden sm:flex items-center gap-1.5 bg-[#F2EEF9] px-3 py-1.5 rounded-lg border border-[#E8E2F0]">
                    <User className="w-3.5 h-3.5 text-[#2D1065]" />
                    <span className="text-xs font-medium text-[#2D1065] truncate max-w-[80px]">
                      {user.email?.split('@')[0]}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title={t.nav.signOut}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="ms-1 bg-[#2D1065] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#220C4E] transition-colors shadow-[0_2px_8px_rgba(45,16,101,0.25)]"
                >
                  {t.nav.signIn}
                </button>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden ms-1 p-2 text-slate-600 hover:bg-[#F2EEF9] rounded-lg transition-all"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-[#E8E2F0] bg-white animate-fade-in">
            <div className="px-4 py-4 space-y-1.5">
              <Link
                to="/blog"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#150D30] bg-[#F2EEF9] rounded-xl hover:bg-[#E8E2F0] transition-colors"
              >
                <BookOpen className="w-4 h-4 text-[#9B4DCA]" />
                {t.nav.blog}
              </Link>

              {user && userRole !== 'individual_user' && (
                <Link
                  to="/admin"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-[#9B4DCA] bg-purple-50 rounded-xl"
                >
                  <User className="w-4 h-4" />
                  {t.nav.adminPanel}
                </Link>
              )}

              {user && (
                <Link
                  to="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-[#150D30] bg-[#F2EEF9] rounded-xl"
                >
                  <History className="w-4 h-4 text-[#2D1065]" />
                  {t.nav.dashboard}
                </Link>
              )}

              <button
                onClick={() => { setIsContactOpen(true); setIsMenuOpen(false); }}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-[#150D30] bg-[#F2EEF9] rounded-xl"
              >
                <MessageSquare className="w-4 h-4 text-[#9B4DCA]" />
                {t.nav.support}
              </button>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => { onLanguageChange(lang === 'en' ? 'ar' : 'en'); setIsMenuOpen(false); }}
                  className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-[#2D1065] border border-[#E8E2F0] rounded-xl bg-white"
                >
                  <Languages className="w-4 h-4" />
                  {lang === 'en' ? 'العربية' : 'English'}
                </button>

                {user ? (
                  <button
                    onClick={() => { handleSignOut(); setIsMenuOpen(false); }}
                    className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-red-500 border border-red-100 rounded-xl bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    {t.nav.signOut}
                  </button>
                ) : (
                  <button
                    onClick={() => { setIsAuthModalOpen(true); setIsMenuOpen(false); }}
                    className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-[#2D1065] rounded-xl"
                  >
                    {t.nav.signIn}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E8E2F0] py-10 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-5">
          <div className="flex items-center gap-3">
            <img src="/brand-assets/10-x logo.png" alt="10-x" className="w-7 h-7" />
            <span className="font-bold text-[#150D30]">
              {t.brand.name}<span className="text-[#C9984A]">{t.brand.suffix}</span>
            </span>
            <span className="text-[#E8E2F0] select-none">|</span>
            <p className="text-slate-400 text-sm">
              {lang === 'en'
                ? `© ${new Date().getFullYear()}. All Rights Reserved.`
                : `© ${new Date().getFullYear()}. جميع الحقوق محفوظة.`}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/privacy-policy" className="text-sm text-slate-400 hover:text-[#2D1065] transition-colors">
              {t.nav.privacyPolicy}
            </Link>
            <Link to="/refund-policy" className="text-sm text-slate-400 hover:text-[#C9984A] transition-colors">
              {t.nav.refundPolicy}
            </Link>
            <button
              onClick={() => setIsContactOpen(true)}
              className="text-sm text-slate-400 hover:text-[#2D1065] transition-colors"
            >
              {t.nav.support}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
