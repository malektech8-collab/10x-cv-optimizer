import React, { useEffect } from 'react';
import { Layout } from '../components/Layout';
import { translations, Language } from '../constants/translations';

interface RefundPolicyProps {
    lang: Language;
    setLang: (lang: Language) => void;
}

export const RefundPolicy: React.FC<RefundPolicyProps> = ({ lang, setLang }) => {
    const t = translations[lang];

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, []);

    const content = {
        en: {
            title: 'Refund Policy',
            lastUpdated: 'Last Updated: October 2024',
            intro: 'Welcome to 10-x CV Optimizer. This Refund Policy complies with the regulations established by the Saudi Ministry of Commerce specifically for digital products and services.',
            sections: [
                {
                    title: '1. General Nature of Digital Products',
                    text: 'Under the regulations of the Saudi Ministry of Commerce, digital products (including downloaded software, optimized templates, and generated text files) are explicitly exempt from the general right of return once they have been delivered, due to their instantly consumable nature.'
                },
                {
                    title: '2. Non-Refundable Scenarios',
                    text: 'Given that the product is a one-time digital generation and optimization of your CV, refunds are not issued if:\n• You have successfully unlocked, viewed, or downloaded the final optimized HTML/PDF.\n• You change your mind after the service has been fully rendered.\n• The system successfully produced actionable, optimized output based on the input text provided.'
                },
                {
                    title: '3. Acceptable Refund Scenarios',
                    text: 'You may be entitled to a full or partial refund (or a free re-run of your optimization) strictly under the following conditions within 7 days of purchase:\n• The platform suffered a severe technical defect that prevented the delivery of your optimized CV entirely.\n• The charge was duplicated mistakenly due to a gateway error.\n• The final output generated a blank or corrupted document completely unreadable by standard software.'
                },
                {
                    title: '4. How to Request Support',
                    text: 'If you encounter a technical defect covered under section 3, please email your Order ID and Original Upload File to support@10-x.online immediately. We will investigate the logs and, if validated, issue a refund or a free new optimization credit to your account within 14 working days.'
                }
            ]
        },
        ar: {
            title: 'سياسة الاسترجاع (الاسترداد)',
            lastUpdated: 'آخر تحديث: أكتوبر 2024',
            intro: 'مرحباً بك في 10-x محسن السيرة الذاتية. سياسة الاسترجاع هذه تتوافق كلياً مع اللوائح والأنظمة الصادرة عن وزارة التجارة السعودية للتعامل مع المنتجات والخدمات الرقمية.',
            sections: [
                {
                    title: '1. الطبيعة العامة للمنتجات الرقمية',
                    text: 'وفقاً لتعليمات وأنظمة وزارة التجارة في المملكة العربية السعودية، تُستثنى المنتجات الرقمية (مثل البرمجيات القابلة للتنزيل، والنماذج المحسنة، وملفات النصوص المنتجة الكترونياً) بمجرد تسليمها ولا تخضع لحق الاسترجاع العام بسبب طبيعتها سريعة الاستهلاك.'
                },
                {
                    title: '2. الحالات غير القابلة للاسترداد',
                    text: 'نظراً لأن المنتج هو توليد رقمي لمرة واحدة وتحسين مبني على سيرتك الذاتية، فلا يتم إصدار المبالغ المستردة في الحالات التالية:\n• قمت بفتح أو عرض أو تنزيل ملف السيرة الذاتية النهائي المحسن كـ HTML أو PDF.\n• إذا غيرت رأيك بعد تقديم الخدمة بالكامل بنجاح.\n• إذا نجح النظام في إخراج منتج محسّن قابل للاستخدام بناءً على النص المُدْخَل.'
                },
                {
                    title: '3. حالات الاسترداد المقبولة',
                    text: 'يحق لك الحصول على استرداد كامل أو جزئي أو إعادة المحاولة مجاناً حصرياً وتحت الظروف التالية (خلال 7 أيام من الشراء):\n• عانت المنصة من خلل فني جسيم منع تسليم سيرتك الذاتية بشكل كامل.\n• تم تكرار الخصم المالي عن طريق الخطأ بسبب مشاكل تتعلق ببوابة الدفع.\n• إذا نتج عن عملية التحسين مستند فارغ أو تالف لا يمكن قراءته إطلاقاً.'
                },
                {
                    title: '4. كيفية طلب الدعم أو الاسترداد',
                    text: 'إذا واجهت أياً من المشاكل الفنية المذكورة في القسم 3، يرجى إرسال رقم الطلب (Order ID) والملف الأصلي المرفوع إلى دعم العملاء عبر البريد الإلكتروني support@10-x.online فوراً. سنقوم بمراجعة الطلب فنياً وفي حال الموافقة سيتم الاسترداد أو تعويض الحساب خلال 14 يوم عمل.'
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
                    <p className="text-lg text-[#EEA727] font-black">{currentContent.intro}</p>

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
