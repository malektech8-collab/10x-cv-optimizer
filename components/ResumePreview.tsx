
import React, { useState } from 'react';
import { Download, Copy, Check, RotateCcw, AlertTriangle, Code, Lock, CreditCard, ArrowRight, Loader2 } from 'lucide-react';
import { PaymentModal } from './PaymentModal';
import { AuthModal } from './AuthModal';
import { auth } from '../lib/firebase';
import { translations, Language } from '../constants/translations';
import { asBlob } from 'html-docx-js-typescript';
import { saveAs } from 'file-saver';
import { ResumeJsonData, TemplateType } from '../types';
import { TEMPLATE_NAMES } from '../templates/index';

interface ResumePreviewProps {
  html: string;
  onReset: () => void;
  isPaid: boolean;
  onPaymentConfirm: (optimizationId: string) => void;
  lang: Language;
  optimizationId?: string | null;
  filename?: string;
  resumeJsonData?: ResumeJsonData | null;
  selectedTemplate?: TemplateType;
  onTemplateChange?: (t: TemplateType) => void;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({ html, onReset, isPaid, onPaymentConfirm, lang, optimizationId, filename, resumeJsonData, selectedTemplate, onTemplateChange }) => {
  const baseName = filename
    ? filename.replace(/\.[^/.]+$/, '').replace(/\s+/g, '_')
    : 'Resume';
  const exportName = `${baseName}_Optimized`;
  const t = translations[lang];
  const [copiedText, setCopiedText] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingPayment, setPendingPayment] = useState(false);
  const [waitingForOptimizationId, setWaitingForOptimizationId] = useState(false);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  // When user signs in after clicking Unlock, wait for optimizationId before opening payment
  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && pendingPayment) {
        setIsAuthModalOpen(false);
        setPendingPayment(false);
        if (optimizationId) {
          setIsModalOpen(true);
        } else {
          // Auth-save useEffect in Home.tsx is still creating the Firestore doc — wait for it
          setWaitingForOptimizationId(true);
        }
      }
    });
    return () => unsubscribe();
  }, [pendingPayment, optimizationId]);

  // Once the optimizationId becomes available, open PaymentModal
  React.useEffect(() => {
    if (waitingForOptimizationId && optimizationId) {
      setWaitingForOptimizationId(false);
      setIsModalOpen(true);
    }
  }, [waitingForOptimizationId, optimizationId]);

  const handleUnlockClick = () => {
    if (auth.currentUser) {
      setIsModalOpen(true);
    } else {
      setIsAuthModalOpen(true);
      setPendingPayment(true);
    }
  };

  React.useEffect(() => {
    if (iframeRef.current && html) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
      }
    }
  }, [html]);

  const handleCopyText = () => {
    if (!isPaid) return;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const text = tempDiv.innerText;
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleCopyHtml = () => {
    if (!isPaid) return;
    navigator.clipboard.writeText(html);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  const handleDownloadPdf = () => {
    if (!isPaid) return;
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const innerHtml = bodyMatch ? bodyMatch[1] : html;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      const isRtl = html.includes('dir="rtl"');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="${isRtl ? 'rtl' : 'ltr'}">
        <head>
          <title>${exportName}</title>
          <style>
            @page { size: letter; margin: 0.75in; }
            body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.5; color: #000; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            h1 { color: #2D1065; font-size: 24pt; margin-top: 0; margin-bottom: 8pt; }
            h2 { color: #2D1065; font-size: 14pt; border-bottom: 2px solid #eee; padding-bottom: 4px; margin-top: 16pt; margin-bottom: 8pt; text-transform: uppercase; }
            h3 { font-size: 12pt; font-weight: bold; margin-bottom: 4px; margin-top: 12pt; }
            p, ul { margin-top: 4px; margin-bottom: 8px; }
            li { margin-bottom: 4px; }
            h1, h2, h3, h4 { page-break-after: avoid; break-after: avoid; }
            ul, li, p { page-break-inside: avoid; break-inside: avoid; }
          </style>
        </head>
        <body>
          ${innerHtml}
          <script>
            window.onload = () => { window.focus(); setTimeout(() => { window.print(); }, 300); };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    } else {
      alert("Please allow pop-ups to open the PDF download/print dialog.");
    }
  };

  const handleDownloadDocx = async () => {
    if (!isPaid) return;
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    let innerHtml = bodyMatch ? bodyMatch[1] : html;
    if (t.dir === 'rtl') {
      innerHtml = innerHtml
        .replace(/<p(?! [^>]*dir=)/g, '<p dir="rtl" align="right"')
        .replace(/<h1(?! [^>]*dir=)/g, '<h1 dir="rtl" align="right"')
        .replace(/<h2(?! [^>]*dir=)/g, '<h2 dir="rtl" align="right"')
        .replace(/<h3(?! [^>]*dir=)/g, '<h3 dir="rtl" align="right"')
        .replace(/<ul(?! [^>]*dir=)/g, '<ul dir="rtl" align="right"')
        .replace(/<li(?! [^>]*dir=)/g, '<li dir="rtl" align="right"')
        .replace(/<div(?! [^>]*dir=)/g, '<div dir="rtl" align="right"');
    }
    const docxHtml = `
      <!DOCTYPE html>
      <html dir="${t.dir}">
      <head><title>Resume</title>
        <style>
          body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; line-height: 1.5; color: #000; text-align: ${t.dir === 'rtl' ? 'right' : 'left'}; }
          h1 { color: #2D1065; font-size: 24pt; margin-top: 0; margin-bottom: 8pt; text-align: ${t.dir === 'rtl' ? 'right' : 'left'}; direction: ${t.dir}; }
          h2 { color: #2D1065; font-size: 14pt; border-bottom: 2px solid #eee; padding-bottom: 4px; margin-top: 16pt; margin-bottom: 8pt; text-transform: uppercase; text-align: ${t.dir === 'rtl' ? 'right' : 'left'}; direction: ${t.dir}; }
          h3 { font-size: 12pt; font-weight: bold; margin-bottom: 4px; margin-top: 12pt; text-align: ${t.dir === 'rtl' ? 'right' : 'left'}; direction: ${t.dir}; }
          p, ul, li { text-align: ${t.dir === 'rtl' ? 'right' : 'left'}; direction: ${t.dir}; }
          p, ul { margin-top: 4px; margin-bottom: 8px; }
          li { margin-bottom: 4px; }
        </style>
      </head>
      <body style="direction: ${t.dir}; text-align: ${t.dir === 'rtl' ? 'right' : 'left'};">
        ${innerHtml}
      </body>
      </html>
    `;
    try {
      const blob = await asBlob(docxHtml, { orientation: 'portrait', margins: { top: 1000, right: 1000, bottom: 1000, left: 1000 } });
      // @ts-ignore
      saveAs(blob, `${exportName}.docx`);
    } catch (error) {
      console.error("DOCX generation error:", error);
      alert("There was an error generating the DOCX. Please try again or download the PDF.");
    }
  };

  if (!html || html.length < 10) {
    return (
      <div className="flex flex-col items-center justify-center p-10 bg-white rounded-2xl border border-[#E8E2F0] shadow-[0_2px_16px_rgba(45,16,101,0.07)] text-center" dir={t.dir}>
        <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center mb-5">
          <AlertTriangle className="w-7 h-7 text-[#C9984A]" />
        </div>
        <h3 className="text-xl font-bold text-[#150D30] mb-2">Empty Result</h3>
        <p className="text-slate-500 text-sm max-w-xs mb-6">The optimization process didn't yield any content. The source file may have been unreadable.</p>
        <button onClick={onReset} className="px-6 py-2.5 bg-[#2D1065] text-white rounded-xl font-medium text-sm hover:bg-[#220C4E] transition-colors">
          Try Another File
        </button>
      </div>
    );
  }

  return (
    <>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => { setIsAuthModalOpen(false); setPendingPayment(false); }}
        lang={lang}
      />
      <PaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(id) => { setIsModalOpen(false); onPaymentConfirm(id); }}
        amount={39}
        currency="SAR"
        lang={lang}
        optimizationId={optimizationId}
      />

      {/* Brief loading overlay while waiting for optimization to save before payment */}
      {waitingForOptimizationId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#150D30]/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-10 text-center space-y-4 shadow-xl">
            <Loader2 className="w-10 h-10 text-[#2D1065] animate-spin mx-auto" />
            <p className="text-sm font-medium text-slate-600">Preparing payment…</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-5xl mx-auto space-y-6 animate-fade-up" dir={t.dir}>

        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
          <h2 className="text-xl font-bold text-[#150D30]">{t.preview.title}</h2>

          {/* Template selector — only shown when JSON data is available */}
          {resumeJsonData && onTemplateChange && (
            <div className="flex items-center gap-2 no-print">
              <span className="text-xs text-slate-500 font-medium">{t.preview.template}:</span>
              {(['classic', 'modern', 'executive'] as TemplateType[]).map((tpl) => (
                <button
                  key={tpl}
                  onClick={() => onTemplateChange(tpl)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    selectedTemplate === tpl
                      ? 'bg-[#2D1065] text-white border-[#2D1065] shadow-sm'
                      : 'bg-white text-slate-600 border-[#E8E2F0] hover:border-[#BFB0E5] hover:text-[#2D1065]'
                  }`}
                >
                  {TEMPLATE_NAMES[tpl][lang]}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {!isPaid ? (
              <button
                onClick={handleUnlockClick}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#C9984A] text-white rounded-xl text-sm font-medium hover:bg-[#B8863F] transition-colors shadow-[0_2px_8px_rgba(201,152,74,0.3)]"
              >
                <CreditCard className="w-4 h-4" />
                {t.preview.unlock}
              </button>
            ) : (
              <>
                <button
                  onClick={handleCopyText}
                  className="flex items-center gap-1.5 px-4 py-2 border border-[#E8E2F0] bg-white text-slate-700 rounded-xl text-sm font-medium hover:border-[#BFB0E5] hover:text-[#2D1065] transition-all"
                  title="Copy as plain text"
                >
                  {copiedText ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {copiedText ? t.preview.copied : t.preview.copyText}
                </button>

                <button
                  onClick={handleCopyHtml}
                  className="flex items-center gap-1.5 px-4 py-2 border border-[#E8E2F0] bg-white text-slate-700 rounded-xl text-sm font-medium hover:border-[#BFB0E5] hover:text-[#2D1065] transition-all"
                  title="Copy raw HTML source"
                >
                  {copiedHtml ? <Check className="w-4 h-4 text-green-500" /> : <Code className="w-4 h-4" />}
                  {copiedHtml ? t.preview.copied : t.preview.copyHtml}
                </button>

                <button
                  onClick={handleDownloadDocx}
                  className="flex items-center gap-1.5 px-4 py-2 border border-[#E8E2F0] bg-white text-slate-700 rounded-xl text-sm font-medium hover:border-[#BFB0E5] hover:text-[#2D1065] transition-all"
                >
                  <Download className="w-4 h-4" />
                  DOCX
                </button>

                <button
                  onClick={handleDownloadPdf}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#2D1065] text-white rounded-xl text-sm font-medium hover:bg-[#220C4E] transition-colors shadow-[0_2px_8px_rgba(45,16,101,0.25)]"
                >
                  <Download className="w-4 h-4" />
                  {t.preview.print}
                </button>
              </>
            )}

            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 text-slate-500 rounded-xl text-sm font-medium hover:bg-slate-100 transition-all border border-slate-100"
            >
              <RotateCcw className="w-4 h-4" />
              {t.preview.restart}
            </button>
          </div>
        </div>

        {/* ── Resume preview container ── */}
        <div className="relative bg-white rounded-2xl overflow-hidden border border-[#E8E2F0] shadow-[0_4px_24px_rgba(45,16,101,0.08)] resume-paper">

          {/* Lock overlay */}
          {!isPaid && (
            <div className="absolute inset-0 z-10 bg-[#150D30]/20 backdrop-blur-[6px] flex items-center justify-center p-6">
              <div className="bg-white rounded-2xl border border-[#E8E2F0] shadow-[0_8px_32px_rgba(0,0,0,0.10)] max-w-sm w-full p-8 text-center space-y-5 animate-fade-up">
                {/* Icon */}
                <div className="w-14 h-14 bg-[#EBE5F5] rounded-xl flex items-center justify-center mx-auto">
                  <Lock className="w-7 h-7 text-[#2D1065]" />
                </div>

                {/* Text */}
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-[#150D30]">{t.preview.readyTitle}</h3>
                  <div className="inline-flex items-center gap-1.5 bg-[#2D1065] text-[#E8D48B] px-4 py-1.5 rounded-lg text-base font-bold">
                    {t.pricing.currency}
                  </div>
                </div>

                <p className="text-slate-500 text-sm leading-relaxed">{t.preview.readyDesc}</p>

                {/* CTA */}
                <button
                  onClick={handleUnlockClick}
                  className="w-full py-3.5 bg-[#C9984A] text-white rounded-xl font-medium text-base hover:bg-[#B8863F] transition-colors flex items-center justify-center gap-2.5 shadow-[0_2px_8px_rgba(201,152,74,0.3)]"
                >
                  {t.preview.proceed}
                  <ArrowRight className={`w-5 h-5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
          )}

          {/* Resume iframe */}
          <div className={`transition-all duration-700 ${!isPaid ? 'filter blur-[8px] grayscale-[0.3] select-none pointer-events-none' : ''}`}>
            <iframe
              ref={iframeRef}
              title="Resume Preview"
              className="w-full min-h-[11in] bg-white border-none"
              style={{ display: 'block' }}
            />
          </div>
        </div>

        {/* ── Export note ── */}
        {isPaid && (
          <div className="no-print bg-[#FFF9ED] border border-[#C9984A]/25 p-5 rounded-xl flex items-start gap-4">
            <div className="bg-amber-100 p-2.5 rounded-lg flex-shrink-0">
              <Download className="w-5 h-5 text-[#C9984A]" />
            </div>
            <div>
              <h4 className="font-semibold text-[#150D30] text-sm mb-1">{t.preview.exportNoteTitle}</h4>
              <p className="text-slate-600 text-sm leading-relaxed">{t.preview.exportNoteDesc}</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
