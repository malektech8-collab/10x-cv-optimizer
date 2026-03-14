import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { translations, Language } from '../constants/translations';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2, ArrowLeft, Clock, Tag, Folder } from 'lucide-react';

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
            if (!isFirebaseConfigured || !id) { setLoading(false); return; }
            try {
                const docRef = doc(db, 'blogs', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) setPost({ id: docSnap.id, ...docSnap.data() });
            } catch (error) {
                console.error("Error fetching blog post:", error);
            }
            setLoading(false);
        };
        fetchPost();
    }, [id]);

    /* ── Loading ── */
    if (loading) {
        return (
            <Layout lang={lang} onLanguageChange={setLang}>
                <div className="flex items-center justify-center py-40">
                    <div className="w-12 h-12 bg-[#EBE5F5] rounded-2xl flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-[#2D1065] animate-spin" />
                    </div>
                </div>
            </Layout>
        );
    }

    /* ── Not found ── */
    if (!post) {
        return (
            <Layout lang={lang} onLanguageChange={setLang}>
                <div className="max-w-sm mx-auto py-32 text-center space-y-4 px-4">
                    <div className="w-14 h-14 bg-[#EBE5F5] rounded-xl flex items-center justify-center mx-auto">
                        <Folder className="w-6 h-6 text-[#BFB0E5]" />
                    </div>
                    <h2 className="text-xl font-bold text-[#150D30]">{t.blog.postNotFound}</h2>
                    <Link to="/blog" className="inline-block text-sm font-medium text-[#2D1065] hover:text-[#9B4DCA] transition-colors">
                        {t.blog.returnToBlog}
                    </Link>
                </div>
            </Layout>
        );
    }

    const title = lang === 'ar' ? post.titleAr : post.titleEn;
    const content = lang === 'ar' ? post.contentAr : post.contentEn;

    return (
        <Layout lang={lang} onLanguageChange={setLang}>
            <div className="max-w-3xl mx-auto py-10 sm:py-16 px-4 animate-fade-up" dir={t.dir}>

                {/* ── Back link ── */}
                <Link
                    to="/blog"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-[#2D1065] transition-colors mb-10"
                >
                    <ArrowLeft className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                    {t.blog.backToBlog}
                </Link>

                {/* ── Article header ── */}
                <header className="space-y-5 mb-8">
                    {/* Category + date */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        {post.category && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EBE5F5] text-[#9B4DCA] rounded-full text-xs font-medium border border-[#E8E2F0]">
                                <Folder className="w-3 h-3" />
                                {post.category}
                            </span>
                        )}
                        <span className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(post.createdAt).toLocaleDateString(
                                lang === 'ar' ? 'ar-SA' : 'en-US',
                                { year: 'numeric', month: 'long', day: 'numeric' }
                            )}
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="text-fluid-3xl font-bold text-[#150D30] tracking-tight leading-snug">
                        {title}
                    </h1>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <Tag className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                            {post.tags.map((tag: string) => (
                                <span
                                    key={tag}
                                    className="text-xs font-medium px-2.5 py-1 bg-slate-50 text-slate-500 rounded-full border border-slate-100 hover:bg-[#EBE5F5] hover:text-[#9B4DCA] hover:border-[#E8E2F0] transition-colors cursor-default"
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}
                </header>

                {/* ── Hero image ── */}
                {post.imageUrl && (
                    <div className="w-full h-56 sm:h-72 md:h-[360px] rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(45,16,101,0.09)] mb-10 bg-[#F2EEF9]">
                        <img
                            src={post.imageUrl}
                            alt={title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {/* ── Divider ── */}
                <div className="border-t border-[#E8E2F0] mb-10" />

                {/* ── Article content ── */}
                <div
                    className="prose prose-lg max-w-none
                        prose-headings:font-bold prose-headings:tracking-tight
                        prose-h1:text-[#150D30] prose-h2:text-[#2D1065] prose-h3:text-[#150D30]
                        prose-p:text-slate-600 prose-p:leading-relaxed
                        prose-a:text-[#2D1065] prose-a:no-underline hover:prose-a:text-[#9B4DCA]
                        prose-strong:text-[#150D30] prose-strong:font-semibold
                        prose-li:text-slate-600
                        prose-img:rounded-xl prose-img:shadow-[0_2px_12px_rgba(45,16,101,0.08)]
                        prose-blockquote:border-s-[#2D1065] prose-blockquote:text-slate-500"
                    dangerouslySetInnerHTML={{ __html: content || '' }}
                />

                {/* ── Footer nav ── */}
                <div className="mt-14 pt-8 border-t border-[#E8E2F0]">
                    <Link
                        to="/blog"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-[#2D1065] transition-colors"
                    >
                        <ArrowLeft className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                        {t.blog.returnToBlog}
                    </Link>
                </div>

            </div>
        </Layout>
    );
};
