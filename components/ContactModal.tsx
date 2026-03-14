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
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#150D30]/60 backdrop-blur-sm animate-fade-in"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="relative w-full max-w-md bg-white rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.12)] border border-[#E8E2F0] overflow-hidden max-h-[90vh] flex flex-col"
                dir={t.dir}
            >
                {/* Header */}
                <div className="px-6 py-5 border-b border-[#E8E2F0] flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#EBE5F5] rounded-xl flex items-center justify-center">
                            <MessageSquare className="w-4 h-4 text-[#2D1065]" />
                        </div>
                        <span className="font-semibold text-[#150D30]">{t.contact.title}</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto">
                    {success ? (
                        <div className="text-center space-y-5 py-6">
                            <div className="bg-green-50 w-14 h-14 rounded-xl flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-7 h-7 text-green-500" />
                            </div>
                            <div className="space-y-1.5">
                                <h3 className="text-xl font-bold text-[#150D30]">{t.contact.success}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">
                                    {t.contact.successDesc}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 bg-[#2D1065] text-white rounded-xl font-medium text-sm hover:bg-[#220C4E] transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        <>
                            <p className="text-slate-500 text-sm mb-5">{t.contact.subtitle}</p>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5 text-start">
                                        <label className="text-xs font-medium text-slate-500">{t.contact.name}</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2F0] outline-none focus:ring-2 focus:ring-[#2D1065]/20 focus:border-[#2D1065] transition-all text-sm text-[#150D30] bg-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5 text-start">
                                        <label className="text-xs font-medium text-slate-500">{t.contact.email}</label>
                                        <input
                                            required
                                            type="email"
                                            value={formData.email}
                                            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2F0] outline-none focus:ring-2 focus:ring-[#2D1065]/20 focus:border-[#2D1065] transition-all text-sm text-[#150D30] bg-white"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5 text-start">
                                    <label className="text-xs font-medium text-slate-500">{t.contact.subject}</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.subject}
                                        onChange={e => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2F0] outline-none focus:ring-2 focus:ring-[#2D1065]/20 focus:border-[#2D1065] transition-all text-sm text-[#150D30] bg-white"
                                    />
                                </div>

                                <div className="space-y-1.5 text-start">
                                    <label className="text-xs font-medium text-slate-500">{t.contact.message}</label>
                                    <textarea
                                        required
                                        rows={3}
                                        value={formData.message}
                                        onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2F0] outline-none focus:ring-2 focus:ring-[#2D1065]/20 focus:border-[#2D1065] transition-all text-sm text-[#150D30] bg-white resize-none"
                                    />
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2.5 text-red-700">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        <p className="text-sm">{error}</p>
                                    </div>
                                )}

                                <button
                                    disabled={loading}
                                    type="submit"
                                    className="w-full py-3 bg-[#2D1065] text-white rounded-xl font-medium text-sm hover:bg-[#220C4E] transition-colors flex items-center justify-center gap-2.5 shadow-[0_2px_8px_rgba(45,16,101,0.25)] disabled:opacity-50"
                                >
                                    {loading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            {t.contact.send}
                                            <Send className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
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
