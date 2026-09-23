import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import {
  Heart, LogOut, ArrowLeft, Eye, Calendar, BarChart2, Clock, Tag,
  Search, Filter, ChevronDown, Sparkles, Compass, PenSquare, FileText,
  Stethoscope,
} from 'lucide-react';
import { blogAPI } from '../../services/api';

const CATEGORIES = [
  'General Health', 'Cardiology', 'Dermatology', 'Nutrition',
  'Mental Health', 'Pediatrics', 'Orthopedics', 'Diabetes',
  'Women Health', 'Fitness & Wellness',
];

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

// Preview Modal
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
            <span className="font-bold text-gray-900">Read Article</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition p-1 rounded-lg hover:bg-gray-100">
            ✕
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

            {/* Body */}
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

export const PatientBlogs = () => {
  const { user } = useSelector((s) => s.auth);
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewPost, setPreviewPost] = useState(null);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    setIsLoading(true);
    try {
      const res = await blogAPI.getFeed();
      setPosts(res.data || []);
      console.log('Loaded blogs:', res.data?.length);
    } catch (err) {
      console.error('Error loading blogs:', err);
      toast.error('Failed to load blogs');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPosts = posts
    .filter((p) => categoryFilter === 'All' || p.category === categoryFilter)
    .filter((p) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const author = p.doctorId?.name?.toLowerCase() || '';
      return p.title.toLowerCase().includes(q) || p.content?.toLowerCase().includes(q) || author.includes(q);
    });

  const handlePreview = (post) => {
    setPreviewPost(post);
    if (post._id) {
      blogAPI.incrementView(post._id).catch(() => {});
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Preview modal */}
      {previewPost && <PreviewModal post={previewPost} onClose={() => setPreviewPost(null)} />}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#1E3A5F] border-b border-[#2D4F7C] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button type="button"
              onClick={() => navigate(-1)}
              className="text-teal-300 hover:text-white transition p-1.5 rounded-lg hover:bg-white/10">
              <ArrowLeft size={20} />
            </button>
            <div className="w-9 h-9 bg-[#0D9488] rounded-lg flex items-center justify-center">
              <PenSquare className="text-white" size={18} />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white leading-tight">Health Blog</h1>
              <p className="text-xs text-teal-300 hidden sm:block">Medical articles from expert doctors</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Search & Filter Header */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Sparkles size={16} className="text-teal-600" />
                Explore Medical Articles
              </h2>
              <p className="text-xs text-gray-500">Read health knowledge & clinical insights published by doctors</p>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative flex-shrink-0">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search title, doctor, content…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 w-56"
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
                  {categoryFilter === 'All' ? 'All Categories' : categoryFilter.split(' ')[0]}
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
        </div>

        {/* Loading skeleton */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                <div className="h-44 bg-gray-100" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-14 text-center">
            <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Compass size={32} className="text-teal-400" />
            </div>
            <p className="font-bold text-gray-700 text-lg">No blogs found</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchQuery ? `No articles match "${searchQuery}"` : 'Check back soon for new articles!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPosts.map((post, idx) => {
              const doc = post.doctorId;
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

                    {/* Author badge */}
                    <div className="absolute top-3 left-3">
                      <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-slate-900/80 text-white font-medium backdrop-blur-sm border border-white/20">
                        <Stethoscope size={11} className="text-teal-300" />
                        {doc?.name ? `Dr. ${doc.name.replace(/^Dr\.\s*/i, '')}` : 'Doctor'}
                      </span>
                    </div>

                    {/* Read time overlay */}
                    <div className="absolute top-3 right-3">
                      <span className="flex items-center gap-1 text-xs text-white bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full font-medium">
                        <Clock size={10} /> {readTime(post.content)} min
                      </span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium w-fit ${CATEGORY_COLORS[post.category] || 'bg-teal-50 text-teal-700'}`}>
                        {post.category}
                      </span>
                      {doc?.specialization && (
                        <span className="text-[11px] text-gray-500 font-medium truncate max-w-[120px]">
                          {doc.specialization}
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-1.5">
                      {post.title}
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-2 flex-1 leading-relaxed">
                      {post.excerpt || post.content?.substring(0, 120)}…
                    </p>

                    {/* Meta */}
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Calendar size={11} /> {fmtDate(post.publishedAt || post.createdAt)}</span>
                      <span className="flex items-center gap-1"><Eye size={11} /> {fmtViews(post.views)}</span>
                      <span className="flex items-center gap-1 ml-auto"><FileText size={11} /> {wordCount(post.content)}w</span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => handlePreview(post)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 bg-[#0D9488] hover:bg-teal-700 text-white rounded-lg transition shadow-sm"
                      >
                        <Eye size={12} /> Read Article
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
