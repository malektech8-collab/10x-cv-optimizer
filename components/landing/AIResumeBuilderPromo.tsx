import React from 'react';
import { Bot, ArrowRight } from 'lucide-react';
import { translations, Language } from '../../constants/translations';
import { FEATURE_FLAGS } from '../../constants/featureFlags';

interface AIResumeBuilderPromoProps {
  lang: Language;
  onStart?: () => void;
}

export const AIResumeBuilderPromo: React.FC<AIResumeBuilderPromoProps> = ({ lang, onStart }) => {
  const t = translations[lang];
  const lt = t.landing.aiBuilderPromo;
  const isActive = FEATURE_FLAGS.aiResumeInterview;

  return (
    <section className="mt-24 no-print" dir={t.dir}>
      <div className="max-w-3xl mx-auto relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2D1065] to-[#220B55] p-8 sm:p-12">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -top-16 -end-16 w-48 h-48 rounded-full bg-[#9B4DCA]/10" />
        <div className="pointer-events-none absolute -bottom-12 -start-12 w-36 h-36 rounded-full bg-[#C9984A]/10" />

        <div className="relative flex flex-col sm:flex-row items-center gap-8">
          {/* Icon */}
          <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
            <Bot className="w-8 h-8 text-[#C9984A]" />
          </div>

          {/* Content */}
          <div className="flex-1 text-center sm:text-start">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#C9984A]/20 text-[#C9984A] rounded-full text-xs font-medium mb-4">
              {isActive ? lt.badgeActive : lt.badge}
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">{lt.title}</h3>
            <p className="text-indigo-200 text-sm leading-relaxed mb-6">{lt.subtitle}</p>
            <button
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#C9984A] text-white rounded-xl font-medium hover:bg-[#B8893F] transition-colors shadow-lg"
              onClick={() => {
                if (isActive && onStart) {
                  onStart();
                }
              }}
            >
              {isActive ? lt.cta : lt.ctaComingSoon}
              <ArrowRight className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
