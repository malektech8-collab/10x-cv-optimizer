import React from 'react';
import { Sparkles, ArrowDown, Bot } from 'lucide-react';
import { translations, Language } from '../../constants/translations';

interface HeroLeadMagnetProps {
  lang: Language;
  onScrollToUpload: () => void;
  onStartBuilder?: () => void;
}

export const HeroLeadMagnet: React.FC<HeroLeadMagnetProps> = ({ lang, onScrollToUpload, onStartBuilder }) => {
  const t = translations[lang];
  const lt = t.landing.hero;

  return (
    <section className="hero-gradient relative overflow-hidden pt-16 pb-8 px-4 no-print" dir={t.dir}>
      {/* Decorative dot grid corners */}
      <div className="pointer-events-none absolute top-0 end-0 w-64 h-64 dot-grid opacity-40 -translate-y-1/4 translate-x-1/4" />
      <div className="pointer-events-none absolute bottom-0 start-0 w-40 h-40 dot-grid opacity-20 translate-y-1/4 -translate-x-1/4" />

      <div className="max-w-2xl mx-auto text-center relative">
        {/* Badge */}
        <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-1.5 bg-[#C9984A]/10 text-[#2D1065] rounded-full text-xs font-medium border border-[#C9984A]/25 tracking-wide mb-6">
          <Sparkles className="w-3.5 h-3.5 text-[#C9984A]" />
          {lt.badge}
        </div>

        {/* Headline */}
        <h1 className="animate-fade-up delay-100 text-fluid-hero font-black text-[#150D30] tracking-tight mb-5">
          {lt.title}
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2D1065] to-[#9B4DCA]">
            {lt.titleAccent}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="animate-fade-up delay-200 text-fluid-lg text-slate-500 max-w-lg mx-auto leading-relaxed mb-10">
          {lt.subtitle}
        </p>

        {/* CTA Buttons */}
        <div className="animate-fade-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onScrollToUpload}
            className="inline-flex items-center gap-3 px-8 py-4 bg-[#2D1065] text-white rounded-xl font-semibold text-lg hover:bg-[#220C4E] transition-colors shadow-[0_4px_16px_rgba(45,16,101,0.3)] hover:shadow-[0_6px_24px_rgba(45,16,101,0.4)]"
          >
            {lt.cta}
            <ArrowDown className={`w-5 h-5 ${lang === 'ar' ? 'rotate-0' : ''}`} />
          </button>

          <span className="text-slate-400 text-sm hidden sm:block">or</span>

          <div className="flex flex-col items-center gap-1">
            <span className="text-slate-400 text-xs">{lt.builderSubtext}</span>
            <button
              onClick={onStartBuilder}
              className="inline-flex items-center gap-2 px-6 py-3.5 border-2 border-[#2D1065]/30 text-[#2D1065] rounded-xl font-semibold hover:bg-[#2D1065]/5 transition-colors"
            >
              <Bot className="w-5 h-5 text-[#C9984A]" />
              {lt.builderCta}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
