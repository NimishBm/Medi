import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import {
  Heart, LogOut, ArrowLeft, Plus, Edit2, Eye, Trash2,
  Calendar, BarChart2, PenSquare, X, Clock, Tag,
  BookOpen, Send, FileText, CheckCircle, AlertCircle,
  TrendingUp, Search, Filter, ChevronDown, Save,
  Globe, Lock, RefreshCw, Upload, Link, Image,
} from 'lucide-react';
import { blogAPI } from '../../services/api';
import { NotificationBell } from '../../components/NotificationBell';
import { useDoctorNotifications } from '../../hooks/useDoctorNotifications';

// ── constants ──────────────────────────────────────────────────────────────

const CATEGORIES = [
  'General Health', 'Cardiology', 'Dermatology', 'Nutrition',
  'Mental Health', 'Pediatrics', 'Orthopedics', 'Diabetes',
  'Women Health', 'Fitness & Wellness',
];

const STATUS_META = {
  published:      { label: 'Published',      style: 'bg-emerald-100 text-emerald-700 border-emerald-200',  dot: 'bg-emerald-500' },
  pending_review: { label: 'Pending Review', style: 'bg-amber-100 text-amber-700 border-amber-200',        dot: 'bg-amber-500'   },
  draft:          { label: 'Draft',           style: 'bg-slate-100 text-slate-600 border-slate-200',        dot: 'bg-slate-400'   },
  rejected:       { label: 'Rejected',        style: 'bg-red-100 text-red-600 border-red-200',             dot: 'bg-red-500'     },
};

const CATEGORY_COLORS = {
  'General Health':    'bg-teal-50 text-teal-700',
  'Cardiology':        'bg-red-50 text-red-700',
  'Dermatology':       'bg-pink-50 text-pink-700',
  'Nutrition':         'bg-green-50 text-green-700',
  'Mental Health':     'bg-purple-50 text-purple-700',
  'Pediatrics':        'bg-blue-50 text-blue-700',
  'Orthopedics':       'bg-orange-50 text-orange-700',
  'Diabetes':          'bg-yellow-50 text-yellow-700',
  'Women Health':      'bg-rose-50 text-rose-700',
  'Fitness & Wellness':'bg-emerald-50 text-emerald-700',
};

// Gradient cover colours used when no image URL provided
const COVER_GRADIENTS = [
  'from-teal-400 to-teal-600',
  'from-blue-400 to-blue-600',
  'from-emerald-400 to-emerald-600',
  'from-cyan-400 to-cyan-600',
  'from-indigo-400 to-indigo-600',
  'from-sky-400 to-sky-600',
];

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const fmtViews = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n ?? 0));

const readTime = (text) => {
  const words = text?.trim().split(/\s+/).length || 0;
  return Math.max(1, Math.round(words / 200));
};

const wordCount = (text) => text?.trim().split(/\s+/).filter(Boolean).length || 0;

const emptyForm = () => ({
  title: '', content: '', excerpt: '', category: 'General Health',
  status: 'draft', coverImage: '',
});

// ── Preview Modal ──────────────────────────────────────────────────────────

const PreviewModal = ({ post, onClose }) => {
  if (!post) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#0D9488] rounded-lg flex items-center justify-center">
              <Eye className="text-white" size={16} />
            </div>
            <span className="font-bold text-gray-900">Post Preview</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition p-1 rounded-lg hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          {/* Cover */}
          {post.coverImage ? (
            <img src={post.coverImage} alt={post.title}
              className="w-full h-56 object-cover"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className={`w-full h-56 bg-gradient-to-br ${COVER_GRADIENTS[0]} flex items-center justify-center`}>
              <PenSquare size={48} className="text-white/50" />
            </div>
          )}

          <div className="p-6">
            {/* Category + read time */}
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${CATEGORY_COLORS[post.category] || 'bg-teal-50 text-teal-700'}`}>
                {post.category}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Clock size={11} /> {readTime(post.content)} min read
              </span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-3">{post.title}</h1>

            {post.excerpt && (
              <p className="text-gray-500 text-sm italic border-l-4 border-teal-400 pl-4 mb-5">{post.excerpt}</p>
            )}

            {/* Body — render newlines */}
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
              {post.content}
            </div>

            {/* Meta footer */}
            <div className="mt-8 pt-4 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1"><Calendar size={11} /> {fmtDate(post.createdAt)}</span>
              <span className="flex items-center gap-1"><BarChart2 size={11} /> {fmtViews(post.views)} views</span>
              <span className="flex items-center gap-1"><FileText size={11} /> {wordCount(post.content)} words</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────

export const DoctorBlog = () => {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  useDoctorNotifications(user?._id);

  const [posts, setPosts]             = useState([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [activeTab, setActiveTab]     = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView]               = useState('list'); // 'list' | 'create' | 'edit'
  const [editPost, setEditPost]       = useState(null);
  const [form, setForm]               = useState(emptyForm());
  const [isSaving, setIsSaving]       = useState(false);
  const [previewPost, setPreviewPost]     = useState(null);
  const [isDeleting, setIsDeleting]       = useState(null); // post id
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [coverMode, setCoverMode]         = useState('url'); // 'url' | 'upload'
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // ── data ───────────────────────────────────────────────────────────────────

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const res = await blogAPI.getPosts();
      setPosts(res.data);
    } catch {
      toast.error('Failed to load posts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [form.content]);

  // ── derived ────────────────────────────────────────────────────────────────

  const filtered = posts
    .filter((p) => activeTab === 'all' || p.status === activeTab)
    .filter((p) => categoryFilter === 'All' || p.category === categoryFilter)
    .filter((p) => !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const tabCounts = {
    all:            posts.length,
    published:      posts.filter((p) => p.status === 'published').length,
    pending_review: posts.filter((p) => p.status === 'pending_review').length,
    draft:          posts.filter((p) => p.status === 'draft').length,
    rejected:       posts.filter((p) => p.status === 'rejected').length,
  };

  const totalViews = posts.reduce((s, p) => s + (p.views || 0), 0);

  // ── form helpers ───────────────────────────────────────────────────────────

  const openCreate = () => {
    setForm(emptyForm());
    setEditPost(null);
    setView('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEdit = (post) => {
    setForm({
      title:      post.title,
      content:    post.content,
      excerpt:    post.excerpt || '',
      category:   post.category || 'General Health',
      status:     post.status,
      coverImage: post.coverImage || '',
    });
    setEditPost(post);
    setView('edit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCoverUpload = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return; }
    setIsUploadingCover(true);
    try {
      const res = await blogAPI.uploadImage(file);
      setForm((f) => ({ ...f, coverImage: res.data.url }));
      toast.success('Image uploaded!');
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleSubmit = async (submitStatus) => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.content.trim()) { toast.error('Content is required'); return; }
    setIsSaving(true);
    const payload = { ...form, status: submitStatus || form.status };
    try {
      if (view === 'edit' && editPost) {
        await blogAPI.updatePost(editPost._id, payload);
        toast.success('Post updated successfully');
      } else {
        await blogAPI.createPost(payload);
        toast.success(submitStatus === 'pending_review' ? 'Post submitted for review!' : 'Post saved as draft!');
      }
      fetchPosts();
      setView('list');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save post');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this post permanently?')) return;
    setIsDeleting(id);
    try {
      await blogAPI.deletePost(id);
      toast.success('Post deleted');
      setPosts((prev) => prev.filter((p) => p._id !== id));
    } catch {
      toast.error('Failed to delete post');
    } finally {
      setIsDeleting(null);
    }
  };

  const handlePreview = (post) => {
    setPreviewPost(post);
  };

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Preview modal */}
      {previewPost && <PreviewModal post={previewPost} onClose={() => setPreviewPost(null)} />}

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-[#1E3A5F] border-b border-[#2D4F7C] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button type="button"
              onClick={() => view !== 'list' ? setView('list') : navigate('/doctor')}
              className="text-teal-300 hover:text-white transition p-1.5 rounded-lg hover:bg-white/10">
              <ArrowLeft size={20} />
            </button>
            <div className="w-9 h-9 bg-[#0D9488] rounded-lg flex items-center justify-center">
              <PenSquare className="text-white" size={18} />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white leading-tight">My Blog</h1>
              <p className="text-xs text-teal-300 hidden sm:block">Share health knowledge with your patients</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Nav links */}
            {['Dashboard:/doctor', 'Appointments:/doctor/appointments', 'Queue:/doctor/queue'].map((s) => {
              const [label, path] = s.split(':');
              return (
                <button key={label} type="button" onClick={() => navigate(path)}
                  className="text-slate-200 hover:text-teal-300 text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition hidden lg:block">
                  {label}
                </button>
              );
            })}
            <div className="hidden lg:block h-5 border-l border-white/20 mx-1" />
            {view === 'list' && (
              <button type="button" onClick={openCreate}
                className="bg-[#0D9488] hover:bg-teal-600 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition shadow-sm">
                <Plus size={16} /> New Post
              </button>
            )}
            <NotificationBell />
            <button type="button" onClick={() => dispatch(logout())}
              className="text-slate-300 hover:text-red-400 p-2 rounded-lg hover:bg-white/10 transition">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* ══════════════════════════════════════
            CREATE / EDIT FORM
        ══════════════════════════════════════ */}
        {(view === 'create' || view === 'edit') && (
          <div className="max-w-4xl mx-auto">
            {/* Form header */}
            <div className="flex items-center gap-3 mb-5">
              <button type="button" onClick={() => setView('list')}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0D9488] transition font-medium">
                <ArrowLeft size={16} /> Back to Posts
              </button>
              <span className="text-gray-300">/</span>
              <span className="text-sm font-semibold text-gray-800">
                {view === 'edit' ? 'Edit Post' : 'New Post'}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

              {/* ── Left — main editor ── */}
              <div className="lg:col-span-2 space-y-4">

                {/* Title */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <input
                    type="text"
                    placeholder="Post title…"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full text-xl font-bold text-gray-900 placeholder-gray-300 border-none outline-none resize-none bg-transparent"
                  />
                  <div className="mt-2 h-0.5 bg-gradient-to-r from-[#0D9488] to-transparent rounded" />
                  <textarea
                    placeholder="Short excerpt / description (optional)…"
                    value={form.excerpt}
                    onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                    rows={2}
                    className="w-full mt-3 text-sm text-gray-500 placeholder-gray-300 border-none outline-none resize-none bg-transparent"
                  />
                </div>

                {/* Content editor */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Content</span>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{wordCount(form.content)} words</span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> ~{readTime(form.content)} min read
                      </span>
                    </div>
                  </div>
                  <textarea
                    ref={textareaRef}
                    placeholder="Write your health article here…&#10;&#10;Tip: Use clear headings, short paragraphs and practical advice for your patients."
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    style={{ minHeight: '360px' }}
                    className="w-full px-5 py-4 text-sm text-gray-700 leading-relaxed border-none outline-none resize-none bg-transparent"
                  />
                </div>

                {/* Cover image */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Image size={14} className="text-teal-600" /> Cover Image
                      <span className="text-gray-400 font-normal text-xs">(optional)</span>
                    </label>
                    {/* Toggle */}
                    <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
                      <button type="button" onClick={() => setCoverMode('url')}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${coverMode === 'url' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                        <Link size={11} /> URL
                      </button>
                      <button type="button" onClick={() => setCoverMode('upload')}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${coverMode === 'upload' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                        <Upload size={11} /> Upload
                      </button>
                    </div>
                  </div>

                  {coverMode === 'url' ? (
                    <input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={form.coverImage}
                      onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                    />
                  ) : (
                    <div>
                      {/* Hidden file input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        className="hidden"
                        onChange={(e) => handleCoverUpload(e.target.files[0])}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingCover}
                        className="w-full border-2 border-dashed border-gray-200 hover:border-teal-400 rounded-lg py-6 flex flex-col items-center gap-2 text-gray-400 hover:text-teal-600 transition disabled:opacity-50"
                      >
                        {isUploadingCover ? (
                          <RefreshCw size={22} className="animate-spin text-teal-500" />
                        ) : (
                          <Upload size={22} />
                        )}
                        <span className="text-sm font-medium">
                          {isUploadingCover ? 'Uploading…' : 'Click to upload image'}
                        </span>
                        <span className="text-xs text-gray-400">JPEG, PNG, GIF, WebP · max 5 MB</span>
                      </button>
                    </div>
                  )}

                  {/* Preview (both modes) */}
                  {form.coverImage && (
                    <div className="mt-3 relative rounded-lg overflow-hidden border border-gray-200">
                      <img
                        src={form.coverImage}
                        alt="cover preview"
                        className="w-full h-40 object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, coverImage: '' })}
                        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Right — settings sidebar ── */}
              <div className="space-y-4">

                {/* Publish panel */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-[#1E3A5F] flex items-center gap-2">
                    <Send size={15} className="text-teal-300" />
                    <span className="text-sm font-bold text-white">Publish</span>
                  </div>
                  <div className="p-4 space-y-3">
                    {/* Current status */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Status</span>
                      {STATUS_META[form.status] && (
                        <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_META[form.status].style}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_META[form.status].dot}`} />
                          {STATUS_META[form.status].label}
                        </span>
                      )}
                    </div>

                    {/* Visibility selector */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Visibility</span>
                      <span className="flex items-center gap-1 text-xs text-gray-600 font-medium">
                        {form.status === 'published' ? <Globe size={12} /> : <Lock size={12} />}
                        {form.status === 'published' ? 'Public' : 'Private (draft)'}
                      </span>
                    </div>

                    <hr className="border-gray-100" />

                    {/* How publishing works — info box */}
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700 leading-relaxed">
                      <p className="font-semibold mb-1">How publishing works</p>
                      <p>• <strong>Save as Draft</strong> — only you can see it.</p>
                      <p>• <strong>Submit for Review</strong> — sends to the clinic admin for approval before going live.</p>
                      <p>• Once approved by admin it becomes <strong>Published</strong> and visible to patients.</p>
                    </div>

                    {/* Action buttons */}
                    <button
                      type="button"
                      onClick={() => handleSubmit('draft')}
                      disabled={isSaving}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 text-sm font-medium rounded-lg transition"
                    >
                      <Save size={14} /> Save as Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSubmit('pending_review')}
                      disabled={isSaving}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#0D9488] hover:bg-teal-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
                    >
                      {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                      {isSaving ? 'Saving…' : 'Submit for Review'}
                    </button>
                    {(view === 'edit' && editPost?.status === 'published') && (
                      <button
                        type="button"
                        onClick={() => handleSubmit('published')}
                        disabled={isSaving}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
                      >
                        {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                        {isSaving ? 'Saving…' : 'Update Published Post'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Category */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2.5 flex items-center gap-2">
                    <Tag size={14} className="text-teal-600" /> Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                  >
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <span className={`mt-2 inline-block text-xs px-2.5 py-1 rounded-full font-medium ${CATEGORY_COLORS[form.category] || 'bg-teal-50 text-teal-700'}`}>
                    {form.category}
                  </span>
                </div>

                {/* Post stats (edit mode) */}
                {view === 'edit' && editPost && (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <BarChart2 size={14} className="text-teal-600" /> Post Stats
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Views</span>
                        <span className="font-bold text-gray-900">{fmtViews(editPost.views)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Created</span>
                        <span className="text-gray-700">{fmtDate(editPost.createdAt)}</span>
                      </div>
                      {editPost.publishedAt && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Published</span>
                          <span className="text-gray-700">{fmtDate(editPost.publishedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Cancel */}
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className="w-full px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium"
                >
                  ← Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            LIST VIEW
        ══════════════════════════════════════ */}
        {view === 'list' && (
          <>
            {/* ── Stats banner ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Total Posts',      value: posts.length,             icon: FileText,    color: 'teal'    },
                { label: 'Published',        value: tabCounts.published,      icon: Globe,       color: 'emerald' },
                { label: 'Pending Review',   value: tabCounts.pending_review, icon: Clock,       color: 'amber'   },
                { label: 'Total Views',      value: fmtViews(totalViews),     icon: TrendingUp,  color: 'blue'    },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 hover:shadow-sm transition">
                  <div className={`w-10 h-10 bg-${color}-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon size={18} className={`text-${color}-600`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    <p className="text-xs text-gray-500">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Hero CTA (only if no posts) ── */}
            {posts.length === 0 && !isLoading && (
              <div className="bg-gradient-to-r from-[#1E3A5F] to-[#0D5A8A] rounded-2xl p-6 mb-6 flex items-center justify-between overflow-hidden relative">
                <div className="relative z-10">
                  <h2 className="text-xl font-bold text-white mb-1">Start Your Health Blog</h2>
                  <p className="text-teal-200 text-sm mb-4 max-w-md">
                    Share your medical expertise, tips, and health insights with your patients.
                    Build trust and educate your community.
                  </p>
                  <button type="button" onClick={openCreate}
                    className="bg-[#0D9488] hover:bg-teal-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl flex items-center gap-2 transition shadow-lg">
                    <Plus size={16} /> Write Your First Post
                  </button>
                </div>
                {/* Decorative */}
                <div className="hidden sm:flex flex-col items-center justify-center opacity-20 absolute right-8 top-1/2 -translate-y-1/2">
                  <BookOpen size={96} className="text-white" />
                </div>
              </div>
            )}

            {/* ── Tabs + Search + Filter bar ── */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Tabs */}
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {[
                    { key: 'all',            label: 'All',            icon: BookOpen   },
                    { key: 'published',      label: 'Published',      icon: Globe      },
                    { key: 'pending_review', label: 'Pending',        icon: Clock      },
                    { key: 'draft',          label: 'Drafts',         icon: FileText   },
                    { key: 'rejected',       label: 'Rejected',       icon: AlertCircle },
                  ].map(({ key, label, icon: Icon }) => (
                    <button key={key} type="button"
                      onClick={() => setActiveTab(key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        activeTab === key
                          ? 'bg-[#1E3A5F] text-white shadow-sm'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}>
                      <Icon size={12} />
                      {label}
                      {tabCounts[key] > 0 && (
                        <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${
                          activeTab === key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {tabCounts[key]}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative flex-shrink-0">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search posts…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 w-44"
                  />
                </div>

                {/* Category filter */}
                <div className="relative flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition text-gray-600"
                  >
                    <Filter size={13} />
                    {categoryFilter === 'All' ? 'Category' : categoryFilter.split(' ')[0]}
                    <ChevronDown size={13} className={`transition ${showCategoryFilter ? 'rotate-180' : ''}`} />
                  </button>
                  {showCategoryFilter && (
                    <div className="absolute right-0 top-10 z-30 bg-white border border-gray-200 rounded-xl shadow-lg w-52 py-1 max-h-64 overflow-y-auto">
                      {['All', ...CATEGORIES].map((c) => (
                        <button key={c} type="button"
                          onClick={() => { setCategoryFilter(c); setShowCategoryFilter(false); }}
                          className={`w-full text-left px-4 py-2 text-sm transition ${
                            categoryFilter === c ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                          }`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Loading skeleton ── */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                    <div className="h-44 bg-gray-100" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-100 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/3" />
                      <div className="h-3 bg-gray-100 rounded w-full" />
                      <div className="h-3 bg-gray-100 rounded w-4/5" />
                    </div>
                  </div>
                ))}
              </div>

            ) : filtered.length === 0 ? (
              /* Empty state */
              <div className="bg-white rounded-xl border border-gray-200 p-14 text-center">
                <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <PenSquare size={32} className="text-teal-300" />
                </div>
                <p className="font-bold text-gray-600 text-lg">No posts found</p>
                <p className="text-sm text-gray-400 mt-1 mb-5">
                  {searchQuery
                    ? `No results for "${searchQuery}"`
                    : activeTab === 'all'
                      ? 'Start sharing your health knowledge with patients.'
                      : `No ${STATUS_META[activeTab]?.label?.toLowerCase() || activeTab} posts.`}
                </p>
                {activeTab === 'all' && !searchQuery && (
                  <button type="button" onClick={openCreate}
                    className="bg-[#0D9488] hover:bg-teal-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition">
                    Write Your First Post
                  </button>
                )}
              </div>

            ) : (
              /* ── Card grid ── */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((post, idx) => {
                  const sm = STATUS_META[post.status] || STATUS_META.draft;
                  return (
                    <div key={post._id}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col group">

                      {/* Cover */}
                      <div className="relative h-44 overflow-hidden flex-shrink-0">
                        {post.coverImage ? (
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-full h-full bg-gradient-to-br ${COVER_GRADIENTS[idx % COVER_GRADIENTS.length]} flex items-center justify-center ${post.coverImage ? 'hidden' : 'flex'}`}
                          style={{ position: post.coverImage ? 'absolute' : 'static', top: 0, left: 0 }}
                        >
                          <PenSquare size={40} className="text-white/40" />
                        </div>

                        {/* Status badge overlay */}
                        <div className="absolute top-3 left-3">
                          <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-semibold backdrop-blur-sm bg-white/90 ${sm.style}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
                            {sm.label}
                          </span>
                        </div>

                        {/* Read time overlay */}
                        <div className="absolute top-3 right-3">
                          <span className="flex items-center gap-1 text-xs text-white bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">
                            <Clock size={10} /> {readTime(post.content)} min
                          </span>
                        </div>
                      </div>

                      {/* Body */}
                      <div className="p-4 flex flex-col flex-1">
                        {/* Category */}
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium w-fit mb-2 ${CATEGORY_COLORS[post.category] || 'bg-teal-50 text-teal-700'}`}>
                          {post.category}
                        </span>

                        <h4 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-1.5">
                          {post.title}
                        </h4>
                        <p className="text-xs text-gray-500 line-clamp-2 flex-1 leading-relaxed">
                          {post.excerpt || post.content?.substring(0, 120)}…
                        </p>

                        {/* Meta */}
                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><Calendar size={11} /> {fmtDate(post.createdAt)}</span>
                          <span className="flex items-center gap-1"><Eye size={11} /> {fmtViews(post.views)}</span>
                          <span className="flex items-center gap-1 ml-auto"><FileText size={11} /> {wordCount(post.content)}w</span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 mt-3">
                          <button
                            type="button"
                            onClick={() => openEdit(post)}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-[#1E3A5F] hover:bg-[#2D4F7C] text-white rounded-lg transition"
                          >
                            <Edit2 size={11} /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePreview(post)}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg transition"
                          >
                            <Eye size={11} /> Preview
                          </button>
                          {post.status === 'draft' && (
                            <button
                              type="button"
                              onClick={() => handleDelete(post._id)}
                              disabled={isDeleting === post._id}
                              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition ml-auto disabled:opacity-50"
                            >
                              {isDeleting === post._id
                                ? <RefreshCw size={11} className="animate-spin" />
                                : <Trash2 size={11} />}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
