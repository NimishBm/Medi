import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import {
  Heart, LogOut, ArrowLeft, Plus, Edit2, Eye,
  Trash2, Calendar, BarChart2, PenSquare, X, ChevronLeft,
} from 'lucide-react';
import { blogAPI } from '../../services/api';
import { NotificationBell } from '../../components/NotificationBell';

// ── constants ──────────────────────────────────────────────────────────────

const CATEGORIES = [
  'General Health', 'Cardiology', 'Dermatology', 'Nutrition',
  'Mental Health', 'Pediatrics', 'Orthopedics', 'Diabetes',
  'Women Health', 'Fitness & Wellness',
];

const STATUS_LABEL = {
  published:      'Published',
  pending_review: 'Pending Review',
  draft:          'Draft',
  rejected:       'Rejected',
};

const STATUS_STYLE = {
  published:      'bg-green-100 text-green-700',
  pending_review: 'bg-yellow-100 text-yellow-700',
  draft:          'bg-gray-100 text-gray-600',
  rejected:       'bg-red-100 text-red-600',
};

// Pastel cover colours used when no image URL provided
const COVER_COLORS = [
  'from-blue-200 to-blue-300',
  'from-teal-200 to-teal-300',
  'from-purple-200 to-purple-300',
  'from-rose-200 to-rose-300',
  'from-amber-200 to-amber-300',
  'from-emerald-200 to-emerald-300',
];

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const fmtViews = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

const emptyForm = () => ({
  title: '', content: '', excerpt: '', category: 'General Health',
  status: 'draft', coverImage: '',
});

// ── component ──────────────────────────────────────────────────────────────

export const DoctorBlog = () => {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [posts, setPosts]           = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [activeTab, setActiveTab]   = useState('all');
  const [view, setView]             = useState('list'); // 'list' | 'create' | 'edit'
  const [editPost, setEditPost]     = useState(null);
  const [form, setForm]             = useState(emptyForm());
  const [isSaving, setIsSaving]     = useState(false);

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

  // ── filtered list ──────────────────────────────────────────────────────────

  const filtered = activeTab === 'all'
    ? posts
    : posts.filter((p) => p.status === activeTab);

  const tabCounts = {
    all:            posts.length,
    published:      posts.filter((p) => p.status === 'published').length,
    pending_review: posts.filter((p) => p.status === 'pending_review').length,
    draft:          posts.filter((p) => p.status === 'draft').length,
    rejected:       posts.filter((p) => p.status === 'rejected').length,
  };

  // ── form helpers ───────────────────────────────────────────────────────────

  const openCreate = () => {
    setForm(emptyForm());
    setEditPost(null);
    setView('create');
  };

  const openEdit = (post) => {
    setForm({
      title:       post.title,
      content:     post.content,
      excerpt:     post.excerpt || '',
      category:    post.category || 'General Health',
      status:      post.status,
      coverImage:  post.coverImage || '',
    });
    setEditPost(post);
    setView('edit');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    setIsSaving(true);
    try {
      if (view === 'edit' && editPost) {
        await blogAPI.updatePost(editPost._id, form);
        toast.success('Post updated');
      } else {
        await blogAPI.createPost(form);
        toast.success('Post created');
      }
      fetchPosts();
      setView('list');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save post');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await blogAPI.deletePost(id);
      toast.success('Post deleted');
      fetchPosts();
    } catch {
      toast.error('Failed to delete post');
    }
  };

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-[#1E3A5F] border-b border-[#2D4F7C] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => view !== 'list' ? setView('list') : navigate('/doctor')}
              className="text-teal-300 hover:text-white transition p-1">
              <ArrowLeft size={20} />
            </button>
            <div className="w-9 h-9 bg-purple-500 rounded-lg flex items-center justify-center">
              <PenSquare className="text-white" size={18} />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white leading-tight">My Blog</h1>
              <p className="text-xs text-teal-300 hidden sm:block">Share health knowledge with your patients</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {view === 'list' && (
              <button type="button" onClick={openCreate}
                className="bg-purple-500 hover:bg-purple-600 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 transition">
                <Plus size={16} /> Create New Blog
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

        {/* ── CREATE / EDIT FORM ── */}
        {(view === 'create' || view === 'edit') && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-purple-600 px-6 py-4 flex items-center justify-between">
                <h2 className="text-white font-bold text-lg">
                  {view === 'edit' ? 'Edit Post' : 'Create New Blog Post'}
                </h2>
                <button type="button" onClick={() => setView('list')}
                  className="text-white/80 hover:text-white transition">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Cover image URL */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cover Image URL <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input type="url" placeholder="https://example.com/image.jpg"
                    value={form.coverImage}
                    onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  {form.coverImage && (
                    <img src={form.coverImage} alt="cover preview"
                      className="mt-2 w-full h-36 object-cover rounded-lg border border-gray-200"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title *</label>
                  <input type="text" placeholder="e.g. 5 Ways to Maintain a Healthy Heart"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
                    required
                  />
                </div>

                {/* Category + Status row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400">
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400">
                      <option value="draft">Draft</option>
                      <option value="pending_review">Submit for Review</option>
                      <option value="published">Publish</option>
                    </select>
                  </div>
                </div>

                {/* Excerpt */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Excerpt <span className="text-gray-400 font-normal">(short summary)</span></label>
                  <textarea placeholder="A brief summary shown on the card..." value={form.excerpt}
                    onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Content *</label>
                  <textarea placeholder="Write your health article here..." value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    rows={10}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 resize-y"
                    required
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setView('list')}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition text-sm">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSaving}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition text-sm flex items-center justify-center gap-2">
                    {isSaving ? 'Saving…' : view === 'edit' ? 'Save Changes' : 'Create Post'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── LIST VIEW ── */}
        {view === 'list' && (
          <>
            {/* Hero banner */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <PenSquare size={24} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 text-lg">Create Your Blog</h2>
                  <p className="text-sm text-gray-500">Write and publish health articles, tips and insights for your patients.</p>
                  <button type="button" onClick={openCreate}
                    className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition w-fit">
                    <Plus size={14} /> Create New Blog
                  </button>
                </div>
              </div>
              {/* Decorative illustration */}
              <div className="hidden sm:flex items-center justify-center w-24 h-24 opacity-60">
                <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <rect x="10" y="8" width="60" height="64" rx="6" fill="#dbeafe"/>
                  <rect x="18" y="20" width="28" height="4" rx="2" fill="#3b82f6"/>
                  <rect x="18" y="30" width="44" height="3" rx="1.5" fill="#93c5fd"/>
                  <rect x="18" y="38" width="38" height="3" rx="1.5" fill="#93c5fd"/>
                  <rect x="18" y="46" width="42" height="3" rx="1.5" fill="#93c5fd"/>
                  <circle cx="62" cy="58" r="14" fill="#bfdbfe"/>
                  <path d="M56 58l4 4 8-8" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            {/* Your Blogs heading + filter tabs */}
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Your Blogs</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all',            label: 'All' },
                  { key: 'published',      label: 'Published' },
                  { key: 'pending_review', label: 'Pending Review' },
                  { key: 'draft',          label: 'Drafts' },
                  { key: 'rejected',       label: 'Rejected' },
                ].map(({ key, label }) => (
                  <button key={key} type="button"
                    onClick={() => setActiveTab(key)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition border ${
                      activeTab === key
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}>
                    {label}
                    {tabCounts[key] > 0 && (
                      <span className={`ml-1.5 text-xs ${activeTab === key ? 'text-blue-100' : 'text-gray-400'}`}>
                        ({tabCounts[key]})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Loading */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1,2,3].map((i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                    <div className="h-40 bg-gray-200" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                      <div className="h-3 bg-gray-200 rounded w-full" />
                      <div className="h-3 bg-gray-200 rounded w-4/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              /* Empty state */
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <PenSquare size={48} className="mx-auto text-gray-200 mb-3" />
                <p className="font-semibold text-gray-500">No posts yet</p>
                <p className="text-sm text-gray-400 mt-1 mb-4">
                  {activeTab === 'all'
                    ? 'Start sharing your health knowledge with patients.'
                    : `No ${STATUS_LABEL[activeTab]?.toLowerCase() || activeTab} posts.`}
                </p>
                {activeTab === 'all' && (
                  <button type="button" onClick={openCreate}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition">
                    Write Your First Post
                  </button>
                )}
              </div>
            ) : (
              /* Card grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((post, idx) => (
                  <div key={post._id}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition flex flex-col">

                    {/* Cover */}
                    {post.coverImage ? (
                      <img src={post.coverImage} alt={post.title}
                        className="w-full h-40 object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-full h-40 bg-gradient-to-br ${COVER_COLORS[idx % COVER_COLORS.length]} flex items-center justify-center ${post.coverImage ? 'hidden' : 'flex'}`}>
                      <PenSquare size={36} className="text-white/60" />
                    </div>

                    {/* Body */}
                    <div className="p-4 flex flex-col flex-1">
                      <h4 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-1">
                        {post.title}
                      </h4>
                      <p className="text-xs text-gray-400 mb-2">{post.category}</p>
                      <p className="text-xs text-gray-500 line-clamp-3 flex-1">
                        {post.excerpt || post.content?.substring(0, 140)}
                      </p>

                      {/* Status badge */}
                      <div className="mt-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_STYLE[post.status] || 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABEL[post.status] || post.status}
                        </span>
                      </div>

                      {/* Meta row */}
                      <div className="flex items-center gap-3 mt-3 text-xs text-gray-400 border-t border-gray-100 pt-3">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} /> {fmtDate(post.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <BarChart2 size={11} /> {fmtViews(post.views)} views
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 mt-3">
                        <button type="button" onClick={() => openEdit(post)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 transition">
                          <Edit2 size={12} /> Edit
                        </button>
                        <button type="button"
                          onClick={() => {
                            blogAPI.incrementView(post._id).catch(() => {});
                            window.open(post.coverImage || '#', '_blank');
                          }}
                          className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium px-2 py-1 rounded hover:bg-teal-50 transition">
                          <Eye size={12} /> View
                        </button>
                        {post.status === 'draft' && (
                          <button type="button" onClick={() => handleDelete(post._id)}
                            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50 transition ml-auto">
                            <Trash2 size={12} /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
