import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  PenSquare,
  Plus,
  Trash2,
  Edit2,
  Heart,
  Eye,
  Globe,
  AlertCircle,
  Settings,
  BookOpen,
  Zap,
  ArrowUpRight,
  LogOut,
} from 'lucide-react';
import { doctorProfileAPI } from '../../services/api';
import { setUser, logout } from '../../store/slices/authSlice';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const DoctorBlog = () => {
  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [view, setView] = useState(user?.wpSiteUrl ? 'posts' : 'setup');
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isAnimated, setIsAnimated] = useState(false);

  const [setupData, setSetupData] = useState({
    wpSiteUrl: user?.wpSiteUrl || '',
    wpUsername: user?.wpUsername || '',
    wpAppPassword: user?.wpAppPassword || '',
  });

  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    excerpt: '',
    status: 'draft',
    categories: [],
  });

  const [editingPost, setEditingPost] = useState(null);

  useEffect(() => {
    setIsAnimated(true);
  }, []);

  useEffect(() => {
    if (view === 'posts' && user?.wpSiteUrl) {
      fetchPosts();
      fetchCategories();
    }
  }, [view, user?.wpSiteUrl]);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/blog/posts`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch posts');
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      toast.error('Failed to load posts');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/blog/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories');
    }
  };

  const handleSetupChange = (e) => {
    const { name, value } = e.target;
    setSetupData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveSetup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await doctorProfileAPI.updateMe(setupData);
      dispatch(setUser({ user: response.data, token }));
      toast.success('WordPress configured successfully!');
      setView('posts');
      setPosts([]);
      fetchPosts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save WordPress credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostChange = (e) => {
    const { name, value } = e.target;
    if (name === 'categories') {
      const selectedCats = Array.from(e.target.selectedOptions, (option) =>
        parseInt(option.value)
      );
      setNewPost((prev) => ({ ...prev, categories: selectedCats }));
    } else {
      setNewPost((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch(`${API_URL}/blog/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newPost),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create post');
      }

      toast.success('Post created successfully!');
      setNewPost({ title: '', content: '', excerpt: '', status: 'draft', categories: [] });
      setView('posts');
      fetchPosts();
    } catch (error) {
      toast.error(error.message || 'Failed to create post');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await fetch(`${API_URL}/blog/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete post');

      toast.success('Post deleted successfully');
      fetchPosts();
    } catch (error) {
      toast.error('Failed to delete post');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-teal-200 shadow-md animate-fade-in">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 sm:w-10 h-9 sm:h-10 bg-gradient-to-br from-purple-600 to-purple-500 rounded-lg flex items-center justify-center hover:shadow-lg transition-shadow">
              <PenSquare className="text-white" size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">ClinicFlow</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Doctor Blog</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {view === 'posts' && user?.wpSiteUrl && (
              <>
                <button
                  onClick={() => setView('new')}
                  className="text-gray-700 hover:text-purple-600 font-medium text-xs sm:text-sm px-2 sm:px-4 py-2 rounded-lg hover:bg-purple-50 transition hidden lg:block"
                >
                  New Post
                </button>
                <button
                  onClick={() => setView('setup')}
                  className="text-gray-700 hover:text-teal-600 font-medium text-xs sm:text-sm px-2 sm:px-4 py-2 rounded-lg hover:bg-teal-50 transition hidden lg:block"
                >
                  Settings
                </button>
                <div className="hidden lg:block h-6 border-l border-gray-300"></div>
              </>
            )}
            <button
              onClick={() => navigate('/doctor')}
              className="text-gray-700 hover:text-teal-600 font-medium text-xs sm:text-sm px-2 sm:px-4 py-2 rounded-lg hover:bg-teal-50 transition hidden lg:block"
            >
              Dashboard
            </button>
            <div className="flex items-center gap-2 bg-gray-100 px-2 sm:px-4 py-2 rounded-full hover:bg-gray-200 transition">
              <div className="w-7 sm:w-8 h-7 sm:h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm hover:shadow-md transition-shadow">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs sm:text-sm font-medium text-gray-700 hidden sm:inline">{user?.name?.split(' ')[0]}</span>
            </div>
            <button
              onClick={() => dispatch(logout())}
              className="text-gray-700 hover:text-red-600 font-medium text-xs sm:text-sm px-2 sm:px-4 py-2 rounded-lg hover:bg-red-50 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Welcome Section */}
      {view === 'posts' && (
        <section className="relative bg-gradient-to-r from-purple-600 via-purple-500 to-pink-400 text-white pt-6 sm:pt-8 pb-16 sm:pb-24 overflow-hidden" style={{ minHeight: '280px' }}>
          {/* Animated Background Elements */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-10 left-5 w-20 h-20 bg-white rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute bottom-10 right-10 w-32 h-32 bg-pink-200 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-purple-200 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          </div>

          {/* Wave SVG Animation */}
          <svg className="absolute bottom-0 left-0 w-full h-auto" viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ height: '120px' }}>
            <defs>
              <linearGradient id="blogWaveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(147, 51, 234, 0.3)" />
                <stop offset="100%" stopColor="rgba(244, 63, 94, 0.2)" />
              </linearGradient>
            </defs>
            <path
              d="M0,40 Q300,80 600,40 T1200,40 L1200,120 L0,120 Z"
              fill="url(#blogWaveGradient)"
              className="animate-bounce"
              style={{ animationDuration: '3s' }}
            />
            <path
              d="M0,60 Q300,100 600,60 T1200,60 L1200,120 L0,120 Z"
              fill="rgba(244, 63, 94, 0.1)"
              className="animate-bounce"
              style={{ animationDuration: '4s', animationDelay: '0.5s' }}
            />
          </svg>

          <div className="max-w-7xl mx-auto px-3 sm:px-6 relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/30">
                    <BookOpen size={16} className="text-pink-200" />
                    <span className="text-xs sm:text-sm font-semibold text-white">Share Your Expertise</span>
                  </div>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 break-words leading-tight">
                  Health Blog & <span className="bg-gradient-to-r from-pink-200 to-white bg-clip-text text-transparent">Insights</span>
                </h2>
                <div className="flex items-center gap-2 text-purple-50 text-sm sm:text-base">
                  <div className="w-1 h-1 bg-white rounded-full"></div>
                  <p>Write and share valuable health information with your patients</p>
                </div>
              </div>

              {/* Floating Icons */}
              <div className="hidden md:flex flex-col items-end gap-2">
                <div className="text-right">
                  <p className="text-purple-100 text-xs font-semibold opacity-75">Total Posts</p>
                  <p className="text-white text-2xl font-bold">{posts.length}</p>
                </div>
                <div className="flex gap-2 mt-3">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-110 cursor-pointer">
                    <PenSquare size={20} className="text-purple-100" />
                  </div>
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-110 cursor-pointer">
                    <BookOpen size={20} className="text-purple-100" />
                  </div>
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-110 cursor-pointer">
                    <Zap size={20} className="text-purple-100" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {/* Setup View */}
        {view === 'setup' && (
          <div className="bg-white rounded-lg border border-teal-200 p-6 sm:p-8 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '300ms' }}>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">WordPress Setup</h2>
            <p className="text-gray-600 mb-6">
              Configure your WordPress credentials to start publishing blog posts about health, medications, diet tips, and more.
            </p>

            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6 flex gap-3">
              <AlertCircle className="text-teal-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-teal-800">
                <p className="font-semibold mb-1">How to set up:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Have a WordPress site ready (self-hosted or hosted)</li>
                  <li>Log in to WordPress admin → Users → Your Profile</li>
                  <li>Scroll to "Application Passwords" and create a new one</li>
                  <li>Enter your site URL, username, and the generated password below</li>
                </ol>
              </div>
            </div>

            <form onSubmit={handleSaveSetup} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    WordPress Site URL
                  </label>
                  <input
                    type="url"
                    name="wpSiteUrl"
                    value={setupData.wpSiteUrl}
                    onChange={handleSetupChange}
                    placeholder="https://myblog.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    e.g., https://myblog.com or http://localhost:8000
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    WordPress Username
                  </label>
                  <input
                    type="text"
                    name="wpUsername"
                    value={setupData.wpUsername}
                    onChange={handleSetupChange}
                    placeholder="Your WordPress username"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Application Password
                </label>
                <input
                  type="password"
                  name="wpAppPassword"
                  value={setupData.wpAppPassword}
                  onChange={handleSetupChange}
                  placeholder="Your WordPress Application Password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Never share this password. It's only stored securely on our servers.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Globe size={18} />
                {isLoading ? 'Connecting...' : 'Connect WordPress'}
              </button>
            </form>
          </div>
        )}

        {/* Posts List View */}
        {view === 'posts' && user?.wpSiteUrl && (
          <div className="animate-fade-in" style={{ animationDelay: '400ms' }}>
            {isLoading && posts.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-block">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center animate-spin">
                    <div className="w-8 h-8 bg-purple-600 rounded-full opacity-20"></div>
                  </div>
                </div>
                <p className="mt-4 text-gray-600">Loading your posts...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-lg border border-teal-200 p-12 text-center hover:shadow-lg transition-all duration-300 transform">
                <PenSquare className="w-16 h-16 text-teal-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
                <p className="text-gray-600 mb-6">Start sharing your health insights with your patients</p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <button
                    onClick={() => setView('new')}
                    className="px-6 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg font-medium hover:shadow-lg transition inline-flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Write Your First Post
                  </button>
                  <button
                    onClick={() => setView('setup')}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition inline-flex items-center gap-2"
                  >
                    <Settings size={18} />
                    Manage Settings
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-6 flex justify-between items-center">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">Your Blog Posts</h3>
                  <button
                    onClick={() => setView('new')}
                    className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg font-medium hover:shadow-lg transition lg:hidden flex items-center gap-2"
                  >
                    <Plus size={18} />
                    New Post
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {posts.map((post, idx) => (
                  <div
                    key={post.id}
                    className="bg-white rounded-lg border border-teal-200 overflow-hidden hover:shadow-md hover:scale-105 hover:-translate-y-1 transition-all duration-300 p-6 sm:p-8 transform"
                    style={{
                      animation: isAnimated ? `slideUp 0.5s ease-out ${400 + idx * 100}ms both` : 'none'
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                            <PenSquare className="text-white" size={18} />
                          </div>
                          <div>
                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2">
                              {post.title.rendered}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-2 ${
                          post.status === 'publish'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {post.status === 'publish' ? '✓ Published' : '⚡ Draft'}
                      </span>
                    </div>

                    {post.excerpt.rendered && (
                      <p
                        className="text-sm text-gray-600 mb-4 line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
                      />
                    )}

                    <div className="flex gap-2 pt-4 border-t border-teal-100 flex-wrap">
                      <button
                        onClick={() =>
                          window.open(post.link, '_blank')
                        }
                        className="flex-1 min-w-[80px] px-3 py-2 bg-teal-50 text-teal-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-teal-100 transition flex items-center justify-center gap-2"
                      >
                        <Eye size={16} />
                        <span className="hidden sm:inline">View</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditingPost(post);
                          setView('edit');
                        }}
                        className="flex-1 min-w-[80px] px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2"
                      >
                        <Edit2 size={16} />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="flex-1 min-w-[80px] px-3 py-2 bg-red-50 text-red-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-red-100 transition flex items-center justify-center gap-2"
                      >
                        <Trash2 size={16} />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* New/Edit Post View */}
        {(view === 'new' || view === 'edit') && user?.wpSiteUrl && (
          <div className="bg-white rounded-lg border border-teal-200 p-6 sm:p-8 max-w-4xl mx-auto animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                <PenSquare className="text-white" size={20} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {view === 'new' ? 'Write a New Post' : 'Edit Post'}
              </h2>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Post Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={newPost.title}
                  onChange={handlePostChange}
                  placeholder="e.g., 5 Healthy Eating Tips for Diabetic Patients"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Content
                </label>
                <textarea
                  name="content"
                  value={newPost.content}
                  onChange={handlePostChange}
                  placeholder="Share your health insights and expertise..."
                  rows="12"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono text-sm"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tip: You can use HTML tags like &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;p&gt;, etc.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Excerpt (optional)
                </label>
                <textarea
                  name="excerpt"
                  value={newPost.excerpt}
                  onChange={handlePostChange}
                  placeholder="A brief summary of your post"
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This appears as a preview when posts are listed
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-emerald-100 rounded flex items-center justify-center">
                        <span className="text-xs font-bold text-emerald-600">✓</span>
                      </div>
                      Status
                    </div>
                  </label>
                  <select
                    name="status"
                    value={newPost.status}
                    onChange={handlePostChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="draft">Draft (Save for later)</option>
                    <option value="publish">Publish Immediately</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-teal-100 rounded flex items-center justify-center">
                        <span className="text-xs font-bold text-teal-600">#</span>
                      </div>
                      Category
                    </div>
                  </label>
                  <select
                    name="categories"
                    value={newPost.categories[0] || ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        setNewPost((prev) => ({
                          ...prev,
                          categories: [parseInt(e.target.value)],
                        }));
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t border-teal-100">
                <button
                  type="button"
                  onClick={() => setView('posts')}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 px-6 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isCreating ? 'Publishing...' : 'Publish Post'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-4 sm:py-6 border-t border-gray-700 animate-fade-in mt-12" style={{ animationDelay: '800ms' }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 mb-6 sm:mb-8">
            <div className="text-center sm:text-left">
              <div className="flex items-center gap-2 mb-4 justify-center sm:justify-start hover:text-white transition">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center hover:shadow-lg transition-shadow">
                  <Heart className="text-white" size={18} strokeWidth={2.5} />
                </div>
                <span className="font-bold text-white">ClinicFlow</span>
              </div>
              <p className="text-sm">Manage healthcare efficiently with our blog feature.</p>
            </div>
            <div className="text-center">
              <h4 className="font-semibold text-white mb-3">Quick Links</h4>
              <ul className="text-sm space-y-2">
                <li><button onClick={() => navigate('/doctor')} className="hover:text-white hover:translate-x-1 transition-all duration-200">Dashboard</button></li>
                <li><button onClick={() => setView('posts')} className="hover:text-white hover:translate-x-1 transition-all duration-200">My Posts</button></li>
                <li><button onClick={() => setView('new')} className="hover:text-white hover:translate-x-1 transition-all duration-200">Write Post</button></li>
              </ul>
            </div>
            <div className="text-center sm:text-right">
              <h4 className="font-semibold text-white mb-3">Support</h4>
              <ul className="text-sm space-y-2">
                <li><a href="#" className="hover:text-white hover:translate-x-1 transition-all duration-200">Help Center</a></li>
                <li><a href="#" className="hover:text-white hover:translate-x-1 transition-all duration-200">Contact Us</a></li>
                <li><a href="#" className="hover:text-white hover:translate-x-1 transition-all duration-200">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-6 sm:pt-8 text-center text-sm">
            <p>© 2026 ClinicFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.6s ease-out;
        }

        .animate-slide-up {
          animation: slideUp 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};
