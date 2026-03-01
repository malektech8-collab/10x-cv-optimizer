
import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { FileUpload } from '../components/FileUpload';
import { ResumePreview } from '../components/ResumePreview';
import { HistoryView } from '../components/HistoryView';
import { AppStatus, AnalysisReport } from '../types';
import { optimizeResume, analyzeResume } from '../services/geminiService';
import { AnalysisView } from '../components/AnalysisView';
import { translations, Language } from '../constants/translations';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { collection, addDoc, updateDoc, query, where, getDocs, doc, orderBy } from 'firebase/firestore';
import { Loader2, Sparkles, Wand2, ShieldCheck, Zap, ArrowRight, CheckCircle2, FileUp, Cpu, Download } from 'lucide-react';

interface HomeProps {
  lang: Language;
  setLang: (lang: Language) => void;
}

export const Home: React.FC<HomeProps> = ({ lang, setLang }) => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [targetLang, setTargetLang] = useState<Language>(lang);
  const [optimizedHtml, setOptimizedHtml] = useState<string>('');
  const [analysisReport, setAnalysisReport] = useState<AnalysisReport | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [fileType, setFileType] = useState<string>('');
  const [currentFilename, setCurrentFilename] = useState<string>('');
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [viewingHistory, setViewingHistory] = useState(false);
  const [currentOptimizationId, setCurrentOptimizationId] = useState<string | null>(null);
  const [userComments, setUserComments] = useState<string>('');

  const t = translations[lang];

  const handleFileSelect = async (file: File) => {
    setStatus(AppStatus.ANALYZING);
    setError(null);
    setIsPaid(false);
    setCurrentFilename(file.name);
    setFileType(file.type);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);

      const base64Data = await base64Promise;
      setFileBase64(base64Data);

      const report = await analyzeResume(base64Data, file.type, targetLang);
      setAnalysisReport(report);

      setStatus(AppStatus.ANALYSIS_COMPLETED);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setError(err.message || 'An unexpected error occurred during analysis.');
      setStatus(AppStatus.ERROR);
    }
  };

  const handleStartOptimization = async () => {
    setStatus(AppStatus.PROCESSING);
    setError(null);
    try {
      // Check if we already have a recent optimization for this file to save quota
      if (isFirebaseConfigured) {
        const user = auth.currentUser;
        if (user) {
          const qRecent = query(
            collection(db, 'optimizations'),
            where('user_id', '==', user.uid),
            where('original_filename', '==', currentFilename),
            orderBy('created_at', 'desc')
          );
          const querySnapshot = await getDocs(qRecent);

          if (!querySnapshot.empty) {
            const existingDoc = querySnapshot.docs[0].data();
            setOptimizedHtml(existingDoc.html_content);
            setCurrentOptimizationId(querySnapshot.docs[0].id);
            setIsPaid(existingDoc.is_paid || true);
            setStatus(AppStatus.COMPLETED);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return; // Exit early, no need to call Gemini
          }
        }
      }

      const html = await optimizeResume(fileBase64, fileType, targetLang, userComments);
      setOptimizedHtml(html);

      // Save to Firebase if configured and user is logged in
      if (isFirebaseConfigured) {
        const user = auth.currentUser;
        if (user) {
          const orderNum = `ORD-${Date.now().toString().slice(-6)}${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
          const docRef = await addDoc(collection(db, 'optimizations'), {
            user_id: user.uid,
            original_filename: currentFilename,
            html_content: html,
            is_paid: true, // TEMPORARY TESTING BYPASS
            order_number: orderNum,
            created_at: new Date().toISOString()
          });
          setCurrentOptimizationId(docRef.id);
        }
      }

      setIsPaid(true); // TEMPORARY TESTING BYPASS
      setStatus(AppStatus.COMPLETED);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Optimization failed:', err);
      setError(err.message || 'An unexpected error occurred during optimization.');
      setStatus(AppStatus.ERROR);
    }
  };

  const handlePaymentConfirm = async () => {
    setIsPaid(true);
    // Update record in Firebase if configured and user is logged in
    if (isFirebaseConfigured && currentOptimizationId) {
      try {
        await updateDoc(doc(db, 'optimizations', currentOptimizationId), { is_paid: true });
      } catch (err) {
        console.error("Failed to update payment status", err);
      }
    }
  };

  const handleReset = () => {
    setOptimizedHtml('');
    setAnalysisReport(null);
    setFileBase64('');
    setStatus(AppStatus.IDLE);
    setIsPaid(false);
    setError(null);
    setViewingHistory(false);
    setCurrentOptimizationId(null);
    setUserComments('');
  };

  const handleHistorySelect = (html: string, filename: string, paid: boolean) => {
    setOptimizedHtml(html);
    setCurrentFilename(filename);
    setIsPaid(paid);
    setStatus(AppStatus.COMPLETED);
    setViewingHistory(false);
  };

  return (
    <Layout
      lang={lang}
      onLanguageChange={setLang}
      onHistoryClick={() => {
        if (isFirebaseConfigured) {
          setViewingHistory(true);
          setStatus(AppStatus.IDLE);
          setOptimizedHtml('');
        }
      }}
      onHomeClick={handleReset}
    >
      {viewingHistory && isFirebaseConfigured ? (
        <HistoryView
          lang={lang}
          onSelect={handleHistorySelect}
          onBack={handleReset}
        />
      ) : (
        <>
          {status === AppStatus.IDLE && (
            <section className="pt-16 sm:pt-24 pb-12 sm:pb-16 px-4 no-print hero-gradient overflow-hidden">
              <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8 animate-fade-in relative">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 sm:px-5 sm:py-2 bg-[#FFEF5F]/30 text-[#4D2B8C] rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest border border-[#EEA727]/20 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#EEA727]" />
                  <span>{t.hero.badge}</span>
                </div>
                <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-[#4D2B8C] tracking-tight leading-[1] md:leading-[0.9]">
                  {t.hero.title} <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#85409D] to-[#EEA727]">
                    {t.hero.titleAccent}
                  </span>
                </h1>
                <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed px-4">
                  {t.hero.subtitle}
                </p>
              </div>
            </section>
          )}

          <section className={`pb-24 px-4 ${status === AppStatus.IDLE ? '-mt-8' : 'pt-12'}`}>
            <div className="max-w-7xl mx-auto">
              {status === AppStatus.IDLE && (
                <>
                  <FileUpload
                    onFileSelect={handleFileSelect}
                    isLoading={status === AppStatus.PROCESSING}
                    lang={lang}
                    targetLang={targetLang}
                    onTargetLangChange={setTargetLang}
                  />

                  <div className="mt-12 sm:mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 no-print">
                    {t.features.map((feature, idx) => (
                      <div key={idx} className="bg-white p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-xl shadow-indigo-100/40 flex flex-col gap-4 sm:gap-6 hover:border-[#EEA727]/30 transition-all group cursor-default">
                        <div className={`p-4 sm:p-5 rounded-2xl w-fit transition-transform group-hover:scale-110 duration-300 ${idx === 0 ? 'bg-indigo-50 text-[#4D2B8C]' : idx === 1 ? 'bg-[#FFEF5F]/20 text-[#EEA727]' : 'bg-purple-50 text-[#85409D]'}`}>
                          {idx === 0 ? <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8" /> : idx === 1 ? <Zap className="w-7 h-7 sm:w-8 sm:h-8" /> : <Wand2 className="w-7 h-7 sm:w-8 sm:h-8" />}
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                          <h3 className="font-black text-xl sm:text-2xl text-[#4D2B8C] tracking-tight">{feature.title}</h3>
                          <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-bold">{feature.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div id="how-it-works" className="mt-36 no-print scroll-mt-24">
                    <div className="text-center mb-20 space-y-4">
                      <h2 className="text-5xl font-black text-[#4D2B8C] tracking-tight">{t.howItWorks.title}</h2>
                      <p className="text-slate-500 text-lg max-w-xl mx-auto font-bold">{t.howItWorks.subtitle}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
                      <div className="hidden md:block absolute top-[60px] left-0 w-full h-1 bg-slate-50 -z-10"></div>

                      {t.howItWorks.steps.map((step, idx) => (
                        <div key={idx} className="flex flex-col items-center text-center space-y-8">
                          <div className="bg-white border-[12px] border-[#fdfcff] p-8 rounded-[2.5rem] shadow-xl ring-1 ring-slate-100 relative">
                            <span className="absolute -top-4 -right-4 w-10 h-10 bg-[#EEA727] text-white rounded-full flex items-center justify-center text-lg font-black shadow-lg">
                              {idx + 1}
                            </span>
                            {idx === 0 ? <FileUp className="w-12 h-12 text-[#4D2B8C]" /> : idx === 1 ? <Cpu className="w-12 h-12 text-[#85409D]" /> : <Download className="w-12 h-12 text-[#EEA727]" />}
                          </div>
                          <div className="space-y-4">
                            <h4 className="font-black text-2xl text-[#4D2B8C]">{step.title}</h4>
                            <p className="text-slate-500 leading-relaxed font-bold text-sm px-4">{step.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div id="pricing" className="mt-40 no-print scroll-mt-24">
                    <div className="max-w-2xl mx-auto bg-white rounded-[3rem] border border-indigo-50 shadow-[0_40px_80px_-12px_rgba(77,43,140,0.1)] overflow-hidden">
                      <div className="p-12 text-center space-y-4 border-b border-slate-50 bg-[#4D2B8C]">
                        <h2 className="text-4xl font-black text-[#FFEF5F] tracking-tight">{t.pricing.title}</h2>
                        <p className="text-indigo-100 font-bold opacity-80">{t.pricing.subtitle}</p>
                      </div>
                      <div className="p-12">
                        <div className="text-center mb-12">
                          <div className="flex items-center justify-center gap-3">
                            <span className="text-7xl sm:text-8xl font-black text-[#4D2B8C] tracking-tighter uppercase">{t.pricing.currency}</span>
                          </div>
                          <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs mt-6">{t.pricing.per}</p>
                        </div>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-10 mb-12">
                          {t.pricing.features.map((item, i) => (
                            <li key={i} className="flex items-start gap-4 text-slate-700">
                              <CheckCircle2 className="w-6 h-6 text-[#EEA727] flex-shrink-0 mt-0.5" />
                              <span className="text-sm font-extrabold">{item}</span>
                            </li>
                          ))}
                        </ul>
                        <button
                          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                          className="w-full py-6 bg-[#85409D] text-white rounded-[2rem] font-black text-xl hover:bg-[#4D2B8C] transition-all shadow-xl shadow-purple-100 flex items-center justify-center gap-4 transform hover:-translate-y-1"
                        >
                          {t.pricing.button}
                          <ArrowRight className={`w-7 h-7 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                        </button>
                        <p className="text-center text-xs text-slate-400 font-black uppercase tracking-widest mt-8">{t.pricing.footer}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {status === AppStatus.ANALYZING && (
                <div className="flex flex-col items-center justify-center py-32 space-y-10">
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#85409D] blur-[80px] opacity-20 animate-pulse rounded-full"></div>
                    <div className="relative bg-white p-12 rounded-[3rem] shadow-2xl ring-1 ring-slate-50">
                      <Loader2 className="w-24 h-24 text-[#85409D] animate-spin" />
                    </div>
                  </div>
                  <div className="text-center space-y-5">
                    <h3 className="text-4xl font-black text-[#4D2B8C] tracking-tight">Analyzing Your CV</h3>
                    <p className="text-slate-500 text-xl font-bold">Scanning structure, checking ATS compatibility, and finding weak verbs...</p>
                    <div className="flex gap-3 justify-center">
                      {[0, 1, 2].map(i => (
                        <div key={i} className={`w-4 h-4 bg-[#EEA727] rounded-full animate-bounce`} style={{ animationDelay: `${i * 0.15}s` }}></div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {status === AppStatus.ANALYSIS_COMPLETED && analysisReport && (
                <AnalysisView
                  report={analysisReport}
                  onOptimize={handleStartOptimization}
                  lang={lang}
                  userComments={userComments}
                  setUserComments={setUserComments}
                />
              )}

              {status === AppStatus.PROCESSING && (
                <div className="flex flex-col items-center justify-center py-32 space-y-10">
                  <div className="relative">
                    <div className="absolute inset-0 bg-[#EEA727] blur-[80px] opacity-20 animate-pulse rounded-full"></div>
                    <div className="relative bg-white p-12 rounded-[3rem] shadow-2xl ring-1 ring-slate-50">
                      <Loader2 className="w-24 h-24 text-[#85409D] animate-spin" />
                    </div>
                  </div>
                  <div className="text-center space-y-5">
                    <h3 className="text-4xl font-black text-[#4D2B8C] tracking-tight">{t.status.optimizing}</h3>
                    <p className="text-slate-500 text-xl font-bold">{t.status.analyzing}</p>
                    <div className="flex gap-3 justify-center">
                      {[0, 1, 2].map(i => (
                        <div key={i} className={`w-4 h-4 bg-[#EEA727] rounded-full animate-bounce`} style={{ animationDelay: `${i * 0.15}s` }}></div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {status === AppStatus.ERROR && (
                <div className="flex flex-col items-center justify-center py-32">
                  <div className="bg-red-50 p-16 rounded-[3rem] border border-red-100 text-center max-w-xl space-y-8 shadow-2xl shadow-red-100/50">
                    <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                      <Zap className="w-10 h-10 text-red-600" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-3xl font-black text-red-900 tracking-tight">{t.status.error}</h3>
                      <p className="text-red-700 font-bold leading-relaxed text-lg">{error}</p>
                    </div>
                    <button
                      onClick={handleReset}
                      className="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-xl hover:bg-red-700 transition-all shadow-xl shadow-red-100"
                    >
                      {t.status.tryAgain}
                    </button>
                  </div>
                </div>
              )}

              {status === AppStatus.COMPLETED && optimizedHtml && (
                <ResumePreview
                  html={optimizedHtml}
                  onReset={handleReset}
                  isPaid={isPaid}
                  onPaymentConfirm={handlePaymentConfirm}
                  lang={lang}
                />
              )}
            </div>
          </section>
        </>
      )}
    </Layout>
  );
};


