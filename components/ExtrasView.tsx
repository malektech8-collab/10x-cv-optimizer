import React, { useState } from 'react';
import { translations, Language } from '../constants/translations';
import { FileText, Linkedin, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface ExtrasViewProps {
    coverLetter?: { coverLetter?: string } | null;
    linkedinGuide?: {
        headline?: string;
        about?: string;
        profileKeywords?: string[];
        connectionStrategy?: string[];
    } | null;
    lang: Language;
}

export const ExtrasView: React.FC<ExtrasViewProps> = ({ coverLetter, linkedinGuide, lang }) => {
    const t = translations[lang];
    const et = t.landing.extras;
    const isAr = lang === 'ar';

    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [expandedSection, setExpandedSection] = useState<'cover' | 'linkedin' | null>(null);

    if (!coverLetter && !linkedinGuide) return null;

    const handleCopy = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        } catch {
            // Fallback silently
        }
    };

    const CopyBtn: React.FC<{ text: string; field: string }> = ({ text, field }) => (
        <button
            onClick={() => handleCopy(text, field)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-[#EBE5F5] text-[#2D1065] hover:bg-[#DDD5EB] transition-colors flex-shrink-0"
        >
            {copiedField === field ? (
                <><Check className="w-3 h-3" />{et.copied}</>
            ) : (
                <><Copy className="w-3 h-3" />{et.copyButton}</>
            )}
        </button>
    );

    return (
        <div className="mt-6 space-y-4" dir={t.dir}>
            {/* Cover Letter */}
            {coverLetter?.coverLetter && (
                <div className="bg-white rounded-2xl border border-[#E8E2F0] shadow-[0_2px_16px_rgba(45,16,101,0.06)] overflow-hidden">
                    <button
                        onClick={() => setExpandedSection(expandedSection === 'cover' ? null : 'cover')}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#FAF9F7] transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-[#C9984A]" />
                            </div>
                            <div className="text-start">
                                <h3 className="text-sm font-semibold text-[#150D30]">{et.coverLetterTitle}</h3>
                                <p className="text-xs text-slate-400">{et.coverLetterDesc}</p>
                            </div>
                        </div>
                        {expandedSection === 'cover'
                            ? <ChevronUp className="w-4 h-4 text-slate-400" />
                            : <ChevronDown className="w-4 h-4 text-slate-400" />
                        }
                    </button>
                    {expandedSection === 'cover' && (
                        <div className="px-6 pb-5 border-t border-[#E8E2F0]">
                            <div className="flex justify-end pt-3 mb-2">
                                <CopyBtn text={coverLetter.coverLetter} field="coverLetter" />
                            </div>
                            <div className="bg-[#FAF9F7] rounded-xl p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                {coverLetter.coverLetter}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* LinkedIn Guide */}
            {linkedinGuide && (linkedinGuide.headline || linkedinGuide.about) && (
                <div className="bg-white rounded-2xl border border-[#E8E2F0] shadow-[0_2px_16px_rgba(45,16,101,0.06)] overflow-hidden">
                    <button
                        onClick={() => setExpandedSection(expandedSection === 'linkedin' ? null : 'linkedin')}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#FAF9F7] transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                                <Linkedin className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="text-start">
                                <h3 className="text-sm font-semibold text-[#150D30]">{et.linkedinTitle}</h3>
                                <p className="text-xs text-slate-400">{et.linkedinDesc}</p>
                            </div>
                        </div>
                        {expandedSection === 'linkedin'
                            ? <ChevronUp className="w-4 h-4 text-slate-400" />
                            : <ChevronDown className="w-4 h-4 text-slate-400" />
                        }
                    </button>
                    {expandedSection === 'linkedin' && (
                        <div className="px-6 pb-5 border-t border-[#E8E2F0] space-y-4 pt-4">
                            {/* Headline */}
                            {linkedinGuide.headline && (
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs font-semibold text-[#150D30] uppercase tracking-wider">{et.headline}</span>
                                        <CopyBtn text={linkedinGuide.headline} field="headline" />
                                    </div>
                                    <div className="bg-[#FAF9F7] rounded-xl p-3 text-sm text-slate-700 font-medium">
                                        {linkedinGuide.headline}
                                    </div>
                                </div>
                            )}

                            {/* About */}
                            {linkedinGuide.about && (
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs font-semibold text-[#150D30] uppercase tracking-wider">{et.about}</span>
                                        <CopyBtn text={linkedinGuide.about} field="about" />
                                    </div>
                                    <div className="bg-[#FAF9F7] rounded-xl p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                        {linkedinGuide.about}
                                    </div>
                                </div>
                            )}

                            {/* Profile Keywords */}
                            {linkedinGuide.profileKeywords && linkedinGuide.profileKeywords.length > 0 && (
                                <div>
                                    <span className="text-xs font-semibold text-[#150D30] uppercase tracking-wider block mb-2">{et.profileKeywords}</span>
                                    <div className="flex flex-wrap gap-2">
                                        {linkedinGuide.profileKeywords.map((kw, i) => (
                                            <span key={i} className="px-3 py-1 bg-[#EBE5F5] text-[#2D1065] text-xs font-medium rounded-full">
                                                {kw}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Connection Strategy */}
                            {linkedinGuide.connectionStrategy && linkedinGuide.connectionStrategy.length > 0 && (
                                <div>
                                    <span className="text-xs font-semibold text-[#150D30] uppercase tracking-wider block mb-2">{et.connectionStrategy}</span>
                                    <ul className="space-y-2">
                                        {linkedinGuide.connectionStrategy.map((tip, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-slate-600 bg-[#FAF9F7] px-3 py-2.5 rounded-lg">
                                                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                                    {i + 1}
                                                </span>
                                                {tip}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
