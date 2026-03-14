import React from 'react';
import { FileText } from 'lucide-react';
import { translations, Language } from '../../constants/translations';

interface ExampleATSReportProps {
  lang: Language;
}

export const ExampleATSReport: React.FC<ExampleATSReportProps> = ({ lang }) => {
  const t = translations[lang];
  const lt = t.landing.exampleReport;

  // Static sample score for the demo
  const sampleScore = 42;
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - sampleScore / 100);
  const scoreColor = sampleScore >= 80 ? '#10b981' : sampleScore >= 50 ? '#C9984A' : '#ef4444';
  const scoreTextColor = sampleScore >= 80 ? 'text-emerald-500' : sampleScore >= 50 ? 'text-[#C9984A]' : 'text-red-500';

  return (
    <section className="mt-24 no-print" dir={t.dir}>
      <div className="text-center mb-12">
        <h2 className="animate-fade-up text-fluid-3xl font-bold text-[#150D30] mb-3">
          {lt.title}
        </h2>
        <p className="animate-fade-up delay-100 text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
          {lt.subtitle}
        </p>
      </div>

      {/* Example report card */}
      <div className="animate-fade-up delay-200 max-w-2xl mx-auto bg-white rounded-2xl border border-[#E8E2F0] shadow-[0_4px_24px_rgba(45,16,101,0.08)] overflow-hidden">
        {/* Header bar */}
        <div className="px-6 py-4 bg-[#F8F6FC] border-b border-[#E8E2F0] flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#2D1065]/10">
            <FileText className="w-4 h-4 text-[#2D1065]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#150D30]">{lt.scoreLabel}</p>
            <p className="text-xs text-slate-400">sample_resume.pdf</p>
          </div>
        </div>

        <div className="p-8 flex flex-col sm:flex-row items-center gap-8">
          {/* Score circle */}
          <div className="relative w-[156px] h-[156px] flex items-center justify-center flex-shrink-0">
            <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 156 156">
              <circle cx="78" cy="78" r={radius} stroke="#EBE5F5" strokeWidth="9" fill="transparent" />
              <circle
                cx="78" cy="78" r={radius}
                stroke={scoreColor}
                strokeWidth="9"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className="transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <div className="text-center">
              <span className={`text-[2.75rem] font-black leading-none ${scoreTextColor}`}>{sampleScore}</span>
              <span className="text-sm font-medium text-slate-400 block mt-0.5">/100</span>
            </div>
          </div>

          {/* Category bars */}
          <div className="flex-1 w-full space-y-4">
            {lt.categories.map((cat, idx) => {
              const barColor =
                cat.score >= 80 ? 'bg-emerald-500' :
                cat.score >= 50 ? 'bg-[#C9984A]' :
                'bg-red-500';

              return (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-[#150D30]">{cat.label}</span>
                    <span className="font-semibold text-slate-500">{cat.score}%</span>
                  </div>
                  <div className="h-2.5 bg-[#EBE5F5] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${barColor} transition-all duration-1000 ease-out`}
                      style={{ width: `${cat.score}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer hint */}
        <div className="px-6 py-3 bg-[#F8F6FC] border-t border-[#E8E2F0] text-center">
          <p className="text-xs text-slate-400 italic">
            {lang === 'ar' ? 'هذا مثال توضيحي — ارفع سيرتك للحصول على تقييمك الحقيقي' : 'This is a sample — upload your resume to get your real score'}
          </p>
        </div>
      </div>
    </section>
  );
};
