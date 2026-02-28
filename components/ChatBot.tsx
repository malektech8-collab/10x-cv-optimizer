import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, Bot, Sparkles } from 'lucide-react';
import { translations, Language } from '../constants/translations';
import { chatWithConsultant } from '../services/geminiService';

interface ChatBotProps {
    lang: Language;
}

interface Message {
    id: string;
    role: 'user' | 'model';
    text: string;
}

export const ChatBot: React.FC<ChatBotProps> = ({ lang }) => {
    const t = translations[lang];
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'model',
            text: lang === 'en'
                ? "Hi! I'm your Career Consultant AI. Ask me about ATS algorithms, CV improvements, or interview tips!"
                : "أهلاً بك! أنا مستشارك المهني المدعوم بالذكاء الاصطناعي. اسألني عن أنظمة ATS، تحسين سيرتك الذاتية، أو نصائح المقابلات!"
        }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    useEffect(() => {
        // Reset welcome message on language change if no other messages exist
        if (messages.length === 1) {
            setMessages([
                {
                    id: 'welcome',
                    role: 'model',
                    text: lang === 'en'
                        ? "Hi! I'm your Career Consultant AI. Ask me about ATS algorithms, CV improvements, or interview tips!"
                        : "أهلاً بك! أنا مستشارك المهني المدعوم بالذكاء الاصطناعي. اسألني عن أنظمة ATS، تحسين سيرتك الذاتية، أو نصائح المقابلات!"
                }
            ]);
        }
    }, [lang]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            text: inputValue.trim()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            // Include message history but limit it to prevent massive context payloads
            const conversation = [...messages, userMessage].map(m => ({ role: m.role, text: m.text }));
            const responseText = await chatWithConsultant(conversation.slice(-10), lang);

            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: responseText
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: lang === 'en' ? "Oops! I encountered an error. Please try again later." : "عذراً! واجهت خطأ. يرجى المحاولة مرة أخرى."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const formatMessage = (text: string) => {
        // Simple Markdown-like formatter for bolding and bullet points
        return text.split('\n').map((line, i) => {
            let formattedLine = line;
            // Bold
            formattedLine = formattedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            // Bullet
            if (formattedLine.startsWith('* ')) {
                formattedLine = `• ${formattedLine.substring(2)}`;
            }
            return (
                <span key={i} dangerouslySetInnerHTML={{ __html: formattedLine }} className="block min-h-[1.5rem]" />
            );
        });
    };

    return (
        <>
            {/* Floating Action Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed ${lang === 'ar' ? 'left-6' : 'right-6'} bottom-6 h-14 bg-[#85409D] hover:bg-[#4D2B8C] text-white rounded-full flex items-center shadow-lg shadow-purple-500/30 transition-all hover:-translate-y-1 z-50 group no-print px-6 gap-3 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100 duration-300'}`}
                aria-label="Open Chatbot"
            >
                <div className="relative">
                    <MessageSquare className="w-5 h-5 group-hover:hidden" />
                    <Sparkles className="w-5 h-5 hidden group-hover:block" />
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#EEA727] rounded-full border-2 border-[#85409D] group-hover:border-[#4D2B8C] transition-colors"></div>
                </div>
                <span className="font-black text-sm tracking-wide">
                    {lang === 'en' ? 'Career Consultant AI' : 'المستشار المهني (الذكاء الاصطناعي)'}
                </span>
            </button>

            {/* Chat Window */}
            <div
                className={`fixed ${lang === 'ar' ? 'left-6' : 'right-6'} bottom-6 w-[360px] max-w-[calc(100vw-3rem)] h-[550px] max-h-[80vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 transform origin-bottom z-50 border border-slate-100 no-print ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-10 pointer-events-none'}`}
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
            >
                {/* Chat Header */}
                <div className="bg-[#4D2B8C] p-5 flex items-center justify-between shadow-md shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-xl">
                            <Bot className="w-6 h-6 text-[#FFEF5F]" />
                        </div>
                        <div>
                            <h3 className="font-black text-white leading-tight">10-x AI Consultant</h3>
                            <p className="text-xs font-bold text-indigo-200">Online & Ready to Help</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'user'
                                    ? 'bg-[#85409D] text-white rounded-tr-sm'
                                    : 'bg-white text-slate-700 border border-slate-100 shadow-sm rounded-tl-sm'
                                    }`}
                            >
                                <div className="text-sm font-medium leading-relaxed">
                                    {formatMessage(msg.text)}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white p-4 rounded-2xl rounded-tl-sm border border-slate-100 shadow-sm flex gap-2">
                                <div className="w-2 h-2 bg-[#EEA727] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-[#EEA727] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-[#EEA727] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={lang === 'en' ? "Ask career questions..." : "اسأل أسئلة مهنية..."}
                            className="flex-1 bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#85409D] focus:border-transparent transition-all font-medium placeholder-slate-400"
                            lang={lang}
                        />
                        <button
                            type="submit"
                            disabled={!inputValue.trim() || isLoading}
                            className={`p-3 rounded-xl flex items-center justify-center transition-all ${!inputValue.trim() || isLoading
                                ? 'bg-slate-100 text-slate-400'
                                : 'bg-[#EEA727] text-white hover:bg-[#d6931d] shadow-md shadow-orange-500/20'
                                }`}
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className={`w-5 h-5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};
