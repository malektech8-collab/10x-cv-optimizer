import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { InvoiceModal } from '../components/InvoiceModal';
import { translations, Language } from '../constants/translations';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { ResumeJsonData, TemplateType } from '../types';
import { renderResumeHTML } from '../templates/index';
import { asBlob } from 'html-docx-js-typescript';
import { saveAs } from 'file-saver';
import {
  Loader2, FileText, Calendar, CheckCircle2, Lock, Receipt,
  Download, Eye, ChevronDown, ChevronUp, LayoutDashboard, Package, Clock, Printer
} from 'lucide-react';

interface DashboardProps {
  lang: Language;
  setLang: (lang: Language) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ lang, setLang }) => {
  const t = translations[lang];
  const navigate = useNavigate();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [invoiceItem, setInvoiceItem] = useState<any | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user || !isFirebaseConfigured) return;
    const fetchHistory = async () => {
      try {
        const q = query(
          collection(db, 'optimizations'),
          where('user_id', '==', user.uid),
          orderBy('created_at', 'desc')
        );
        const snapshot = await getDocs(q);
        setHistory(
          snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter((item: any) => item.html_content || item.is_paid || item.original_filename)
        );
      } catch (err) {
        console.error('Error fetching history:', err);
      }
      setLoading(false);
    };
    fetchHistory();
  }, [user]);

  const formatDate = (createdAt: any) => {
    if (!createdAt) return '—';
    const date = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  };

  const currencySymbol = (code: string) => code === 'SAR' ? 'ر.س' : code;

  const formatAmount = (item: any) => {
    if (!item.amount) return null;
    const major = (item.amount / 100).toFixed(2);
    return `${major} ${currencySymbol(item.currency || 'SAR')}`;
  };

  const getResumeHtml = (item: any) => {
    if (item.resume_json) {
      return renderResumeHTML(item.resume_json as ResumeJsonData, (item.selected_template || 'classic') as TemplateType, lang as 'en' | 'ar');
    }
    return item.html_content || '';
  };

  const getExportName = (item: any) =>
    (item.original_filename?.replace(/\.[^.]+$/, '') || 'resume').replace(/\s+/g, '_') + '_Optimized';

  const handleDownloadPdf = (item: any) => {
    const html = getResumeHtml(item);
    if (!html) return;
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const innerHtml = bodyMatch ? bodyMatch[1] : html;
    const isRtl = html.includes('dir="rtl"');
    const exportName = getExportName(item);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
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
      alert('Please allow pop-ups to open the PDF download/print dialog.');
    }
  };

  const handleDownloadDocx = async (item: any) => {
    const html = getResumeHtml(item);
    if (!html) return;
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
      saveAs(blob, `${getExportName(item)}.docx`);
    } catch (error) {
      console.error('DOCX generation error:', error);
      alert('There was an error generating the DOCX. Please try again.');
    }
  };

  const handleViewResume = (item: any) => {
    navigate('/', {
      state: { confirmedOptimizationId: item.id, isPaid: item.is_paid },
    });
  };

  const paidCount = history.filter(h => h.is_paid).length;
  const unpaidCount = history.filter(h => !h.is_paid).length;

  // Not signed in
  if (!loading && !user) {
    return (
      <Layout lang={lang} onLanguageChange={setLang}>
        <div className="max-w-sm mx-auto py-32 text-center space-y-5 px-4 animate-fade-up">
          <div className="w-16 h-16 bg-[#EBE5F5] rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7 text-[#2D1065]" />
          </div>
          <h2 className="text-2xl font-bold text-[#150D30]">{t.dashboard.signInRequired}</h2>
          <p className="text-slate-500 text-sm">{t.dashboard.signInDesc}</p>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-3 bg-[#2D1065] text-white rounded-xl font-medium text-sm hover:bg-[#220C4E] transition-colors shadow-[0_2px_8px_rgba(45,16,101,0.25)]"
          >
            {t.dashboard.goHome}
          </button>
        </div>
      </Layout>
    );
  }

  // Loading
  if (loading) {
    return (
      <Layout lang={lang} onLanguageChange={setLang}>
        <div className="flex items-center justify-center py-40">
          <div className="w-12 h-12 bg-[#EBE5F5] rounded-2xl flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-[#2D1065] animate-spin" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout lang={lang} onLanguageChange={setLang}>
      <div className="max-w-4xl mx-auto py-10 sm:py-14 px-4 space-y-8 animate-fade-up" dir={t.dir}>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E2F0]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[#EBE5F5] rounded-xl flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-[#2D1065]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#150D30]">{t.dashboard.title}</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2D1065] text-white rounded-xl text-sm font-medium hover:bg-[#220C4E] transition-colors shadow-[0_2px_8px_rgba(45,16,101,0.25)]"
          >
            {t.dashboard.newOptimization}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-[#E8E2F0] p-5 shadow-[0_2px_12px_rgba(45,16,101,0.05)]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-[#EBE5F5] rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-[#2D1065]" />
              </div>
              <span className="text-sm font-medium text-slate-500">{t.dashboard.totalOrders}</span>
            </div>
            <p className="text-3xl font-bold text-[#150D30]">{history.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#E8E2F0] p-5 shadow-[0_2px_12px_rgba(45,16,101,0.05)]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-sm font-medium text-slate-500">{t.dashboard.paidOrders}</span>
            </div>
            <p className="text-3xl font-bold text-green-600">{paidCount}</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#E8E2F0] p-5 shadow-[0_2px_12px_rgba(45,16,101,0.05)]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-sm font-medium text-slate-500">{t.dashboard.pendingOrders}</span>
            </div>
            <p className="text-3xl font-bold text-amber-600">{unpaidCount}</p>
          </div>
        </div>

        {/* Orders heading */}
        <div>
          <h2 className="text-lg font-bold text-[#150D30]">{t.dashboard.ordersTitle}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{t.dashboard.ordersSubtitle}</p>
        </div>

        {/* Orders list */}
        {history.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-[#E8E2F0] shadow-[0_2px_12px_rgba(45,16,101,0.05)]">
            <div className="w-14 h-14 bg-[#EBE5F5] rounded-xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-[#BFB0E5]" />
            </div>
            <h3 className="text-lg font-semibold text-slate-400 mb-1">{t.dashboard.empty}</h3>
            <p className="text-slate-400 text-sm">{t.dashboard.emptyDesc}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-[#E8E2F0] shadow-[0_2px_12px_rgba(45,16,101,0.05)] hover:border-[#BFB0E5] hover:shadow-[0_4px_16px_rgba(45,16,101,0.09)] transition-all overflow-hidden"
                >
                  {/* Card header — order meta */}
                  <div className="flex items-center justify-between px-5 py-3 bg-[#F2EEF9] border-b border-[#E8E2F0]">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <Receipt className="w-3.5 h-3.5" />
                      {t.dashboard.orderLabel} #{item.order_number || item.id.slice(0, 8).toUpperCase()}
                    </div>
                    <div className="flex items-center gap-3">
                      {formatAmount(item) && (
                        <span className="text-xs font-semibold text-[#2D1065]">{formatAmount(item)}</span>
                      )}
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                        item.is_paid
                          ? 'bg-green-50 text-green-600 border-green-100'
                          : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {item.is_paid
                          ? <CheckCircle2 className="w-3 h-3" />
                          : <Lock className="w-3 h-3" />}
                        {item.is_paid ? t.history.paid : t.history.unpaid}
                      </span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-5">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-[#EBE5F5] p-3 rounded-xl flex-shrink-0">
                          <FileText className="w-5 h-5 text-[#2D1065]" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#150D30] text-sm leading-snug">{item.original_filename || 'CV Optimization'}</h3>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(item.created_at)}
                            </span>
                            {item.paid_at && (
                              <span className="flex items-center gap-1 text-green-500">
                                <CheckCircle2 className="w-3 h-3" />
                                {t.dashboard.paidOn} {formatDate(item.paid_at)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        {(item.html_content || item.resume_json) ? (
                          <button
                            onClick={() => handleViewResume(item)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2D1065] text-white rounded-xl text-sm font-medium hover:bg-[#220C4E] transition-colors shadow-[0_2px_8px_rgba(45,16,101,0.2)]"
                          >
                            <Eye className="w-4 h-4" />
                            {t.history.view}
                          </button>
                        ) : (
                          <span className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-400 rounded-xl text-sm font-medium cursor-not-allowed">
                            <Eye className="w-4 h-4" />
                            {t.history.view}
                          </span>
                        )}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          className="p-2.5 text-slate-400 hover:text-[#2D1065] hover:bg-[#F2EEF9] rounded-xl transition-all"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="mt-5 pt-5 border-t border-[#E8E2F0] space-y-3 animate-fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div className="bg-[#FAF9F7] rounded-xl p-3">
                            <span className="text-xs text-slate-400 block mb-1">{t.dashboard.orderNumber}</span>
                            <span className="font-medium text-[#150D30]">
                              {item.order_number || item.id.slice(0, 8).toUpperCase()}
                            </span>
                          </div>
                          <div className="bg-[#FAF9F7] rounded-xl p-3">
                            <span className="text-xs text-slate-400 block mb-1">{t.dashboard.createdDate}</span>
                            <span className="font-medium text-[#150D30]">{formatDate(item.created_at)}</span>
                          </div>
                          {item.selected_template && (
                            <div className="bg-[#FAF9F7] rounded-xl p-3">
                              <span className="text-xs text-slate-400 block mb-1">{t.dashboard.template}</span>
                              <span className="font-medium text-[#150D30] capitalize">{item.selected_template}</span>
                            </div>
                          )}
                          <div className="bg-[#FAF9F7] rounded-xl p-3">
                            <span className="text-xs text-slate-400 block mb-1">{t.dashboard.paymentStatus}</span>
                            <span className={`font-medium ${item.is_paid ? 'text-green-600' : 'text-amber-600'}`}>
                              {item.is_paid ? t.history.paid : t.history.unpaid}
                            </span>
                          </div>
                        </div>
                        {item.is_paid && (
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => handleDownloadPdf(item)}
                              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#2D1065] rounded-xl hover:bg-[#220C4E] transition-colors shadow-[0_2px_6px_rgba(45,16,101,0.2)]"
                            >
                              <Download className="w-4 h-4" />
                              {t.dashboard.downloadPdf}
                            </button>
                            <button
                              onClick={() => handleDownloadDocx(item)}
                              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#2D1065] bg-[#EBE5F5] rounded-xl hover:bg-[#DDD5EE] transition-colors"
                            >
                              <Download className="w-4 h-4" />
                              {t.dashboard.downloadDocx}
                            </button>
                            <button
                              onClick={() => setInvoiceItem(item)}
                              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#2D1065] border border-[#E8E2F0] bg-white rounded-xl hover:bg-[#F2EEF9] transition-colors"
                            >
                              <Receipt className="w-4 h-4" />
                              {t.dashboard.viewInvoice}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <InvoiceModal
        isOpen={!!invoiceItem}
        onClose={() => setInvoiceItem(null)}
        item={invoiceItem}
        lang={lang}
      />
    </Layout>
  );
};
