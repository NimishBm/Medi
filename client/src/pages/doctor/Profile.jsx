import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { doctorProfileAPI, organizationAPI } from '../../services/api';
import { setUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import {
  Heart, LogOut, Plus, X, Edit2, MapPin, Clock, DollarSign, Globe,
  Award, Users, Star, CheckCircle, Camera, Building2,
  Search, Phone, Mail, ExternalLink, Shield, Stethoscope,
  Languages, FlaskConical, Trophy, BadgeCheck, Info, Loader2,
  GraduationCap, ActivitySquare, Syringe, ChevronDown, ChevronUp,
  UserCircle2, LayoutDashboard, Save
} from 'lucide-react';
import { NotificationBell } from '../../components/NotificationBell';
import { useDoctorNotifications } from '../../hooks/useDoctorNotifications';

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const COMMON_QUALIFICATIONS = ['MBBS', 'MD', 'MS', 'DM', 'DNB', 'MCh', 'FRCS', 'MRCP', 'MBA'];

const ORG_TYPE_LABELS = { HOSPITAL: 'Hospital', CLINIC: 'Clinic', CHAIN: 'Hospital Chain', DIAGNOSTIC_CENTER: 'Diagnostic Center' };
const ORG_TYPE_BADGE = { HOSPITAL: 'bg-blue-100 text-blue-700', CLINIC: 'bg-teal-100 text-teal-700', CHAIN: 'bg-violet-100 text-violet-700', DIAGNOSTIC_CENTER: 'bg-orange-100 text-orange-700' };

/* ── Pill chip ── */
const Tag = ({ children, palette, onRemove }) => {
  const p = {
    teal:    'bg-teal-50   text-teal-700   ring-teal-200',
    amber:   'bg-amber-50  text-amber-700  ring-amber-200',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    purple:  'bg-purple-50 text-purple-700 ring-purple-200',
    orange:  'bg-orange-50 text-orange-700 ring-orange-200',
    sky:     'bg-sky-50    text-sky-700    ring-sky-200',
  }[palette] || 'bg-gray-50 text-gray-700 ring-gray-200';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ring-1 ${p}`}>
      {children}
      {onRemove && (
        <button type="button" onClick={onRemove} className="ml-0.5 opacity-60 hover:opacity-100">
          <X size={11} strokeWidth={3} />
        </button>
      )}
    </span>
  );
};

/* ── Field input + label ── */
const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>
    {children}
  </div>
);

const inp = 'w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent placeholder-slate-300 transition';

/* ── Tag adder row ── */
const TagAdder = ({ label, placeholder, value, onChange, onAdd, tags, onRemove, palette, datalistId, datalistItems }) => (
  <Field label={label}>
    <div className="flex gap-2 mb-2">
      <input type="text" value={value} onChange={onChange}
        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), onAdd())}
        placeholder={placeholder} list={datalistId}
        className={inp + ' flex-1'} />
      {datalistId && datalistItems && (
        <datalist id={datalistId}>{datalistItems.map(i => <option key={i} value={i} />)}</datalist>
      )}
      <button type="button" onClick={onAdd}
        className="flex items-center gap-1 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition">
        <Plus size={14} /> Add
      </button>
    </div>
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t, i) => <Tag key={i} palette={palette} onRemove={() => onRemove(i)}>{t}</Tag>)}
    </div>
  </Field>
);

/* ── Collapsible edit section ── */
const EditSection = ({ icon, title, accent, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  const accentMap = { teal: 'text-teal-600 bg-teal-50', blue: 'text-blue-600 bg-blue-50', amber: 'text-amber-600 bg-amber-50', emerald: 'text-emerald-600 bg-emerald-50', purple: 'text-purple-600 bg-purple-50', orange: 'text-orange-600 bg-orange-50' };
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-xs">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition">
        <div className="flex items-center gap-3">
          <span className={`w-7 h-7 rounded-md flex items-center justify-center ${accentMap[accent] || 'text-slate-600 bg-slate-100'}`}>{icon}</span>
          <span className="font-semibold text-slate-800 text-sm">{title}</span>
        </div>
        {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-slate-100">{children}</div>}
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   ORGANIZATION SECTION
══════════════════════════════════════════════════════ */
const OrganizationSection = ({ isEditing }) => {
  const [myOrgs, setMyOrgs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [joiningId, setJoiningId] = useState(null);
  const [leavingId, setLeavingId] = useState(null);
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
      setSearchQuery(''); setSearchResults([]);
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

  /* View mode */
  if (!isEditing) {
    if (isLoading) return (
      <div className="flex items-center gap-2 py-4 text-slate-400 text-sm">
        <Loader2 size={15} className="animate-spin" /> Loading affiliations…
      </div>
    );
    if (!myOrgs.length) return (
      <div className="text-center py-8">
        <Building2 size={32} className="mx-auto text-slate-300 mb-2" />
        <p className="text-sm text-slate-400">No organizations added yet</p>
      </div>
    );
    return (
      <div className="space-y-3">
        {myOrgs.map(org => (
          <div key={org._id} className="flex gap-4 p-4 rounded-xl bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-100 hover:border-blue-200 transition">
            <div className="w-11 h-11 rounded-xl bg-white shadow-sm border border-slate-200 flex items-center justify-center flex-shrink-0">
              {org.logo ? <img src={org.logo} alt={org.name} className="w-9 h-9 object-contain rounded-lg" /> : <Building2 size={20} className="text-blue-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-800 text-sm leading-tight">{org.name}</p>
                  {org.type && <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide mt-0.5 ${ORG_TYPE_BADGE[org.type] || 'bg-slate-100 text-slate-600'}`}>{ORG_TYPE_LABELS[org.type] || org.type}</span>}
                </div>
                {org.website && <a href={org.website} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-600 flex-shrink-0 mt-0.5"><ExternalLink size={13} /></a>}
              </div>
              <div className="flex flex-wrap gap-3 mt-1.5">
                {org.city && <span className="flex items-center gap-1 text-[11px] text-slate-500"><MapPin size={10} />{org.city}</span>}
                {org.phone && <span className="flex items-center gap-1 text-[11px] text-slate-500"><Phone size={10} />{org.phone}</span>}
                {org.email && <span className="flex items-center gap-1 text-[11px] text-slate-500"><Mail size={10} />{org.email}</span>}
              </div>
              {org.description && <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-1">{org.description}</p>}
            </div>
          </div>
        ))}
      </div>
    );
  }

  /* Edit mode */
  return (
    <div className="space-y-4 pt-3">
      {myOrgs.length > 0 && (
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Current Affiliations</p>
          <div className="space-y-2">
            {myOrgs.map(org => (
              <div key={org._id} className="flex items-center justify-between gap-3 px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0"><Building2 size={16} className="text-teal-700" /></div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{org.name}</p>
                    {org.city && <p className="text-[11px] text-slate-400">{org.city}</p>}
                  </div>
                </div>
                <button type="button" onClick={() => handleLeave(org._id, org.name)} disabled={leavingId === org._id}
                  className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50">
                  {leavingId === org._id ? <Loader2 size={11} className="animate-spin" /> : <X size={11} />} Leave
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Search & Join</p>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Type hospital / clinic name…"
            className="w-full pl-9 pr-9 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 placeholder-slate-300 transition" />
          {isSearching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />}
        </div>
        {searchResults.length > 0 && (
          <div className="mt-1.5 border border-slate-200 rounded-lg overflow-hidden shadow-sm bg-white">
            {searchResults.map(org => {
              const isJoined = joined(org._id);
              return (
                <div key={org._id} className="flex items-center justify-between gap-3 px-3.5 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{org.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {org.type && <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${ORG_TYPE_BADGE[org.type] || 'bg-slate-100 text-slate-600'}`}>{ORG_TYPE_LABELS[org.type] || org.type}</span>}
                      {org.city && <span className="text-[11px] text-slate-400">{org.city}</span>}
                    </div>
                  </div>
                  <button type="button" onClick={() => !isJoined && handleJoin(org)} disabled={isJoined || joiningId === org._id}
                    className={`flex-shrink-0 flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-semibold transition ${isJoined ? 'bg-green-50 text-green-600 cursor-default' : 'bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50'}`}>
                    {joiningId === org._id ? <Loader2 size={12} className="animate-spin" /> : isJoined ? <><CheckCircle size={12} /> Joined</> : <><Plus size={12} /> Join</>}
                  </button>
                </div>
              );
            })}
          </div>
        )}
        {searchQuery.trim().length >= 2 && !isSearching && !searchResults.length && (
          <p className="text-xs text-slate-400 text-center py-3">No results for "{searchQuery}"</p>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
export const DoctorProfile = () => {
  const { user, token } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  useDoctorNotifications(user?._id);
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [profilePhoto, setProfilePhoto] = useState(() => {
    const p = user?.profilePhoto;
    if (!p) return null;
    if (p.startsWith('http')) return p;
    const base = (import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_URL.includes('localhost')) ? import.meta.env.VITE_API_URL.replace('/api', '') : '';
    return `${base}${p}`;
  });

  const [nq, setNq] = useState('');  // new qualification
  const [nt, setNt] = useState('');  // new treatment
  const [nl, setNl] = useState('');  // new language
  const [ns, setNs] = useState('');  // new specialization
  const [nc, setNc] = useState('');  // new certification
  const [na, setNa] = useState('');  // new achievement

  const [fd, setFd] = useState({
    specialization: user?.specialization || '',
    consultationFee: user?.consultationFee || '',
    videoConsultationFee: user?.videoConsultationFee || '',
    roomNumber: user?.roomNumber || '',
    experience: user?.experience || '',
    phone: user?.phone || '',
    qualifications: user?.qualifications || [],
    boardCertifications: user?.boardCertifications || [],
    specializations: user?.specializations || [],
    isActive: user?.isActive !== false,
    availability: user?.availability || {},
    aboutMe: user?.aboutMe || '',
    treatments: user?.treatments || [],
    languages: user?.languages || [],
    achievements: user?.achievements || [],
    registrationNumber: user?.registrationNumber || '',
    hospital: user?.hospital || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    zipCode: user?.zipCode || '',
    insurance: user?.insurance || '',
    website: user?.website || '',
    consultationDuration: user?.consultationDuration || 30,
    onlineConsultation: user?.onlineConsultation !== false,
    emergencyConsultation: user?.emergencyConsultation || false,
    waitingTime: user?.waitingTime || 30,
    patientsSeen: user?.patientsSeen || 0,
    successRate: user?.successRate || 0,
    rating: user?.rating || 0,
  });

  useEffect(() => {
    if (!fd.availability || !Object.keys(fd.availability).length) {
      const a = {}; DAYS_OF_WEEK.forEach(d => a[d] = { start: '', end: '' });
      setFd(p => ({ ...p, availability: a }));
    }
  }, []);

  const ch = e => { const { name, value, type, checked } = e.target; setFd(p => ({ ...p, [name]: type === 'checkbox' ? checked : value })); };
  const addArr = (k, v, set) => { if (v.trim() && !fd[k].includes(v.trim())) { setFd(p => ({ ...p, [k]: [...p[k], v.trim()] })); set(''); } };
  const remArr = (k, i) => setFd(p => ({ ...p, [k]: p[k].filter((_, j) => j !== i) }));

  const handlePhotoUpload = async e => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5 MB'); return; }
    setIsUploadingPhoto(true);
    try {
      const r = await doctorProfileAPI.uploadPhoto(file);
      setProfilePhoto(r.data.profilePhoto);
      dispatch(setUser({ user: r.data.user, token }));
      toast.success('Photo updated!');
    } catch (e) { toast.error(e.response?.data?.message || 'Upload failed'); }
    finally { setIsUploadingPhoto(false); }
  };

  const handleSubmit = async e => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      const r = await doctorProfileAPI.updateMe(fd);
      dispatch(setUser({ user: r.data, token }));
      toast.success('Profile saved!');
      setIsEditing(false);
    } catch (e) { toast.error(e.response?.data?.message || 'Save failed'); }
    finally { setIsSubmitting(false); }
  };

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  const TABS = [
    { id: 'overview',      label: 'Overview',      Icon: UserCircle2 },
    { id: 'credentials',   label: 'Credentials',   Icon: GraduationCap },
    { id: 'organizations', label: 'Organizations',  Icon: Building2 },
    { id: 'practice',      label: 'Practice',       Icon: Stethoscope },
  ];

  /* ── Stat card ── */
  const StatCard = ({ icon, label, value, sub, gradient }) => (
    <div className={`relative overflow-hidden rounded-xl p-4 text-white ${gradient}`}>
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 0, transparent 60%)' }} />
      <div className="relative flex items-center gap-3">
        <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">{icon}</div>
        <div className="min-w-0">
          <p className="text-xl font-black leading-none tracking-tight">{value}</p>
          {sub && <p className="text-[11px] font-medium opacity-70 mt-0.5 truncate">{sub}</p>}
          <p className="text-[10px] font-bold opacity-75 mt-1 uppercase tracking-widest truncate">{label}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #f7fafa 50%, #f0fff4 100%)' }}>

      {/* ══ HEADER ══ */}
      <header className="sticky top-0 z-50 bg-[#1E3A5F] border-b border-[#2D4F7C] shadow-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <Heart size={17} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="leading-none">
              <p className="text-sm font-bold text-white">MediQ</p>
              <p className="text-[10px] text-teal-300 hidden sm:block">Doctor Profile</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => navigate('/doctor')}
              className="hidden sm:flex items-center gap-1.5 text-slate-300 hover:text-white hover:bg-white/10 text-xs font-medium px-3 py-1.5 rounded-lg transition">
              <LayoutDashboard size={14} /> Dashboard
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
              <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center text-white text-[10px] font-bold">{initials[0]}</div>
              <span className="text-xs font-medium text-white">{user?.name?.split(' ')[0]}</span>
            </div>
            <NotificationBell />
            <button onClick={() => dispatch(logout())}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition" title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">

        {/* ══ HERO BANNER ══ */}
        <div className="relative rounded-3xl overflow-hidden mb-8 shadow-2xl">
          {/* Background */}
          <div className="h-40 sm:h-48 bg-gradient-to-r from-[#0f2849] via-[#0d6e6e] to-[#0a5c5c] relative">
            {/* mesh overlay */}
            <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                  <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
            {/* decorative circles */}
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-teal-400/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 left-1/3 w-48 h-48 bg-blue-400/20 rounded-full blur-2xl" />

            {/* Edit profile button */}
            <button
              onClick={() => setIsEditing(e => !e)}
              className={`absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition shadow-lg ${
                isEditing ? 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border border-white/20'
                  : 'bg-white text-slate-700 hover:bg-slate-50'
              }`}>
              <Edit2 size={14} />
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {/* White bottom section */}
          <div className="bg-white px-5 sm:px-8 pb-5">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 -mt-12 sm:-mt-14 relative z-10">

              {/* Avatar */}
              <div className="relative group flex-shrink-0 self-start">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl border-4 border-white shadow-xl overflow-hidden bg-gradient-to-br from-teal-400 via-teal-500 to-teal-700 flex items-center justify-center">
                  {profilePhoto
                    ? <img src={profilePhoto} alt={user?.name} className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                    : <span className="text-white text-3xl sm:text-4xl font-black select-none">{initials}</span>}
                </div>
                <button onClick={() => fileInputRef.current?.click()} disabled={isUploadingPhoto}
                  className="absolute inset-0 flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100 bg-black/30 rounded-xl transition disabled:opacity-30"
                  title="Change photo">
                  <span className="flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                    {isUploadingPhoto ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
                    {isUploadingPhoto ? 'Uploading…' : 'Change'}
                  </span>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </div>

              {/* Name + meta */}
              <div className="flex-1 pt-2 sm:pt-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <div className="flex items-baseline gap-2.5 flex-wrap">
                      <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">{user?.name || 'Dr. Name'}</h1>
                      {fd.experience > 0 && (
                        <span className="text-xs font-bold text-teal-700 bg-teal-50 ring-1 ring-teal-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {fd.experience} yrs exp
                        </span>
                      )}
                    </div>
                    <p className="text-teal-600 font-semibold text-sm mt-0.5">{fd.specialization || 'Medical Professional'}</p>
                    {fd.hospital && (
                      <p className="flex items-center gap-1.5 text-slate-500 text-sm mt-1">
                        <MapPin size={13} className="text-slate-400" />{fd.hospital}{fd.city && `, ${fd.city}`}
                      </p>
                    )}
                    {/* badges */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {user?.verificationStatus === 'APPROVED' && (
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold ring-1 ring-emerald-200">
                          <Shield size={11} /> Verified
                        </span>
                      )}
                      {user?.averageRating > 0 && (
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold ring-1 ring-amber-200">
                          <Star size={11} /> {user.averageRating.toFixed(1)} / 5
                        </span>
                      )}
                      {fd.onlineConsultation && (
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold ring-1 ring-blue-200">
                          <Globe size={11} /> Online
                        </span>
                      )}
                      {fd.emergencyConsultation && (
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold ring-1 ring-red-200">
                          <ActivitySquare size={11} /> Emergency
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Contact pills */}
                  <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
                    {fd.phone && (
                      <a href={`tel:${fd.phone}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:border-teal-300 hover:text-teal-600 transition">
                        <Phone size={12} /> {fd.phone}
                      </a>
                    )}
                    {fd.website && (
                      <a href={fd.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:border-teal-300 hover:text-teal-600 transition">
                        <Globe size={12} /> Website
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══ STAT CARDS (view only) ══ */}
        {!isEditing && (fd.patientsSeen > 0 || fd.successRate > 0) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {fd.patientsSeen > 0 && (
              <StatCard icon={<Users size={20} />} label="Patients Seen" value={`${fd.patientsSeen}+`} sub="Treated successfully" gradient="bg-gradient-to-br from-blue-500 to-blue-700" />
            )}
            {fd.successRate > 0 && (
              <StatCard icon={<Award size={20} />} label="Success Rate" value={`${fd.successRate}%`} sub="Positive outcomes" gradient="bg-gradient-to-br from-violet-500 to-violet-700" />
            )}
          </div>
        )}

        {/* ══ TABS ══ */}
        <div className="flex items-center gap-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-1.5 mb-6 overflow-x-auto">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition flex-1 justify-center ${
                activeTab === id
                  ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-md shadow-teal-200'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}>
              <Icon size={15} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════
            EDIT FORM
        ════════════════════════════════════════════ */}
        {isEditing ? (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">

              {/* ─ OVERVIEW TAB ─ */}
              {activeTab === 'overview' && (
                <>
                  <EditSection icon={<UserCircle2 size={15} />} title="Personal & Contact" accent="teal">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                      <Field label="Specialization">
                        <input name="specialization" value={fd.specialization} onChange={ch} placeholder="e.g. Cardiology" className={inp} />
                      </Field>
                      <Field label="Reg. / License Number">
                        <input name="registrationNumber" value={fd.registrationNumber} onChange={ch} placeholder="e.g. MCI-12345" className={inp} />
                      </Field>
                      <Field label="Years of Experience">
                        <input type="number" name="experience" value={fd.experience} onChange={ch} min="0" className={inp} />
                      </Field>
                      <Field label="Phone Number">
                        <input type="tel" name="phone" value={fd.phone} onChange={ch} placeholder="+91 98765 43210" className={inp} />
                      </Field>
                      <Field label="Website">
                        <input type="url" name="website" value={fd.website} onChange={ch} placeholder="https://example.com" className={inp} />
                      </Field>
                      <Field label="Room Number">
                        <input name="roomNumber" value={fd.roomNumber} onChange={ch} placeholder="e.g. 101" className={inp} />
                      </Field>
                      <div className="sm:col-span-2">
                        <Field label="Professional Bio">
                          <textarea name="aboutMe" value={fd.aboutMe} onChange={ch} rows={4} placeholder="Brief professional introduction…" className={inp + ' resize-none'} />
                        </Field>
                      </div>
                    </div>
                  </EditSection>

                  <EditSection icon={<MapPin size={15} />} title="Location & Clinic" accent="blue">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                      <Field label="Hospital / Clinic">
                        <input name="hospital" value={fd.hospital} onChange={ch} placeholder="e.g. Apollo Hospital" className={inp} />
                      </Field>
                      <Field label="City">
                        <input name="city" value={fd.city} onChange={ch} placeholder="e.g. Mumbai" className={inp} />
                      </Field>
                      <Field label="State">
                        <input name="state" value={fd.state} onChange={ch} placeholder="e.g. Maharashtra" className={inp} />
                      </Field>
                      <Field label="ZIP Code">
                        <input name="zipCode" value={fd.zipCode} onChange={ch} placeholder="e.g. 400001" className={inp} />
                      </Field>
                      <div className="sm:col-span-2">
                        <Field label="Full Address">
                          <textarea name="address" value={fd.address} onChange={ch} rows={2} placeholder="Street, building…" className={inp + ' resize-none'} />
                        </Field>
                      </div>
                    </div>
                  </EditSection>
                </>
              )}

              {/* ─ CREDENTIALS TAB ─ */}
              {activeTab === 'credentials' && (
                <>
                  <EditSection icon={<GraduationCap size={15} />} title="Qualifications" accent="teal">
                    <div className="pt-4">
                      <TagAdder label="Add degree / qualification" placeholder="e.g. MBBS, MD" value={nq} onChange={e => setNq(e.target.value)}
                        onAdd={() => addArr('qualifications', nq, setNq)} tags={fd.qualifications} onRemove={i => remArr('qualifications', i)}
                        palette="teal" datalistId="qual-list" datalistItems={COMMON_QUALIFICATIONS} />
                    </div>
                  </EditSection>

                  <EditSection icon={<BadgeCheck size={15} />} title="Board Certifications" accent="amber">
                    <div className="pt-4">
                      <TagAdder label="Add certification" placeholder="e.g. FRCS, MRCP" value={nc} onChange={e => setNc(e.target.value)}
                        onAdd={() => addArr('boardCertifications', nc, setNc)} tags={fd.boardCertifications} onRemove={i => remArr('boardCertifications', i)} palette="amber" />
                    </div>
                  </EditSection>

                  <EditSection icon={<FlaskConical size={15} />} title="Sub-Specializations" accent="emerald">
                    <div className="pt-4">
                      <TagAdder label="Add specialization" placeholder="e.g. Interventional Cardiology" value={ns} onChange={e => setNs(e.target.value)}
                        onAdd={() => addArr('specializations', ns, setNs)} tags={fd.specializations} onRemove={i => remArr('specializations', i)} palette="emerald" />
                    </div>
                  </EditSection>

                  <EditSection icon={<Trophy size={15} />} title="Awards & Achievements" accent="orange">
                    <div className="pt-4">
                      <TagAdder label="Add award / recognition" placeholder="e.g. Best Doctor 2024" value={na} onChange={e => setNa(e.target.value)}
                        onAdd={() => addArr('achievements', na, setNa)} tags={fd.achievements} onRemove={i => remArr('achievements', i)} palette="orange" />
                    </div>
                  </EditSection>
                </>
              )}

              {/* ─ ORGANIZATIONS TAB ─ */}
              {activeTab === 'organizations' && (
                <EditSection icon={<Building2 size={15} />} title="Organizations & Affiliations" accent="blue">
                  <OrganizationSection isEditing={true} />
                </EditSection>
              )}

              {/* ─ PRACTICE TAB ─ */}
              {activeTab === 'practice' && (
                <>
                  <EditSection icon={<DollarSign size={15} />} title="Consultation Details" accent="teal">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                      <Field label="In-Person Fee (₹)">
                        <input type="number" name="consultationFee" value={fd.consultationFee} onChange={ch} min="0" className={inp} />
                      </Field>
                      <Field label="Video Fee (₹)">
                        <input type="number" name="videoConsultationFee" value={fd.videoConsultationFee} onChange={ch} min="0" placeholder="If different" className={inp} />
                      </Field>
                      <Field label="Session Duration (min)">
                        <input type="number" name="consultationDuration" value={fd.consultationDuration} onChange={ch} min="5" className={inp} />
                      </Field>
                      <Field label="Avg. Wait Time (min)">
                        <input type="number" name="waitingTime" value={fd.waitingTime} onChange={ch} min="0" className={inp} />
                      </Field>
                      <Field label="Patients Seen (approx)">
                        <input type="number" name="patientsSeen" value={fd.patientsSeen} onChange={ch} min="0" placeholder="e.g. 5000" className={inp} />
                      </Field>
                      <Field label="Success Rate (%)">
                        <input type="number" name="successRate" value={fd.successRate} onChange={ch} min="0" max="100" className={inp} />
                      </Field>
                      <Field label="Insurance Accepted">
                        <input name="insurance" value={fd.insurance} onChange={ch} placeholder="e.g. ICICI, HDFC" className={inp} />
                      </Field>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-slate-100">
                      {[['onlineConsultation', 'Online Consultation'], ['emergencyConsultation', 'Emergency Available']].map(([name, label]) => (
                        <label key={name} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" name={name} checked={fd[name]} onChange={ch} className="w-4 h-4 accent-teal-600 rounded" />
                          <span className="text-sm font-medium text-slate-700">{label}</span>
                        </label>
                      ))}
                    </div>
                  </EditSection>

                  <EditSection icon={<Syringe size={15} />} title="Treatments & Procedures" accent="orange">
                    <div className="pt-4">
                      <TagAdder label="Add treatment" placeholder="e.g. Angioplasty, ECG, Bypass" value={nt} onChange={e => setNt(e.target.value)}
                        onAdd={() => addArr('treatments', nt, setNt)} tags={fd.treatments} onRemove={i => remArr('treatments', i)} palette="orange" />
                    </div>
                  </EditSection>

                  <EditSection icon={<Languages size={15} />} title="Languages Spoken" accent="purple">
                    <div className="pt-4">
                      <TagAdder label="Add language" placeholder="e.g. English, Hindi, Tamil" value={nl} onChange={e => setNl(e.target.value)}
                        onAdd={() => addArr('languages', nl, setNl)} tags={fd.languages} onRemove={i => remArr('languages', i)} palette="purple" />
                    </div>
                  </EditSection>
                </>
              )}
            </div>

            {/* Sticky save bar */}
            <div className="sticky bottom-0 mt-6 z-20 pb-4">
              <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl shadow-2xl px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                  Unsaved changes on <span className="font-semibold text-slate-700 capitalize">{activeTab}</span>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsEditing(false)}
                    className="px-5 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-semibold transition">
                    Discard
                  </button>
                  <button type="submit" disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-teal-200 transition disabled:opacity-50">
                    {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    {isSubmitting ? 'Saving…' : 'Save Profile'}
                  </button>
                </div>
              </div>
            </div>
          </form>

        ) : (
          /* ════════════════════════════════════════════
              VIEW MODE — two-column layout on desktop
          ═════════════════════════════════════════════ */
          <div>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Left column — 2/3 width */}
                <div className="lg:col-span-2 space-y-4">

                  {/* About card */}
                  {fd.aboutMe && (
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-slate-50">
                        <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center"><Info size={14} className="text-teal-600" /></div>
                        <h3 className="text-sm font-bold text-slate-800">About Me</h3>
                      </div>
                      <div className="px-5 py-4">
                        <p className="text-slate-600 text-sm leading-relaxed">{fd.aboutMe}</p>
                      </div>
                    </div>
                  )}

                  {/* Consultation card */}
                  <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2.5 px-5 py-3 border-b border-slate-50">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center"><DollarSign size={14} className="text-emerald-600" /></div>
                      <h3 className="text-sm font-bold text-slate-800">Consultation Details</h3>
                    </div>
                    <div className="px-5 py-4">
                      <div className="grid grid-cols-2 gap-3">
                        {fd.consultationFee > 0 && (
                          <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-3.5 border border-teal-100">
                            <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mb-1">In-Person</p>
                            <p className="text-2xl font-black text-teal-700 leading-none">₹{fd.consultationFee}</p>
                            <p className="text-[11px] text-teal-600/60 mt-1">per visit</p>
                          </div>
                        )}
                        {fd.videoConsultationFee > 0 && (
                          <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl p-3.5 border border-blue-100">
                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Video Call</p>
                            <p className="text-2xl font-black text-blue-700 leading-none">₹{fd.videoConsultationFee}</p>
                            <p className="text-[11px] text-blue-600/60 mt-1">per session</p>
                          </div>
                        )}
                        {fd.consultationDuration > 0 && (
                          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Duration</p>
                            <p className="text-2xl font-black text-slate-700 leading-none">{fd.consultationDuration}<span className="text-sm font-medium text-slate-500"> min</span></p>
                            <p className="text-[11px] text-slate-400 mt-1">per session</p>
                          </div>
                        )}
                        {fd.waitingTime > 0 && (
                          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Avg. Wait</p>
                            <p className="text-2xl font-black text-slate-700 leading-none">{fd.waitingTime}<span className="text-sm font-medium text-slate-500"> min</span></p>
                            <p className="text-[11px] text-slate-400 mt-1">estimated</p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-100">
                        {fd.onlineConsultation && <span className="flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-bold ring-1 ring-green-200"><CheckCircle size={11} /> Online</span>}
                        {fd.emergencyConsultation && <span className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold ring-1 ring-red-200"><ActivitySquare size={11} /> Emergency</span>}
                        {fd.insurance && <span className="flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold ring-1 ring-purple-200"><Shield size={11} /> {fd.insurance}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right column — 1/3 width */}
                <div className="space-y-4">

                  {/* Location card */}
                  {(fd.hospital || fd.city) && (
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-slate-50">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center"><MapPin size={14} className="text-blue-600" /></div>
                        <h3 className="text-sm font-bold text-slate-800">Location</h3>
                      </div>
                      <div className="px-5 py-3.5 space-y-1">
                        {fd.hospital && <p className="font-bold text-slate-800 text-sm">{fd.hospital}</p>}
                        {fd.address && <p className="text-slate-500 text-xs leading-snug">{fd.address}</p>}
                        <p className="text-slate-500 text-xs">{fd.city}{fd.state && `, ${fd.state}`}{fd.zipCode && ` ${fd.zipCode}`}</p>
                      </div>
                      {(fd.phone || fd.website) && (
                        <div className="px-5 pb-3.5 pt-2 border-t border-slate-100 space-y-2">
                          {fd.phone && (
                            <a href={`tel:${fd.phone}`} className="flex items-center gap-2 text-xs text-slate-600 hover:text-teal-600 transition font-medium">
                              <div className="w-6 h-6 bg-slate-100 rounded-md flex items-center justify-center flex-shrink-0"><Phone size={11} className="text-slate-500" /></div>
                              {fd.phone}
                            </a>
                          )}
                          {fd.website && (
                            <a href={fd.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs text-slate-600 hover:text-teal-600 transition font-medium">
                              <div className="w-6 h-6 bg-slate-100 rounded-md flex items-center justify-center flex-shrink-0"><Globe size={11} className="text-slate-500" /></div>
                              Visit Website <ExternalLink size={10} className="ml-auto text-slate-400" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quick info tiles */}
                  {(fd.registrationNumber || fd.roomNumber) && (
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-slate-50">
                        <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center"><BadgeCheck size={14} className="text-violet-600" /></div>
                        <h3 className="text-sm font-bold text-slate-800">Details</h3>
                      </div>
                      <div className="px-5 py-3.5 space-y-2">
                        {fd.registrationNumber && (
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Reg. No.</span>
                            <span className="text-xs font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md">{fd.registrationNumber}</span>
                          </div>
                        )}
                        {fd.roomNumber && (
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Room</span>
                            <span className="text-xs font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md">{fd.roomNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Edit CTA */}
                  <button onClick={() => setIsEditing(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-teal-400 hover:text-teal-500 text-xs font-semibold transition group">
                    <Edit2 size={13} className="group-hover:rotate-6 transition-transform" /> Complete Your Profile
                  </button>
                </div>
              </div>
            )}

            {/* CREDENTIALS TAB */}
            {activeTab === 'credentials' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {fd.qualifications.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2.5 px-5 py-3 border-b border-slate-50">
                      <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center"><GraduationCap size={14} className="text-teal-600" /></div>
                      <h3 className="text-sm font-bold text-slate-800">Qualifications</h3>
                    </div>
                    <div className="px-5 py-4 flex flex-wrap gap-2">
                      {fd.qualifications.map((q, i) => <Tag key={i} palette="teal">{q}</Tag>)}
                    </div>
                  </div>
                )}
                {fd.boardCertifications.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2.5 px-5 py-3 border-b border-slate-50">
                      <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center"><BadgeCheck size={14} className="text-amber-600" /></div>
                      <h3 className="text-sm font-bold text-slate-800">Board Certifications</h3>
                    </div>
                    <div className="px-5 py-4 flex flex-wrap gap-2">
                      {fd.boardCertifications.map((c, i) => <Tag key={i} palette="amber">{c}</Tag>)}
                    </div>
                  </div>
                )}
                {fd.specializations.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2.5 px-5 py-3 border-b border-slate-50">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center"><FlaskConical size={14} className="text-emerald-600" /></div>
                      <h3 className="text-sm font-bold text-slate-800">Sub-Specializations</h3>
                    </div>
                    <div className="px-5 py-4 flex flex-wrap gap-2">
                      {fd.specializations.map((s, i) => <Tag key={i} palette="emerald">{s}</Tag>)}
                    </div>
                  </div>
                )}
                {fd.achievements.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2.5 px-5 py-3 border-b border-slate-50">
                      <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center"><Trophy size={14} className="text-orange-600" /></div>
                      <h3 className="text-sm font-bold text-slate-800">Awards & Achievements</h3>
                    </div>
                    <div className="px-5 py-4 space-y-2">
                      {fd.achievements.map((a, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                          <span className="text-base leading-none mt-0.5 flex-shrink-0">🏅</span>
                          <span className="text-xs text-slate-700 font-semibold leading-snug">{a}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {!fd.qualifications.length && !fd.boardCertifications.length && !fd.specializations.length && !fd.achievements.length && (
                  <div className="lg:col-span-2 text-center py-16">
                    <GraduationCap size={40} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-slate-400 font-semibold text-sm">No credentials added yet</p>
                    <p className="text-slate-300 text-xs mt-1">Add your degrees, certifications and achievements</p>
                    <button onClick={() => setIsEditing(true)} className="mt-3 px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition">Add Credentials →</button>
                  </div>
                )}
              </div>
            )}

            {/* ORGANIZATIONS TAB */}
            {activeTab === 'organizations' && (
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center"><Building2 size={14} className="text-blue-600" /></div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Organizations & Affiliations</h3>
                      <p className="text-[11px] text-slate-400">Hospitals and clinics you are associated with</p>
                    </div>
                  </div>
                  <button onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-teal-600 hover:bg-teal-50 rounded-lg transition border border-teal-200">
                    <Plus size={12} /> Manage
                  </button>
                </div>
                <div className="px-5 py-4">
                  <OrganizationSection isEditing={false} />
                </div>
              </div>
            )}

            {/* PRACTICE TAB */}
            {activeTab === 'practice' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {fd.treatments.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden lg:col-span-2">
                    <div className="flex items-center gap-2.5 px-5 py-3 border-b border-slate-50">
                      <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center"><Syringe size={14} className="text-orange-600" /></div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">Treatments & Procedures</h3>
                        <p className="text-[11px] text-slate-400">{fd.treatments.length} procedure{fd.treatments.length !== 1 ? 's' : ''} listed</p>
                      </div>
                    </div>
                    <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {fd.treatments.map((t, i) => (
                        <div key={i} className="flex items-center gap-2 p-2.5 bg-orange-50 rounded-lg border border-orange-100 hover:border-orange-300 hover:bg-orange-100 transition">
                          <div className="w-1.5 h-1.5 bg-orange-500 rounded-full flex-shrink-0" />
                          <span className="text-xs font-semibold text-slate-700 leading-tight">{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {fd.languages.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2.5 px-5 py-3 border-b border-slate-50">
                      <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center"><Languages size={14} className="text-purple-600" /></div>
                      <h3 className="text-sm font-bold text-slate-800">Languages Spoken</h3>
                    </div>
                    <div className="px-5 py-4 flex flex-wrap gap-2">
                      {fd.languages.map((l, i) => <Tag key={i} palette="purple">{l}</Tag>)}
                    </div>
                  </div>
                )}
                {!fd.treatments.length && !fd.languages.length && (
                  <div className="lg:col-span-2 text-center py-16">
                    <Stethoscope size={40} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-slate-400 font-semibold text-sm">No practice details added yet</p>
                    <p className="text-slate-300 text-xs mt-1">Add treatments, procedures and languages</p>
                    <button onClick={() => setIsEditing(true)} className="mt-3 px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition">Add Details →</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
