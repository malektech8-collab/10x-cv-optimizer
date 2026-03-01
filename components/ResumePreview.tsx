
import React, { useState } from 'react';
import { Download, Copy, Check, RotateCcw, AlertTriangle, Code, Lock, CreditCard } from 'lucide-react';
import { PaymentModal } from './PaymentModal';
import { translations, Language } from '../constants/translations';
import { asBlob } from 'html-docx-js-typescript';
import { saveAs } from 'file-saver';

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

  const handleDownloadPdf = () => {
    if (!isPaid) return;

    // Extract the body content from the AI-generated HTML to prevent double DOCTYPE wrapping
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const innerHtml = bodyMatch ? bodyMatch[1] : html;

    // Use native browser print for flawless RTL (Arabic) text shaping and layout
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();

      const isRtl = html.includes('dir="rtl"');

      // We inject strict "Word Document" styles so the browser Print dialog generates a PDF exactly like the DOCX
      printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="${isRtl ? 'rtl' : 'ltr'}">
        <head>
          <title>Optimized Resume</title>
          <style>
            @page {
              size: letter;
              margin: 0.75in;
            }
            body { 
              font-family: Arial, Helvetica, sans-serif; 
              font-size: 11pt; 
              line-height: 1.5;
              color: #000;
              margin: 0; 
              padding: 0;
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
            }
            h1 { color: #4D2B8C; font-size: 24pt; margin-top: 0; margin-bottom: 8pt; }
            h2 { color: #4D2B8C; font-size: 14pt; border-bottom: 2px solid #eee; padding-bottom: 4px; margin-top: 16pt; margin-bottom: 8pt; text-transform: uppercase; }
            h3 { font-size: 12pt; font-weight: bold; margin-bottom: 4px; margin-top: 12pt; }
            p, ul { margin-top: 4px; margin-bottom: 8px; }
            li { margin-bottom: 4px; }
            
            /* Prevent awkward page breaks */
            h1, h2, h3, h4 { 
              page-break-after: avoid; 
              break-after: avoid; 
            }
            ul, li, p { 
              page-break-inside: avoid; 
              break-inside: avoid; 
            }
          </style>
        </head>
        <body>
          ${innerHtml}
          <script>
            window.onload = () => {
              window.focus();
              setTimeout(() => {
                window.print();
              }, 300);
            };
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

    // Extract body to avoid double document structures
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    let innerHtml = bodyMatch ? bodyMatch[1] : html;

    // Microsoft Word AltChunk HTML parser frequently ignores CSS "direction: rtl".
    // We must forcefully inject inline `dir="rtl"` and `align="right"` attributes onto block elements.
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

    // Use identical strict styles for DOCX
    const docxHtml = `
      <!DOCTYPE html>
      <html dir="${t.dir}">
      <head>
        <title>Resume</title>
        <style>
            body { 
              font-family: Arial, Helvetica, sans-serif; 
              font-size: 11pt; 
              line-height: 1.5;
              color: #000;
              text-align: ${t.dir === 'rtl' ? 'right' : 'left'};
            }
            h1 { color: #4D2B8C; font-size: 24pt; margin-top: 0; margin-bottom: 8pt; text-align: ${t.dir === 'rtl' ? 'right' : 'left'}; direction: ${t.dir}; }
            h2 { color: #4D2B8C; font-size: 14pt; border-bottom: 2px solid #eee; padding-bottom: 4px; margin-top: 16pt; margin-bottom: 8pt; text-transform: uppercase; text-align: ${t.dir === 'rtl' ? 'right' : 'left'}; direction: ${t.dir}; }
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
      // Ensure the generated string/blob gets downloaded correctly
      // @ts-ignore
      saveAs(blob, 'optimized-resume.docx');
    } catch (error) {
      console.error("DOCX generation error:", error);
      alert("There was an error generating the DOCX. Please try again or download the PDF.");
    }
  };

  if (!html || html.length < 10) {
    return (
      <div className="flex flex-col items-center justify-center p-8 sm:p-16 bg-white rounded-[2rem] sm:rounded-[3rem] border border-slate-100 shadow-2xl text-center" dir={t.dir}>
        <AlertTriangle className="w-12 h-12 sm:w-16 sm:h-16 text-[#EEA727] mb-6" />
        <h3 className="text-2xl sm:text-3xl font-black text-[#4D2B8C] tracking-tight">Empty Result</h3>
        <p className="text-slate-500 mb-8 sm:mb-10 font-bold max-w-sm text-sm sm:text-base">The optimization process didn't yield any content. This might happen if the source file was unreadable.</p>
        <button onClick={onReset} className="px-8 sm:px-10 py-3 sm:py-4 bg-[#85409D] text-white rounded-xl sm:rounded-2xl font-black text-base sm:text-lg hover:bg-[#4D2B8C] transition-all shadow-xl shadow-purple-100">Try Another File</button>
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 no-print">
          <h2 className="text-2xl sm:text-3xl font-black text-[#4D2B8C] tracking-tight">{t.preview.title}</h2>
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
                  onClick={handleDownloadDocx}
                  className="flex items-center gap-2 px-5 py-3 border-2 border-slate-100 bg-white text-[#4D2B8C] rounded-2xl text-sm font-black hover:border-[#85409D] transition-all"
                >
                  <Download className="w-4 h-4" />
                  Download DOCX
                </button>

                <button
                  onClick={handleDownloadPdf}
                  className="flex items-center gap-2 px-6 py-3 bg-[#4D2B8C] text-white rounded-2xl text-sm font-black hover:bg-[#85409D] transition-all shadow-xl shadow-indigo-200"
                >
                  <Download className="w-4 h-4" />
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

        <div className="relative bg-white shadow-[0_40px_100px_-20px_rgba(77,43,140,0.15)] rounded-[2rem] sm:rounded-[3rem] overflow-hidden border border-indigo-50/50 resume-paper transition-all duration-700 ring-1 ring-slate-100">
          {!isPaid && (
            <div className="absolute inset-0 z-10 bg-indigo-900/10 backdrop-blur-[4px] flex flex-col items-center justify-center p-10 text-center">
              <div className="bg-white p-8 sm:p-12 rounded-[2rem] sm:rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-slate-50 max-w-md space-y-6 sm:space-y-8 animate-in fade-in zoom-in-95 duration-500 mx-4">
                <div className="bg-[#FFEF5F]/30 w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center mx-auto shadow-sm">
                  <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-[#4D2B8C]" />
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-2xl sm:text-3xl font-black text-[#4D2B8C] tracking-tight">{t.preview.readyTitle}</h3>
                  <div className="bg-[#4D2B8C] text-[#FFEF5F] inline-block px-4 py-1.5 rounded-full text-base sm:text-lg font-black shadow-md uppercase">
                    {t.pricing.price === '0' ? t.pricing.currency : `${t.pricing.price} ${t.pricing.currency}`}
                  </div>
                </div>
                <p className="text-slate-500 text-base sm:text-lg font-bold leading-relaxed">
                  {t.preview.readyDesc}
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full py-4 sm:py-5 bg-[#EEA727] text-white rounded-xl sm:rounded-2xl font-black text-lg sm:text-xl hover:bg-[#4D2B8C] transition-all flex items-center justify-center gap-3 shadow-xl shadow-amber-100 transform hover:-translate-y-1"
                >
                  {t.preview.proceed}
                  <ArrowRight className={`w-5 h-5 sm:w-6 sm:h-6 ${lang === 'ar' ? 'rotate-180' : ''}`} />
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
              <Download className="w-8 h-8 text-[#4D2B8C]" />
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
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
);
