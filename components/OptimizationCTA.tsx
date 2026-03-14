import React from 'react';
import { translations, Language } from '../constants/translations';
import { Sparkles, ArrowRight, CheckCircle2, Zap, Gift } from 'lucide-react';

interface OptimizationCTAProps {
    currentScore: number;
    onOptimize: () => void;
    lang: Language;
    userComments: string;
    setUserComments: (comments: string) => void;
}

export const OptimizationCTA: React.FC<OptimizationCTAProps> = ({
    currentScore, onOptimize, lang, userComments, setUserComments,
}) => {
    const t = translations[lang];
    const ct = t.landing.optimizationCta;
    const isAr = lang === 'ar';

    // Projected improvement: aim for meaningful gain, cap at 98
    const projected = currentScore >= 85
        ? Math.min(currentScore + 7, 98)
        : Math.min(currentScore + Math.max(25, 85 - currentScore), 95);

    return (
        <div className="bg-gradient-to-br from-[#2D1065] to-[#220B55] rounded-2xl p-8 md:p-10 text-white relative overflow-hidden" dir={t.dir}>
            {/* Decorative elements */}
            <div className="absolute top-0 end-0 w-64 h-64 bg-white/[0.03] rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 start-0 w-40 h-40 bg-[#C9984A]/[0.08] rounded-full translate-y-1/2 -translate-x-1/4" />

            <div className="max-w-3xl mx-auto relative">

                {/* Score projection banner */}
                <div className="flex items-center justify-center gap-6 mb-8">
                    {/* Current score */}
                    <div className="text-center">
                        <span className={`text-3xl font-black ${currentScore >= 80 ? 'text-emerald-400' : currentScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{currentScore}</span>
                        <p className="text-[11px] text-indigo-300 font-medium mt-0.5">
                            {isAr ? 'نتيجتك الحالية' : 'Current'}
                        </p>
                    </div>

                    {/* Arrow */}
                    <div className="flex items-center gap-1.5">
                        <div className="w-8 h-px bg-indigo-400/40" />
                        <Zap className="w-5 h-5 text-[#C9984A]" />
                        <div className="w-8 h-px bg-indigo-400/40" />
                    </div>

                    {/* Projected score */}
                    <div className="text-center">
                        <span className="text-3xl font-black text-emerald-400">{projected}+</span>
                        <p className="text-[11px] text-indigo-300 font-medium mt-0.5">
                            {isAr ? 'بعد التحسين' : 'After'}
                        </p>
                    </div>
                </div>

                {/* Headline */}
                <div className="text-center mb-6">
                    <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto border border-white/10 mb-4">
                        <Sparkles className="w-5 h-5 text-[#C9984A]" />
                    </div>
                    <h3 className="text-2xl font-bold leading-snug mb-2">
                        {currentScore >= 85
                            ? (isAr ? 'سيرتك الذاتية قوية — لنجعلها مثالية.' : 'Your resume is strong — let\'s make it perfect.')
                            : ct.headline
                        }
                    </h3>
                    <p className="text-indigo-200 text-sm leading-relaxed max-w-lg mx-auto">{ct.subtitle}</p>
                </div>

                {/* Bonuses grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 max-w-xl mx-auto">
                    {ct.bonuses.map((bonus, i) => (
                        <div key={i} className="flex items-center gap-2.5 bg-white/[0.07] border border-white/10 rounded-xl px-4 py-3">
                            <div className="w-6 h-6 rounded-lg bg-[#C9984A]/20 flex items-center justify-center flex-shrink-0">
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#C9984A]" />
                            </div>
                            <span className="text-sm text-indigo-100 font-medium">{bonus}</span>
                        </div>
                    ))}
                </div>

                {/* User instructions */}
                <div className="text-start max-w-xl mx-auto mb-6">
                    <label className="block text-xs font-medium text-indigo-200 mb-2">
                        {ct.instructions}
                    </label>
                    <textarea
                        value={userComments}
                        onChange={(e) => setUserComments(e.target.value)}
                        placeholder={ct.instructionsPlaceholder}
                        className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-indigo-300/50 focus:outline-none focus:ring-2 focus:ring-[#C9984A]/60 focus:border-transparent transition-all min-h-[80px] resize-none text-sm"
                        dir={t.dir}
                    />
                </div>

                {/* CTA button + price */}
                <div className="text-center space-y-3">
                    <button
                        onClick={onOptimize}
                        className="px-10 py-3.5 bg-[#C9984A] text-white rounded-xl font-semibold text-base hover:bg-[#B8863F] transition-all flex items-center justify-center gap-2.5 mx-auto shadow-[0_4px_20px_rgba(201,152,74,0.4)] hover:shadow-[0_6px_24px_rgba(201,152,74,0.5)] active:scale-[0.98]"
                    >
                        {ct.button}
                        <ArrowRight className={`w-4.5 h-4.5 ${isAr ? 'rotate-180' : ''}`} />
                    </button>
                    <div className="flex items-center justify-center gap-2 text-xs text-indigo-300">
                        <Gift className="w-3.5 h-3.5 text-[#C9984A]" />
                        <span>{ct.price} — {ct.priceNote}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
