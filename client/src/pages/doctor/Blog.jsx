import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  PenSquare,
  Plus,
  Trash2,
  Edit2,
  ArrowLeft,
  Eye,
  Globe,
  AlertCircle,
  Settings,
} from 'lucide-react';
import { doctorProfileAPI } from '../../services/api';
import { setUser } from '../../store/slices/authSlice';

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
      <header className="sticky top-0 z-50 bg-white border-b border-teal-200 shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/doctor')}
              className="text-gray-600 hover:text-gray-900 transition"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <PenSquare className="text-white" size={20} />
              </div>
              <h1 className="text-xl font-bold text-gray-900">My Blog</h1>
            </div>
          </div>
          {view === 'posts' && user?.wpSiteUrl && (
            <div className="flex gap-2">
              <button
                onClick={() => setView('new')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition flex items-center gap-2"
              >
                <Plus size={18} />
                New Post
              </button>
              <button
                onClick={() => setView('setup')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition flex items-center gap-2"
              >
                <Settings size={18} />
                Settings
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Setup View */}
        {view === 'setup' && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">WordPress Setup</h2>
            <p className="text-gray-600 mb-6">
              Configure your WordPress credentials to start publishing blog posts.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex gap-3">
              <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-blue-800">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Never share this password. It's only stored securely.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50"
              >
                {isLoading ? 'Connecting...' : 'Connect WordPress'}
              </button>
            </form>
          </div>
        )}

        {/* Posts List View */}
        {view === 'posts' && user?.wpSiteUrl && (
          <div>
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
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <PenSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
                <p className="text-gray-600 mb-4">Start sharing your health insights with your patients</p>
                <button
                  onClick={() => setView('new')}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition inline-flex items-center gap-2"
                >
                  <Plus size={18} />
                  Write Your First Post
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition p-6"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                          {post.title.rendered}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(post.date).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          post.status === 'publish'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {post.status === 'publish' ? 'Published' : 'Draft'}
                      </span>
                    </div>

                    {post.excerpt.rendered && (
                      <p
                        className="text-sm text-gray-600 mb-4 line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
                      />
                    )}

                    <div className="flex gap-2 pt-4 border-t border-gray-200">
                      <button
                        onClick={() =>
                          window.open(post.link, '_blank')
                        }
                        className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition flex items-center justify-center gap-2"
                      >
                        <Eye size={16} />
                        View
                      </button>
                      <button
                        onClick={() => {
                          setEditingPost(post);
                          setView('edit');
                        }}
                        className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2"
                      >
                        <Edit2 size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="flex-1 px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition flex items-center justify-center gap-2"
                      >
                        <Trash2 size={16} />
                        Delete
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
          <div className="bg-white rounded-lg border border-gray-200 p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {view === 'new' ? 'Write a New Post' : 'Edit Post'}
            </h2>

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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tip: You can use HTML tags like &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;li&gt;,
                  etc.
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={newPost.status}
                    onChange={handlePostChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="publish">Publish Immediately</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Category
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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

              <div className="flex gap-3 pt-6 border-t border-gray-200">
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
                  className="flex-1 px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isCreating ? 'Publishing...' : 'Publish Post'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};
