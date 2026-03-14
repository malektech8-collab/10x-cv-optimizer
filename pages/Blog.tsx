import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { translations, Language } from '../constants/translations';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Loader2, BookOpen, Clock, ChevronRight, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BlogProps {
    lang: Language;
    setLang: (lang: Language) => void;
}

export const Blog: React.FC<BlogProps> = ({ lang, setLang }) => {
    const t = translations[lang];
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('All');

    const generateSlug = (title: string, id: string) =>
        `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${id}`;

    useEffect(() => {
        const fetchPosts = async () => {
            if (!isFirebaseConfigured) { setLoading(false); return; }
            try {
                const q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
                const snapshot = await getDocs(q);
                setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error("Error fetching blogs:", error);
            }
            setLoading(false);
        };
        fetchPosts();
    }, []);

    const categories = ['All', ...Array.from(new Set(posts.map(p => p.category).filter(Boolean)))];
    const filteredPosts = selectedCategory === 'All'
        ? posts
        : posts.filter(p => p.category === selectedCategory);

    return (
        <Layout lang={lang} onLanguageChange={setLang}>
            <div className="max-w-5xl mx-auto py-14 sm:py-20 px-4 space-y-12 animate-fade-up" dir={t.dir}>

                {/* ── Hero ── */}
                <div className="text-center space-y-5 relative">
                    {/* Decorative dot grid */}
                    <div className="pointer-events-none absolute top-0 end-0 w-48 h-48 dot-grid opacity-30 -translate-y-1/3 translate-x-1/3" />

                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#EBE5F5] text-[#2D1065] rounded-full text-xs font-medium border border-[#E8E2F0] tracking-wide">
                        <BookOpen className="w-3.5 h-3.5" />
                        {t.blog.badge}
                    </div>

                    <h1 className="text-fluid-4xl font-bold text-[#150D30] tracking-tight leading-tight">
                        {t.blog.title}{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2D1065] to-[#9B4DCA]">
                            {t.blog.titleAccent}
                        </span>
                    </h1>

                    <p className="text-fluid-base text-slate-500 max-w-xl mx-auto leading-relaxed">
                        {t.blog.subtitle}
                    </p>
                </div>

                {/* ── Category filter ── */}
                {!loading && categories.length > 1 && (
                    <div className="flex flex-wrap justify-center gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                                    selectedCategory === cat
                                        ? 'bg-[#2D1065] text-white shadow-[0_2px_8px_rgba(45,16,101,0.25)]'
                                        : 'bg-white border border-[#E8E2F0] text-slate-600 hover:border-[#BFB0E5] hover:text-[#2D1065]'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                )}

                {/* ── Loading ── */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-12 h-12 bg-[#EBE5F5] rounded-2xl flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-[#2D1065] animate-spin" />
                        </div>
                    </div>

                /* ── Empty ── */
                ) : filteredPosts.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-2xl border border-[#E8E2F0] shadow-[0_2px_12px_rgba(45,16,101,0.05)]">
                        <div className="w-14 h-14 bg-[#EBE5F5] rounded-xl flex items-center justify-center mx-auto mb-4">
                            <BookOpen className="w-6 h-6 text-[#BFB0E5]" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-400 mb-1">{t.blog.noPosts}</h3>
                        <p className="text-slate-400 text-sm">{t.blog.noPostsDesc}</p>
                    </div>

                /* ── Posts grid ── */
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredPosts.map(post => (
                            <article
                                key={post.id}
                                className="bg-white rounded-2xl border border-[#E8E2F0] overflow-hidden shadow-[0_2px_12px_rgba(45,16,101,0.05)] hover:shadow-[0_6px_24px_rgba(45,16,101,0.10)] hover:-translate-y-1 transition-all group flex flex-col"
                            >
                                {/* Cover image */}
                                {post.imageUrl && (
                                    <div className="h-48 overflow-hidden bg-[#F2EEF9]">
                                        <img
                                            src={post.imageUrl}
                                            alt={lang === 'ar' ? post.titleAr : post.titleEn}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                )}

                                <div className="p-6 flex flex-col flex-grow">
                                    {/* Meta row */}
                                    <div className="flex items-center gap-2.5 mb-4 flex-wrap">
                                        {post.category && (
                                            <span className="px-2.5 py-0.5 bg-[#EBE5F5] text-[#9B4DCA] rounded-full text-xs font-medium border border-[#E8E2F0]">
                                                {post.category}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1 text-xs text-slate-400">
                                            <Clock className="w-3 h-3" />
                                            {new Date(post.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <h3 className="font-bold text-[#150D30] text-base leading-relaxed mb-3 group-hover:text-[#2D1065] transition-colors line-clamp-2">
                                        {lang === 'ar' ? post.titleAr : post.titleEn}
                                    </h3>

                                    {/* Excerpt */}
                                    <p className="text-slate-500 text-sm leading-relaxed mb-5 flex-grow line-clamp-3">
                                        {lang === 'ar' ? post.excerptAr : post.excerptEn}
                                    </p>

                                    {/* Tags */}
                                    {post.tags && post.tags.length > 0 && (
                                        <div className="flex items-center gap-1.5 flex-wrap mb-5">
                                            <Tag className="w-3 h-3 text-slate-300 flex-shrink-0" />
                                            {post.tags.slice(0, 4).map((tag: string) => (
                                                <span key={tag} className="text-xs text-slate-400">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Read more */}
                                    <Link
                                        to={`/blog/${generateSlug(post.titleEn || 'post', post.id)}`}
                                        className="inline-flex items-center gap-1 text-sm font-medium text-[#2D1065] hover:text-[#9B4DCA] transition-colors"
                                    >
                                        {t.blog.readMore}
                                        <ChevronRight className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
};
