import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { translations, Language } from '../constants/translations';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { Loader2, ShieldAlert, LayoutDashboard, FileText, Users, ShoppingCart, Plus, Edit, Trash2, Upload, ExternalLink } from 'lucide-react';
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

    // Simple state for creating a blog
    const [isCreatingBlog, setIsCreatingBlog] = useState(false);
    const [blogTitleEn, setBlogTitleEn] = useState('');
    const [blogExcerptEn, setBlogExcerptEn] = useState('');
    const [blogContentEn, setBlogContentEn] = useState('');
    const [blogTitleAr, setBlogTitleAr] = useState('');
    const [blogExcerptAr, setBlogExcerptAr] = useState('');
    const [blogContentAr, setBlogContentAr] = useState('');
    const [blogImage, setBlogImage] = useState(''); // Stores the final URL or existing URL
    const [imageFile, setImageFile] = useState<File | null>(null); // Stores the actual local file
    const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const generateSlug = (title: string, id: string) => {
        return `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${id}`;
    };

    useEffect(() => {
        if (!isFirebaseConfigured) {
            setLoading(false);
            return;
        }
        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                    const role = userDoc.exists() ? userDoc.data().role : 'individual_user';
                    setUserRole(role);

                    if (role === 'content_editor') setActiveTab('blogs');
                    else if (role === 'commerce_manager') setActiveTab('optimizations');

                    if (role !== 'individual_user') {
                        fetchData(role);
                    } else {
                        setLoading(false);
                    }
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
            // Fetch Optimizations
            if (role === 'super_admin' || role === 'commerce_manager') {
                const optQ = query(collection(db, 'optimizations'), orderBy('created_at', 'desc'));
                const optSnapshot = await getDocs(optQ);
                setOptimizations(optSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }

            // Fetch Blogs
            if (role === 'super_admin' || role === 'content_editor') {
                const blogQ = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
                const blogSnapshot = await getDocs(blogQ);
                setBlogs(blogSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }

            // Fetch Users
            if (role === 'super_admin') {
                const usersQ = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
                const usersSnapshot = await getDocs(usersQ);
                setAllUsers(usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            await updateDoc(doc(db, 'users', userId), { role: newRole });
            setAllUsers(allUsers.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (err) {
            console.error("Failed to update role", err);
        }
    };

    const handleCreateOrUpdateBlog = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!blogTitleEn || !blogTitleAr) return;

        setIsUploading(true);
        try {
            let finalImageUrl = blogImage;

            // If a new file is explicitly selected, convert it to a Base64 string
            if (imageFile) {
                finalImageUrl = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = error => reject(error);
                    reader.readAsDataURL(imageFile);
                });
            }

            if (editingBlogId) {
                // Update existing
                await updateDoc(doc(db, 'blogs', editingBlogId), {
                    titleEn: blogTitleEn,
                    excerptEn: blogExcerptEn,
                    contentEn: blogContentEn,
                    titleAr: blogTitleAr,
                    excerptAr: blogExcerptAr,
                    contentAr: blogContentAr,
                    imageUrl: finalImageUrl,
                    updatedAt: new Date().toISOString()
                });
            } else {
                // Create new
                await addDoc(collection(db, 'blogs'), {
                    titleEn: blogTitleEn,
                    excerptEn: blogExcerptEn,
                    contentEn: blogContentEn,
                    titleAr: blogTitleAr,
                    excerptAr: blogExcerptAr,
                    contentAr: blogContentAr,
                    imageUrl: finalImageUrl,
                    createdAt: new Date().toISOString()
                });
            }
            setIsCreatingBlog(false);
            setEditingBlogId(null);
            setBlogTitleEn('');
            setBlogExcerptEn('');
            setBlogContentEn('');
            setBlogTitleAr('');
            setBlogExcerptAr('');
            setBlogContentAr('');
            setBlogImage('');
            setImageFile(null);
            if (userRole) fetchData(userRole);
        } catch (err) {
            console.error(err);
        } finally {
            setIsUploading(false);
        }
    };

    const handleEditClick = (blog: any) => {
        setBlogTitleEn(blog.titleEn);
        setBlogExcerptEn(blog.excerptEn);
        setBlogContentEn(blog.contentEn);
        setBlogTitleAr(blog.titleAr);
        setBlogExcerptAr(blog.excerptAr);
        setBlogContentAr(blog.contentAr);
        setBlogImage(blog.imageUrl || '');
        setImageFile(null); // Clear any pending file
        setEditingBlogId(blog.id);
        setIsCreatingBlog(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteClick = async (blogId: string) => {
        if (!window.confirm("Are you sure you want to permanently delete this powerful post?")) return;
        try {
            await deleteDoc(doc(db, 'blogs', blogId));
            if (userRole) fetchData(userRole);
        } catch (err) {
            console.error("Failed to delete", err);
        }
    };

    if (loading) {
        return (
            <Layout lang={lang} onLanguageChange={setLang}>
                <div className="flex flex-col items-center justify-center py-40">
                    <Loader2 className="w-12 h-12 text-[#85409D] animate-spin" />
                </div>
            </Layout>
        );
    }

    // RBAC Authorization
    if (!user || !userRole || userRole === 'individual_user') {
        return (
            <Layout lang={lang} onLanguageChange={setLang}>
                <div className="max-w-4xl mx-auto py-32 text-center space-y-6">
                    <ShieldAlert className="w-20 h-20 text-red-400 mx-auto" />
                    <h2 className="text-4xl font-black text-[#4D2B8C]">Access Denied</h2>
                    <p className="text-slate-500 font-bold max-w-lg mx-auto">You do not have the necessary permissions to view the Admin Panel.</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout lang={lang} onLanguageChange={setLang}>
            <div className="max-w-7xl mx-auto py-12 px-4 flex flex-col md:flex-row gap-8 animate-fade-in" dir={t.dir}>

                {/* Sidebar */}
                <div className="w-full md:w-64 space-y-2">
                    <div className="p-4 mb-4">
                        <h2 className="text-xl font-black text-[#4D2B8C] flex flex-col gap-1">
                            <span className="flex items-center gap-2"><LayoutDashboard className="w-5 h-5 text-[#85409D]" /> Admin</span>
                            <span className="text-xs font-bold text-[#EEA727] uppercase tracking-widest">{userRole.replace('_', ' ')}</span>
                        </h2>
                    </div>
                    {(userRole === 'super_admin' || userRole === 'commerce_manager') && (
                        <button
                            onClick={() => setActiveTab('optimizations')}
                            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-black transition-all ${activeTab === 'optimizations' ? 'bg-[#4D2B8C] text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <ShoppingCart className="w-5 h-5" /> Orders
                        </button>
                    )}
                    {(userRole === 'super_admin' || userRole === 'content_editor') && (
                        <button
                            onClick={() => setActiveTab('blogs')}
                            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-black transition-all ${activeTab === 'blogs' ? 'bg-[#4D2B8C] text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <FileText className="w-5 h-5" /> Blogs
                        </button>
                    )}
                    {userRole === 'super_admin' && (
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-black transition-all ${activeTab === 'users' ? 'bg-[#4D2B8C] text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            <Users className="w-5 h-5" /> Users
                        </button>
                    )}
                </div>

                {/* Main Content */}
                <div className="flex-1 space-y-8 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-indigo-100/30">

                    {activeTab === 'optimizations' && (userRole === 'super_admin' || userRole === 'commerce_manager') && (
                        <div className="space-y-6">
                            <h3 className="text-3xl font-black text-[#4D2B8C]">Recent Orders</h3>
                            <div className="grid grid-cols-1 gap-4">
                                {optimizations.length === 0 ? <p className="text-slate-400 font-bold">No orders found.</p> : optimizations.map((opt) => (
                                    <div key={opt.id} className="p-6 rounded-2xl border border-slate-100 flex items-center justify-between bg-slate-50">
                                        <div>
                                            <p className="font-black text-[#4D2B8C]">{opt.original_filename}</p>
                                            <p className="text-sm font-bold text-slate-500">Order #{opt.order_number || opt.id.slice(0, 8)}</p>
                                            <p className="text-xs text-slate-400 font-bold">{new Date(opt.created_at).toLocaleString()}</p>
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${opt.is_paid ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {opt.is_paid ? 'Paid' : 'Unpaid'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'blogs' && (userRole === 'super_admin' || userRole === 'content_editor') && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-3xl font-black text-[#4D2B8C]">Manage Blogs</h3>
                                <button
                                    onClick={() => setIsCreatingBlog(!isCreatingBlog)}
                                    className="bg-[#EEA727] text-white px-5 py-2 rounded-xl font-black flex items-center gap-2 hover:bg-[#FFEF5F] hover:text-[#4D2B8C] transition-all shadow-md"
                                >
                                    <Plus className="w-4 h-4" /> New Post
                                </button>
                            </div>

                            {isCreatingBlog && (
                                <form onSubmit={handleCreateOrUpdateBlog} className="bg-amber-50 p-8 rounded-3xl space-y-6 border border-amber-100 shadow-inner">
                                    <h4 className="font-black text-xl text-[#85409D]">
                                        {editingBlogId ? 'Update Existing Post (Dual-Language)' : 'Create New Post (Dual-Language)'}
                                    </h4>

                                    <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-100">
                                        <h5 className="font-bold text-slate-500">English Content</h5>
                                        <input required type="text" placeholder="Post Title (English)" value={blogTitleEn} onChange={e => setBlogTitleEn(e.target.value)} className="w-full px-5 py-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#85409D] font-bold shadow-sm" />
                                        <textarea required placeholder="Short Excerpt (English)" value={blogExcerptEn} onChange={e => setBlogExcerptEn(e.target.value)} className="w-full h-24 px-5 py-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#85409D] font-bold shadow-sm resize-none" />
                                        <div className="bg-white rounded-xl prose-editor-container mb-8">
                                            <DefaultEditor value={blogContentEn} onChange={(e) => setBlogContentEn(e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-100" dir="rtl">
                                        <h5 className="font-bold text-slate-500">المحتوى العربي</h5>
                                        <input required type="text" placeholder="عنوان المقال (عربي)" value={blogTitleAr} onChange={e => setBlogTitleAr(e.target.value)} className="w-full px-5 py-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#85409D] font-bold shadow-sm" />
                                        <textarea required placeholder="مقتطف قصير (عربي)" value={blogExcerptAr} onChange={e => setBlogExcerptAr(e.target.value)} className="w-full h-24 px-5 py-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#85409D] font-bold shadow-sm resize-none" />
                                        <div className="bg-white rounded-xl prose-editor-container mb-8">
                                            <DefaultEditor value={blogContentAr} onChange={(e) => setBlogContentAr(e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-100 flex flex-col sm:flex-row items-center gap-6">
                                        <div className="flex-1 w-full">
                                            <h5 className="font-bold text-slate-500 mb-2">Upload Hero Image</h5>
                                            <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-6 hover:bg-slate-50 transition-colors text-center cursor-pointer">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        if (e.target.files && e.target.files[0]) {
                                                            setImageFile(e.target.files[0]);
                                                        }
                                                    }}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                                <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                                                    <Upload className="w-8 h-8 text-slate-400" />
                                                    <span className="text-slate-500 font-bold">
                                                        {imageFile ? imageFile.name : 'Click or Drag Image Here'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {(blogImage || imageFile) && (
                                            <div className="w-32 h-32 rounded-xl overflow-hidden border border-slate-200 shadow-sm shrink-0">
                                                <img
                                                    src={imageFile ? URL.createObjectURL(imageFile) : blogImage}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-end gap-4">
                                        <button type="button" onClick={() => { setIsCreatingBlog(false); setEditingBlogId(null); setImageFile(null); }} className="px-6 py-3 font-black text-slate-500 hover:bg-slate-100 rounded-xl transition-colors" disabled={isUploading}>Cancel</button>
                                        <button type="submit" disabled={isUploading} className="px-6 py-3 bg-[#85409D] text-white font-black rounded-xl hover:bg-[#4D2B8C] transition-colors shadow-lg shadow-purple-200 disabled:opacity-50 flex items-center gap-2">
                                            {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                                            {editingBlogId ? 'Update Post' : 'Publish Post'}
                                        </button>
                                    </div>
                                </form>
                            )}

                            <div className="grid grid-cols-1 gap-4">
                                {blogs.length === 0 ? <p className="text-slate-400 font-bold">No blogs published.</p> : blogs.map((blog) => (
                                    <div key={blog.id} className="p-6 rounded-2xl border border-slate-100 flex items-center justify-between hover:border-[#85409D]/30 transition-all">
                                        <div className="flex items-center gap-4">
                                            {blog.imageUrl && <img src={blog.imageUrl} alt="thmb" className="w-16 h-16 rounded-xl object-cover" />}
                                            <div>
                                                <p className="font-black text-lg text-[#4D2B8C]">{blog.titleEn} | {blog.titleAr}</p>
                                                <p className="text-sm text-slate-400 font-bold truncate max-w-lg">{blog.excerptEn}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <a href={`/blog/${generateSlug(blog.titleEn || 'post', blog.id)}`} target="_blank" rel="noopener noreferrer" title="View live post" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-blue-500">
                                                <ExternalLink className="w-5 h-5" />
                                            </a>
                                            <button onClick={() => handleEditClick(blog)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-[#85409D]">
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleDeleteClick(blog.id)} className="p-2 hover:bg-red-50 rounded-full transition-colors text-slate-400 hover:text-red-500">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && userRole === 'super_admin' && (
                        <div className="space-y-6">
                            <h3 className="text-3xl font-black text-[#4D2B8C]">User Directory</h3>
                            <p className="text-slate-500 font-bold">Assign platform roles to registered users.</p>

                            <div className="grid grid-cols-1 gap-4">
                                {allUsers.map((u) => (
                                    <div key={u.id} className="p-6 rounded-2xl border border-slate-100 flex flex-col md:flex-row items-center justify-between bg-slate-50 gap-4">
                                        <div>
                                            <p className="font-black text-lg text-[#4D2B8C]">{u.email}</p>
                                            <p className="text-xs text-slate-400 font-bold">Joined: {new Date(u.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex items-center gap-3 w-full md:w-auto">
                                            <select
                                                value={u.role || 'individual_user'}
                                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                className="w-full md:w-auto px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#85409D] font-bold bg-white text-slate-700 shadow-sm cursor-pointer"
                                            >
                                                <option value="individual_user">Individual User</option>
                                                <option value="content_editor">Content Editor</option>
                                                <option value="commerce_manager">Commerce Manager</option>
                                                <option value="super_admin">Super Admin</option>
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </Layout>
    );
};
