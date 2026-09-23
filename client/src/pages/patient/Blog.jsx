import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useIsMobile } from '../../hooks/useIsMobile';
import { NotificationBell } from '../../components/NotificationBell';
import { logout } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import {
  ChevronLeft, BookOpen, Calendar, BarChart2, ChevronRight,
  Search, Tag, Stethoscope, ArrowLeft,
} from 'lucide-react';
import { blogAPI } from '../../services/api';

const T = '#0D9488';

const CATEGORIES = [
  'All',
  'General Health', 'Cardiology', 'Dermatology', 'Nutrition',
  'Mental Health', 'Pediatrics', 'Orthopedics', 'Diabetes',
  'Women Health', 'Fitness & Wellness',
];

const COVER_COLORS = [
  ['#DBEAFE', '#BFDBFE'],
  ['#CCFBF1', '#99F6E4'],
  ['#EDE9FE', '#DDD6FE'],
  ['#FCE7F3', '#FBCFE8'],
  ['#FEF3C7', '#FDE68A'],
  ['#D1FAE5', '#A7F3D0'],
];

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const fmtViews = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n ?? 0));

export const PatientBlog = () => {
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const isMobile  = useIsMobile();
  const { user }  = useSelector((s) => s.auth);

  const [posts, setPosts]                   = useState([]);
  const [isLoading, setIsLoading]           = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery]       = useState('');
  const [selectedPost, setSelectedPost]     = useState(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await blogAPI.getPublicPosts(activeCategory === 'All' ? null : activeCategory);
        setPosts(res.data || []);
      } catch {
        toast.error('Failed to load articles');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [activeCategory]);

  const openPost = async (post) => {
    blogAPI.incrementView(post._id).catch(() => {});
    try {
      const res = await blogAPI.getPublicPost(post._id);
      setSelectedPost(res.data);
    } catch {
      setSelectedPost(post);
    }
  };

  const filtered = posts.filter((p) =>
    searchQuery.trim() === '' ||
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.excerpt || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA', fontFamily: 'system-ui,-apple-system,sans-serif' }}>

      {/* ── Navbar ── */}
      <header style={{ background: '#fff', borderBottom: '1px solid #E8ECF0', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => selectedPost ? setSelectedPost(null) : navigate('/patient')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex', padding: 4 }}>
            <ChevronLeft size={22} />
          </button>
          <div onClick={() => navigate('/patient')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <div style={{ width: 32, height: 32, background: `linear-gradient(135deg,${T},#0F766E)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stethoscope size={16} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 16, color: T }}>ClinicFlow</span>
          </div>
          {!isMobile && (
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginLeft: 4 }}>
              {selectedPost ? '/ Health Blog / Article' : '/ Health Blog'}
            </span>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <NotificationBell userId={user?._id} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F3F4F6', padding: '5px 10px', borderRadius: 20 }}>
              <div style={{ width: 24, height: 24, background: T, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12 }}>
                {user?.name?.charAt(0)}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{user?.name?.split(' ')[0]}</span>
            </div>
            <button onClick={() => dispatch(logout())}
              style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>
              Logout
            </button>
          </div>
        </div>
        <div style={{ background: T, height: 4 }} />
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px 48px' }}>

        {/* ── POST DETAIL VIEW ── */}
        {selectedPost && (
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <button onClick={() => setSelectedPost(null)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
              <ArrowLeft size={15} /> Back to articles
            </button>

            <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ height: 5, background: `linear-gradient(90deg,${T},#14B8A6)` }} />

              {/* Cover */}
              {selectedPost.coverImage ? (
                <img src={selectedPost.coverImage} alt={selectedPost.title}
                  style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div style={{ width: '100%', height: 220, background: `linear-gradient(135deg,${COVER_COLORS[0][0]},${COVER_COLORS[0][1]})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={48} color="#fff" opacity={0.5} />
                </div>
              )}

              <div style={{ padding: '24px 28px' }}>
                {/* Category badge */}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, background: '#F0FDF4', color: T, padding: '3px 10px', borderRadius: 20, marginBottom: 12 }}>
                  <Tag size={10} /> {selectedPost.category}
                </span>

                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', lineHeight: 1.3, marginBottom: 12 }}>
                  {selectedPost.title}
                </h2>

                {/* Doctor info */}
                {selectedPost.doctorId && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 36, height: 36, background: '#EFF6FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Stethoscope size={16} color="#3B82F6" />
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', margin: 0 }}>Dr. {selectedPost.doctorId.name}</p>
                      <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>{selectedPost.doctorId.specialization}</p>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#9CA3AF', paddingBottom: 16, borderBottom: '1px solid #F3F4F6', marginBottom: 20 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={12} /> {fmtDate(selectedPost.publishedAt || selectedPost.createdAt)}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <BarChart2 size={12} /> {fmtViews(selectedPost.views)} views
                  </span>
                </div>

                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                  {selectedPost.content}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── LIST VIEW ── */}
        {!selectedPost && (
          <>
            {/* Hero banner */}
            <div style={{ background: 'linear-gradient(135deg,#F0FDF4,#E0F2FE)', border: '1.5px solid #BBF7D0', borderRadius: 16, padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, background: '#CCFBF1', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <BookOpen size={24} color={T} />
                </div>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 18, color: '#111827', margin: 0 }}>Health Blog</p>
                  <p style={{ fontSize: 13, color: '#6B7280', margin: '2px 0 0' }}>Trusted health knowledge written by our doctors</p>
                </div>
              </div>
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input
                type="text"
                placeholder="Search articles…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', paddingLeft: 36, paddingRight: 14, paddingTop: 9, paddingBottom: 9, border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, background: '#fff', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Category tabs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: '1.5px solid',
                    cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
                    background: activeCategory === cat ? T : '#fff',
                    color:      activeCategory === cat ? '#fff' : '#374151',
                    borderColor: activeCategory === cat ? T : '#E5E7EB',
                  }}>
                  {cat}
                </button>
              ))}
            </div>

            {/* Loading skeletons */}
            {isLoading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
                {[1,2,3,4,5,6].map((i) => (
                  <div key={i} style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 14, overflow: 'hidden' }}>
                    <div style={{ height: 160, background: '#F3F4F6' }} />
                    <div style={{ padding: 16 }}>
                      <div style={{ height: 14, background: '#F3F4F6', borderRadius: 6, width: '70%', marginBottom: 8 }} />
                      <div style={{ height: 11, background: '#F3F4F6', borderRadius: 6, width: '50%', marginBottom: 6 }} />
                      <div style={{ height: 11, background: '#F3F4F6', borderRadius: 6, width: '90%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: '56px 16px', textAlign: 'center' }}>
                <BookOpen size={48} color="#D1D5DB" style={{ margin: '0 auto 16px' }} />
                <p style={{ fontWeight: 700, color: '#111827', marginBottom: 4 }}>No articles found</p>
                <p style={{ fontSize: 13, color: '#6B7280' }}>
                  {searchQuery ? 'Try a different search term.' : 'No published articles in this category yet.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
                {filtered.map((post, idx) => {
                  const [c1, c2] = COVER_COLORS[idx % COVER_COLORS.length];
                  return (
                    <button key={post._id} onClick={() => openPost(post)}
                      style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>

                      {/* Cover */}
                      {post.coverImage ? (
                        <img src={post.coverImage} alt={post.title}
                          style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                      ) : null}
                      <div style={{ width: '100%', height: 160, background: `linear-gradient(135deg,${c1},${c2})`, alignItems: 'center', justifyContent: 'center', display: post.coverImage ? 'none' : 'flex' }}>
                        <BookOpen size={36} color="#fff" opacity={0.5} />
                      </div>

                      {/* Body */}
                      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: T, marginBottom: 4 }}>{post.category}</span>
                        <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', lineHeight: 1.4, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {post.title}
                        </p>
                        {post.doctorId && (
                          <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>
                            Dr. {post.doctorId.name} · {post.doctorId.specialization}
                          </p>
                        )}
                        <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {post.excerpt || post.content?.substring(0, 120)}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTop: '1px solid #F3F4F6', fontSize: 11, color: '#9CA3AF' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Calendar size={11} /> {fmtDate(post.publishedAt || post.createdAt)}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: T, fontWeight: 600 }}>
                            Read <ChevronRight size={12} />
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
