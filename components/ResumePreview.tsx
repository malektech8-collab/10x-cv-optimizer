
import React, { useState } from 'react';
import { Download, Printer, Copy, Check, RotateCcw, AlertTriangle, Code, Lock, CreditCard } from 'lucide-react';
import { PaymentModal } from './PaymentModal';
import { translations, Language } from '../constants/translations';

interface ResumePreviewProps {
  html: string;
  onReset: () => void;
  isPaid: boolean;
  onPaymentConfirm: () => void;
  lang: Language;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({ html, onReset, isPaid, onPaymentConfirm, lang }) => {
  const t = translations[lang];
  const [copiedText, setCopiedText] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

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

  const handlePrint = () => {
    if (!isPaid) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
      
      setTimeout(() => {
        if (printWindow.document.readyState === 'complete') {
          printWindow.focus();
          printWindow.print();
        }
      }, 500);
    } else {
      alert("Please allow pop-ups to print the resume.");
    }
  };

  const handleDownloadHtml = () => {
    if (!isPaid) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'optimized-resume.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!html || html.length < 10) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-white rounded-[3rem] border border-slate-100 shadow-2xl text-center" dir={t.dir}>
        <AlertTriangle className="w-16 h-16 text-[#EEA727] mb-6" />
        <h3 className="text-3xl font-black text-[#4D2B8C] tracking-tight">Empty Result</h3>
        <p className="text-slate-500 mb-10 font-bold max-w-sm">The optimization process didn't yield any content. This might happen if the source file was unreadable.</p>
        <button onClick={onReset} className="px-10 py-4 bg-[#85409D] text-white rounded-2xl font-black text-lg hover:bg-[#4D2B8C] transition-all shadow-xl shadow-purple-100">Try Another File</button>
      </div>
    );
  }

  return (
    <>
      <PaymentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={onPaymentConfirm}
        amount={39}
        currency={t.pricing.currency}
        lang={lang}
      />

      <div className="w-full max-w-5xl mx-auto space-y-8 animate-fade-in" dir={t.dir}>
        <div className="flex flex-wrap items-center justify-between gap-6 no-print">
          <h2 className="text-3xl font-black text-[#4D2B8C] tracking-tight">{t.preview.title}</h2>
          <div className="flex flex-wrap items-center gap-3">
            {!isPaid ? (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-3 px-8 py-3.5 bg-[#EEA727] text-white rounded-2xl text-base font-black hover:bg-[#4D2B8C] transition-all shadow-xl shadow-amber-100 transform hover:-translate-y-0.5"
              >
                <CreditCard className="w-5 h-5" />
                {t.preview.unlock}
              </button>
            ) : (
              <>
                <button
                  onClick={handleCopyText}
                  className="flex items-center gap-2 px-5 py-3 border-2 border-slate-100 bg-white text-[#4D2B8C] rounded-2xl text-sm font-black hover:border-[#85409D] transition-all"
                  title="Copy as plain text"
                >
                  {copiedText ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {copiedText ? t.preview.copied : t.preview.copyText}
                </button>
                
                <button
                  onClick={handleCopyHtml}
                  className="flex items-center gap-2 px-5 py-3 border-2 border-slate-100 bg-white text-[#4D2B8C] rounded-2xl text-sm font-black hover:border-[#85409D] transition-all"
                  title="Copy raw HTML source"
                >
                  {copiedHtml ? <Check className="w-4 h-4 text-green-500" /> : <Code className="w-4 h-4" />}
                  {copiedHtml ? t.preview.copied : t.preview.copyHtml}
                </button>

                <button
                  onClick={handleDownloadHtml}
                  className="flex items-center gap-2 px-5 py-3 border-2 border-slate-100 bg-white text-[#4D2B8C] rounded-2xl text-sm font-black hover:border-[#85409D] transition-all"
                >
                  <Download className="w-4 h-4" />
                  {t.preview.download}
                </button>
                
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-6 py-3 bg-[#4D2B8C] text-white rounded-2xl text-sm font-black hover:bg-[#85409D] transition-all shadow-xl shadow-indigo-200"
                >
                  <Printer className="w-4 h-4" />
                  {t.preview.print}
                </button>
              </>
            )}
            
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-6 py-3 border-2 border-slate-50 bg-slate-50 text-slate-500 rounded-2xl text-sm font-black hover:bg-slate-100 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              {t.preview.restart}
            </button>
          </div>
        </div>

        <div className="relative bg-white shadow-[0_40px_100px_-20px_rgba(77,43,140,0.15)] rounded-[3rem] overflow-hidden border border-indigo-50/50 resume-paper transition-all duration-700 ring-1 ring-slate-100">
          {!isPaid && (
            <div className="absolute inset-0 z-10 bg-indigo-900/10 backdrop-blur-[4px] flex flex-col items-center justify-center p-10 text-center">
              <div className="bg-white p-12 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-slate-50 max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-[#FFEF5F]/30 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto shadow-sm">
                  <Lock className="w-10 h-10 text-[#4D2B8C]" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-black text-[#4D2B8C] tracking-tight">{t.preview.readyTitle}</h3>
                  <div className="bg-[#4D2B8C] text-[#FFEF5F] inline-block px-4 py-1.5 rounded-full text-lg font-black shadow-md">
                    {t.preview.readyPrice}
                  </div>
                </div>
                <p className="text-slate-500 text-lg font-bold leading-relaxed">
                  {t.preview.readyDesc}
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full py-5 bg-[#EEA727] text-white rounded-2xl font-black text-xl hover:bg-[#4D2B8C] transition-all flex items-center justify-center gap-3 shadow-xl shadow-amber-100 transform hover:-translate-y-1"
                >
                  {t.preview.proceed}
                  <ArrowRight className={`w-6 h-6 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
          )}
          
          <div className={`p-0 bg-slate-100/10 transition-all duration-1000 ${!isPaid ? 'filter blur-[10px] grayscale-[0.2] select-none pointer-events-none scale-[0.98]' : ''}`}>
            <iframe 
              ref={iframeRef}
              title="Resume Preview"
              className="w-full min-h-[11in] bg-white border-none"
              style={{ display: 'block' }}
            />
          </div>
        </div>

        {isPaid && (
          <div className="no-print bg-[#FFEF5F]/20 border-2 border-[#EEA727]/30 p-8 rounded-[2.5rem] flex items-start gap-6 animate-in slide-in-from-bottom-6 duration-500">
            <div className="bg-white p-4 rounded-2xl shadow-sm">
              <Printer className="w-8 h-8 text-[#4D2B8C]" />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-black text-[#4D2B8C] tracking-tight">{t.preview.exportNoteTitle}</h4>
              <p className="text-lg text-[#4D2B8C] opacity-80 font-bold leading-relaxed">
                {t.preview.exportNoteDesc}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const ArrowRight = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);
