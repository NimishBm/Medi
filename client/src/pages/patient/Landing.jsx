import { useState, useEffect } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { appointmentAPI, doctorAPI, queueAPI, searchAPI } from '../../services/api';
import {
  Search, Heart, Eye, Smile, Activity, Thermometer, Layers, MapPin,
  CheckCircle, CalendarCheck, Star, ChevronRight,
  Calendar, User, FileText, Users, CreditCard, Stethoscope,
  Zap, Shield, Phone, Clock, ArrowRight, Menu, X as XIcon,
} from 'lucide-react';
import { NotificationBell } from '../../components/NotificationBell';

/* ─── Constants ──────────────────────────────────────────────────────────── */

const SPECIALTIES = [
  { id: 'general',    name: 'General Physician', icon: Activity,    bg: '#E8F5E9', iconColor: '#2E7D32', specializations: ['General Physician'] },
  { id: 'cardio',     name: 'Cardiology',         icon: Heart,       bg: '#FDECEA', iconColor: '#C62828', specializations: ['Cardiologist'] },
  { id: 'derma',      name: 'Dermatology',         icon: Layers,      bg: '#EDE7F6', iconColor: '#6A1B9A', specializations: ['Dermatologist'] },
  { id: 'eye',        name: 'Ophthalmology',       icon: Eye,         bg: '#E3F2FD', iconColor: '#1565C0', specializations: ['Ophthalmologist'] },
  { id: 'dental',     name: 'Dental',              icon: Smile,       bg: '#FFF8E1', iconColor: '#F57F17', specializations: ['Dentist'] },
  { id: 'pediatrics', name: 'Pediatrics',          icon: Thermometer, bg: '#FCE4EC', iconColor: '#AD1457', specializations: ['Pediatrician', 'Paediatrician'] },
  { id: 'ortho',      name: 'Orthopedics',         icon: Shield,      bg: '#E0F7FA', iconColor: '#00695C', specializations: ['Orthopedic', 'Orthopedic Surgeon'] },
  { id: 'neuro',      name: 'Neurology',           icon: Zap,         bg: '#F3E5F5', iconColor: '#7B1FA2', specializations: ['Neurologist', 'Neurosurgeon'] },
];

const QUICK_ACTIONS = [
  { label: 'Book Appointment', sub: 'Find a doctor near you', icon: CalendarCheck, bg: '#E8F5E9', accent: '#2E7D32', route: '/patient/marketplace' },
  { label: 'My Appointments',  sub: 'View & manage bookings',  icon: Calendar,      bg: '#E3F2FD', accent: '#1565C0', route: '/patient/my-appointments' },
  { label: 'Prescriptions',    sub: 'Access your records',     icon: FileText,      bg: '#FFF8E1', accent: '#F57F17', route: '/patient/prescriptions' },
  { label: 'Family Members',   sub: 'Manage family health',    icon: Users,         bg: '#FCE4EC', accent: '#AD1457', route: '/patient/family' },
];

const LOCATIONS = ['Current Location', 'Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai'];

/* ─── Logged-In View ─────────────────────────────────────────────────────── */

const LoggedInView = ({ user, dispatch, navigate, searchInput, setSearchInput, handleSearch }) => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen]             = useState(false);
  const [suggestions, setSuggestions]             = useState([]);
  const [showSuggestions, setShowSuggestions]     = useState(false);
  const [doctors, setDoctors]                     = useState([]);
  const [queueStats, setQueueStats]               = useState({});
  const [upcomingAppt, setUpcomingAppt]           = useState(null);
  const [loadingDoctors, setLoadingDoctors]       = useState(true);
  const [selectedLocation, setSelectedLocation]   = useState('Current Location');

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const cached = sessionStorage.getItem('doctorsCache');
        const cacheTime = sessionStorage.getItem('doctorsCacheTime');
        const now = Date.now();

        if (cached && cacheTime && (now - parseInt(cacheTime)) < 300000) {
          setDoctors(JSON.parse(cached));
          setLoadingDoctors(false);
          return;
        }

        const [doctorsRes, statsRes] = await Promise.allSettled([
          doctorAPI.getDoctors(),
          queueAPI.getQueueStats(),
        ]);

        let doctorsArray = [];
        if (doctorsRes.status === 'fulfilled') {
          const data = doctorsRes.value.data;
          doctorsArray = Array.isArray(data) ? data : (data?.doctors || []);
        }

        const top8 = doctorsArray
          .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
          .slice(0, 8);

        setDoctors(top8);
        sessionStorage.setItem('doctorsCache', JSON.stringify(top8));
        sessionStorage.setItem('doctorsCacheTime', now.toString());
        setQueueStats(statsRes.status === 'fulfilled' ? statsRes.value.data || {} : {});
      } catch { /* silent */ }
      finally { setLoadingDoctors(false); }
    };

    const loadAppt = async () => {
      try {
        const res = await appointmentAPI.getAppointments();
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const next = (res.data || [])
          .filter(a => a.doctorId && a.status === 'BOOKED' && new Date(a.appointmentDate) >= today)
          .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))[0];
        setUpcomingAppt(next || null);
      } catch { /* silent */ }
    };

    loadDoctors();
    loadAppt();
  }, []);

  useEffect(() => {
    if (!searchInput.trim() || searchInput.trim().length < 4) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await searchAPI.suggestions(searchInput.trim());
        setSuggestions(res.data?.suggestions || []);
      } catch { setSuggestions([]); }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const getWait = (d) => {
    const s = queueStats[d._id] || { waiting: 0 };
    return (s.waiting || 0) * (d.averageConsultationTime || 10);
  };

  const visibleDoctors = [...doctors].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));

  return (
    <div className="min-h-screen" style={{ background: '#F5F7FA', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── Top Nav ── */}
      <header style={{ background: '#fff', borderBottom: '1px solid #E8ECF0', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px', height: 60, display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Hamburger — mobile only */}
          {isMobile && (
            <button onClick={() => setSidebarOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#374151', display: 'flex', padding: 4, flexShrink: 0 }}>
              <Menu size={24} />
            </button>
          )}

          {/* Logo */}
          <div onClick={() => navigate('/patient')} style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, cursor: 'pointer' }}>
            <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#0D9488,#0F766E)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stethoscope size={18} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 17, color: '#0D9488', letterSpacing: '-0.3px' }}>ClinicFlow</span>
          </div>

          {/* Location — hidden on mobile */}
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 20, padding: '4px 12px', flexShrink: 0 }}>
              <MapPin size={13} color="#0D9488" />
              <select
                value={selectedLocation}
                onChange={e => setSelectedLocation(e.target.value)}
                style={{ fontSize: 12, fontWeight: 600, color: '#0D9488', background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer' }}
              >
                {LOCATIONS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          )}

          {/* Search — hidden on mobile */}
          {!isMobile && (
            <div style={{ flex: 1, position: 'relative', maxWidth: 440 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', zIndex: 1 }} />
              <input
                type="text" placeholder="Search doctor, symptom, specialty..."
                value={searchInput}
                onChange={e => { setSearchInput(e.target.value); setShowSuggestions(true); }}
                onKeyPress={handleSearch}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                style={{ width: '100%', paddingLeft: 36, paddingRight: 14, paddingTop: 8, paddingBottom: 8, background: '#F5F7FA', border: '1.5px solid #E5E7EB', borderRadius: 24, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
              {showSuggestions && suggestions.length > 0 && (
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 100, overflow: 'hidden' }}>
                  {suggestions.map(s => (
                    <button
                      key={s}
                      onMouseDown={() => {
                        setSearchInput(s);
                        setShowSuggestions(false);
                        navigate('/patient/marketplace', { state: { search: s } });
                      }}
                      style={{ width: '100%', textAlign: 'left', padding: '9px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#111827', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #F3F4F6' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#F0FDF4'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <Search size={12} color="#0D9488" />
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <NotificationBell userId={user?._id} />
            <div onClick={() => navigate('/patient/profile')} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
              <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#0D9488,#0F766E)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{user?.name?.split(' ')[0]}</span>
            </div>
            <button
              onClick={() => dispatch(logout())}
              style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', background: '#F3F4F6', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Secondary Nav — desktop only */}
        {!isMobile && (
          <div style={{ background: '#0D9488' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px', display: 'flex', gap: 2, overflowX: 'auto' }}>
              {['Find Doctors', 'My Appointments', 'Prescriptions', 'Family Health', 'Payments'].map((item, i) => (
                <button
                  key={item}
                  onClick={() => {
                    const routes = ['/patient/marketplace', '/patient/my-appointments', '/patient/prescriptions', '/patient/family', '/patient/payments'];
                    navigate(routes[i]);
                  }}
                  style={{ color: '#fff', fontSize: 13, fontWeight: 500, padding: '9px 16px', background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', opacity: 0.9, flexShrink: 0 }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mobile bottom teal strip */}
        {isMobile && <div style={{ background: '#0D9488', height: 4 }} />}
      </header>

      {/* ── Incomplete Profile Banner ── */}
      {!user?.phone && (
        <div style={{ background: '#FFF7ED', borderBottom: '1px solid #FED7AA' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: '#92400E', flex: 1, minWidth: 200 }}>
              <strong>Complete your profile</strong> — add your phone, date of birth and gender so doctors can serve you better.
            </span>
            <button
              onClick={() => navigate('/patient/complete-profile')}
              style={{ flexShrink: 0, background: '#D97706', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Complete now →
            </button>
          </div>
        </div>
      )}

      {/* ── Mobile Sidebar ── */}
      {isMobile && (
        <>
          {/* Backdrop */}
          {sidebarOpen && (
            <div
              onClick={() => setSidebarOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200 }}
            />
          )}

          {/* Drawer */}
          <div style={{
            position: 'fixed', top: 0, left: 0, height: '100vh', width: 270,
            background: '#fff', zIndex: 201, boxShadow: '4px 0 24px rgba(0,0,0,0.12)',
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.25s ease',
            display: 'flex', flexDirection: 'column',
            fontFamily: 'system-ui,-apple-system,sans-serif',
          }}>
            {/* Sidebar header */}
            <div style={{ background: `linear-gradient(135deg,#0D9488,#0F766E)`, padding: '20px 16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Stethoscope size={16} color="#fff" strokeWidth={2.5} />
                </div>
                <span style={{ fontWeight: 800, fontSize: 16, color: '#fff' }}>ClinicFlow</span>
              </div>
              <button onClick={() => setSidebarOpen(false)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#fff', display: 'flex', padding: 6 }}>
                <XIcon size={18} />
              </button>
            </div>

            {/* User pill */}
            <div style={{ margin: '14px 16px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg,#0D9488,#0F766E)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{user?.name}</p>
                <p style={{ fontSize: 11, color: '#0D9488', fontWeight: 600 }}>Patient</p>
              </div>
            </div>

            {/* Nav links */}
            <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
              {[
                { label: 'Find Doctors',     route: '/patient/marketplace',       icon: Stethoscope },
                { label: 'My Appointments',  route: '/patient/my-appointments',   icon: Calendar },
                { label: 'Prescriptions',    route: '/patient/prescriptions',     icon: FileText },
                { label: 'Family Health',    route: '/patient/family',            icon: Users },
                { label: 'Live Queue',       route: '/patient/queue',             icon: Clock },
                { label: 'Payments',         route: '/patient/payments',          icon: CreditCard },
                { label: 'My Profile',       route: '/patient/profile',           icon: User },
              ].map(({ label, route, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => { setSidebarOpen(false); navigate(route); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid #F3F4F6' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F0FDF4'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <div style={{ width: 34, height: 34, background: '#F0FDF4', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={16} color="#0D9488" />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{label}</span>
                  <ChevronRight size={14} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
                </button>
              ))}
            </nav>

            {/* Logout */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid #F3F4F6' }}>
              <button
                onClick={() => { setSidebarOpen(false); dispatch(logout()); }}
                style={{ width: '100%', padding: '11px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, color: '#DC2626', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                Logout
              </button>
            </div>
          </div>
        </>
      )}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 16px 40px' }}>

        {/* ── Upcoming appointment banner ── */}
        {upcomingAppt && (
          <div style={{ background: 'linear-gradient(135deg,#0D9488,#0F766E)', borderRadius: 14, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <p style={{ color: '#99F6E4', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Upcoming Appointment</p>
              <p style={{ color: '#fff', fontWeight: 800, fontSize: 16, marginBottom: 2 }}>
                Dr. {(upcomingAppt.doctorId?.name || 'Doctor').replace(/^Dr\.?\s+/, '')}
              </p>
              <p style={{ color: '#99F6E4', fontSize: 13 }}>
                {upcomingAppt.doctorId?.specialization} &nbsp;·&nbsp;
                {new Date(upcomingAppt.appointmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} &nbsp;·&nbsp;
                {upcomingAppt.appointmentTime} &nbsp;·&nbsp; Token #{upcomingAppt.tokenNumber}
              </p>
            </div>
            <button
              onClick={() => navigate('/patient/my-appointments')}
              style={{ background: '#fff', color: '#0D9488', fontWeight: 700, fontSize: 13, padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0 }}
            >
              View Details →
            </button>
          </div>
        )}

        {/* ── Greeting row ── */}
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginBottom: 2 }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p style={{ color: '#6B7280', fontSize: 14 }}>How can we help you today?</p>
        </div>

        {/* ── Quick action tiles ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 28 }}>
          {QUICK_ACTIONS.map(({ label, sub, icon: Icon, bg, accent, route }) => (
            <button
              key={route}
              onClick={() => navigate(route)}
              style={{ background: '#fff', border: `1.5px solid ${bg}`, borderRadius: 14, padding: '16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', textAlign: 'left', transition: 'box-shadow 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ width: 44, height: 44, background: bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={22} color={accent} strokeWidth={2} />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 2 }}>{label}</p>
                <p style={{ fontSize: 12, color: '#6B7280' }}>{sub}</p>
              </div>
              <ChevronRight size={16} color="#9CA3AF" style={{ marginLeft: 'auto', flexShrink: 0 }} />
            </button>
          ))}
        </div>

        {/* ── Browse by Specialty ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>Browse by Specialty</h3>
            <button
              onClick={() => navigate('/patient/marketplace')}
              style={{ fontSize: 13, color: '#0D9488', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              View all <ChevronRight size={14} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10 }}>
            {SPECIALTIES.map(s => {
              const Icon = s.icon;
              const isActive = false;
              return (
                <button
                  key={s.id}
                  onClick={() => navigate('/patient/marketplace', { state: { category: s.id } })}
                  style={{
                    background: isActive ? s.bg : '#fff',
                    border: isActive ? `2px solid ${s.iconColor}` : '1.5px solid #E5E7EB',
                    borderRadius: 14, padding: '14px 10px', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <div style={{ width: 44, height: 44, background: s.bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={22} color={s.iconColor} strokeWidth={2} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: isActive ? s.iconColor : '#374151', textAlign: 'center', lineHeight: 1.3 }}>{s.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Doctor Cards ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>
              Top Doctors
            </h3>
            <button
              onClick={() => navigate('/patient/marketplace')}
              style={{ fontSize: 13, color: '#0D9488', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              See all <ChevronRight size={14} />
            </button>
          </div>

          {loadingDoctors ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
              {[...Array(4)].map((_, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1.5px solid #E5E7EB' }}>
                  <div style={{ height: 8, background: '#E5E7EB' }} />
                  <div style={{ padding: 16 }}>
                    <div style={{ width: 44, height: 44, background: '#F3F4F6', borderRadius: '50%', marginBottom: 10 }} />
                    <div style={{ height: 12, background: '#F3F4F6', borderRadius: 6, marginBottom: 6, width: '70%' }} />
                    <div style={{ height: 10, background: '#F3F4F6', borderRadius: 6, width: '50%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : visibleDoctors.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #E5E7EB', padding: '32px 16px', textAlign: 'center' }}>
              <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 8 }}>No doctors found for this specialty.</p>
              <button
                onClick={() => setActiveSpec('all')}
                style={{ color: '#0D9488', fontWeight: 600, fontSize: 14, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Show all doctors
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
              {visibleDoctors.map(doc => {
                const waitMin = getWait(doc);
                const rating = doc.averageRating > 0 ? doc.averageRating.toFixed(1) : null;
                return (
                  <div
                    key={doc._id}
                    onClick={() => navigate(`/patient/doctors/${doc._id}`)}
                    style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #E5E7EB', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.15s, border-color 0.15s', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.09)'; e.currentTarget.style.borderColor = '#99F6E4'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
                  >
                    {/* Top accent strip */}
                    <div style={{ height: 6, background: 'linear-gradient(90deg,#0D9488,#14B8A6)' }} />
                    <div style={{ padding: '14px 14px 0' }}>
                      {/* Avatar + wait badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div style={{ width: 46, height: 46, background: 'linear-gradient(135deg,#0D9488,#0F766E)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 18 }}>
                          {doc.name.replace(/^Dr\.?\s+/, '').charAt(0)}
                        </div>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 20,
                          background: waitMin === 0 ? '#D1FAE5' : waitMin <= 20 ? '#FEF9C3' : '#FEE2E2',
                          color: waitMin === 0 ? '#065F46' : waitMin <= 20 ? '#92400E' : '#991B1B',
                        }}>
                          {waitMin === 0 ? 'Available' : `~${waitMin}m`}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginBottom: 2 }}>
                        <p style={{ fontWeight: 800, fontSize: 14, color: '#111827', lineHeight: 1.3, margin: 0 }}>
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
                      <p style={{ fontSize: 12, color: '#0D9488', fontWeight: 600, marginBottom: 10 }}>{doc.specialization}</p>
                      {/* Stats */}
                      <div style={{ display: 'flex', gap: 10, fontSize: 12, color: '#6B7280', marginBottom: 14, flexWrap: 'wrap' }}>
                        <span>{doc.experience}yr exp</span>
                        <span>·</span>
                        <span>₹{doc.consultationFee}</span>
                        {rating && <>
                          <span>·</span>
                          <span style={{ color: '#F59E0B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Star size={11} fill="#F59E0B" color="#F59E0B" /> {rating}
                          </span>
                        </>}
                      </div>
                    </div>
                    <div style={{ padding: '0 14px 14px', marginTop: 'auto' }}>
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/patient/doctors/${doc._id}/book`); }}
                        style={{ width: '100%', background: '#0D9488', color: '#fff', fontWeight: 700, fontSize: 13, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer' }}
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Browse All CTA ── */}
        <button
          onClick={() => navigate('/patient/marketplace')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', marginTop: 24, background: '#fff', border: '2px solid #0D9488', color: '#0D9488', fontWeight: 700, fontSize: 15, padding: '14px', borderRadius: 14, cursor: 'pointer' }}
        >
          <Search size={18} />
          Browse All Doctors
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

/* ─── Logged-Out Marketing Page ──────────────────────────────────────────── */

const LoggedOutView = ({ navigate, searchInput, setSearchInput, handleSearch, handleSpecialtyClick }) => {
  const isMobile = useIsMobile();
  const [selectedLocation, setSelectedLocation] = useState('Mumbai');

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA', fontFamily: 'system-ui,-apple-system,sans-serif' }}>

      {/* ── Top Nav ── */}
      <header style={{ background: '#fff', borderBottom: '1px solid #E8ECF0', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px', height: 60, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#0D9488,#0F766E)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stethoscope size={18} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 17, color: '#0D9488', letterSpacing: '-0.3px' }}>ClinicFlow</span>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => navigate('/login/patient')}
              style={{ fontSize: 13, fontWeight: 600, color: '#374151', background: 'none', border: '1.5px solid #D1D5DB', borderRadius: 8, padding: '7px 16px', cursor: 'pointer' }}
            >
              Login
            </button>
            <button
              onClick={() => navigate('/register')}
              style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: '#0D9488', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer' }}
            >
              {isMobile ? 'Sign Up' : 'Sign Up Free'}
            </button>
            {!isMobile && (
              <button
                onClick={() => navigate('/login/doctor')}
                style={{ fontSize: 13, fontWeight: 600, color: '#0D9488', background: '#F0FDF4', border: '1.5px solid #99F6E4', borderRadius: 8, padding: '7px 16px', cursor: 'pointer' }}
              >
                For Doctors
              </button>
            )}
          </div>
        </div>

        {/* Nav bar */}
        <div style={{ background: '#0D9488' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px', display: 'flex', gap: 2, overflowX: 'auto' }}>
            {['Find Doctors', 'Book Appointment', 'Live Queue', 'About Us'].map(item => (
              <button
                key={item}
                style={{ color: '#fff', fontSize: 13, fontWeight: 500, padding: '9px 16px', background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', opacity: 0.9, flexShrink: 0 }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{ background: 'linear-gradient(135deg,#0D9488 0%,#0F766E 50%,#115E59 100%)', padding: '52px 16px 56px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ maxWidth: 640 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '5px 14px', marginBottom: 20 }}>
              <CheckCircle size={13} color="#99F6E4" />
              <span style={{ color: '#CCFBF1', fontSize: 12, fontWeight: 600 }}>500+ Verified Doctors · Real-time Queue</span>
            </div>
            <h1 style={{ color: '#fff', fontSize: 'clamp(26px, 5vw, 48px)', fontWeight: 900, lineHeight: 1.15, marginBottom: 14, letterSpacing: '-0.5px' }}>
              Book a Doctor.<br />Skip the Wait.
            </h1>
            <p style={{ color: '#CCFBF1', fontSize: 15, marginBottom: 28, lineHeight: 1.6 }}>
              Search by symptom or specialty. See real-time queue status before you leave home.
            </p>

            {/* Search box */}
            <div style={{ background: '#fff', borderRadius: 16, padding: 12, display: 'flex', gap: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 200 }}>
                <MapPin size={16} color="#0D9488" />
                <select
                  value={selectedLocation}
                  onChange={e => setSelectedLocation(e.target.value)}
                  style={{ fontSize: 13, fontWeight: 600, color: '#374151', background: 'transparent', border: 'none', outline: 'none', cursor: 'pointer', borderRight: '1.5px solid #E5E7EB', paddingRight: 12 }}
                >
                  {LOCATIONS.slice(1).map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div style={{ flex: 3, display: 'flex', alignItems: 'center', gap: 8, minWidth: 220 }}>
                <Search size={16} color="#9CA3AF" />
                <input
                  type="text"
                  placeholder="Search doctor, symptom, specialty..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyPress={handleSearch}
                  style={{ flex: 1, fontSize: 14, border: 'none', outline: 'none', color: '#111827' }}
                />
              </div>
              <button
                onClick={() => {
                  if (searchInput.trim()) handleSearch({ key: 'Enter' });
                  else navigate('/marketplace');
                }}
                style={{ background: '#0D9488', color: '#fff', fontWeight: 700, fontSize: 14, padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0 }}
              >
                Search
              </button>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 18, flexWrap: 'wrap' }}>
              {['General Physician', 'Dermatologist', 'Cardiologist'].map(tag => {
                const tagSpecialty = SPECIALTIES.find(s => s.specializations?.includes(tag));
                return (
                <button
                  key={tag}
                  onClick={() => tagSpecialty && handleSpecialtyClick(tagSpecialty)}
                  style={{ background: 'rgba(255,255,255,0.15)', color: '#CCFBF1', fontSize: 12, fontWeight: 600, padding: '5px 14px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer' }}
                >
                  {tag}
                </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick Action Cards ── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {[
            { label: 'Book Appointment', sub: 'Search & book a doctor near you', icon: CalendarCheck, bg: '#E8F5E9', accent: '#2E7D32', action: () => navigate('/marketplace') },
            { label: 'Live Queue Tracker', sub: 'Check wait time before you go', icon: Clock, bg: '#E0F7FA', accent: '#00695C', action: () => navigate('/marketplace') },
            { label: 'Doctor for Emergency', sub: '24/7 urgent consultations', icon: Zap, bg: '#FDECEA', accent: '#C62828', action: () => navigate('/marketplace') },

            { label: 'Create Account', sub: 'Save history & manage family', icon: Shield, bg: '#F3E5F5', accent: '#6A1B9A', action: () => navigate('/register') },
          ].map(({ label, sub, icon: Icon, bg, accent, action }) => (
            <button
              key={label}
              onClick={action}
              style={{ background: '#fff', border: `1.5px solid ${bg}`, borderRadius: 14, padding: '16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', textAlign: 'left' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ width: 48, height: 48, background: bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={24} color={accent} strokeWidth={2} />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 3 }}>{label}</p>
                <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.4 }}>{sub}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Browse by Specialty ── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px 36px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827' }}>Browse by Health Condition</h2>
          <button
            onClick={() => navigate('/marketplace')}
            style={{ fontSize: 13, color: '#0D9488', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            View all <ChevronRight size={14} />
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
          {SPECIALTIES.map(s => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => handleSpecialtyClick(s)}
                style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 14, padding: '16px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#0D9488'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(13,148,136,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{ width: 48, height: 48, background: s.bg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={24} color={s.iconColor} strokeWidth={2} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', textAlign: 'center', lineHeight: 1.3 }}>{s.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ background: '#fff', padding: '40px 16px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 28, textAlign: 'center' }}>How ClinicFlow Works</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20 }}>
            {[
              { step: '01', icon: Search, title: 'Search', desc: 'Find doctors by symptom, name, or specialty.' },
              { step: '02', icon: CalendarCheck, title: 'Book', desc: 'Pick a date and get instant confirmation.' },
              { step: '03', icon: Clock, title: 'Track Queue', desc: 'See your live position in the queue.' },
              { step: '04', icon: CheckCircle, title: 'Consult', desc: 'Meet the doctor and get prescriptions digitally.' },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} style={{ textAlign: 'center' }}>
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: 14 }}>
                  <div style={{ width: 60, height: 60, background: '#F0FDF4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                    <Icon size={26} color="#0D9488" strokeWidth={2} />
                  </div>
                  <span style={{ position: 'absolute', top: -4, right: -4, background: '#0D9488', color: '#fff', fontSize: 10, fontWeight: 800, width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {step}
                  </span>
                </div>
                <p style={{ fontWeight: 700, fontSize: 15, color: '#111827', marginBottom: 5 }}>{title}</p>
                <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.5 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ background: '#0D9488', padding: '28px 16px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 20, textAlign: 'center' }}>
          {[['500+', 'Verified Doctors'], ['10K+', 'Patients Served'], ['4.8★', 'Average Rating'], ['< 10 min', 'Avg Queue Time']].map(([val, label]) => (
            <div key={label}>
              <p style={{ color: '#fff', fontSize: 'clamp(20px,4vw,32px)', fontWeight: 900, marginBottom: 4 }}>{val}</p>
              <p style={{ color: '#99F6E4', fontSize: 13 }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ background: 'linear-gradient(135deg,#F0FDF4,#E0F7FA)', border: '1.5px solid #99F6E4', borderRadius: 20, padding: '32px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 6 }}>Ready to take charge of your health?</h3>
            <p style={{ color: '#6B7280', fontSize: 14 }}>Join thousands of patients who trust ClinicFlow every day.</p>
          </div>
          <button
            onClick={() => navigate('/register')}
            style={{ background: '#0D9488', color: '#fff', fontWeight: 700, fontSize: 15, padding: '12px 28px', borderRadius: 12, border: 'none', cursor: 'pointer', flexShrink: 0 }}
          >
            Get Started Free →
          </button>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid #E5E7EB', padding: '16px', textAlign: 'center' }}>
        <p style={{ color: '#9CA3AF', fontSize: 12 }}>© 2026 ClinicFlow · All rights reserved.</p>
      </footer>
    </div>
  );
};

/* ─── Root Component ─────────────────────────────────────────────────────── */

export const Landing = () => {
  const user      = useSelector(state => state.auth.user);
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const [searchInput, setSearchInput] = useState('');

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchInput.trim()) {
      const route = user ? '/patient/marketplace' : '/marketplace';
      navigate(route, { state: { search: searchInput } });
    }
  };

  const handleSpecialtyClick = (specialty) => {
  const route = user ? '/patient/marketplace' : '/marketplace';
  navigate(route, { state: { category: specialty.id } });
};

  if (user) {
    return (
      <LoggedInView
        user={user} dispatch={dispatch} navigate={navigate}
        searchInput={searchInput} setSearchInput={setSearchInput}
        handleSearch={handleSearch}
      />
    );
  }

  return (
    <LoggedOutView
      navigate={navigate}
      searchInput={searchInput} setSearchInput={setSearchInput}
      handleSearch={handleSearch}
      handleSpecialtyClick={handleSpecialtyClick}
    />
  );
};
