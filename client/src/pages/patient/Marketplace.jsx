import { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { doctorAPI, queueAPI, searchAPI } from '../../services/api';
import { logout } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import {
  ChevronLeft, Search, Heart, Activity, Star, SearchX, MapPin, Stethoscope,
  Eye, Smile, Thermometer, Layers, Shield, Zap, SlidersHorizontal, ChevronDown,
} from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';

const T = '#0D9488';

const CATEGORIES = [
  { id: 'all',        name: 'All Doctors',       icon: '⭐' },
  { id: 'general',   name: 'General Physician',  icon: null, specialization: 'General Physician' },
  { id: 'cardio',    name: 'Cardiology',          icon: null, specialization: 'Cardiologist' },
  { id: 'derma',     name: 'Dermatology',         icon: null, specialization: 'Dermatologist' },
  { id: 'eye',       name: 'Ophthalmology',       icon: null, specialization: 'Ophthalmologist' },
  { id: 'dental',    name: 'Dental',              icon: null, specialization: 'Dentist' },
  { id: 'pediatrics',name: 'Pediatrics',          icon: null, specialization: 'Pediatrician' },
];

const SORT_OPTIONS = [
  { id: 'relevant',   label: 'Most Relevant' },
  { id: 'rating',     label: 'Highest Rated' },
  { id: 'fee_low',    label: 'Price: Low to High' },
  { id: 'fee_high',   label: 'Price: High to Low' },
  { id: 'wait',       label: 'Shortest Wait' },
  { id: 'experience', label: 'Most Experienced' },
];


const LOCATIONS = ['Current Location', 'Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad'];

const S = {
  page: { minHeight: '100vh', background: '#F5F7FA', fontFamily: 'system-ui,-apple-system,sans-serif' },
  header: { background: '#fff', borderBottom: '1px solid #E8ECF0', position: 'sticky', top: 0, zIndex: 50 },
  headerInner: { maxWidth: 1100, margin: '0 auto', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', gap: 10 },
  logo: { width: 32, height: 32, background: `linear-gradient(135deg,${T},#0F766E)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontWeight: 800, fontSize: 16, color: T, letterSpacing: '-0.3px' },
  navBar: { background: T },
  navBarInner: { maxWidth: 1100, margin: '0 auto', padding: '0 16px', display: 'flex', gap: 2, overflowX: 'auto' },
  body: { maxWidth: 1100, margin: '0 auto', padding: '20px 16px 48px' },
};

export const Marketplace = () => {
  const isMobile = useIsMobile();
  const user = useSelector(s => s.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [doctors, setDoctors]             = useState([]);
  const [queueStats, setQueueStats]       = useState({});
  const [search, setSearch]               = useState(location.state?.search || '');
  const [selectedCategory, setSelected]  = useState('all');
  const [sortBy, setSortBy]               = useState('relevant');
  const [loading, setLoading]             = useState(true);
  const [selectedLocation, setLocation]  = useState('Current Location');
  const [searchResults, setSearchResults] = useState(null);
  const [searchType, setSearchType]       = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (location.state?.category) {
      setSelected(location.state.category);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (location.state?.search) setSearch(location.state.search);
  }, [location.state]);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await doctorAPI.getDoctors();
        setDoctors(res.data);
        const map = {};
        for (const d of res.data) {
          try {
            const q = await queueAPI.getQueueByDoctorId(d._id);
            map[d._id] = q.data;
          } catch { map[d._id] = { waiting: 0 }; }
        }
        setQueueStats(map);
      } catch (e) {
        if (e.response?.status !== 401) toast.error('Failed to load doctors');
      } finally { setLoading(false); }
    };
    fetch();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults(null);
      setSearchType(null);
      return;
    }
    if (!search.trim()) return;
    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const res = await searchAPI.search(search.trim());
        setSearchResults(res.data.doctors || []);
        setSearchType(res.data.searchType || null);
      } catch {
        setSearchResults(null);
        setSearchType(null);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const filtered = useMemo(() => {
    const base = searchResults !== null ? searchResults : doctors;
    let r = base;
    if (!search.trim() && selectedCategory !== 'all') {
      const cat = CATEGORIES.find(c => c.id === selectedCategory);
      r = cat?.specialization
        ? r.filter(d => d.specialization === cat.specialization)
        : r.filter(d => d.specialization === selectedCategory);
    }
    return [...r].sort((a, b) => {
      const wA = (queueStats[a._id]?.waiting || 0) * (a.averageConsultationTime || 10);
      const wB = (queueStats[b._id]?.waiting || 0) * (b.averageConsultationTime || 10);
      if (sortBy === 'rating') return (b.averageRating || 0) - (a.averageRating || 0);
      if (sortBy === 'fee_low') return a.consultationFee - b.consultationFee;
      if (sortBy === 'fee_high') return b.consultationFee - a.consultationFee;
      if (sortBy === 'wait') return wA - wB;
      if (sortBy === 'experience') return b.experience - a.experience;
      return 0;
    });
  }, [doctors, searchResults, search, selectedCategory, sortBy, queueStats]);

  const getWait = id => {
    const s = queueStats[id] || { waiting: 0 };
    return (s.waiting || 0) * (doctors.find(d => d._id === id)?.averageConsultationTime || 10);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F5F7FA' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: `4px solid ${T}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#374151', fontWeight: 600 }}>Loading doctors...</p>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      {/* Header */}
      <header style={S.header}>
        <div style={S.headerInner}>
          <button onClick={() => navigate(user ? '/patient' : '/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#6B7280', display: 'flex' }}>
            <ChevronLeft size={22} />
          </button>
          <div onClick={() => navigate(user ? '/patient' : '/')} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <div style={S.logo}><Stethoscope size={16} color="#fff" strokeWidth={2.5} /></div>
            <span style={S.logoText}>ClinicFlow</span>
          </div>
          {!isMobile && <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginLeft: 8 }}>/ Browse Doctors</span>}

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 20, padding: '4px 10px', marginLeft: 12 }}>
            <MapPin size={12} color={T} />
            <select value={selectedLocation} onChange={e => setLocation(e.target.value)}
              style={{ fontSize: 12, fontWeight: 600, color: T, background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer' }}>
              {LOCATIONS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {user ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F3F4F6', padding: '5px 10px', borderRadius: 20 }}>
                  <div style={{ width: 24, height: 24, background: T, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12 }}>
                    {user.name?.charAt(0)}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{user.name?.split(' ')[0]}</span>
                </div>
                <button onClick={() => dispatch(logout())} style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>Logout</button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/login/patient')} style={{ fontSize: 12, fontWeight: 600, color: '#374151', background: 'none', border: '1.5px solid #D1D5DB', borderRadius: 8, padding: '5px 12px', cursor: 'pointer' }}>Login</button>
                <button onClick={() => navigate('/login/doctor')} style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: T, border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer' }}>For Doctors</button>
              </>
            )}
          </div>
        </div>

        {/* Search + filter bar */}
        <div style={{ background: '#fff', borderTop: '1px solid #F3F4F6', padding: '10px 16px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input type="text" placeholder="Search doctors, symptoms, specialties..."
                value={search} onChange={e => { setSearch(e.target.value); if (!e.target.value.trim()) { setSearchResults(null); setSearchType(null); } }}
                style={{ width: '100%', paddingLeft: 36, paddingRight: searchLoading ? 80 : 14, paddingTop: 9, paddingBottom: 9, background: '#F5F7FA', border: '1.5px solid #E5E7EB', borderRadius: 24, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              {searchLoading && (
                <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: T, fontWeight: 600 }}>Searching…</span>
              )}
              {searchType === 'symptom' && search.trim() && !searchLoading && (
                <div style={{ position: 'absolute', left: 12, top: 'calc(100% + 4px)', fontSize: 11, color: T, fontWeight: 600, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '3px 10px', whiteSpace: 'nowrap' }}>
                  Showing doctors for symptom: {search}
                </div>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                style={{ fontSize: 12, fontWeight: 600, color: '#374151', background: '#F5F7FA', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '8px 28px 8px 10px', appearance: 'none', outline: 'none', cursor: 'pointer' }}>
                {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
              <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6B7280' }} />
            </div>
          </div>
        </div>

        {/* Category pills */}
        <div style={{ background: '#FAFAFA', borderTop: '1px solid #F3F4F6', padding: '8px 16px', overflowX: 'auto' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 8 }}>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setSelected(cat.id)}
                style={{
                  fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 20, whiteSpace: 'nowrap', cursor: 'pointer', transition: 'all 0.15s',
                  background: selectedCategory === cat.id ? T : '#fff',
                  color: selectedCategory === cat.id ? '#fff' : '#374151',
                  border: `1.5px solid ${selectedCategory === cat.id ? T : '#E5E7EB'}`,
                }}>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div style={S.body}>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
          <span style={{ fontWeight: 700, color: '#111827' }}>{filtered.length}</span> doctor{filtered.length !== 1 ? 's' : ''} available
          {selectedCategory !== 'all' && <span> in <span style={{ color: T, fontWeight: 600 }}>{CATEGORIES.find(c => c.id === selectedCategory)?.name}</span></span>}
        </p>

        {filtered.length === 0 ? (
          <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: '56px 16px', textAlign: 'center' }}>
            <SearchX size={48} color="#D1D5DB" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontWeight: 700, color: '#111827', marginBottom: 6 }}>No doctors found</p>
            <p style={{ fontSize: 13, color: '#6B7280' }}>Try adjusting filters or searching differently</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
            {filtered.map(doc => {
              const stats = queueStats[doc._id] || { waiting: 0 };
              const wait = getWait(doc._id);
              const rating = doc.averageRating > 0 ? doc.averageRating.toFixed(1) : null;
              return (
                <div key={doc._id}
                  style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #E5E7EB', overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'box-shadow 0.15s, border-color 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.09)'; e.currentTarget.style.borderColor = '#99F6E4'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
                  onClick={() => navigate(user ? `/patient/doctors/${doc._id}` : `/doctors/${doc._id}`)}>
                  {/* Accent strip */}
                  <div style={{ height: 6, background: `linear-gradient(90deg,${T},#14B8A6)` }} />
                  <div style={{ padding: '14px 16px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div style={{ width: 50, height: 50, background: `linear-gradient(135deg,${T},#0F766E)`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 20 }}>
                        {doc.name.charAt(0)}
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 20,
                        background: wait === 0 ? '#D1FAE5' : wait <= 20 ? '#FEF9C3' : '#FEE2E2',
                        color: wait === 0 ? '#065F46' : wait <= 20 ? '#92400E' : '#991B1B',
                      }}>
                        {wait === 0 ? 'Available' : `~${wait}m wait`}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginBottom: 2 }}>
                      <p style={{ fontWeight: 800, fontSize: 15, color: '#111827', lineHeight: 1.3, margin: 0 }}>
                        Dr. {doc.name.replace(/^Dr\.?\s+/, '')}
                      </p>
                      {doc.isVerified && (
                        <div title="Verified Doctor" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, background: '#059669', borderRadius: '50%', flexShrink: 0 }}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
                            <path d="M5 12L10 17L19 8" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: T, fontWeight: 600, marginBottom: 10 }}>{doc.specialization}</p>
                    <div style={{ display: 'flex', gap: 10, fontSize: 12, color: '#6B7280', marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span>{doc.experience}yr</span>
                      <span style={{ color: '#D1D5DB' }}>·</span>
                      <span>₹{doc.consultationFee}</span>
                      {rating && <>
                        <span style={{ color: '#D1D5DB' }}>·</span>
                        <span style={{ color: '#F59E0B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Star size={11} fill="#F59E0B" color="#F59E0B" /> {rating}
                        </span>
                      </>}
                    </div>
                    <div style={{ display: 'flex', gap: 8, fontSize: 11, fontWeight: 600, marginBottom: 14 }}>
                      <span style={{ background: '#F3F4F6', color: '#374151', padding: '3px 8px', borderRadius: 6 }}>{stats.waiting || 0} waiting</span>
                    </div>
                  </div>
                  <div style={{ padding: '0 16px 16px', marginTop: 'auto' }}>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        if (user) navigate(`/patient/doctors/${doc._id}/book`);
                        else { toast.error('Login to book'); navigate('/login/patient'); }
                      }}
                      style={{ width: '100%', background: T, color: '#fff', fontWeight: 700, fontSize: 13, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer' }}>
                      Book Appointment
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
