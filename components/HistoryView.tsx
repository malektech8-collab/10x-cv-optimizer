
import React, { useState, useEffect } from 'react';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { translations, Language } from '../constants/translations';
import { Loader2, FileText, ExternalLink, Calendar, CheckCircle2, Lock, ArrowLeft } from 'lucide-react';

interface HistoryViewProps {
  lang: Language;
  onSelect: (html: string, filename: string, paid: boolean) => void;
  onBack: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ lang, onSelect, onBack }) => {
  const t = translations[lang];
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!isFirebaseConfigured) {
        setLoading(false);
        return;
      }

      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, 'optimizations'),
          where('user_id', '==', user.uid),
          orderBy('created_at', 'desc')
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setHistory(data);
      } catch (err) {
        console.error('Error fetching history:', err);
      }
      setLoading(false);
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="w-12 h-12 text-[#85409D] animate-spin" />
      </div>
    );
  }

  if (!isFirebaseConfigured) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-6">
        <Lock className="w-16 h-16 text-slate-300 mx-auto" />
        <h2 className="text-3xl font-black text-[#4D2B8C]">Database Not Configured</h2>
        <p className="text-slate-500 font-bold">Please set up Firebase in your environment.</p>
        <button onClick={onBack} className="px-8 py-3 bg-[#4D2B8C] text-white rounded-xl font-bold">Go Back</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-12 animate-fade-in" dir={t.dir}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-8 gap-6">
        <div className="space-y-2">
          <h2 className="text-3xl sm:text-5xl font-black text-[#4D2B8C] tracking-tight">{t.history.title}</h2>
          <p className="text-slate-500 font-bold">{history.length} Saved Resumes</p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-black text-slate-400 hover:text-[#4D2B8C] transition-colors"
        >
          <ArrowLeft className={`w-5 h-5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
          Go Back
        </button>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[2rem] sm:rounded-[3rem] border border-slate-100 shadow-xl shadow-indigo-100/30">
          <div className="bg-slate-50 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300" />
          </div>
          <p className="text-lg sm:text-xl font-bold text-slate-400 px-4">{t.history.empty}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {history.map((item) => (
            <div
              key={item.id}
              className="bg-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-100 shadow-xl shadow-indigo-100/20 flex flex-col md:flex-row items-center md:items-start lg:items-center justify-between gap-6 sm:gap-8 hover:border-[#85409D]/30 transition-all group"
            >
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 w-full md:w-auto">
                <div className="bg-indigo-50 p-4 sm:p-5 rounded-xl sm:rounded-2xl group-hover:bg-[#4D2B8C] group-hover:text-[#FFEF5F] transition-all">
                  <FileText className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <div className="space-y-1 text-center sm:text-start flex-grow">
                  <h3 className="text-lg sm:text-xl font-black text-[#4D2B8C] tracking-tight">{item.original_filename}</h3>
                  <p className="text-[10px] font-bold text-slate-500">Order #{item.order_number || item.id.slice(0, 8)}</p>
                  <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-400 font-bold mt-2">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      {new Date(item.created_at).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {item.is_paid ? (
                        <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#EEA727]" />
                      )}
                      <span className={item.is_paid ? 'text-green-600' : 'text-[#EEA727] text-[10px] sm:text-sm'}>
                        {item.is_paid ? t.history.paid : t.history.unpaid}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onSelect(item.html_content, item.original_filename, item.is_paid)}
                className="w-full md:w-auto px-10 py-4 bg-[#85409D] text-white rounded-2xl font-black text-base hover:bg-[#4D2B8C] transition-all shadow-lg shadow-purple-100 flex items-center justify-center gap-3"
              >
                {t.history.view}
                <ExternalLink className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
