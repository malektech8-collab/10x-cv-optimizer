import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { translations, Language } from '../constants/translations';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2, ArrowLeft, Clock } from 'lucide-react';

interface BlogPostProps {
    lang: Language;
    setLang: (lang: Language) => void;
}

export const BlogPost: React.FC<BlogPostProps> = ({ lang, setLang }) => {
    const { id: slugId } = useParams<{ id: string }>();
    const id = slugId ? slugId.split('-').pop() : undefined;
    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const t = translations[lang];

    useEffect(() => {
        const fetchPost = async () => {
            if (!isFirebaseConfigured || !id) {
                setLoading(false);
                return;
            }
            try {
                const docRef = doc(db, 'blogs', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setPost({ id: docSnap.id, ...docSnap.data() });
                }
            } catch (error) {
                console.error("Error fetching blog post:", error);
            }
            setLoading(false);
        };

        fetchPost();
    }, [id]);

    if (loading) {
        return (
            <Layout lang={lang} onLanguageChange={setLang}>
                <div className="flex flex-col items-center justify-center py-40">
                    <Loader2 className="w-12 h-12 text-[#85409D] animate-spin" />
                </div>
            </Layout>
        );
    }

    if (!post) {
        return (
            <Layout lang={lang} onLanguageChange={setLang}>
                <div className="max-w-3xl mx-auto py-32 text-center">
                    <h2 className="text-4xl font-black text-[#4D2B8C]">{t.blog.postNotFound}</h2>
                    <Link to="/blog" className="text-[#85409D] inline-block mt-4 font-bold hover:underline">{t.blog.returnToBlog}</Link>
                </div>
            </Layout>
        );
    }

    const title = lang === 'ar' ? post.titleAr : post.titleEn;
    const content = lang === 'ar' ? post.contentAr : post.contentEn;

    return (
        <Layout lang={lang} onLanguageChange={setLang}>
            <div className="max-w-4xl mx-auto py-8 sm:py-16 px-4 space-y-8 animate-fade-in" dir={t.dir}>
                <Link to="/blog" className="inline-flex items-center gap-2 text-slate-500 font-bold hover:text-[#4D2B8C] transition-colors">
                    <ArrowLeft className={`w-5 h-5 ${lang === 'ar' ? 'rotate-180' : ''}`} /> {t.blog.backToBlog}
                </Link>

                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-400">
                        <Clock className="w-4 h-4" />
                        {new Date(post.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-[#4D2B8C] tracking-tight leading-tight">{title}</h1>
                </div>

                {post.imageUrl && (
                    <div className="w-full h-56 sm:h-80 md:h-[400px] rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                        <img src={post.imageUrl} alt={title} className="w-full h-full object-cover" />
                    </div>
                )}

                {/* Content Wrapper specifically formatted for WYSIWYG HTML output */}
                <div
                    className="prose prose-lg prose-indigo max-w-none prose-headings:font-black prose-headings:text-[#4D2B8C] prose-p:text-slate-600 prose-a:text-[#85409D]"
                    dangerouslySetInnerHTML={{ __html: content || '' }}
                />
            </div>
        </Layout>
    );
};
