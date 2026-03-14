import React from 'react';
import { AnalysisReport } from '../types';
import { translations, Language } from '../constants/translations';
import { AlertTriangle, FileText, CheckCircle2, TrendingUp, XCircle, Zap, BarChart3, Type, Target, Gauge } from 'lucide-react';
import { OptimizationCTA } from './OptimizationCTA';

interface AnalysisViewProps {
    report: AnalysisReport;
    onOptimize: () => void;
    lang: Language;
    userComments: string;
    setUserComments: (comments: string) => void;
}

const CATEGORY_CONFIG = (isAr: boolean) => [
    {
        key: 'formatting' as const,
        label: isAr ? 'التنسيق' : 'Formatting',
        icon: <Type className="w-3.5 h-3.5" />,
        color: '#9B4DCA',
        bg: 'bg-purple-50',
        textColor: 'text-[#9B4DCA]',
    },
    {
        key: 'keywords' as const,
        label: isAr ? 'الكلمات المفتاحية' : 'Keywords',
        icon: <Target className="w-3.5 h-3.5" />,
        color: '#2D1065',
        bg: 'bg-[#EBE5F5]',
        textColor: 'text-[#2D1065]',
    },
    {
        key: 'impact' as const,
        label: isAr ? 'التأثير' : 'Impact',
        icon: <BarChart3 className="w-3.5 h-3.5" />,
        color: '#C9984A',
        bg: 'bg-amber-50',
        textColor: 'text-[#C9984A]',
    },
    {
        key: 'structure' as const,
        label: isAr ? 'الهيكل' : 'Structure',
        icon: <Gauge className="w-3.5 h-3.5" />,
        color: '#10b981',
        bg: 'bg-emerald-50',
        textColor: 'text-emerald-600',
    },
];

export const AnalysisView: React.FC<AnalysisViewProps> = ({ report, onOptimize, lang, userComments, setUserComments }) => {
    const t = translations[lang];
    const isAr = lang === 'ar';

    const scoreColor =
        report.score >= 80 ? 'text-emerald-500' :
        report.score >= 50 ? 'text-[#C9984A]' :
        'text-red-500';

    const scoreTrackColor =
        report.score >= 80 ? '#10b981' :
        report.score >= 50 ? '#C9984A' :
        '#ef4444';

    const scoreBadgeCls =
        report.score >= 80 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
        report.score >= 50 ? 'bg-amber-50 text-amber-600 border-amber-200' :
        'bg-red-50 text-red-600 border-red-200';

    const scoreLabel =
        report.score >= 80 ? (isAr ? 'ممتاز' : 'Excellent') :
        report.score >= 50 ? (isAr ? 'متوسط' : 'Average') :
        (isAr ? 'يحتاج تحسين' : 'Needs Work');

    // SVG circle math
    const radius = 68;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - report.score / 100);

    const hasBreakdown = !!report.scoreBreakdown;
    const categories = CATEGORY_CONFIG(isAr);

    // Use deterministic issues/strengths when available, fall back to AI-generated
    const issues = report.issues || [...report.structureGaps, ...report.grammarIssues];
    const strengths = report.strengths || report.impactOptimizations;

    return (
        <div className="max-w-5xl mx-auto py-10 sm:py-14 px-4 animate-fade-up" dir={t.dir}>

            {/* ── Header ── */}
            <div className="text-center mb-10 space-y-3">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#EBE5F5] text-[#2D1065] rounded-full text-xs font-medium border border-[#E8E2F0] tracking-wide">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{isAr ? 'اكتمل تحليل السيرة الذاتية' : 'Resume Analysis Complete'}</span>
                </div>
                <h2 className="text-fluid-3xl font-bold text-[#150D30] tracking-tight leading-tight">
                    {isAr ? 'تقرير ' : 'Your '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2D1065] to-[#9B4DCA]">
                        {isAr ? 'التوافق مع ATS' : 'ATS Report'}
                    </span>
                </h2>
                <p className="text-slate-500 max-w-lg mx-auto text-sm leading-relaxed">
                    {isAr
                        ? 'حللنا سيرتك الذاتية مقارنة بآلاف المرشحين الناجحين. إليك ما وجدناه.'
                        : 'We analyzed your resume against thousands of successful candidates. Here\'s what we found.'
                    }
                </p>
            </div>

            {/* ── Top row: Score + Summary/Breakdown ── */}
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 mb-6">

                {/* Score card */}
                <div className="bg-white rounded-2xl border border-[#E8E2F0] shadow-[0_2px_16px_rgba(45,16,101,0.06)] p-6 flex flex-col items-center justify-center gap-4">
                    <div className="relative w-[156px] h-[156px] flex items-center justify-center">
                        <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 156 156">
                            <circle cx="78" cy="78" r={radius} stroke="#EBE5F5" strokeWidth="9" fill="transparent" />
                            <circle
                                cx="78" cy="78" r={radius}
                                stroke={scoreTrackColor}
                                strokeWidth="9"
                                fill="transparent"
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                className="transition-all duration-1000 ease-out"
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="text-center">
                            <span className={`text-[2.75rem] font-black leading-none ${scoreColor}`}>{report.score}</span>
                            <span className="text-sm font-medium text-slate-400 block mt-0.5">/100</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                        <span className={`px-3.5 py-1 rounded-full border text-xs font-semibold tracking-wide ${scoreBadgeCls}`}>
                            {scoreLabel}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <span className="font-medium">{isAr ? 'توافق ATS:' : 'ATS:'}</span>
                            <span className="font-semibold text-slate-600">{report.atsCompatibility}</span>
                        </div>
                    </div>
                </div>

                {/* Summary + Breakdown card */}
                <div className="bg-white rounded-2xl border border-[#E8E2F0] shadow-[0_2px_16px_rgba(45,16,101,0.06)] p-6 flex flex-col justify-center">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="w-9 h-9 rounded-xl bg-[#EBE5F5] flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Zap className="w-4.5 h-4.5 text-[#2D1065]" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-[#150D30] mb-1">
                                {isAr ? 'الملخص التنفيذي' : 'Executive Summary'}
                            </h3>
                            <p className="text-slate-600 text-sm leading-relaxed">{report.summary}</p>
                        </div>
                    </div>

                    {/* Score breakdown progress bars (deterministic mode) */}
                    {hasBreakdown ? (
                        <div className="pt-4 border-t border-[#E8E2F0] space-y-3">
                            {categories.map(cat => {
                                const value = report.scoreBreakdown![cat.key];
                                const pct = (value / 25) * 100;
                                return (
                                    <div key={cat.key}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-6 h-6 rounded-md ${cat.bg} flex items-center justify-center ${cat.textColor}`}>
                                                    {cat.icon}
                                                </div>
                                                <span className="text-xs font-medium text-[#150D30]">{cat.label}</span>
                                            </div>
                                            <span className="text-xs font-bold text-slate-600">{value}/25</span>
                                        </div>
                                        <div className="h-2 bg-[#EBE5F5] rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-1000 ease-out"
                                                style={{ width: `${pct}%`, backgroundColor: cat.color }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* Quick stats row (legacy AI mode) */
                        <div className="grid grid-cols-3 gap-3 mt-auto pt-4 border-t border-[#E8E2F0]">
                            <div className="text-center">
                                <span className="text-2xl font-bold text-red-500">{issues.length}</span>
                                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                    {isAr ? 'مشاكل' : 'Issues'}
                                </p>
                            </div>
                            <div className="text-center">
                                <span className="text-2xl font-bold text-emerald-500">{strengths.length}</span>
                                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                    {isAr ? 'نقاط قوة' : 'Strengths'}
                                </p>
                            </div>
                            <div className="text-center">
                                <span className={`text-2xl font-bold ${scoreColor}`}>{report.score}%</span>
                                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                    {isAr ? 'النتيجة' : 'Score'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Gaps & Strengths side-by-side ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                {/* Issues */}
                <div className="bg-white rounded-2xl border border-[#E8E2F0] shadow-[0_2px_16px_rgba(45,16,101,0.06)] p-6">
                    <h3 className="text-sm font-semibold text-[#150D30] flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                        </div>
                        {isAr ? 'المشاكل المكتشفة' : 'Issues Found'}
                    </h3>
                    <ul className="space-y-2.5">
                        {issues.length > 0 ? issues.map((gap, i) => (
                            <li key={i} className="flex items-start gap-3 text-slate-600 bg-red-50/50 px-4 py-3 rounded-xl border border-red-100/70 text-sm leading-relaxed">
                                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                {gap}
                            </li>
                        )) : (
                            <li className="flex items-start gap-3 text-slate-500 bg-emerald-50/50 px-4 py-3 rounded-xl border border-emerald-100/70 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                {isAr ? 'لم يتم العثور على مشاكل حرجة!' : 'No critical issues found!'}
                            </li>
                        )}
                    </ul>
                </div>

                {/* Strengths / How We'll Fix It */}
                <div className="bg-white rounded-2xl border border-[#E8E2F0] shadow-[0_2px_16px_rgba(45,16,101,0.06)] p-6">
                    <h3 className="text-sm font-semibold text-[#150D30] flex items-center gap-2 mb-4">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                        {hasBreakdown
                            ? (isAr ? 'نقاط القوة' : 'Strengths')
                            : (isAr ? 'كيف سنصلحها' : 'How We\'ll Fix It')
                        }
                    </h3>
                    <ul className="space-y-2.5">
                        {strengths.length > 0 ? strengths.map((opt, i) => (
                            <li key={i} className="flex items-start gap-3 text-slate-600 bg-emerald-50/40 px-4 py-3 rounded-xl border border-emerald-100/60 text-sm leading-relaxed">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                {opt}
                            </li>
                        )) : (
                            <li className="flex items-start gap-3 text-slate-500 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 text-sm">
                                {isAr ? 'لا توجد نقاط قوة مميزة حالياً' : 'No notable strengths detected yet'}
                            </li>
                        )}
                    </ul>
                </div>
            </div>

            {/* ── CTA Section ── */}
            <OptimizationCTA
                currentScore={report.score}
                onOptimize={onOptimize}
                lang={lang}
                userComments={userComments}
                setUserComments={setUserComments}
            />
        </div>
    );
};
