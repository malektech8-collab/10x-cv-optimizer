import React from 'react';
import { Wand2, FileText, Search, Sparkles } from 'lucide-react';
import { translations, Language } from '../../constants/translations';

interface UpgradeBenefitsProps {
  lang: Language;
}

const benefitIcons = [
  <Wand2 className="w-6 h-6" />,
  <FileText className="w-6 h-6" />,
  <Search className="w-6 h-6" />,
  <Sparkles className="w-6 h-6" />,
];

const benefitColors = [
  { bg: 'bg-[#2D1065]/10', text: 'text-[#2D1065]' },
  { bg: 'bg-[#9B4DCA]/10', text: 'text-[#9B4DCA]' },
  { bg: 'bg-[#C9984A]/10', text: 'text-[#C9984A]' },
  { bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
];

export const UpgradeBenefits: React.FC<UpgradeBenefitsProps> = ({ lang }) => {
  const t = translations[lang];
  const lt = t.landing.upgradeBenefits;

  return (
    <section className="mt-24 no-print" dir={t.dir}>
      <div className="text-center mb-14">
        <h2 className="animate-fade-up text-fluid-3xl font-bold text-[#150D30] mb-3">
          {lt.title}
        </h2>
        <p className="animate-fade-up delay-100 text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
          {lt.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {lt.benefits.map((benefit, idx) => (
          <div
            key={idx}
            className="animate-fade-up bg-white p-7 rounded-2xl border border-[#E8E2F0] shadow-[0_2px_12px_rgba(45,16,101,0.05)] flex flex-col gap-4 hover:shadow-[0_4px_20px_rgba(45,16,101,0.09)] hover:border-[#BFB0E5] transition-all cursor-default"
            style={{ animationDelay: `${0.1 * idx}s` }}
          >
            <div className={`p-3 rounded-xl w-fit ${benefitColors[idx].bg} ${benefitColors[idx].text}`}>
              {benefitIcons[idx]}
            </div>
            <div>
              <h3 className="font-semibold text-lg text-[#150D30] mb-2">{benefit.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{benefit.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
