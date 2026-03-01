import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { translations, Language } from '../constants/translations';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Loader2, BookOpen, Clock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BlogProps {
    lang: Language;
    setLang: (lang: Language) => void;
}

export const Blog: React.FC<BlogProps> = ({ lang, setLang }) => {
    const t = translations[lang];
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const generateSlug = (title: string, id: string) => {
        return `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${id}`;
    };

    useEffect(() => {
        const fetchPosts = async () => {
            if (!isFirebaseConfigured) {
                setLoading(false);
                return;
            }
            try {
                const q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setPosts(data);
            } catch (error) {
                console.error("Error fetching blogs:", error);
            }
            setLoading(false);
        };

        fetchPosts();
    }, []);

    return (
        <Layout lang={lang} onLanguageChange={setLang}>
            <div className="max-w-5xl mx-auto py-12 sm:py-24 px-4 space-y-12 animate-fade-in" dir={t.dir}>
                <div className="text-center space-y-6">
                    <div className="inline-flex items-center gap-2 px-5 py-2 bg-purple-50 text-[#85409D] rounded-full text-xs font-black uppercase tracking-widest border border-purple-100 shadow-sm">
                        <BookOpen className="w-4 h-4" />
                        <span>{t.blog.badge}</span>
                    </div>
                    <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-[#4D2B8C] tracking-tight">{t.blog.title} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#85409D] to-[#EEA727]">{t.blog.titleAccent}</span></h1>
                    <p className="text-base sm:text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed px-4">
                        {t.blog.subtitle}
                    </p>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 translate-y-[20px]">
                        <Loader2 className="w-12 h-12 text-[#85409D] animate-spin" />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-32 bg-white rounded-[3rem] border border-slate-100 shadow-xl">
                        <BookOpen className="w-20 h-20 text-slate-200 mx-auto mb-6" />
                        <h3 className="text-2xl font-black text-slate-400">{t.blog.noPosts}</h3>
                        <p className="text-slate-400 font-bold mt-2">{t.blog.noPostsDesc}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {posts.map(post => (
                            <div key={post.id} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-xl shadow-indigo-100/30 hover:shadow-2xl hover:-translate-y-2 transition-all group flex flex-col">
                                {post.imageUrl && (
                                    <div className="h-48 sm:h-64 overflow-hidden relative">
                                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-10"></div>
                                        <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    </div>
                                )}
                                <div className="p-6 sm:p-10 flex flex-col flex-grow">
                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-400 mb-4">
                                        <Clock className="w-4 h-4" />
                                        {new Date(post.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                                    </div>
                                    <h3 className="text-2xl font-black text-[#4D2B8C] tracking-tight mb-4 group-hover:text-[#85409D] transition-colors line-clamp-2">
                                        {lang === 'ar' ? post.titleAr : post.titleEn}
                                    </h3>
                                    <p className="text-slate-500 font-bold leading-relaxed mb-8 flex-grow line-clamp-3">
                                        {lang === 'ar' ? post.excerptAr : post.excerptEn}
                                    </p>
                                    <Link to={`/blog/${generateSlug(post.titleEn || 'post', post.id)}`} className="flex items-center gap-2 text-[#85409D] font-black text-sm uppercase tracking-widest group-hover:text-[#EEA727] transition-all w-fit">
                                        {t.blog.readMore} <ChevronRight className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
};
