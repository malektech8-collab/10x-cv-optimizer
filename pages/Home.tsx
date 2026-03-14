
import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { FileUpload } from '../components/FileUpload';
import { ResumePreview } from '../components/ResumePreview';
import { AppStatus, AnalysisReport, ResumeJsonData, TemplateType } from '../types';
import { optimizeResume, analyzeResume, createResumeSession } from '../services/aiService';
import { renderResumeHTML } from '../templates/index';
import { AnalysisView } from '../components/AnalysisView';
import { translations, Language } from '../constants/translations';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { collection, addDoc, updateDoc, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useLocation } from 'react-router-dom';
import { Loader2, Sparkles, Wand2, ShieldCheck, Zap, ArrowRight, CheckCircle2, FileUp, Cpu, Download, Languages, Search, PenTool, MessageSquare, Bot } from 'lucide-react';
import { FEATURE_FLAGS } from '../constants/featureFlags';
import {
  HeroLeadMagnet, ATSUploadLeadMagnet, ExampleATSReport,
  UpgradeBenefits, AIResumeBuilderPromo, FinalCTA,
} from '../components/landing';
import { LeadCaptureModal, LeadData } from '../components/LeadCaptureModal';
import { JobTargetModal, JobTargetData } from '../components/JobTargetModal';
import { ExtrasView } from '../components/ExtrasView';
import { AIResumeInterview } from '../components/AIResumeInterview';
import { runDeterministicATS, explainScores } from '../services/ats';
import { trackEvent } from '../services/analyticsService';

interface HomeProps {
  lang: Language;
  setLang: (lang: Language) => void;
}

export const Home: React.FC<HomeProps> = ({ lang, setLang }) => {
  const location = useLocation();
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [targetLang, setTargetLang] = useState<Language>(lang);
  const [resumeJsonData, setResumeJsonData] = useState<ResumeJsonData | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('classic');
  const [legacyHtml, setLegacyHtml] = useState<string>(''); // fallback for old history items without JSON
  const [analysisReport, setAnalysisReport] = useState<AnalysisReport | null>(null);
  const [parseSessionId, setParseSessionId] = useState<string | null>(null);
  const [currentFilename, setCurrentFilename] = useState<string>('');
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentOptimizationId, setCurrentOptimizationId] = useState<string | null>(null);
  const [userComments, setUserComments] = useState<string>('');
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showJobTarget, setShowJobTarget] = useState(false);
  const [jobTarget, setJobTarget] = useState<JobTargetData | null>(null);
  const [coverLetter, setCoverLetter] = useState<any>(null);
  const [linkedinGuide, setLinkedinGuide] = useState<any>(null);
  const [showResumeBuilder, setShowResumeBuilder] = useState(false);

  const optimizedHtml = React.useMemo(() => {
    if (resumeJsonData) return renderResumeHTML(resumeJsonData, selectedTemplate, targetLang as 'en' | 'ar');
    return legacyHtml;
  }, [resumeJsonData, selectedTemplate, targetLang, legacyHtml]);

  const t = translations[lang];

  // When user signs in AFTER optimization completes (e.g. via the unlock flow),
  // save the optimization to Firestore so the optimizationId is available for payment.
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (
        user &&
        status === AppStatus.COMPLETED &&
        resumeJsonData &&
        !currentOptimizationId &&
        currentFilename
      ) {
        try {
          const renderedHtml = renderResumeHTML(resumeJsonData, selectedTemplate, targetLang as 'en' | 'ar');
          const orderNum = `ORD-${Date.now().toString().slice(-6)}${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
          const docRef = await addDoc(collection(db, 'optimizations'), {
            user_id: user.uid,
            original_filename: currentFilename,
            resume_json: resumeJsonData,
            selected_template: selectedTemplate,
            html_content: renderedHtml,
            is_paid: false,
            order_number: orderNum,
            created_at: new Date().toISOString(),
          });
          setCurrentOptimizationId(docRef.id);
        } catch (err) {
          console.error('Failed to save optimization after sign-in:', err);
        }
      }
    });
    return () => unsub();
  }, [status, resumeJsonData, currentOptimizationId, currentFilename, selectedTemplate, targetLang]);

  // Restore full state when returning from /payment-result after a successful payment.
  // Must wait for Firebase auth to restore (async after page load) before reading Firestore,
  // otherwise security rules reject the read and the user appears signed-out with a blank page.
  useEffect(() => {
    const state = location.state as any;
    if (!state?.confirmedOptimizationId || !state?.isPaid || !isFirebaseConfigured) return;

    const id = state.confirmedOptimizationId;
    let done = false;

    const restoreFromDoc = () => {
      if (done) return;
      done = true;
      getDoc(doc(db, 'optimizations', id)).then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.resume_json) {
            setResumeJsonData(data.resume_json as ResumeJsonData);
            if (data.selected_template) setSelectedTemplate(data.selected_template as TemplateType);
          } else {
            setLegacyHtml(data.html_content || '');
          }
          setCurrentFilename(data.original_filename || '');
          setCurrentOptimizationId(id);
          setIsPaid(true);
          setStatus(AppStatus.COMPLETED);
        }
      }).catch((err) => console.error('Failed to restore optimization after payment:', err));
    };

    // Try to read once auth is ready; fallback after 3s even if auth hasn't restored
    const fallbackTimer = setTimeout(restoreFromDoc, 3000);

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) return; // still restoring — wait
      unsubAuth();
      clearTimeout(fallbackTimer);
      restoreFromDoc();
    });

    return () => {
      unsubAuth();
      clearTimeout(fallbackTimer);
    };
  }, []);

  const handleFileSelect = async (file: File) => {
    // When lead magnet landing is active, show lead capture modal before analyzing
    if (FEATURE_FLAGS.leadMagnetLanding) {
      setPendingFile(file);
      setShowLeadCapture(true);
      return;
    }
    runAnalysis(file);
  };

  const handleLeadSubmit = (leadData: LeadData) => {
    setShowLeadCapture(false);
    if (pendingFile) {
      runAnalysis(pendingFile);
      setPendingFile(null);
    }
  };

  const runAnalysis = async (file: File) => {
    setStatus(AppStatus.ANALYZING);
    setError(null);
    setIsPaid(false);
    setCurrentFilename(file.name);
    trackEvent('ATS_ANALYSIS_STARTED', { filename: file.name, lang: targetLang });

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

      const { report, sessionId, parsedJson } = await analyzeResume(base64Data, file.type, targetLang);

      // When deterministic ATS flag is on, override AI scores with deterministic engine
      let finalReport = report;
      if (FEATURE_FLAGS.deterministicATS && parsedJson) {
        const atsDetail = runDeterministicATS(parsedJson, targetLang);
        const explanation = explainScores(atsDetail.scores, atsDetail.issues, atsDetail.strengths, targetLang);
        finalReport = {
          ...report,
          score: atsDetail.scores.total,
          atsCompatibility: explanation.atsCompatibility,
          summary: explanation.summary,
          structureGaps: atsDetail.issues,
          impactOptimizations: atsDetail.strengths,
          scoreBreakdown: {
            formatting: atsDetail.scores.formatting,
            keywords: atsDetail.scores.keywords,
            impact: atsDetail.scores.impact,
            structure: atsDetail.scores.structure,
          },
          issues: atsDetail.issues,
          strengths: atsDetail.strengths,
        };
      }

      setAnalysisReport(finalReport);
      setParseSessionId(sessionId);
      trackEvent('ATS_ANALYSIS_COMPLETED', { score: finalReport.score, lang: targetLang });

      setStatus(AppStatus.ANALYSIS_COMPLETED);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setError(err.message || 'An unexpected error occurred during analysis.');
      setStatus(AppStatus.ERROR);
    }
  };

  // Show job target modal before optimizing
  const handleStartOptimization = () => {
    trackEvent('OPTIMIZATION_CLICKED', { score: analysisReport?.score });
    setShowJobTarget(true);
  };

  const handleJobTargetSubmit = (data: JobTargetData) => {
    setJobTarget(data);
    setShowJobTarget(false);
    runOptimization(data);
  };

  const handleJobTargetSkip = () => {
    setShowJobTarget(false);
    runOptimization(null);
  };

  // AI Resume Builder: interview completed → create session → optimize
  const handleInterviewComplete = async (resumeData: ResumeJsonData, targetRole: string) => {
    setShowResumeBuilder(false);
    setStatus(AppStatus.PROCESSING);
    setError(null);
    setCurrentFilename('AI Resume Builder');

    try {
      const { sessionId } = await createResumeSession(resumeData, targetLang);
      setParseSessionId(sessionId);

      const jobTargetParam = targetRole ? { jobTitle: targetRole } : undefined;

      const { resumeData: jsonData, coverLetter: cl, linkedinGuide: lg } = await optimizeResume(
        sessionId, targetLang, '', undefined, jobTargetParam,
      );
      setCoverLetter(cl || null);
      setLinkedinGuide(lg || null);
      setResumeJsonData(jsonData);
      const renderedHtml = renderResumeHTML(jsonData, selectedTemplate, targetLang as 'en' | 'ar');

      if (isFirebaseConfigured) {
        const user = auth.currentUser;
        if (user) {
          const orderNum = `ORD-${Date.now().toString().slice(-6)}${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
          const docRef = await addDoc(collection(db, 'optimizations'), {
            user_id: user.uid,
            original_filename: 'AI Resume Builder',
            resume_json: jsonData,
            selected_template: selectedTemplate,
            html_content: renderedHtml,
            is_paid: false,
            order_number: orderNum,
            created_at: new Date().toISOString(),
          });
          setCurrentOptimizationId(docRef.id);
        }
      }

      setStatus(AppStatus.COMPLETED);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Resume builder optimization failed:', err);
      setError(err.message || 'An unexpected error occurred.');
      setStatus(AppStatus.ERROR);
    }
  };

  const runOptimization = async (target: JobTargetData | null) => {
    setStatus(AppStatus.PROCESSING);
    setError(null);
    try {
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
            if (existingDoc.resume_json) {
              setResumeJsonData(existingDoc.resume_json as ResumeJsonData);
              if (existingDoc.selected_template) setSelectedTemplate(existingDoc.selected_template as TemplateType);
            } else {
              setLegacyHtml(existingDoc.html_content || '');
            }
            setCurrentOptimizationId(querySnapshot.docs[0].id);
            setIsPaid(existingDoc.is_paid || true);
            setStatus(AppStatus.COMPLETED);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
          }
        }
      }

      const jobTargetParam = target ? {
        jobTitle: target.jobTitle || undefined,
        industry: target.industry || undefined,
        jobDescription: target.jobDescription || undefined,
      } : undefined;

      const { resumeData: jsonData, coverLetter: cl, linkedinGuide: lg } = await optimizeResume(
        parseSessionId!, targetLang, userComments, currentOptimizationId || undefined, jobTargetParam,
      );
      setCoverLetter(cl || null);
      setLinkedinGuide(lg || null);
      setResumeJsonData(jsonData);
      const renderedHtml = renderResumeHTML(jsonData, selectedTemplate, targetLang as 'en' | 'ar');

      if (isFirebaseConfigured) {
        const user = auth.currentUser;
        if (user && !currentOptimizationId) {
          const orderNum = `ORD-${Date.now().toString().slice(-6)}${Math.random().toString(36).substring(2, 4).toUpperCase()}`;
          const docRef = await addDoc(collection(db, 'optimizations'), {
            user_id: user.uid,
            original_filename: currentFilename,
            resume_json: jsonData,
            selected_template: selectedTemplate,
            html_content: renderedHtml,
            is_paid: false,
            order_number: orderNum,
            created_at: new Date().toISOString()
          });
          setCurrentOptimizationId(docRef.id);
        } else if (user && currentOptimizationId) {
          await updateDoc(doc(db, 'optimizations', currentOptimizationId), {
            original_filename: currentFilename,
            resume_json: jsonData,
            selected_template: selectedTemplate,
            html_content: renderedHtml,
          });
        }
      }

      setStatus(AppStatus.COMPLETED);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Optimization failed:', err);
      setError(err.message || 'An unexpected error occurred during optimization.');
      setStatus(AppStatus.ERROR);
    }
  };

  const handlePaymentConfirm = async (optimizationId: string) => {
    setCurrentOptimizationId(optimizationId);
    setIsPaid(true);
    trackEvent('PAYMENT_COMPLETED', { optimizationId });
  };

  const handleTemplateChange = async (newTemplate: TemplateType) => {
    setSelectedTemplate(newTemplate);
    if (currentOptimizationId && resumeJsonData && isFirebaseConfigured) {
      const newHtml = renderResumeHTML(resumeJsonData, newTemplate, targetLang as 'en' | 'ar');
      updateDoc(doc(db, 'optimizations', currentOptimizationId), {
        selected_template: newTemplate,
        html_content: newHtml,
      }).catch((err) => console.error('Failed to save template preference:', err));
    }
  };

  const handleReset = () => {
    setResumeJsonData(null);
    setSelectedTemplate('classic');
    setLegacyHtml('');
    setAnalysisReport(null);
    setParseSessionId(null);
    setStatus(AppStatus.IDLE);
    setIsPaid(false);
    setError(null);
    setCurrentOptimizationId(null);
    setUserComments('');
    setJobTarget(null);
    setCoverLetter(null);
    setLinkedinGuide(null);
    setShowResumeBuilder(false);
  };

  const featureIcons = [
    <Search className="w-5 h-5" />,
    <PenTool className="w-5 h-5" />,
    <Languages className="w-5 h-5" />,
    <MessageSquare className="w-5 h-5" />,
  ];

  const featureColors = [
    { bg: 'bg-[#EBE5F5]', text: 'text-[#2D1065]' },
    { bg: 'bg-amber-50',  text: 'text-[#C9984A]' },
    { bg: 'bg-purple-50', text: 'text-[#9B4DCA]' },
    { bg: 'bg-green-50',  text: 'text-green-700' },
  ];

  const stepIcons = [
    <FileUp   className="w-6 h-6 text-[#2D1065]" />,
    <Search   className="w-6 h-6 text-[#9B4DCA]" />,
    <PenTool  className="w-6 h-6 text-[#C9984A]" />,
    <Download className="w-6 h-6 text-green-700" />,
  ];

  return (
    <Layout
      lang={lang}
      onLanguageChange={setLang}
      onHomeClick={handleReset}
    >
        <>
          {/* Lead Capture Modal */}
          <LeadCaptureModal
            isOpen={showLeadCapture}
            onClose={() => { setShowLeadCapture(false); setPendingFile(null); }}
            onSubmit={handleLeadSubmit}
            lang={lang}
          />

          {/* Job Target Modal */}
          <JobTargetModal
            isOpen={showJobTarget}
            onClose={() => setShowJobTarget(false)}
            onSubmit={handleJobTargetSubmit}
            onSkip={handleJobTargetSkip}
            lang={lang}
          />

          {/* AI Resume Builder Interview */}
          {showResumeBuilder && (
            <AIResumeInterview
              lang={lang}
              onComplete={handleInterviewComplete}
              onClose={() => setShowResumeBuilder(false)}
            />
          )}

          {/* ── Hero ── */}
          {status === AppStatus.IDLE && (
            FEATURE_FLAGS.leadMagnetLanding ? (
              <HeroLeadMagnet
                lang={lang}
                onScrollToUpload={() => document.getElementById('ats-upload')?.scrollIntoView({ behavior: 'smooth' })}
                onStartBuilder={() => { trackEvent('AI_RESUME_BUILDER_STARTED'); setShowResumeBuilder(true); }}
              />
            ) : (
              <section className="hero-gradient relative overflow-hidden pt-16 pb-8 px-4 no-print">
                {/* Decorative dot grid corners */}
                <div className="pointer-events-none absolute top-0 end-0 w-64 h-64 dot-grid opacity-40 -translate-y-1/4 translate-x-1/4" />
                <div className="pointer-events-none absolute bottom-0 start-0 w-40 h-40 dot-grid opacity-20 translate-y-1/4 -translate-x-1/4" />

                <div className="max-w-2xl mx-auto text-center relative">
                  {/* Badge */}
                  <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-1.5 bg-[#C9984A]/10 text-[#2D1065] rounded-full text-xs font-medium border border-[#C9984A]/25 tracking-wide mb-6">
                    <Sparkles className="w-3.5 h-3.5 text-[#C9984A]" />
                    {t.hero.badge}
                  </div>

                  {/* Headline */}
                  <h1 className="animate-fade-up delay-100 text-fluid-hero font-black text-[#150D30] tracking-tight mb-5">
                    {t.hero.title}
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2D1065] to-[#9B4DCA]">
                      {t.hero.titleAccent}
                    </span>
                  </h1>

                  {/* Subtitle */}
                  <p className="animate-fade-up delay-200 text-fluid-lg text-slate-500 max-w-lg mx-auto leading-relaxed mb-10">
                    {t.hero.subtitle}
                  </p>

                  {/* Builder CTA */}
                  <div className="animate-fade-up delay-300 flex flex-col items-center gap-1">
                    <span className="text-slate-400 text-xs">{t.hero.builderSubtext}</span>
                    <button
                      onClick={() => { trackEvent('AI_RESUME_BUILDER_STARTED'); setShowResumeBuilder(true); }}
                      className="inline-flex items-center gap-2 px-6 py-3.5 border-2 border-[#2D1065]/30 text-[#2D1065] rounded-xl font-semibold hover:bg-[#2D1065]/5 transition-colors"
                    >
                      <Bot className="w-5 h-5 text-[#C9984A]" />
                      {t.hero.builderCta}
                    </button>
                  </div>
                </div>
              </section>
            )
          )}

          {/* ── Main content ── */}
          <section className={`pb-24 px-4 ${status === AppStatus.IDLE ? '-mt-2' : 'pt-12'}`}>
            <div className="max-w-7xl mx-auto">

              {/* ── IDLE: upload + landing sections ── */}
              {status === AppStatus.IDLE && (
                FEATURE_FLAGS.leadMagnetLanding ? (
                  <>
                    <ATSUploadLeadMagnet
                      lang={lang}
                      targetLang={targetLang}
                      onTargetLangChange={setTargetLang}
                      onFileSelect={handleFileSelect}
                      isLoading={status === AppStatus.PROCESSING}
                    />
                    <ExampleATSReport lang={lang} />
                    <UpgradeBenefits lang={lang} />
                    <AIResumeBuilderPromo lang={lang} onStart={() => { trackEvent('AI_RESUME_BUILDER_STARTED'); setShowResumeBuilder(true); }} />
                    <FinalCTA
                      lang={lang}
                      onScrollToUpload={() => document.getElementById('ats-upload')?.scrollIntoView({ behavior: 'smooth' })}
                    />
                  </>
                ) : (
                  <>
                    {/* Upload */}
                    <div className="animate-fade-up delay-300">
                      <FileUpload
                        onFileSelect={handleFileSelect}
                        isLoading={status === AppStatus.PROCESSING}
                        lang={lang}
                        targetLang={targetLang}
                        onTargetLangChange={setTargetLang}
                      />
                    </div>

                    {/* ── Feature cards ── */}
                    <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 no-print">
                      {t.features.map((feature, idx) => (
                        <div
                          key={idx}
                          className={`animate-fade-up bg-white p-7 rounded-2xl border border-[#E8E2F0] shadow-[0_2px_12px_rgba(45,16,101,0.05)] flex flex-col gap-4 hover:shadow-[0_4px_20px_rgba(45,16,101,0.09)] hover:border-[#BFB0E5] transition-all cursor-default`}
                          style={{ animationDelay: `${0.1 * idx}s` }}
                        >
                          <div className={`p-3 rounded-xl w-fit ${featureColors[idx].bg} ${featureColors[idx].text}`}>
                            {featureIcons[idx]}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg text-[#150D30] mb-2">{feature.title}</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* ── How it works ── */}
                    <div id="how-it-works" className="mt-24 no-print scroll-mt-24">
                      <div className="text-center mb-14">
                        <h2 className="text-fluid-4xl font-bold text-[#150D30] mb-3">{t.howItWorks.title}</h2>
                        <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">{t.howItWorks.subtitle}</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 relative">
                        {/* Connector line */}
                        <div className="hidden lg:block absolute top-8 start-[calc(12.5%+2rem)] end-[calc(12.5%+2rem)] h-px bg-[#E8E2F0]" />

                        {t.howItWorks.steps.map((step, idx) => (
                          <div key={idx} className="flex flex-col items-center text-center gap-5">
                            {/* Icon box */}
                            <div className="relative bg-white w-16 h-16 rounded-2xl border border-[#E8E2F0] shadow-[0_2px_12px_rgba(45,16,101,0.07)] flex items-center justify-center">
                              <span className="absolute -top-2.5 -end-2.5 w-5 h-5 bg-[#C9984A] text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                                {idx + 1}
                              </span>
                              {stepIcons[idx]}
                            </div>
                            <div>
                              <h4 className="font-semibold text-lg text-[#150D30] mb-2">{step.title}</h4>
                              <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ── Pricing ── */}
                    <div id="pricing" className="mt-24 no-print scroll-mt-24">
                      <div className="max-w-lg mx-auto bg-white rounded-2xl border border-[#E8E2F0] shadow-[0_4px_24px_rgba(45,16,101,0.08)] overflow-hidden">
                        {/* Header */}
                        <div className="px-8 py-7 bg-[#2D1065] text-center">
                          <h2 className="text-2xl font-bold text-white mb-1">{t.pricing.title}</h2>
                          <p className="text-indigo-200 text-sm opacity-90">{t.pricing.subtitle}</p>
                        </div>

                        {/* Body */}
                        <div className="p-8">
                          {/* Price */}
                          <div className="text-center mb-8">
                            <div className="text-6xl font-black text-[#2D1065] leading-none tracking-tight">
                              {t.pricing.currency}
                            </div>
                            <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-3">
                              {t.pricing.per}
                            </p>
                          </div>

                          {/* Features list */}
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-8">
                            {t.pricing.features.map((item, i) => (
                              <li key={i} className="flex items-start gap-3 text-slate-600">
                                <CheckCircle2 className="w-4.5 h-4.5 text-[#C9984A] flex-shrink-0 mt-0.5" />
                                <span className="text-sm">{item}</span>
                              </li>
                            ))}
                          </ul>

                          {/* CTA */}
                          <button
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="w-full py-3.5 bg-[#2D1065] text-white rounded-xl font-medium text-base hover:bg-[#220C4E] transition-colors flex items-center justify-center gap-3 shadow-[0_2px_8px_rgba(45,16,101,0.25)]"
                          >
                            {t.pricing.button}
                            <ArrowRight className={`w-5 h-5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                          </button>

                          <p className="text-center text-xs text-slate-400 mt-5">{t.pricing.footer}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )
              )}

              {/* ── Analyzing ── */}
              {status === AppStatus.ANALYZING && (
                <div className="flex flex-col items-center justify-center py-32 gap-8 animate-fade-up">
                  <div className="w-16 h-16 rounded-2xl bg-[#EBE5F5] flex items-center justify-center shadow-[0_2px_12px_rgba(45,16,101,0.10)]">
                    <Loader2 className="w-7 h-7 text-[#2D1065] animate-spin" />
                  </div>
                  <div className="text-center space-y-2.5">
                    <h3 className="text-2xl font-bold text-[#150D30]">Analyzing Your CV</h3>
                    <p className="text-slate-500 text-sm max-w-sm">
                      Scanning structure, checking ATS compatibility, and identifying improvement areas…
                    </p>
                    <div className="flex gap-1.5 justify-center pt-2">
                      {[0, 1, 2].map(i => (
                        <div
                          key={i}
                          className="w-2 h-2 bg-[#C9984A] rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Analysis completed ── */}
              {status === AppStatus.ANALYSIS_COMPLETED && analysisReport && (
                <AnalysisView
                  report={analysisReport}
                  onOptimize={handleStartOptimization}
                  lang={lang}
                  userComments={userComments}
                  setUserComments={setUserComments}
                />
              )}

              {/* ── Processing ── */}
              {status === AppStatus.PROCESSING && (
                <div className="flex flex-col items-center justify-center py-32 gap-8 animate-fade-up">
                  <div className="w-16 h-16 rounded-2xl bg-[#EBE5F5] flex items-center justify-center shadow-[0_2px_12px_rgba(45,16,101,0.10)]">
                    <Loader2 className="w-7 h-7 text-[#9B4DCA] animate-spin" />
                  </div>
                  <div className="text-center space-y-2.5">
                    <h3 className="text-2xl font-bold text-[#150D30]">{t.status.optimizing}</h3>
                    <p className="text-slate-500 text-sm max-w-sm">{t.status.analyzing}</p>
                    <div className="flex gap-1.5 justify-center pt-2">
                      {[0, 1, 2].map(i => (
                        <div
                          key={i}
                          className="w-2 h-2 bg-[#C9984A] rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Error ── */}
              {status === AppStatus.ERROR && (
                <div className="flex flex-col items-center justify-center py-24 animate-fade-up">
                  <div className="bg-white p-10 rounded-2xl border border-red-100 shadow-[0_4px_24px_rgba(220,38,38,0.07)] text-center max-w-sm w-full space-y-5">
                    <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto">
                      <Zap className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#150D30] mb-1.5">{t.status.error}</h3>
                      <p className="text-slate-500 text-sm leading-relaxed">{error}</p>
                    </div>
                    <button
                      onClick={handleReset}
                      className="w-full py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
                    >
                      {t.status.tryAgain}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Completed ── */}
              {status === AppStatus.COMPLETED && optimizedHtml && (
                <>
                  <ResumePreview
                    html={optimizedHtml}
                    onReset={handleReset}
                    isPaid={isPaid}
                    onPaymentConfirm={handlePaymentConfirm}
                    lang={lang}
                    optimizationId={currentOptimizationId}
                    filename={currentFilename}
                    resumeJsonData={resumeJsonData}
                    selectedTemplate={selectedTemplate}
                    onTemplateChange={handleTemplateChange}
                  />
                  <ExtrasView
                    coverLetter={coverLetter}
                    linkedinGuide={linkedinGuide}
                    lang={lang}
                  />
                </>
              )}

            </div>
          </section>
        </>
    </Layout>
  );
};
