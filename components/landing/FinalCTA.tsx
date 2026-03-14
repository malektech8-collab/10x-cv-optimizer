import React from 'react';
import { ArrowUp, Shield } from 'lucide-react';
import { translations, Language } from '../../constants/translations';

interface FinalCTAProps {
  lang: Language;
  onScrollToUpload: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ lang, onScrollToUpload }) => {
  const t = translations[lang];
  const lt = t.landing.finalCta;

  return (
    <section className="mt-24 no-print" dir={t.dir}>
      <div className="max-w-lg mx-auto bg-white rounded-2xl border border-[#E8E2F0] shadow-[0_4px_24px_rgba(45,16,101,0.08)] overflow-hidden">
        {/* Header */}
        <div className="px-8 py-7 bg-[#2D1065] text-center">
          <h2 className="text-2xl font-bold text-white mb-1">{lt.title}</h2>
          <p className="text-indigo-200 text-sm opacity-90">{lt.subtitle}</p>
        </div>

        {/* Body */}
        <div className="p-8 text-center">
          <p className="text-slate-500 text-sm mb-6">{lt.priceLine}</p>

          {/* CTA */}
          <button
            onClick={onScrollToUpload}
            className="w-full py-3.5 bg-[#2D1065] text-white rounded-xl font-medium text-base hover:bg-[#220C4E] transition-colors flex items-center justify-center gap-3 shadow-[0_2px_8px_rgba(45,16,101,0.25)]"
          >
            {lt.cta}
            <ArrowUp className="w-5 h-5" />
          </button>

          <div className="flex items-center justify-center gap-2 mt-5">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-xs text-slate-400">{lt.footer}</p>
          </div>
        </div>
      </div>
    </section>
  );
};
