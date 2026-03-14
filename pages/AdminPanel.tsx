import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { translations, Language } from '../constants/translations';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { Loader2, ShieldAlert, LayoutDashboard, FileText, Users, ShoppingCart, Plus, Edit, Trash2, Upload, ExternalLink, CheckCircle2, Lock, Receipt, ChevronDown, ChevronUp } from 'lucide-react';
import { InvoiceModal } from '../components/InvoiceModal';
import { User as FirebaseUser } from 'firebase/auth';
import DefaultEditor from 'react-simple-wysiwyg';

interface AdminPanelProps {
    lang: Language;
    setLang: (lang: Language) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ lang, setLang }) => {
    const t = translations[lang];
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'optimizations' | 'blogs' | 'users'>('optimizations');
    const [userRole, setUserRole] = useState<string | null>(null);

    const [optimizations, setOptimizations] = useState<any[]>([]);
    const [blogs, setBlogs] = useState<any[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);

    const [isCreatingBlog, setIsCreatingBlog] = useState(false);
    const [blogTitleEn, setBlogTitleEn] = useState('');
    const [blogExcerptEn, setBlogExcerptEn] = useState('');
    const [blogContentEn, setBlogContentEn] = useState('');
    const [blogTitleAr, setBlogTitleAr] = useState('');
    const [blogExcerptAr, setBlogExcerptAr] = useState('');
    const [blogContentAr, setBlogContentAr] = useState('');
    const [blogImage, setBlogImage] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
    const [blogCategory, setBlogCategory] = useState('');
    const [blogTags, setBlogTags] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [expandedOptId, setExpandedOptId] = useState<string | null>(null);
    const [invoiceItem, setInvoiceItem] = useState<any | null>(null);

    const BLOG_CATEGORIES = ['Resume Tips', 'Career Advice', 'ATS Optimization', 'Interview Tips', 'Job Search', 'Industry News'];

    const generateSlug = (title: string, id: string) =>
        `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${id}`;

    useEffect(() => {
        if (!isFirebaseConfigured) { setLoading(false); return; }
        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                    const role = userDoc.exists() ? userDoc.data().role : 'individual_user';
                    setUserRole(role);
                    if (role === 'content_editor') setActiveTab('blogs');
                    else if (role === 'commerce_manager') setActiveTab('optimizations');
                    if (role !== 'individual_user') fetchData(role);
                    else setLoading(false);
                } catch (error) {
                    console.error("Error checking admin role:", error);
                    setLoading(false);
                }
            } else {
                setUserRole(null);
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const fetchData = async (role: string) => {
        try {
            if (role === 'super_admin' || role === 'commerce_manager') {
                const optQ = query(collection(db, 'optimizations'), orderBy('created_at', 'desc'));
                const optSnapshot = await getDocs(optQ);
                setOptimizations(optSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }
            if (role === 'super_admin' || role === 'content_editor') {
                const blogQ = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
                const blogSnapshot = await getDocs(blogQ);
                setBlogs(blogSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }
            if (role === 'super_admin') {
                const usersQ = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
                const usersSnapshot = await getDocs(usersQ);
                setAllUsers(usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            await updateDoc(doc(db, 'users', userId), { role: newRole });
            setAllUsers(allUsers.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (err) { console.error("Failed to update role", err); }
    };

    const resetBlogForm = () => {
        setIsCreatingBlog(false); setEditingBlogId(null);
        setBlogTitleEn(''); setBlogExcerptEn(''); setBlogContentEn('');
        setBlogTitleAr(''); setBlogExcerptAr(''); setBlogContentAr('');
        setBlogImage(''); setBlogCategory(''); setBlogTags(''); setImageFile(null);
    };

    const handleCreateOrUpdateBlog = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!blogTitleEn || !blogTitleAr) return;
        setIsUploading(true);
        try {
            let finalImageUrl = blogImage;
            if (imageFile) {
                finalImageUrl = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = error => reject(error);
                    reader.readAsDataURL(imageFile);
                });
            }
            const parsedTags = blogTags.split(',').map(t => t.trim()).filter(Boolean);
            const payload = {
                titleEn: blogTitleEn, excerptEn: blogExcerptEn, contentEn: blogContentEn,
                titleAr: blogTitleAr, excerptAr: blogExcerptAr, contentAr: blogContentAr,
                imageUrl: finalImageUrl, category: blogCategory, tags: parsedTags,
            };
            if (editingBlogId) {
                await updateDoc(doc(db, 'blogs', editingBlogId), { ...payload, updatedAt: new Date().toISOString() });
            } else {
                await addDoc(collection(db, 'blogs'), { ...payload, createdAt: new Date().toISOString() });
            }
            resetBlogForm();
            if (userRole) fetchData(userRole);
        } catch (err) { console.error(err); }
        finally { setIsUploading(false); }
    };

    const handleEditClick = (blog: any) => {
        setBlogTitleEn(blog.titleEn); setBlogExcerptEn(blog.excerptEn); setBlogContentEn(blog.contentEn);
        setBlogTitleAr(blog.titleAr); setBlogExcerptAr(blog.excerptAr); setBlogContentAr(blog.contentAr);
        setBlogImage(blog.imageUrl || ''); setBlogCategory(blog.category || '');
        setBlogTags((blog.tags || []).join(', ')); setImageFile(null);
        setEditingBlogId(blog.id); setIsCreatingBlog(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteClick = async (blogId: string) => {
        if (!window.confirm("Are you sure you want to permanently delete this post?")) return;
        try {
            await deleteDoc(doc(db, 'blogs', blogId));
            if (userRole) fetchData(userRole);
        } catch (err) { console.error("Failed to delete", err); }
    };

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

    /* ── Access denied ── */
    if (!user || !userRole || userRole === 'individual_user') {
        return (
            <Layout lang={lang} onLanguageChange={setLang}>
                <div className="max-w-sm mx-auto py-32 text-center space-y-4 px-4">
                    <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center mx-auto">
                        <ShieldAlert className="w-7 h-7 text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold text-[#150D30]">Access Denied</h2>
                    <p className="text-slate-500 text-sm max-w-xs mx-auto">You don't have permission to view the Admin Panel.</p>
                </div>
            </Layout>
        );
    }

    /* ── Shared input styles ── */
    const inputCls = "w-full px-4 py-2.5 rounded-xl border border-[#E8E2F0] outline-none focus:ring-2 focus:ring-[#2D1065]/20 focus:border-[#2D1065] transition-all text-sm text-[#150D30] bg-white";
    const labelCls = "block text-xs font-medium text-slate-500 mb-1.5";

    return (
        <Layout lang={lang} onLanguageChange={setLang}>
            <div className="max-w-7xl mx-auto py-10 px-4 flex flex-col md:flex-row gap-6 animate-fade-up" dir={t.dir}>

                {/* ── Sidebar ── */}
                <aside className="w-full md:w-56 flex-shrink-0">
                    <div className="bg-white rounded-2xl border border-[#E8E2F0] shadow-[0_2px_12px_rgba(45,16,101,0.05)] overflow-hidden">
                        {/* Brand */}
                        <div className="px-5 py-4 border-b border-[#E8E2F0]">
                            <div className="flex items-center gap-2 mb-0.5">
                                <LayoutDashboard className="w-4 h-4 text-[#9B4DCA]" />
                                <span className="font-semibold text-[#150D30] text-sm">Admin Panel</span>
                            </div>
                            <span className="text-xs font-medium text-[#C9984A] capitalize">
                                {userRole.replace('_', ' ')}
                            </span>
                        </div>

                        {/* Nav */}
                        <nav className="p-2 space-y-1">
                            {(userRole === 'super_admin' || userRole === 'commerce_manager') && (
                                <button
                                    onClick={() => setActiveTab('optimizations')}
                                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                        activeTab === 'optimizations'
                                            ? 'bg-[#2D1065] text-white'
                                            : 'text-slate-600 hover:bg-[#F2EEF9] hover:text-[#2D1065]'
                                    }`}
                                >
                                    <ShoppingCart className="w-4 h-4" /> Orders
                                </button>
                            )}
                            {(userRole === 'super_admin' || userRole === 'content_editor') && (
                                <button
                                    onClick={() => setActiveTab('blogs')}
                                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                        activeTab === 'blogs'
                                            ? 'bg-[#2D1065] text-white'
                                            : 'text-slate-600 hover:bg-[#F2EEF9] hover:text-[#2D1065]'
                                    }`}
                                >
                                    <FileText className="w-4 h-4" /> Blogs
                                </button>
                            )}
                            {userRole === 'super_admin' && (
                                <button
                                    onClick={() => setActiveTab('users')}
                                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                        activeTab === 'users'
                                            ? 'bg-[#2D1065] text-white'
                                            : 'text-slate-600 hover:bg-[#F2EEF9] hover:text-[#2D1065]'
                                    }`}
                                >
                                    <Users className="w-4 h-4" /> Users
                                </button>
                            )}
                        </nav>
                    </div>
                </aside>

                {/* ── Main content ── */}
                <div className="flex-1 bg-white rounded-2xl border border-[#E8E2F0] shadow-[0_2px_12px_rgba(45,16,101,0.05)] p-6 md:p-8 space-y-6">

                    {/* ── Orders tab ── */}
                    {activeTab === 'optimizations' && (userRole === 'super_admin' || userRole === 'commerce_manager') && (
                        <div className="space-y-5">
                            <h3 className="text-lg font-bold text-[#150D30]">Recent Orders</h3>

                            {optimizations.length === 0 ? (
                                <p className="text-slate-400 text-sm">No orders found.</p>
                            ) : (
                                <div className="space-y-3">
                                    {optimizations.map((opt) => {
                                        const isExpanded = expandedOptId === opt.id;
                                        const formatDate = (d: any) => {
                                            if (!d) return '—';
                                            const date = d?.toDate ? d.toDate() : new Date(d);
                                            if (isNaN(date.getTime())) return '—';
                                            return date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                                        };
                                        const currencySymbol = (code: string) => code === 'SAR' ? 'ر.س' : code;
                                        const amount = opt.amount ? `${(opt.amount / 100).toFixed(2)} ${currencySymbol(opt.currency || 'SAR')}` : '—';
                                        return (
                                            <div key={opt.id} className="rounded-xl border border-[#E8E2F0] overflow-hidden hover:border-[#BFB0E5] transition-all">
                                                <div
                                                    className="flex items-center justify-between p-4 bg-[#F2EEF9] cursor-pointer"
                                                    onClick={() => setExpandedOptId(isExpanded ? null : opt.id)}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-[#150D30] text-sm">{opt.original_filename}</p>
                                                        <p className="text-xs text-slate-500 mt-0.5">
                                                            Order #{opt.order_number || opt.id.slice(0, 8)}
                                                            <span className="mx-2 text-slate-300">·</span>
                                                            {formatDate(opt.created_at)}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3 flex-shrink-0">
                                                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${
                                                            opt.is_paid
                                                                ? 'bg-green-50 text-green-600 border-green-100'
                                                                : 'bg-amber-50 text-amber-600 border-amber-100'
                                                        }`}>
                                                            {opt.is_paid
                                                                ? <CheckCircle2 className="w-3 h-3" />
                                                                : <Lock className="w-3 h-3" />}
                                                            {opt.is_paid ? 'Paid' : 'Unpaid'}
                                                        </span>
                                                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                                    </div>
                                                </div>
                                                {isExpanded && (
                                                    <div className="p-4 bg-white border-t border-[#E8E2F0] space-y-3 animate-fade-in">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                                                            <div className="bg-[#FAF9F7] rounded-xl p-3">
                                                                <span className="text-xs text-slate-400 block mb-1">Customer</span>
                                                                <span className="font-medium text-[#150D30] text-sm">{opt.email || '—'}</span>
                                                            </div>
                                                            <div className="bg-[#FAF9F7] rounded-xl p-3">
                                                                <span className="text-xs text-slate-400 block mb-1">Amount</span>
                                                                <span className="font-medium text-[#150D30] text-sm">{amount}</span>
                                                            </div>
                                                            <div className="bg-[#FAF9F7] rounded-xl p-3">
                                                                <span className="text-xs text-slate-400 block mb-1">Created</span>
                                                                <span className="font-medium text-[#150D30] text-sm">{formatDate(opt.created_at)}</span>
                                                            </div>
                                                            {opt.paid_at && (
                                                                <div className="bg-[#FAF9F7] rounded-xl p-3">
                                                                    <span className="text-xs text-slate-400 block mb-1">Paid On</span>
                                                                    <span className="font-medium text-green-600 text-sm">{formatDate(opt.paid_at)}</span>
                                                                </div>
                                                            )}
                                                            {opt.paymob_transaction_id && (
                                                                <div className="bg-[#FAF9F7] rounded-xl p-3">
                                                                    <span className="text-xs text-slate-400 block mb-1">Transaction ID</span>
                                                                    <span className="font-medium text-[#150D30] text-sm font-mono">{opt.paymob_transaction_id}</span>
                                                                </div>
                                                            )}
                                                            {opt.selected_template && (
                                                                <div className="bg-[#FAF9F7] rounded-xl p-3">
                                                                    <span className="text-xs text-slate-400 block mb-1">Template</span>
                                                                    <span className="font-medium text-[#150D30] text-sm capitalize">{opt.selected_template}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {opt.is_paid && (
                                                            <button
                                                                onClick={() => setInvoiceItem(opt)}
                                                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#2D1065] border border-[#E8E2F0] bg-white rounded-xl hover:bg-[#F2EEF9] transition-colors"
                                                            >
                                                                <Receipt className="w-4 h-4" />
                                                                {t.dashboard.viewInvoice}
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Blogs tab ── */}
                    {activeTab === 'blogs' && (userRole === 'super_admin' || userRole === 'content_editor') && (
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-[#150D30]">Manage Blogs</h3>
                                <button
                                    onClick={() => setIsCreatingBlog(!isCreatingBlog)}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-[#2D1065] text-white rounded-xl text-sm font-medium hover:bg-[#220C4E] transition-colors shadow-[0_2px_6px_rgba(45,16,101,0.2)]"
                                >
                                    <Plus className="w-4 h-4" /> New Post
                                </button>
                            </div>

                            {/* Blog form */}
                            {isCreatingBlog && (
                                <form onSubmit={handleCreateOrUpdateBlog} className="bg-[#F2EEF9] border border-[#E8E2F0] rounded-2xl p-6 space-y-5">
                                    <h4 className="font-semibold text-[#150D30] text-sm">
                                        {editingBlogId ? 'Update Post' : 'Create New Post'} — Dual Language
                                    </h4>

                                    {/* English content */}
                                    <div className="bg-white rounded-xl border border-[#E8E2F0] p-5 space-y-3">
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">English</p>
                                        <div>
                                            <label className={labelCls}>Title</label>
                                            <input required type="text" placeholder="Post title (English)" value={blogTitleEn} onChange={e => setBlogTitleEn(e.target.value)} className={inputCls} />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Excerpt</label>
                                            <textarea required placeholder="Short excerpt" value={blogExcerptEn} onChange={e => setBlogExcerptEn(e.target.value)} className={`${inputCls} h-20 resize-none`} />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Content</label>
                                            <div className="rounded-xl border border-[#E8E2F0] overflow-hidden">
                                                <DefaultEditor value={blogContentEn} onChange={(e) => setBlogContentEn(e.target.value)} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Arabic content */}
                                    <div className="bg-white rounded-xl border border-[#E8E2F0] p-5 space-y-3" dir="rtl">
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">العربية</p>
                                        <div>
                                            <label className={labelCls}>العنوان</label>
                                            <input required type="text" placeholder="عنوان المقال" value={blogTitleAr} onChange={e => setBlogTitleAr(e.target.value)} className={inputCls} />
                                        </div>
                                        <div>
                                            <label className={labelCls}>المقتطف</label>
                                            <textarea required placeholder="مقتطف قصير" value={blogExcerptAr} onChange={e => setBlogExcerptAr(e.target.value)} className={`${inputCls} h-20 resize-none`} />
                                        </div>
                                        <div>
                                            <label className={labelCls}>المحتوى</label>
                                            <div className="rounded-xl border border-[#E8E2F0] overflow-hidden">
                                                <DefaultEditor value={blogContentAr} onChange={(e) => setBlogContentAr(e.target.value)} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Image upload */}
                                    <div className="bg-white rounded-xl border border-[#E8E2F0] p-5">
                                        <label className={labelCls}>Hero Image</label>
                                        <div className="flex items-center gap-4">
                                            <div className="relative flex-1 border-2 border-dashed border-[#D5CCE8] rounded-xl p-5 hover:border-[#8B6DC8] hover:bg-[#F2EEF9] transition-colors text-center cursor-pointer">
                                                <input
                                                    type="file" accept="image/*"
                                                    onChange={(e) => { if (e.target.files?.[0]) setImageFile(e.target.files[0]); }}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                                <div className="flex flex-col items-center gap-2 pointer-events-none">
                                                    <Upload className="w-6 h-6 text-slate-400" />
                                                    <span className="text-sm text-slate-500">
                                                        {imageFile ? imageFile.name : 'Click or drag image here'}
                                                    </span>
                                                </div>
                                            </div>
                                            {(blogImage || imageFile) && (
                                                <div className="w-24 h-24 rounded-xl overflow-hidden border border-[#E8E2F0] flex-shrink-0">
                                                    <img
                                                        src={imageFile ? URL.createObjectURL(imageFile) : blogImage}
                                                        alt="Preview"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Category + tags */}
                                    <div className="bg-white rounded-xl border border-[#E8E2F0] p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelCls}>Category</label>
                                            <select value={blogCategory} onChange={e => setBlogCategory(e.target.value)} className={inputCls}>
                                                <option value="">— No Category —</option>
                                                {BLOG_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelCls}>Tags <span className="text-slate-400 font-normal">(comma-separated)</span></label>
                                            <input type="text" placeholder="e.g. ats, resume, job search" value={blogTags} onChange={e => setBlogTags(e.target.value)} className={inputCls} />
                                        </div>
                                    </div>

                                    {/* Form actions */}
                                    <div className="flex justify-end gap-3 pt-1">
                                        <button
                                            type="button"
                                            onClick={resetBlogForm}
                                            disabled={isUploading}
                                            className="px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isUploading}
                                            className="flex items-center gap-2 px-5 py-2 bg-[#2D1065] text-white rounded-xl text-sm font-medium hover:bg-[#220C4E] transition-colors disabled:opacity-50 shadow-[0_2px_6px_rgba(45,16,101,0.2)]"
                                        >
                                            {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                                            {editingBlogId ? 'Update Post' : 'Publish Post'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Blog list */}
                            {blogs.length === 0 ? (
                                <p className="text-slate-400 text-sm">No blogs published yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {blogs.map((blog) => (
                                        <div key={blog.id} className="flex items-center gap-4 p-4 rounded-xl border border-[#E8E2F0] hover:border-[#BFB0E5] transition-all">
                                            {blog.imageUrl && (
                                                <img src={blog.imageUrl} alt="thumb" className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-[#E8E2F0]" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-[#150D30] text-sm truncate">
                                                    {blog.titleEn}
                                                    <span className="text-slate-300 mx-2">|</span>
                                                    {blog.titleAr}
                                                </p>
                                                <div className="flex items-center gap-2 flex-wrap mt-1.5">
                                                    {blog.category && (
                                                        <span className="text-xs font-medium px-2 py-0.5 bg-[#EBE5F5] text-[#9B4DCA] rounded-full border border-[#E8E2F0]">
                                                            {blog.category}
                                                        </span>
                                                    )}
                                                    {(blog.tags || []).slice(0, 3).map((tag: string) => (
                                                        <span key={tag} className="text-xs text-slate-400 px-2 py-0.5 bg-slate-50 rounded-full border border-slate-100">
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                                <p className="text-xs text-slate-400 mt-1 truncate">{blog.excerptEn}</p>
                                            </div>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                <a
                                                    href={`/blog/${generateSlug(blog.titleEn || 'post', blog.id)}`}
                                                    target="_blank" rel="noopener noreferrer"
                                                    className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                                <button onClick={() => handleEditClick(blog)} className="p-2 text-slate-400 hover:text-[#9B4DCA] hover:bg-[#EBE5F5] rounded-lg transition-all">
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDeleteClick(blog.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Users tab ── */}
                    {activeTab === 'users' && userRole === 'super_admin' && (
                        <div className="space-y-5">
                            <div>
                                <h3 className="text-lg font-bold text-[#150D30]">User Directory</h3>
                                <p className="text-slate-500 text-sm mt-0.5">Assign platform roles to registered users.</p>
                            </div>

                            <div className="space-y-3">
                                {allUsers.map((u) => (
                                    <div key={u.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-[#E8E2F0] bg-[#F2EEF9] gap-3">
                                        <div>
                                            <p className="font-medium text-[#150D30] text-sm">{u.email}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                Joined {new Date(u.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <select
                                            value={u.role || 'individual_user'}
                                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                            className="w-full sm:w-auto px-3 py-2 rounded-xl border border-[#E8E2F0] outline-none focus:ring-2 focus:ring-[#2D1065]/20 focus:border-[#2D1065] text-sm bg-white text-[#150D30] cursor-pointer"
                                        >
                                            <option value="individual_user">Individual User</option>
                                            <option value="content_editor">Content Editor</option>
                                            <option value="commerce_manager">Commerce Manager</option>
                                            <option value="super_admin">Super Admin</option>
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <InvoiceModal
                isOpen={!!invoiceItem}
                onClose={() => setInvoiceItem(null)}
                item={invoiceItem}
                lang={lang}
            />
        </Layout>
    );
};
