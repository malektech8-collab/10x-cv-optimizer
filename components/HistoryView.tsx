
import React, { useState, useEffect } from 'react';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { translations, Language } from '../constants/translations';
import { ResumeJsonData, TemplateType } from '../types';
import { Loader2, FileText, ExternalLink, Calendar, CheckCircle2, Lock, ArrowLeft, Receipt } from 'lucide-react';

interface HistoryViewProps {
  lang: Language;
  onSelect: (html: string, filename: string, paid: boolean, resumeJson?: ResumeJsonData | null, template?: TemplateType) => void;
  onBack: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ lang, onSelect, onBack }) => {
  const t = translations[lang];
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!isFirebaseConfigured) { setLoading(false); return; }
      const user = auth.currentUser;
      if (!user) { setLoading(false); return; }
      try {
        const q = query(
          collection(db, 'optimizations'),
          where('user_id', '==', user.uid),
          orderBy('created_at', 'desc')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((item: any) => item.html_content && item.original_filename);
        setHistory(data);
      } catch (err) {
        console.error('Error fetching history:', err);
      }
      setLoading(false);
    };
    fetchHistory();
  }, []);

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

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <div className="w-12 h-12 bg-[#EBE5F5] rounded-2xl flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-[#2D1065] animate-spin" />
        </div>
      </div>
    );
  }

  /* ── Not configured ── */
  if (!isFirebaseConfigured) {
    return (
      <div className="max-w-sm mx-auto py-24 text-center space-y-4 px-4">
        <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-[#150D30]">Database Not Configured</h2>
        <p className="text-slate-500 text-sm">Please set up Firebase in your environment.</p>
        <button
          onClick={onBack}
          className="px-6 py-2.5 bg-[#2D1065] text-white rounded-xl font-medium text-sm hover:bg-[#220C4E] transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-8 animate-fade-up" dir={t.dir}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between pb-6 border-b border-[#E8E2F0]">
        <div>
          <h2 className="text-2xl font-bold text-[#150D30]">{t.history.title}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{history.length} saved resume{history.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-[#2D1065] transition-colors"
        >
          <ArrowLeft className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
          Go Back
        </button>
      </div>

      {/* ── Empty state ── */}
      {history.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-[#E8E2F0] shadow-[0_2px_12px_rgba(45,16,101,0.05)]">
          <div className="w-14 h-14 bg-[#EBE5F5] rounded-xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-[#BFB0E5]" />
          </div>
          <p className="text-slate-500 text-sm">{t.history.empty}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-[#E8E2F0] shadow-[0_2px_12px_rgba(45,16,101,0.05)] hover:border-[#BFB0E5] hover:shadow-[0_4px_16px_rgba(45,16,101,0.09)] transition-all overflow-hidden"
            >
              {/* Card header — order meta */}
              <div className="flex items-center justify-between px-5 py-3 bg-[#F2EEF9] border-b border-[#E8E2F0]">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Receipt className="w-3.5 h-3.5" />
                  Order #{item.order_number || item.id.slice(0, 8).toUpperCase()}
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
              <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-[#EBE5F5] p-3 rounded-xl flex-shrink-0">
                    <FileText className="w-5 h-5 text-[#2D1065]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#150D30] text-sm leading-snug">{item.original_filename}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(item.created_at)}
                      </span>
                      {item.paid_at && (
                        <span className="flex items-center gap-1 text-green-500">
                          <CheckCircle2 className="w-3 h-3" />
                          Paid {formatDate(item.paid_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onSelect(item.html_content, item.original_filename, item.is_paid, item.resume_json || null, item.selected_template || 'classic')}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2D1065] text-white rounded-xl text-sm font-medium hover:bg-[#220C4E] transition-colors shadow-[0_2px_8px_rgba(45,16,101,0.2)] flex-shrink-0"
                >
                  {t.history.view}
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
