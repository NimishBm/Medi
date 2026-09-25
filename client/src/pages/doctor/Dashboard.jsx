import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Navigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { useState, useEffect, useRef, useMemo } from 'react';
import toast from 'react-hot-toast';
import { doctorProfileAPI, queueAPI, organizationAPI } from '../../services/api';
import { setUser } from '../../store/slices/authSlice';
import { NotificationBell } from '../../components/NotificationBell';
import { useDoctorNotifications } from '../../hooks/useDoctorNotifications';
import {
  Users,
  Calendar,
  Clock,
  Award,
  Activity,
  Smartphone,
  Heart,
  Shield,
  MapPin,
  Zap,
  ArrowUpRight,
  DollarSign,
  CheckCircle,
  Trash2,
  Edit2,
  Sparkles,
  PenSquare,
  CreditCard,
  Building2,
  Phone,
  Globe,
  BadgeCheck,
  Languages,
  Search,
  Plus,
  X,
  Loader2,
  ExternalLink,
} from 'lucide-react';

const FEATURES = [
  { id: 'appointments', name: 'Appointments', icon: Users, color: 'from-teal-400 to-teal-600', path: '/doctor/appointments', desc: 'View all patient appointments' },
  { id: 'schedule', name: 'Smart Scheduling', icon: Calendar, color: 'from-emerald-400 to-emerald-600', path: '/doctor/schedule', desc: 'Manage your availability & slots' },
  { id: 'queue', name: 'Live Queue', icon: Clock, color: 'from-orange-400 to-orange-500', path: '/doctor/queue', desc: 'Real-time patient queue' },
  { id: 'patients', name: 'Patient Care', icon: Users, color: 'from-green-400 to-green-600', path: '/doctor/patients', desc: 'View all registered patients' },
  { id: 'payments', name: 'Payment History', icon: CreditCard, color: 'from-blue-500 to-cyan-600', path: '/doctor/payments', desc: 'View all payments done by patients' },
  { id: 'blog', name: 'My Blog', icon: PenSquare, color: 'from-purple-400 to-purple-600', path: '/doctor/blog', desc: 'Write & manage health blog posts' },
];

const LOCATIONS = ['Current Location', 'Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad'];

const ORG_TYPE_BADGE = {
  HOSPITAL: 'bg-blue-100 text-blue-700',
  CLINIC: 'bg-teal-100 text-teal-700',
  CHAIN: 'bg-violet-100 text-violet-700',
  DIAGNOSTIC_CENTER: 'bg-orange-100 text-orange-700',
};
const ORG_TYPE_LABELS = {
  HOSPITAL: 'Hospital', CLINIC: 'Clinic', CHAIN: 'Hospital Chain', DIAGNOSTIC_CENTER: 'Diagnostic Center',
};

/* ── Mini organization section for Dashboard profile card ── */
const OrganizationMini = ({ navigate }) => {
  const [myOrgs, setMyOrgs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [joiningId, setJoiningId] = useState(null);
  const [leavingId, setLeavingId] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    organizationAPI.getMyOrganizations()
      .then(r => setMyOrgs(r.data.organizations || []))
      .catch(() => setMyOrgs([]))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!searchQuery.trim() || searchQuery.trim().length < 2) { setSearchResults([]); return; }
    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try { const r = await organizationAPI.searchOrganizations(searchQuery.trim()); setSearchResults(r.data.organizations || []); }
      catch { setSearchResults([]); } finally { setIsSearching(false); }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery]);

  const handleJoin = async org => {
    setJoiningId(org._id);
    try {
      await organizationAPI.joinOrganization(org._id);
      setMyOrgs(p => [...p, org]);
      setSearchQuery(''); setSearchResults([]); setShowSearch(false);
      toast.success(`Joined ${org.name}`);
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to join'); }
    finally { setJoiningId(null); }
  };

  const handleLeave = async (id, name) => {
    setLeavingId(id);
    try {
      await organizationAPI.leaveOrganization(id);
      setMyOrgs(p => p.filter(o => o._id !== id));
      toast.success(`Left ${name}`);
    } catch (e) { toast.error(e.response?.data?.message || 'Failed to leave'); }
    finally { setLeavingId(null); }
  };

  const joined = id => myOrgs.some(o => o._id === id);

  return (
    <div className="border-t border-teal-100 pt-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Building2 size={12} /> Organizations
        </p>
        <button
          type="button"
          onClick={() => setShowSearch(s => !s)}
          className="flex items-center gap-1 text-[11px] px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-md font-semibold transition"
        >
          {showSearch ? <X size={11} /> : <Plus size={11} />}
          {showSearch ? 'Cancel' : 'Add'}
        </button>
      </div>

      {/* Search panel */}
      {showSearch && (
        <div className="mb-3 space-y-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search hospital / clinic…"
              className="w-full pl-8 pr-8 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder-gray-300 transition"
            />
            {isSearching && <Loader2 size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />}
          </div>
          {searchResults.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white max-h-44 overflow-y-auto">
              {searchResults.map(org => {
                const isJoined = joined(org._id);
                return (
                  <div key={org._id} className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 text-xs truncate">{org.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {org.type && <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${ORG_TYPE_BADGE[org.type] || 'bg-gray-100 text-gray-600'}`}>{ORG_TYPE_LABELS[org.type] || org.type}</span>}
                        {org.city && <span className="text-[10px] text-gray-400">{org.city}</span>}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => !isJoined && handleJoin(org)}
                      disabled={isJoined || joiningId === org._id}
                      className={`flex-shrink-0 flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg font-semibold transition ${isJoined ? 'bg-green-50 text-green-600 cursor-default' : 'bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50'}`}
                    >
                      {joiningId === org._id ? <Loader2 size={11} className="animate-spin" /> : isJoined ? <><CheckCircle size={11} /> Joined</> : <><Plus size={11} /> Join</>}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {searchQuery.trim().length >= 2 && !isSearching && !searchResults.length && (
            <p className="text-[11px] text-gray-400 text-center py-2">No results for "{searchQuery}"</p>
          )}
        </div>
      )}

      {/* Orgs list */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-2 text-gray-400 text-xs"><Loader2 size={13} className="animate-spin" /> Loading…</div>
      ) : myOrgs.length === 0 ? (
        <div className="text-center py-4">
          <Building2 size={24} className="mx-auto text-gray-300 mb-1" />
          <p className="text-[11px] text-gray-400">No affiliations yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {myOrgs.map(org => (
            <div key={org._id} className="flex items-center gap-2.5 p-2.5 bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-100 rounded-lg group">
              <div className="w-8 h-8 rounded-lg bg-white shadow-sm border border-blue-100 flex items-center justify-center flex-shrink-0">
                {org.logo ? <img src={org.logo} alt={org.name} className="w-6 h-6 object-contain rounded" /> : <Building2 size={15} className="text-blue-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-xs truncate leading-tight">{org.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {org.type && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${ORG_TYPE_BADGE[org.type] || 'bg-gray-100 text-gray-600'}`}>{ORG_TYPE_LABELS[org.type] || org.type}</span>}
                  {org.city && <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><MapPin size={8} />{org.city}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                {org.website && <a href={org.website} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-600"><ExternalLink size={12} /></a>}
                <button type="button" onClick={() => handleLeave(org._id, org.name)} disabled={leavingId === org._id}
                  className="text-red-400 hover:text-red-600 disabled:opacity-50">
                  {leavingId === org._id ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Defined outside the component so its reference is stable across parent re-renders.
// Defining it inside DoctorDashboard would cause React to treat it as a new component
// type on every render, unmounting and remounting every StatCard instance.
const StatCard = ({ icon: Icon, label, value, color, trend, subtext, delay = 0, isAnimated }) => (
  <div
    className={`bg-white rounded-lg border border-teal-200 p-4 hover:shadow-md hover:scale-102 transition-all duration-300 transform ${
      isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
    }`}
    style={{ transitionDelay: `${delay}ms` }}
  >
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 bg-${color}-100 rounded-lg flex items-center justify-center`}>
        <Icon className={`text-${color}-600`} size={20} />
      </div>
      {trend && <div className="flex items-center gap-1 text-green-600 text-xs font-semibold animate-pulse">
        <ArrowUpRight size={14} /> {trend}%
      </div>}
    </div>
    <p className="text-gray-600 text-xs mb-1">{label}</p>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
  </div>
);

export const DoctorDashboard = () => {
  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  useDoctorNotifications(user?._id);
  const [isAnimated, setIsAnimated] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const [patientsSeen, setPatientsSeen] = useState(0);

  // All hooks must be called unconditionally before any conditional return
  useEffect(() => {
    setIsAnimated(true);
  }, []);

  useEffect(() => {
    // Only fetch when a valid doctor is logged in
    if (!user?._id) return;

    // Fetch today's queue to get the live patients-seen count
    const fetchPatientsSeen = async () => {
      try {
        const res = await queueAPI.getQueueByDoctorId(user._id);
        setPatientsSeen(res.data.stats?.completed || 0);
      } catch {
        // Silently fail — not critical
      }
    };

    fetchPatientsSeen();
    // Refresh every 30 seconds while the doctor is on the dashboard
    const interval = setInterval(fetchPatientsSeen, 30000);
    return () => clearInterval(interval);
  }, [user?._id]);

  // Guard: if not logged in as DOCTOR, redirect — placed after all hooks
  if (!user || user.role !== 'DOCTOR') {
    return <Navigate to="/login/doctor" replace />;
  }

  const profilePhotoUrl = useMemo(() => {
    if (!user?.profilePhoto) return null;
    if (user.profilePhoto.startsWith('http')) return user.profilePhoto;
    if (user.profilePhoto.startsWith('/')) return user.profilePhoto;
    return user.profilePhoto;
  }, [user?.profilePhoto]);

  const getWorkingDays = () => {
    if (!user?.availability) return 0;
    return Object.values(user.availability).filter(day => day?.start && day?.end).length;
  };

  const handleDeletePhoto = async () => {
    if (!window.confirm('Are you sure you want to delete your profile photo?')) return;

    setIsDeletingPhoto(true);
    try {
      const response = await doctorProfileAPI.updateMe({ profilePhoto: null });
      dispatch(
        setUser({
          user: response.data,
          token,
        })
      );
      toast.success('Profile photo deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete photo');
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#1E3A5F] border-b border-[#2D4F7C] shadow-lg animate-fade-in">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 sm:w-10 h-9 sm:h-10 bg-[#0D9488] rounded-lg flex items-center justify-center hover:shadow-lg transition-shadow">
              <Heart className="text-white" size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white">MediQ</h1>
              <p className="text-xs text-teal-300 hidden sm:block">Doctor Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate('/doctor/profile')}
              className="flex items-center gap-2 bg-white/10 px-2 sm:px-4 py-2 rounded-full hover:bg-white/20 transition cursor-pointer"
            >
              <div className="w-7 sm:w-8 h-7 sm:h-8 bg-[#0D9488] rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs sm:text-sm font-medium text-white hidden sm:inline">{user?.name?.split(' ')[0]}</span>
            </button>
            <NotificationBell />
            <button
              onClick={() => dispatch(logout())}
              className="text-slate-300 hover:text-red-400 font-medium text-xs sm:text-sm px-2 sm:px-4 py-2 rounded-lg hover:bg-white/10 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Welcome Section */}
      <section className="relative text-white pt-6 sm:pt-8 pb-16 sm:pb-24 overflow-hidden" style={{ minHeight: '280px', background: 'linear-gradient(145deg,#1E3A5F,#0F2944,#0D9488)' }}>
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-5 w-20 h-20 bg-white rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-emerald-200 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-teal-200 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Wave SVG Animation */}
        <svg className="absolute bottom-0 left-0 w-full h-auto" viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ height: '120px' }}>
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(13, 148, 136, 0.3)" />
              <stop offset="100%" stopColor="rgba(16, 185, 129, 0.2)" />
            </linearGradient>
          </defs>
          <path
            d="M0,40 Q300,80 600,40 T1200,40 L1200,120 L0,120 Z"
            fill="url(#waveGradient)"
            className="animate-bounce"
            style={{ animationDuration: '3s' }}
          />
          <path
            d="M0,60 Q300,100 600,60 T1200,60 L1200,120 L0,120 Z"
            fill="rgba(16, 185, 129, 0.1)"
            className="animate-bounce"
            style={{ animationDuration: '4s', animationDelay: '0.5s' }}
          />
        </svg>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/30">
                  <Sparkles size={16} className="text-yellow-300 animate-spin" style={{ animationDuration: '3s' }} />
                  <span className="text-xs sm:text-sm font-semibold text-white">Welcome Back!</span>
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 break-words leading-tight">
                Welcome, <span className="bg-gradient-to-r from-yellow-200 to-white bg-clip-text text-transparent">{user?.name}</span>
              </h2>
              <div className="flex items-center gap-2 text-teal-50 text-sm sm:text-base">
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <p>Here's an overview of your practice</p>
              </div>
            </div>

            {/* Floating Icons */}
            <div className="hidden md:flex flex-col items-end gap-2">
              <div className="text-right">
                <p className="text-teal-100 text-xs font-semibold opacity-75">Last updated</p>
                <p className="text-white text-sm font-semibold">Today at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div className="flex gap-2 mt-3">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-110 cursor-pointer">
                  <Calendar size={20} className="text-teal-100" />
                </div>
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-110 cursor-pointer">
                  <Users size={20} className="text-teal-100" />
                </div>
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-110 cursor-pointer">
                  <Activity size={20} className="text-teal-100" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            icon={Calendar}
            label="Working Days"
            value={getWorkingDays()}
            color="teal"
            subtext="Per week"
            delay={0}
            isAnimated={isAnimated}
          />
          <StatCard
            icon={DollarSign}
            label="Consultation Fee"
            value={`₹${user?.consultationFee || 500}`}
            color="green"
            subtext="Standard rate"
            delay={100}
            isAnimated={isAnimated}
          />
          <StatCard
            icon={Users}
            label="Patients Seen"
            value={patientsSeen}
            color="emerald"
            subtext="Today"
            delay={200}
            isAnimated={isAnimated}
          />
          <StatCard
            icon={Clock}
            label="Avg Wait Time"
            value={`${user?.waitingTime || 30}m`}
            color="orange"
            subtext="Minutes"
            delay={300}
            isAnimated={isAnimated}
          />
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            {/* Profile Card — rich redesign */}
            <div className="bg-white rounded-xl border border-teal-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in" style={{ animationDelay: '300ms' }}>

              {/* Hero banner + avatar */}
              <div className="relative h-24 bg-gradient-to-br from-[#1E3A5F] via-[#0F4C75] to-[#0D9488]">
                {/* Decorative blobs */}
                <div className="absolute top-2 right-4 w-14 h-14 bg-white/10 rounded-full blur-xl" />
                <div className="absolute bottom-0 left-8 w-10 h-10 bg-teal-300/20 rounded-full blur-lg" />

                {/* Status badge */}
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full border border-white/30">
                  <span className={`w-1.5 h-1.5 rounded-full ${user?.isActive !== false ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
                  <span className="text-[10px] font-semibold text-white">{user?.isActive !== false ? 'Active' : 'Inactive'}</span>
                </div>

                {/* Verification badge */}
                {(user?.verificationStatus === 'VERIFIED' || user?.licenseVerified) && (
                  <div className="absolute top-3 left-3 flex items-center gap-1 bg-blue-500/30 backdrop-blur-sm px-2 py-0.5 rounded-full border border-blue-300/30">
                    <BadgeCheck size={10} className="text-blue-200" />
                    <span className="text-[10px] font-semibold text-blue-100">Verified</span>
                  </div>
                )}

                {/* Avatar */}
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                  <div className="relative">
                    {user?.profilePhoto ? (
                      <img
                        key={user?.profilePhoto}
                        src={profilePhotoUrl}
                        alt={user.name}
                        className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-white shadow-lg">
                        {user?.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {user?.profilePhoto && (
                      <button
                        onClick={handleDeletePhoto}
                        disabled={isDeletingPhoto}
                        className="absolute -bottom-1 -right-1 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-lg transition disabled:opacity-50"
                        title="Delete photo"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Name + specialization */}
              <div className="pt-12 pb-4 px-5 text-center border-b border-teal-50">
                <h3 className="text-base font-bold text-gray-900 leading-tight">{user?.name}</h3>
                <p className="text-xs text-teal-600 font-semibold mt-0.5">{user?.specialization || 'Specialist'}</p>
                {user?.hospital && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
                    <Building2 size={11} className="text-gray-400" />{user.hospital}
                  </p>
                )}
                {(user?.city || user?.state) && (
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center justify-center gap-1">
                    <MapPin size={11} />{[user.city, user.state].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>

              {/* Quick stats row */}
              <div className="grid grid-cols-3 divide-x divide-teal-100 border-b border-teal-100">
                <div className="py-3 text-center">
                  <p className="text-sm font-bold text-gray-900">{user?.experience || '—'}</p>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">Yrs Exp</p>
                </div>
                <div className="py-3 text-center">
                  <p className="text-sm font-bold text-gray-900">
                    {user?.averageRating ? user.averageRating.toFixed(1) : user?.rating ? Number(user.rating).toFixed(1) : '—'}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">Rating</p>
                </div>
                <div className="py-3 text-center">
                  <p className="text-sm font-bold text-gray-900">₹{user?.consultationFee || '—'}</p>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">Fee</p>
                </div>
              </div>

              {/* Detail rows */}
              <div className="px-5 py-4 space-y-3">

                {/* Qualifications */}
                {user?.qualifications?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Award size={10} /> Qualifications
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {user.qualifications.map((q, i) => (
                        <span key={i} className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded-md ring-1 ring-teal-200">{q}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Languages */}
                {user?.languages?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Languages size={10} /> Languages
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {user.languages.map((l, i) => (
                        <span key={i} className="bg-purple-50 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-md ring-1 ring-purple-200">{l}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Consultation types */}
                {(user?.onlineConsultation || user?.emergencyConsultation) && (
                  <div className="flex flex-wrap gap-1.5">
                    {user.onlineConsultation && (
                      <span className="flex items-center gap-1 text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded-md ring-1 ring-green-200 font-semibold">
                        <CheckCircle size={10} /> Online
                      </span>
                    )}
                    {user.emergencyConsultation && (
                      <span className="flex items-center gap-1 text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded-md ring-1 ring-red-200 font-semibold">
                        <Zap size={10} /> Emergency
                      </span>
                    )}
                  </div>
                )}

                {/* Contact row */}
                {(user?.phone || user?.website) && (
                  <div className="flex flex-wrap gap-3">
                    {user.phone && (
                      <span className="flex items-center gap-1 text-[11px] text-gray-500">
                        <Phone size={11} className="text-gray-400" />{user.phone}
                      </span>
                    )}
                    {user.website && (
                      <a href={user.website} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-700 transition">
                        <Globe size={11} />{user.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </div>
                )}

                {/* Registration number */}
                {user?.registrationNumber && (
                  <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                    <Shield size={13} className="text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase">Reg. No.</p>
                      <p className="text-xs text-gray-700 font-mono font-semibold truncate">{user.registrationNumber}</p>
                    </div>
                  </div>
                )}

                {/* About me snippet */}
                {user?.aboutMe && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">About</p>
                    <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{user.aboutMe}</p>
                  </div>
                )}

                {/* Organizations */}
                <OrganizationMini navigate={navigate} />
              </div>

              {/* Edit button */}
              <div className="px-5 pb-5">
                <button
                  onClick={() => navigate('/doctor/profile')}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-lg font-semibold text-sm hover:from-teal-700 hover:to-teal-600 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Edit2 size={15} />
                  Edit Full Profile
                </button>
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-2">
            {/* Features Grid */}
            <div className="mb-8 animate-fade-in" style={{ animationDelay: '500ms' }}>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Practice Tools</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {FEATURES.map((feature, idx) => {
                  const IconComponent = feature.icon;
                  return (
                    <button
                      key={feature.id}
                      onClick={() => navigate(feature.path)}
                      className="group bg-white border-2 border-teal-200 hover:border-teal-400 rounded-lg p-4 sm:p-6 transition-all duration-300 hover:shadow-lg hover:scale-105 hover:-translate-y-1 text-left transform"
                      style={{
                        animation: isAnimated ? `slideUp 0.5s ease-out ${300 + idx * 100}ms both` : 'none'
                      }}
                    >
                      <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform duration-300`}>
                        <IconComponent size={24} className="text-white" strokeWidth={2} />
                      </div>
                      <h4 className="font-bold text-gray-900 mb-1">{feature.name}</h4>
                      <p className="text-xs text-gray-600">{feature.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* Services Section */}
      <section className="bg-white border-t border-teal-200 py-4 sm:py-6 animate-fade-in" style={{ animationDelay: '700ms' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Consultation Services</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-teal-50 rounded-lg p-4 border border-teal-200 hover:shadow-md hover:scale-105 transition-all duration-300 transform">
              <div className="flex items-center gap-3 mb-2">
                <Smartphone className="text-teal-600" size={20} />
                <h4 className="font-semibold text-sm sm:text-base text-gray-900">Online Consultation</h4>
              </div>
              <p className="text-sm text-gray-600">
                {user?.onlineConsultation ? '✓ Available' : '✕ Not Available'}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200 hover:shadow-md hover:scale-105 transition-all duration-300 transform">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="text-green-600" size={20} />
                <h4 className="font-semibold text-sm sm:text-base text-gray-900">Emergency Consultation</h4>
              </div>
              <p className="text-sm text-gray-600">
                {user?.emergencyConsultation ? '✓ Available' : '✕ Not Available'}
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200 hover:shadow-md hover:scale-105 transition-all duration-300 transform">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="text-orange-500" size={20} />
                <h4 className="font-semibold text-sm sm:text-base text-gray-900">Duration per Session</h4>
              </div>
              <p className="text-sm text-gray-600">{user?.consultationDuration || 30} minutes</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-4 sm:py-6 border-t border-gray-700 animate-fade-in" style={{ animationDelay: '800ms' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 mb-6 sm:mb-8">
            <div className="text-center sm:text-left">
              <div className="flex items-center gap-2 mb-4 justify-center sm:justify-start hover:text-white transition">
                <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center hover:shadow-lg transition-shadow">
                  <Heart className="text-white" size={18} strokeWidth={2.5} />
                </div>
                <span className="font-bold text-white">MediQ</span>
              </div>
              <p className="text-sm">Managing healthcare efficiently.</p>
            </div>
            <div className="text-center">
              <h4 className="font-semibold text-white mb-3">Quick Links</h4>
              <ul className="text-sm space-y-2">
                <li><button onClick={() => navigate('/doctor/appointments')} className="hover:text-white hover:translate-x-1 transition-all duration-200">Appointments</button></li>
                <li><button onClick={() => navigate('/doctor/schedule')} className="hover:text-white hover:translate-x-1 transition-all duration-200">Schedule</button></li>
                <li><button onClick={() => navigate('/doctor/profile')} className="hover:text-white hover:translate-x-1 transition-all duration-200">Profile</button></li>
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
            <p>© 2026 MediQ. All rights reserved.</p>
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

        @keyframes slideIn {
          from {
            transform: translateX(20px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.6s ease-out;
        }

        .animate-slide-up {
          animation: slideUp 0.6s ease-out;
        }

        .animate-slide-in {
          animation: slideIn 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};
