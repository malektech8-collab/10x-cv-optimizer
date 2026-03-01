import React, { useState } from 'react';
import { X, Send, CheckCircle2, AlertCircle, Loader2, MessageSquare } from 'lucide-react';
import { translations, Language } from '../constants/translations';

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    lang: Language;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose, lang }) => {
    const t = translations[lang];
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // In a real app, you'd send this to your backend or a service like Formspree/EmailJS
            // For now, we'll simulate a successful send
            await new Promise(resolve => setTimeout(resolve, 1500));
            setSuccess(true);
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (err) {
            setError(t.contact.errorDesc);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6 sm:p-6 bg-[#4D2B8C]/20 backdrop-blur-md animate-in fade-in duration-300">
            <div
                className="relative w-full max-w-xl bg-white rounded-[2rem] sm:rounded-[3rem] shadow-2xl border border-indigo-50 overflow-hidden"
                dir={t.dir}
            >
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-slate-400 hover:text-[#4D2B8C] hover:bg-slate-50 rounded-full transition-all z-10"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="p-8 sm:p-12">
                    {success ? (
                        <div className="text-center space-y-6 py-8 animate-in zoom-in-95 duration-500">
                            <div className="bg-green-50 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto shadow-sm">
                                <CheckCircle2 className="w-10 h-10 text-green-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-3xl font-black text-[#4D2B8C] tracking-tight">{t.contact.success}</h3>
                                <p className="text-slate-500 font-bold leading-relaxed">
                                    {t.contact.successDesc}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="px-10 py-4 bg-[#4D2B8C] text-white rounded-2xl font-black text-lg hover:bg-[#85409D] transition-all shadow-xl shadow-indigo-100"
                            >
                                Close Window
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2 mb-10">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-[#4D2B8C] rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100/50 mb-2">
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span>Get in Touch</span>
                                </div>
                                <h2 className="text-3xl sm:text-4xl font-black text-[#4D2B8C] tracking-tight">{t.contact.title}</h2>
                                <p className="text-slate-500 font-bold text-sm sm:text-base">{t.contact.subtitle}</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2 text-start">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{t.contact.name}</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-[#4D2B8C] font-bold focus:bg-white focus:border-[#EEA727] outline-none transition-all placeholder-slate-300"
                                        />
                                    </div>
                                    <div className="space-y-2 text-start">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{t.contact.email}</label>
                                        <input
                                            required
                                            type="email"
                                            value={formData.email}
                                            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-[#4D2B8C] font-bold focus:bg-white focus:border-[#EEA727] outline-none transition-all placeholder-slate-300"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 text-start">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{t.contact.subject}</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.subject}
                                        onChange={e => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-[#4D2B8C] font-bold focus:bg-white focus:border-[#EEA727] outline-none transition-all placeholder-slate-300"
                                    />
                                </div>

                                <div className="space-y-2 text-start">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{t.contact.message}</label>
                                    <textarea
                                        required
                                        rows={4}
                                        value={formData.message}
                                        onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
                                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 text-[#4D2B8C] font-bold focus:bg-white focus:border-[#EEA727] outline-none transition-all placeholder-slate-300 resize-none"
                                    />
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-800 animate-in slide-in-from-top-4">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                        <p className="text-sm font-bold">{error}</p>
                                    </div>
                                )}

                                <button
                                    disabled={loading}
                                    type="submit"
                                    className="w-full py-5 bg-[#EEA727] text-white rounded-[1.5rem] sm:rounded-[2rem] font-black text-lg hover:bg-[#4D2B8C] transition-all flex items-center justify-center gap-3 shadow-xl shadow-amber-100 disabled:opacity-50 transform hover:-translate-y-1"
                                >
                                    {loading ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <>
                                            {t.contact.send}
                                            <Send className={`w-5 h-5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
