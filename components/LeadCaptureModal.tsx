import React, { useState } from 'react';
import { X, Loader2, FileSearch, Lock, Shield } from 'lucide-react';
import { translations, Language } from '../constants/translations';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';

export interface LeadData {
  name: string;
  email: string;
  phone: string;
  targetJobTitle: string;
  targetIndustry: string;
}

interface LeadCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (leadData: LeadData) => void;
  lang: Language;
}

export const LeadCaptureModal: React.FC<LeadCaptureModalProps> = ({ isOpen, onClose, onSubmit, lang }) => {
  const t = translations[lang];
  const lt = t.landing.leadCapture;

  const [loading, setLoading] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [formData, setFormData] = useState<LeadData>({
    name: '',
    email: '',
    phone: '',
    targetJobTitle: '',
    targetIndustry: '',
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLimitReached(false);

    try {
      if (isFirebaseConfigured) {
        // Check if email already used a free analysis
        const leadsRef = collection(db, 'leads');
        const q = query(leadsRef, where('email', '==', formData.email.toLowerCase().trim()));
        const snap = await getDocs(q);

        if (!snap.empty) {
          const existingLead = snap.docs[0];
          const data = existingLead.data();
          if (data.analysisCount >= 1) {
            setLimitReached(true);
            setLoading(false);
            return;
          }
          // Existing lead but hasn't used analysis yet — update count
          await updateDoc(doc(db, 'leads', existingLead.id), {
            analysisCount: (data.analysisCount || 0) + 1,
            name: formData.name,
            phone: formData.phone || null,
            targetJobTitle: formData.targetJobTitle,
            targetIndustry: formData.targetIndustry,
          });
        } else {
          // New lead
          const emailNorm = formData.email.toLowerCase().trim();
          await addDoc(leadsRef, {
            name: formData.name,
            email: emailNorm,
            phone: formData.phone || null,
            targetJobTitle: formData.targetJobTitle,
            targetIndustry: formData.targetIndustry,
            source: 'ats-analysis',
            analysisCount: 1,
            createdAt: new Date().toISOString(),
          });
          // Marketing contact (consent-flagged copy for email campaigns)
          await addDoc(collection(db, 'marketingContacts'), {
            email: emailNorm,
            name: formData.name,
            source: 'ats-analysis',
            createdAt: new Date().toISOString(),
            consent: true,
          });
        }
      }

      onSubmit(formData);
    } catch (err) {
      console.error('Lead capture error:', err);
      // Still allow analysis even if lead storage fails
      onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#150D30]/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.12)] border border-[#E8E2F0] overflow-hidden max-h-[90vh] flex flex-col"
        dir={t.dir}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#2D1065] to-[#3D1A85] text-white flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 end-4 p-1 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <FileSearch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{lt.title}</h2>
              <p className="text-indigo-200 text-xs">{lt.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {limitReached ? (
            <div className="text-center py-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                <Lock className="w-7 h-7 text-amber-500" />
              </div>
              <h3 className="text-lg font-bold text-[#150D30] mb-2">{lt.limitReached}</h3>
              <p className="text-slate-500 text-sm mb-6">{lt.limitDesc}</p>
              <button
                onClick={() => {
                  onClose();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full py-3 bg-[#2D1065] text-white rounded-xl font-medium hover:bg-[#220C4E] transition-colors"
              >
                {lt.upgradeButton}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-[#150D30] mb-1.5">{lt.name}</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-[#FAF9F7] border border-[#E8E2F0] rounded-xl text-sm text-[#150D30] focus:outline-none focus:ring-2 focus:ring-[#9B4DCA]/30 focus:border-[#9B4DCA] transition-all"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-[#150D30] mb-1.5">{lt.email}</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-[#FAF9F7] border border-[#E8E2F0] rounded-xl text-sm text-[#150D30] focus:outline-none focus:ring-2 focus:ring-[#9B4DCA]/30 focus:border-[#9B4DCA] transition-all"
                />
              </div>

              {/* Phone (optional) */}
              <div>
                <label className="block text-sm font-medium text-[#150D30] mb-1.5">{lt.phone}</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-[#FAF9F7] border border-[#E8E2F0] rounded-xl text-sm text-[#150D30] focus:outline-none focus:ring-2 focus:ring-[#9B4DCA]/30 focus:border-[#9B4DCA] transition-all"
                />
              </div>

              {/* Target Job Title (optional) */}
              <div>
                <label className="block text-sm font-medium text-[#150D30] mb-1.5">{lt.jobTitle}</label>
                <input
                  type="text"
                  name="targetJobTitle"
                  value={formData.targetJobTitle}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-[#FAF9F7] border border-[#E8E2F0] rounded-xl text-sm text-[#150D30] focus:outline-none focus:ring-2 focus:ring-[#9B4DCA]/30 focus:border-[#9B4DCA] transition-all"
                />
              </div>

              {/* Target Industry (optional) */}
              <div>
                <label className="block text-sm font-medium text-[#150D30] mb-1.5">{lt.industry}</label>
                <select
                  name="targetIndustry"
                  value={formData.targetIndustry}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-[#FAF9F7] border border-[#E8E2F0] rounded-xl text-sm text-[#150D30] focus:outline-none focus:ring-2 focus:ring-[#9B4DCA]/30 focus:border-[#9B4DCA] transition-all"
                >
                  <option value="">{lt.industryPlaceholder}</option>
                  {lt.industryOptions.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#2D1065] text-white rounded-xl font-medium text-base hover:bg-[#220C4E] transition-colors flex items-center justify-center gap-2 shadow-[0_2px_8px_rgba(45,16,101,0.25)] disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <FileSearch className="w-4 h-4" />
                    {lt.button}
                  </>
                )}
              </button>

              {/* Privacy note */}
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                <Shield className="w-3 h-3" />
                <span>{lt.privacy}</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
