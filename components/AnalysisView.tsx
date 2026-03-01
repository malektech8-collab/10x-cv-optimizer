import React from 'react';
import { AnalysisReport } from '../types';
import { translations, Language } from '../constants/translations';
import { Sparkles, AlertTriangle, FileText, CheckCircle2, TrendingUp, XCircle, ChevronRight, Zap } from 'lucide-react';

interface AnalysisViewProps {
    report: AnalysisReport;
    onOptimize: () => void;
    lang: Language;
    userComments: string;
    setUserComments: (comments: string) => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ report, onOptimize, lang, userComments, setUserComments }) => {
    const t = translations[lang];

    // Colors based on score
    const scoreColor = report.score >= 80 ? 'text-green-500' : report.score >= 50 ? 'text-[#EEA727]' : 'text-red-500';
    const scoreBg = report.score >= 80 ? 'bg-green-50' : report.score >= 50 ? 'bg-amber-50' : 'bg-red-50';

    return (
        <div className="max-w-5xl mx-auto py-12 px-4 space-y-12 animate-fade-in" dir={t.dir}>
            {/* Header & Score */}
            <div className="text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-50 text-[#4D2B8C] rounded-full text-xs font-black uppercase tracking-widest">
                    <FileText className="w-4 h-4" />
                    <span>Resume Analysis Complete</span>
                </div>
                <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-[#4D2B8C] tracking-tight px-4 leading-tight">Here is your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#85409D] to-[#EEA727]">ATS Report</span></h2>
                <p className="text-base sm:text-xl text-slate-500 max-w-2xl mx-auto font-medium px-4">
                    We analyzed your resume against thousands of successful candidates. Here's what we found.
                </p>
            </div>

            <div className="bg-white rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 border border-slate-100 shadow-2xl shadow-indigo-100/40">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-center">

                    {/* Score Circle */}
                    <div className="flex flex-col items-center space-y-4">
                        <div className="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center">
                            <svg className="absolute w-full h-full transform -rotate-90">
                                <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100" />
                                <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray={2 * Math.PI * 72} strokeDashoffset={(2 * Math.PI * 72) * (1 - report.score / 100)} className={`${scoreColor} transition-all duration-1000 ease-out`} strokeLinecap="round" />
                            </svg>
                            <div className="text-center">
                                <span className={`text-5xl sm:text-6xl font-black ${scoreColor}`}>{report.score}</span>
                                <span className="text-lg sm:text-xl font-bold text-slate-400 block -mt-1 sm:-mt-2">/100</span>
                            </div>
                        </div>
                        <div className={`px-4 py-1.5 rounded-full ${scoreBg} ${scoreColor} text-[10px] sm:text-sm font-black tracking-wide uppercase`}>
                            ATS Compatibility: {report.atsCompatibility}
                        </div>
                    </div>

                    {/* Details */}
                    <div className="md:col-span-2 space-y-8">
                        <div className="space-y-4">
                            <h3 className="text-xl font-black text-[#4D2B8C] flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-500" /> Critical Gaps Found
                            </h3>
                            <ul className="space-y-3">
                                {[...report.structureGaps, ...report.grammarIssues].slice(0, 3).map((gap, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                        <span className="font-bold">{gap}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xl font-black text-[#85409D] flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-green-500" /> How We Will Fix It
                            </h3>
                            <ul className="space-y-3">
                                {report.impactOptimizations.map((opt, i) => (
                                    <li key={i} className="flex items-start gap-3 text-slate-600">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span className="font-bold">{opt}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                </div>
            </div>

            {/* Call to Action */}
            <div className="bg-gradient-to-br from-[#4D2B8C] to-[#85409D] p-8 sm:p-12 rounded-[2rem] sm:rounded-[3xl] text-white text-center space-y-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="relative z-10 space-y-6">
                    <div className="bg-[#FFEF5F]/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Zap className="w-10 h-10 text-[#FFEF5F]" />
                    </div>
                    <h3 className="text-4xl font-black tracking-tight">{report.summary}</h3>
                    <p className="text-indigo-100 text-lg max-w-2xl mx-auto font-bold opacity-90">
                        {lang === 'en' ? 'Unlock a 10x better version of your CV instantly. Our AI will restructure, rewrite, and optimize everything to beat the ATS and impress human recruiters.' : 'احصل على نسخة أفضل بـ 10 أضعاف من سيرتك الذاتية فوراً. سيقوم الذكاء الاصطناعي بإعادة هيكلة وكتابة وتحسين كل شيء لتجاوز أنظمة فلترة السير الذاتية وإبهار مسؤولي التوظيف البشر.'}
                    </p>

                    <div className="max-w-xl mx-auto py-4 text-start">
                        <label className="block text-sm font-black text-indigo-100 mb-2">
                            {lang === 'en' ? 'Any specific instructions for the AI? (Optional)' : 'أي تعليمات خاصة للذكاء الاصطناعي؟ (اختياري)'}
                        </label>
                        <textarea
                            value={userComments}
                            onChange={(e) => setUserComments(e.target.value)}
                            placeholder={lang === 'en' ? "e.g., 'Focus more on my leadership skills' or 'Change my job title to Marketing Manager'" : "مثال: ركز المهارات القيادية، أو غير المسمى الوظيفي إلى مدير تسويق"}
                            className="w-full bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-indigo-200/60 focus:outline-none focus:ring-2 focus:ring-[#EEA727] focus:border-transparent transition-all min-h-[100px] resize-none text-sm font-medium"
                            dir={t.dir}
                        />
                    </div>

                    <button
                        onClick={onOptimize}
                        className="mt-4 px-8 sm:px-12 py-4 sm:py-5 bg-[#EEA727] text-white rounded-[1.5rem] sm:rounded-[2rem] font-black text-lg sm:text-xl hover:bg-[#FFEF5F] hover:text-[#4D2B8C] hover:-translate-y-1 transition-all shadow-xl shadow-orange-500/30 flex items-center justify-center gap-3 mx-auto"
                    >
                        {lang === 'en' ? 'Optimize Now' : 'حسن الآن'} <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                </div>
            </div>
        </div>
    );
};
