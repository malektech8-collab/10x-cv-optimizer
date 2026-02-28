import React, { useEffect } from 'react';
import { Layout } from '../components/Layout';
import { translations, Language } from '../constants/translations';

interface PrivacyPolicyProps {
    lang: Language;
    setLang: (lang: Language) => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ lang, setLang }) => {
    const t = translations[lang];

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, []);

    const content = {
        en: {
            title: 'Privacy Policy',
            lastUpdated: 'Last Updated: October 2024',
            intro: 'Welcome to 10-x CV Optimizer. This Privacy Policy outlines how we collect, use, and protect your personal data in compliance with the Saudi Personal Data Protection Law (PDPL).',
            sections: [
                {
                    title: '1. Data Collection',
                    text: 'We collect your email address during registration to provide authentication and save your resume history. When you upload a resume, we securely process the text and document solely for the purpose of ATS optimization powered by our AI Engine.'
                },
                {
                    title: '2. Data Usage & Storage',
                    text: 'Your document content and optimization results are stored securely in our Google Firebase Database. We do not sell, rent, or trade your personal data to third parties. Data is used exclusively to deliver our core service.'
                },
                {
                    title: '3. Data Security',
                    text: 'We implement industry-standard encryption and security measures. Payment processing is handled via secure payment gateways (Paymob) and we do not store your raw credit card numbers.'
                },
                {
                    title: '4. Your Rights under PDPL',
                    text: 'Under the Saudi PDPL, you have the right to:\n• Access the personal data we hold about you.\n• Request correction of inaccurate data.\n• Request the destruction of your personal data after the purpose of collection has been fulfilled.\n• Withdraw your consent at any time.'
                },
                {
                    title: '5. Contact Us',
                    text: 'For any privacy-related inquiries, requests, or to exercise your rights, please contact us at support@10-x.online.'
                }
            ]
        },
        ar: {
            title: 'سياسة الخصوصية',
            lastUpdated: 'آخر تحديث: أكتوبر 2024',
            intro: 'مرحباً بك في 10-x محسن السيرة الذاتية. توضح سياسة الخصوصية هذه كيف نقوم بجمع بياناتك الشخصية واستخدامها وحمايتها بما يتوافق مع نظام حماية البيانات الشخصية السعودي (PDPL).',
            sections: [
                {
                    title: '1. جمع البيانات',
                    text: 'نقوم بجمع عنوان بريدك الإلكتروني أثناء التسجيل لتوفير المصادقة وحفظ سجل سيرتك الذاتية. عندما تقوم برفع سيرة ذاتية، نقوم بمعالجة النص والمستند بشكل آمن وحصري لغرض التحسين لأنظمة ATS والمدعوم بمحرك الذكاء الاصطناعي الخاص بنا.'
                },
                {
                    title: '2. استخدام البيانات وتخزينها',
                    text: 'يتم تخزين محتوى المستند الخاص بك ونتائج التحسين بشكل آمن في قاعدة بيانات Google Firebase الخاصة بنا. نحن لا نبيع أو نؤجر أو نتاجر ببياناتك الشخصية لأطراف ثالثة. يتم استخدام البيانات حصرياً لتقديم خدمتنا الأساسية.'
                },
                {
                    title: '3. أمن البيانات',
                    text: 'نطبق معايير وتشفيرات أمنية متوافقة مع معايير الصناعة. تتم معالجة الدفع عبر بوابات دفع آمنة (Paymob السعودية) ولا نقوم أبداً بتخزين أرقام بطاقات الائتمان الخاصة بك.'
                },
                {
                    title: '4. حقوقك بموجب نظام (PDPL)',
                    text: 'بموجب نظام حماية البيانات الشخصية السعودي (PDPL)، يحق لك:\n• الوصول إلى بياناتك الشخصية التي نحتفظ بها.\n• طلب تصحيح البيانات غير الدقيقة.\n• طلب إتلاف بياناتك الشخصية بعد انتهاء الغرض من جمعها.\n• سحب موافقتك في أي وقت.'
                },
                {
                    title: '5. تواصل معنا',
                    text: 'لأي استفسارات تتعلق بالخصوصية أو الطلبات أو لممارسة حقوقك، يرجى التواصل معنا على support@10-x.online.'
                }
            ]
        }
    };

    const currentContent = content[lang];

    return (
        <Layout lang={lang} onLanguageChange={setLang}>
            <div className="max-w-4xl mx-auto py-24 px-4 space-y-12 animate-fade-in" dir={t.dir}>
                <div className="space-y-4">
                    <h1 className="text-5xl font-black text-[#4D2B8C] tracking-tight">{currentContent.title}</h1>
                    <p className="text-slate-500 font-bold">{currentContent.lastUpdated}</p>
                </div>

                <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-100 shadow-xl shadow-indigo-100/30 space-y-8 text-slate-600 font-medium leading-relaxed">
                    <p className="text-lg">{currentContent.intro}</p>

                    <div className="space-y-8">
                        {currentContent.sections.map((section, idx) => (
                            <div key={idx} className="space-y-3">
                                <h3 className="text-xl font-black text-[#85409D] tracking-tight">{section.title}</h3>
                                <p className="whitespace-pre-line text-slate-500 font-bold leading-relaxed">{section.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
};
