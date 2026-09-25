import { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { doctorAPI, queueAPI, searchAPI, organizationAPI, appointmentAPI } from '../../services/api';
import { logout } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import {
  ChevronLeft, Search, Heart, Activity, Star, SearchX, MapPin, Stethoscope,
  Eye, Smile, Thermometer, Layers, Shield, Zap, SlidersHorizontal, ChevronDown,
  Building2, Phone, Globe,
} from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { NotificationBell } from '../../components/NotificationBell';
import { LocationPicker } from '../../components/LocationPicker';

const T = '#0D9488';

const CATEGORIES = [
  { id: 'all',        name: 'All Doctors',       icon: '⭐' },
  { id: 'general',   name: 'General Physician',  icon: null, specializations: ['General Physician'] },
  { id: 'cardio',    name: 'Cardiology',          icon: null, specializations: ['Cardiologist'] },
  { id: 'derma',     name: 'Dermatology',         icon: null, specializations: ['Dermatologist'] },
  { id: 'eye',       name: 'Ophthalmology',       icon: null, specializations: ['Ophthalmologist'] },
  { id: 'dental',    name: 'Dental',              icon: null, specializations: ['Dentist'] },
  { id: 'pediatrics',name: 'Pediatrics',          icon: null, specializations: ['Pediatrician', 'Paediatrician'] },
  { id: 'ortho',     name: 'Orthopedics',         icon: null, specializations: ['Orthopedic', 'Orthopedic Surgeon'] },
  { id: 'neuro',     name: 'Neurology',            icon: null, specializations: ['Neurologist', 'Neurosurgeon'] },
];

const SORT_OPTIONS = [
  { id: 'relevant',   label: 'Most Relevant' },
  { id: 'rating',     label: 'Highest Rated' },
  { id: 'fee_low',    label: 'Price: Low to High' },
  { id: 'fee_high',   label: 'Price: High to Low' },
  { id: 'wait',       label: 'Shortest Wait' },
  { id: 'experience', label: 'Most Experienced' },
];


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
  const [detectedCity, setDetectedCity]   = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationDenied, setLocationDenied]   = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searchType, setSearchType]       = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeTab, setActiveTab]         = useState('doctors');
  const [organizations, setOrganizations] = useState([]);
  const [orgsLoading, setOrgsLoading]     = useState(false);
  const [myAppointments, setMyAppointments] = useState([]);
  const [currentPage, setCurrentPage]     = useState(1);
  const DOCS_PER_PAGE = 12;

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

        const [doctorsResult, queueResult, orgsResult, apptResult] = await Promise.allSettled([
          doctorAPI.getDoctors(),
          queueAPI.getQueueStats(),
<<<<<<< HEAD
          organizationAPI.getOrganizations(),
          user?.role === 'PATIENT' ? appointmentAPI.getAppointments() : Promise.resolve({ data: [] }),
=======
          organizationAPI.getAll(),
>>>>>>> origin/development
        ]);

        if (doctorsResult.status === 'fulfilled') {
          let doctorsList = Array.isArray(doctorsResult.value.data?.doctors) ? doctorsResult.value.data.doctors : [];
          console.log(doctorsList);
          // Safety filter: Remove any REJECTED doctors
          doctorsList = doctorsList.filter(d => d.verificationStatus !== 'REJECTED');
          setDoctors(doctorsList);
        } else {
          setDoctors([]);
          if (doctorsResult.reason?.response?.status !== 401) {
            toast.error('Failed to load doctors');
          }
        }

        setQueueStats(
          queueResult.status === 'fulfilled' ? (queueResult.value.data || {}) : {}
        );

        if (orgsResult.status === 'fulfilled') {
          setOrganizations(orgsResult.value.data?.organizations || []);
        }

        if (apptResult.status === 'fulfilled') {
          const appts = Array.isArray(apptResult.value.data) ? apptResult.value.data : [];
          setMyAppointments(appts.filter(a => a.status !== 'CANCELLED'));
        }
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  useEffect(() => {
    const query = search.trim();

    if (!query) {
      setSearchResults(null);
      setSearchType(null);
      setSearchLoading(false);
      return;
    }

    if (query.length < 3) {
      setSearchResults([]);
      setSearchType(null);
      setSearchLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const res = await searchAPI.search(query);
        let results = res.data.doctors || [];
        results = results.filter(d => d.verificationStatus !== 'REJECTED');
        setSearchResults(results);
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

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setLocationLoading(true);
    setLocationDenied(false);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || null;
          if (city) {
            localStorage.setItem('medi_city', city);
            setDetectedCity(city);
            toast.success(`Showing doctors near ${city}`);
          } else {
            toast.error('Could not determine your city');
          }
        } catch {
          toast.error('Location lookup failed');
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setLocationDenied(true);
        setLocationLoading(false);
        toast.error('Location access denied. Showing all doctors.');
      },
      { timeout: 8000 }
    );
  };

  useEffect(() => {
    const saved = localStorage.getItem('medi_city');
    if (saved) setDetectedCity(saved);
  }, []);

  const filtered = useMemo(() => {
    const base = searchResults !== null ? searchResults : doctors;
    let r = base;
    if (!search.trim() && selectedCategory !== 'all') {
      const cat = CATEGORIES.find(c => c.id === selectedCategory);
      if (cat?.specializations) {
        r = r.filter(d => cat.specializations.includes(d.specialization));
      }
    }
    if (detectedCity && !search.trim()) {
      const cityFiltered = r.filter(d => d.city?.toLowerCase() === detectedCity.toLowerCase());
      if (cityFiltered.length > 0) r = cityFiltered;
    }
    return [...r].sort((a, b) => {
      if (sortBy === 'rating') return (b.averageRating || 0) - (a.averageRating || 0);
      if (sortBy === 'fee_low') return a.consultationFee - b.consultationFee;
      if (sortBy === 'fee_high') return b.consultationFee - a.consultationFee;
      if (sortBy === 'wait') return (queueStats[a._id]?.waiting || 0) - (queueStats[b._id]?.waiting || 0);
      if (sortBy === 'experience') return b.experience - a.experience;
      return 0;
    });
  }, [doctors, searchResults, search, selectedCategory, sortBy, queueStats, detectedCity]);

  const cityFallback = useMemo(() => {
    if (!detectedCity || search.trim()) return false;
    const base = searchResults !== null ? searchResults : doctors;
    return base.filter(d => d.city?.toLowerCase() === detectedCity.toLowerCase()).length === 0;
  }, [detectedCity, doctors, searchResults, search]);

  // Map doctorId → the patient's nearest upcoming/today appointment with that doctor
  const myApptMap = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const map = {};
    for (const a of myAppointments) {
      const dateStr = new Date(a.appointmentDate).toISOString().slice(0, 10);
      if (dateStr < todayStr) continue; // skip past appointments
      const did = a.doctorId?._id || a.doctorId;
      if (!did) continue;
      const existing = map[did];
      if (!existing || dateStr < new Date(existing.appointmentDate).toISOString().slice(0, 10)) {
        map[did] = a;
      }
    }
    return map;
  }, [myAppointments]);

  const fmtTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  const fmtApptDate = (a) => {
    const dateStr = new Date(a.appointmentDate).toISOString().slice(0, 10);
    const todayStr = new Date().toISOString().slice(0, 10);
    if (dateStr === todayStr) return `Today · ${fmtTime(a.appointmentTime)}`;
    const d = new Date(a.appointmentDate);
    return `${d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} · ${fmtTime(a.appointmentTime)}`;
  };

  const availableCities = useMemo(() => {
    const fromDoctors = [...new Set(doctors.map(d => d.city).filter(Boolean))].sort();
    if (detectedCity && !fromDoctors.includes(detectedCity)) return [detectedCity, ...fromDoctors];
    return fromDoctors;
  }, [doctors, detectedCity]);

  const handleLocationSelect = (city) => {
    if (!city) { setDetectedCity(null); localStorage.removeItem('medi_city'); }
    else { localStorage.setItem('medi_city', city); setDetectedCity(city); }
  };

  useEffect(() => { setCurrentPage(1); }, [filtered]);

  const totalPages = Math.ceil(filtered.length / DOCS_PER_PAGE);
  const paginatedDocs = filtered.slice((currentPage - 1) * DOCS_PER_PAGE, currentPage * DOCS_PER_PAGE);

  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
    if (currentPage >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
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
            <span style={S.logoText}>MediQ</span>
          </div>
          {!isMobile && <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginLeft: 8 }}>/ Browse Doctors</span>}

          {!isMobile && (
            <div style={{ marginLeft: 12 }}>
              <LocationPicker
                detectedCity={detectedCity}
                availableCities={availableCities}
                locationLoading={locationLoading}
                onSelect={handleLocationSelect}
                onDetect={requestLocation}
              />
            </div>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {user && <NotificationBell userId={user._id} />}
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
            {isMobile && (
              <LocationPicker
                detectedCity={detectedCity}
                availableCities={availableCities}
                locationLoading={locationLoading}
                onSelect={handleLocationSelect}
                onDetect={requestLocation}
                compact
              />
            )}
            {!isMobile && (
              <div style={{ position: 'relative' }}>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                  style={{ fontSize: 12, fontWeight: 600, color: '#374151', background: '#F5F7FA', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '8px 28px 8px 10px', appearance: 'none', outline: 'none', cursor: 'pointer' }}>
                  {SORT_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
                <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6B7280' }} />
              </div>
            )}
          </div>
        </div>

        {/* Tab switcher: Doctors / Hospitals */}
        <div style={{ background: '#fff', borderTop: '1px solid #F3F4F6', padding: '0 16px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 0 }}>
            {[
              { id: 'doctors', label: 'Doctors', icon: <Stethoscope size={14} style={{ marginRight: 5 }} /> },
              { id: 'hospitals', label: 'Hospitals & Clinics', icon: <Building2 size={14} style={{ marginRight: 5 }} /> },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', padding: '10px 18px', fontWeight: 700, fontSize: 13,
                  background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                  color: activeTab === tab.id ? T : '#6B7280',
                  borderBottom: `3px solid ${activeTab === tab.id ? T : 'transparent'}`,
                  transition: 'all 0.15s',
                }}>
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category pills — only for Doctors tab */}
        {activeTab === 'doctors' && (
        <div style={{ background: '#FAFAFA', borderTop: '1px solid #F3F4F6', padding: '8px 16px', overflowX: 'auto' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', gap: 8 }}>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => {
                setSelected(cat.id);
                setSearch('');
                setSearchResults(null);
                setSearchType(null);
              }}
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
        )}
      </header>

      <div style={S.body}>
        {activeTab === 'hospitals' ? (
          <>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
              <span style={{ fontWeight: 700, color: '#111827' }}>{organizations.length}</span> hospital{organizations.length !== 1 ? 's' : ''} &amp; clinic{organizations.length !== 1 ? 's' : ''} on MediQ
            </p>
            {organizations.length === 0 ? (
              <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: '56px 16px', textAlign: 'center' }}>
                <Building2 size={48} color="#D1D5DB" style={{ margin: '0 auto 16px' }} />
                <p style={{ fontWeight: 700, color: '#111827', marginBottom: 6 }}>No hospitals listed yet</p>
                <p style={{ fontSize: 13, color: '#6B7280' }}>Partner hospitals will appear here</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
                {organizations.map(org => {
                  const orgPath = user ? `/patient/organizations/${org._id}` : `/organizations/${org._id}`;
                  const initials = org.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
                  const typeColors = { HOSPITAL: '#EFF6FF', CLINIC: '#F0FDF4', CHAIN: '#FFF7ED', DIAGNOSTIC_CENTER: '#FDF4FF' };
                  const typeTextColors = { HOSPITAL: '#1D4ED8', CLINIC: '#065F46', CHAIN: '#9A3412', DIAGNOSTIC_CENTER: '#7E22CE' };
                  const typeBg = typeColors[org.type] || '#F3F4F6';
                  const typeText = typeTextColors[org.type] || '#374151';
                  return (
                    <div key={org._id}
                      style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #E5E7EB', overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'box-shadow 0.15s, border-color 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.09)'; e.currentTarget.style.borderColor = '#99F6E4'; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
                      onClick={() => navigate(orgPath)}>
                      <div style={{ height: 6, background: `linear-gradient(90deg,#1D4ED8,${T})` }} />
                      <div style={{ padding: '16px 16px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 12 }}>
                          <div style={{ width: 54, height: 54, background: `linear-gradient(135deg,#1D4ED8,${T})`, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 18, flexShrink: 0 }}>
                            {org.logo ? <img src={org.logo} alt={org.name} style={{ width: 54, height: 54, borderRadius: 14, objectFit: 'cover' }} /> : initials}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontWeight: 800, fontSize: 15, color: '#111827', margin: '0 0 4px', lineHeight: 1.3 }}>{org.name}</p>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: typeBg, color: typeText }}>
                                {org.type?.replace('_', ' ')}
                              </span>
                              {org.city && (
                                <span style={{ fontSize: 11, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 3 }}>
                                  <MapPin size={10} />{org.city}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {org.description && (
                          <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 10, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                            {org.description}
                          </p>
                        )}

                        {org.specialties?.length > 0 && (
                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                            {org.specialties.slice(0, 3).map(s => (
                              <span key={s} style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', background: '#F0FDF4', color: T, borderRadius: 8 }}>{s}</span>
                            ))}
                            {org.specialties.length > 3 && (
                              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', background: '#F3F4F6', color: '#6B7280', borderRadius: 8 }}>+{org.specialties.length - 3}</span>
                            )}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: 8, fontSize: 11, fontWeight: 600, marginBottom: 14 }}>
                          <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '3px 8px', borderRadius: 6 }}>
                            {org.doctorCount ?? 0} doctor{org.doctorCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <div style={{ padding: '0 16px 16px', marginTop: 'auto' }}>
                        <button
                          onClick={e => { e.stopPropagation(); navigate(orgPath); }}
                          style={{ width: '100%', background: 'linear-gradient(135deg,#1D4ED8,#2563EB)', color: '#fff', fontWeight: 700, fontSize: 13, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer' }}>
                          View Doctors
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
                  <span style={{ fontWeight: 700, color: '#111827' }}>{filtered.length}</span> doctor{filtered.length !== 1 ? 's' : ''} available
                  {selectedCategory !== 'all' && <span> in <span style={{ color: T, fontWeight: 600 }}>{CATEGORIES.find(c => c.id === selectedCategory)?.name}</span></span>}
                  {detectedCity && !cityFallback && !search.trim() && <span> near <span style={{ color: T, fontWeight: 600 }}>{detectedCity}</span></span>}
                </p>
                {cityFallback && (
                  <p style={{ fontSize: 12, color: '#D97706', margin: '4px 0 0', fontWeight: 600 }}>
                    No doctors near {detectedCity} — showing all doctors
                  </p>
                )}
              </div>
              {totalPages > 1 && (
                <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>
                  Page {currentPage} of {totalPages}
                </p>
              )}
            </div>

            {filtered.length === 0 ? (
              <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: '56px 16px', textAlign: 'center' }}>
                <SearchX size={48} color="#D1D5DB" style={{ margin: '0 auto 16px' }} />
                <p style={{ fontWeight: 700, color: '#111827', marginBottom: 6 }}>No doctors found</p>
                <p style={{ fontSize: 13, color: '#6B7280' }}>Try adjusting filters or searching differently</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
                {paginatedDocs.map(doc => {
                  const stats = queueStats[doc._id] || { waiting: 0 };
                  const myAppt = myApptMap[doc._id];
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
                          {myAppt ? (
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 20, background: '#F0FDF4', color: '#065F46' }}>
                              Your Appt
                            </span>
                          ) : stats.waiting > 0 ? (
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 20, background: '#F3F4F6', color: '#6B7280' }}>
                              {stats.waiting} in queue
                            </span>
                          ) : null}
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
                        <p style={{ fontSize: 12, color: T, fontWeight: 600, marginBottom: (doc.organization || doc.organizationIds?.length > 0) ? 4 : 10 }}>{doc.specialization}</p>
                        {(doc.organization || doc.organizationIds?.length > 0) && (
                          <p style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Building2 size={11} color="#9CA3AF" />
                            {doc.organizationIds?.[0]?.name || doc.organization}
                          </p>
                        )}
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
                        {myAppt && (
                          <div style={{ display: 'flex', gap: 6, fontSize: 11, fontWeight: 600, marginBottom: 14, flexWrap: 'wrap' }}>
                            <span style={{ background: '#F0FDF4', color: T, padding: '3px 8px', borderRadius: 6 }}>
                              {fmtApptDate(myAppt)}
                            </span>
                            {myAppt.tokenNumber && (
                              <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '3px 8px', borderRadius: 6 }}>
                                Token #{myAppt.tokenNumber}
                              </span>
                            )}
                          </div>
                        )}
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

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 32, flexWrap: 'wrap' }}>
                <button
                  onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={currentPage === 1}
                  style={{ padding: '8px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', background: currentPage === 1 ? '#F9FAFB' : '#fff', color: currentPage === 1 ? '#D1D5DB' : '#374151', fontWeight: 600, fontSize: 13, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>
                  ← Prev
                </button>

                {getPageNumbers().map((pg, idx) =>
                  pg === '...' ? (
                    <span key={`ellipsis-${idx}`} style={{ padding: '8px 4px', color: '#9CA3AF', fontSize: 13 }}>…</span>
                  ) : (
                    <button key={pg}
                      onClick={() => { setCurrentPage(pg); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      style={{
                        width: 36, height: 36, borderRadius: 10, border: '1.5px solid', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                        background: currentPage === pg ? T : '#fff',
                        color: currentPage === pg ? '#fff' : '#374151',
                        borderColor: currentPage === pg ? T : '#E5E7EB',
                      }}>
                      {pg}
                    </button>
                  )
                )}

                <button
                  onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={currentPage === totalPages}
                  style={{ padding: '8px 14px', borderRadius: 10, border: '1.5px solid #E5E7EB', background: currentPage === totalPages ? '#F9FAFB' : '#fff', color: currentPage === totalPages ? '#D1D5DB' : '#374151', fontWeight: 600, fontSize: 13, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
