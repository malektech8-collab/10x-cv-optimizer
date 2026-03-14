import React, { useState } from 'react';
import { X, Briefcase, Target, ArrowRight, SkipForward } from 'lucide-react';
import { translations, Language } from '../constants/translations';

export interface JobTargetData {
  jobTitle: string;
  industry: string;
  jobDescription: string;
}

interface JobTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: JobTargetData) => void;
  onSkip: () => void;
  lang: Language;
}

export const JobTargetModal: React.FC<JobTargetModalProps> = ({ isOpen, onClose, onSubmit, onSkip, lang }) => {
  const t = translations[lang];
  const jt = t.landing.jobTarget;

  const [formData, setFormData] = useState<JobTargetData>({
    jobTitle: '',
    industry: '',
    jobDescription: '',
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#150D30]/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.12)] border border-[#E8E2F0] overflow-hidden max-h-[90vh] flex flex-col"
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
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{jt.title}</h2>
              <p className="text-indigo-200 text-xs">{jt.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Job Title */}
            <div>
              <label className="block text-sm font-medium text-[#150D30] mb-1.5">{jt.jobTitle}</label>
              <div className="relative">
                <Briefcase className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  placeholder={jt.jobTitlePlaceholder}
                  className="w-full ps-10 pe-4 py-2.5 bg-[#FAF9F7] border border-[#E8E2F0] rounded-xl text-sm text-[#150D30] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#9B4DCA]/30 focus:border-[#9B4DCA] transition-all"
                />
              </div>
            </div>

            {/* Industry */}
            <div>
              <label className="block text-sm font-medium text-[#150D30] mb-1.5">{jt.industry}</label>
              <select
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-[#FAF9F7] border border-[#E8E2F0] rounded-xl text-sm text-[#150D30] focus:outline-none focus:ring-2 focus:ring-[#9B4DCA]/30 focus:border-[#9B4DCA] transition-all"
              >
                <option value="">{jt.industry}</option>
                {jt.industryOptions.map((opt, i) => (
                  <option key={i} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Job Description */}
            <div>
              <label className="block text-sm font-medium text-[#150D30] mb-1.5">{jt.jobDescription}</label>
              <textarea
                name="jobDescription"
                value={formData.jobDescription}
                onChange={handleChange}
                placeholder={jt.jobDescriptionPlaceholder}
                rows={4}
                className="w-full px-4 py-2.5 bg-[#FAF9F7] border border-[#E8E2F0] rounded-xl text-sm text-[#150D30] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#9B4DCA]/30 focus:border-[#9B4DCA] transition-all resize-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-[#2D1065] text-white rounded-xl font-medium text-base hover:bg-[#220C4E] transition-colors flex items-center justify-center gap-2.5 shadow-[0_2px_8px_rgba(45,16,101,0.25)]"
              >
                {jt.submit}
                <ArrowRight className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
              </button>
              <button
                type="button"
                onClick={onSkip}
                className="w-full py-2.5 text-slate-500 text-sm font-medium hover:text-[#2D1065] transition-colors flex items-center justify-center gap-2"
              >
                <SkipForward className="w-3.5 h-3.5" />
                {jt.skip}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
