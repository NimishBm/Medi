import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../../services/api';
import { setUser, logout } from '../../store/slices/authSlice';
import { useIsMobile } from '../../hooks/useIsMobile';
import toast from 'react-hot-toast';
import {
  ChevronLeft, Stethoscope, User, Phone, Mail, Calendar,
  Droplets, Shield, Edit3, Save, X, AlertCircle,
} from 'lucide-react';

const T = '#0D9488';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDER_MAP = { M: 'Male', F: 'Female', Other: 'Other' };

export const PatientProfile = () => {
  const { user, token } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [editing, setEditing]   = useState(false);
  const [allergyInput, setAllergyInput] = useState('');

  const [form, setForm] = useState({
    name: '', phone: '', dateOfBirth: '', gender: '', bloodGroup: '', allergies: [],
  });

  useEffect(() => {
    userAPI.getMe()
      .then(r => {
        const d = r.data;
        setProfile(d);
        setForm({
          name:        d.name        || '',
          phone:       d.phone       || '',
          dateOfBirth: d.dateOfBirth ? d.dateOfBirth.split('T')[0] : '',
          gender:      d.gender      || '',
          bloodGroup:  d.bloodGroup  || '',
          allergies:   d.allergies   || [],
        });
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addAllergy = () => {
    const val = allergyInput.trim();
    if (!val) return;
    if (form.allergies.includes(val)) { toast.error('Already added'); return; }
    set('allergies', [...form.allergies, val]);
    setAllergyInput('');
  };

  const removeAllergy = (a) => set('allergies', form.allergies.filter(x => x !== a));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (!form.phone.trim()) { toast.error('Phone is required'); return; }
    setSaving(true);
    try {
      const res = await userAPI.updateMe({
        name:        form.name.trim(),
        phone:       form.phone.trim(),
        dateOfBirth: form.dateOfBirth || undefined,
        gender:      form.gender      || undefined,
        bloodGroup:  form.bloodGroup  || undefined,
        allergies:   form.allergies,
      });
      const updated = { ...res.data, role: 'PATIENT' };
      setProfile(updated);
      dispatch(setUser({ user: updated, token }));
      setEditing(false);
      toast.success('Profile updated');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      name:        profile.name        || '',
      phone:       profile.phone       || '',
      dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
      gender:      profile.gender      || '',
      bloodGroup:  profile.bloodGroup  || '',
      allergies:   profile.allergies   || [],
    });
    setAllergyInput('');
    setEditing(false);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F5F7FA' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: `4px solid ${T}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#374151', fontWeight: 600 }}>Loading profile...</p>
      </div>
    </div>
  );

  const initials = (profile?.name || 'P').replace(/^Dr\.?\s+/, '').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const dob = profile?.dateOfBirth ? new Date(profile.dateOfBirth) : null;
  const age = dob ? Math.floor((Date.now() - dob) / (365.25 * 24 * 3600 * 1000)) : null;

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA', fontFamily: 'system-ui,-apple-system,sans-serif' }}>

      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #E8ECF0', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/patient')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex', padding: 4 }}>
            <ChevronLeft size={22} />
          </button>
          <div onClick={() => navigate('/patient')} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <div style={{ width: 32, height: 32, background: `linear-gradient(135deg,${T},#0F766E)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stethoscope size={16} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 16, color: T }}>ClinicFlow</span>
          </div>
          {!isMobile && <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginLeft: 4 }}>/ My Profile</span>}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {!editing ? (
              <button onClick={() => setEditing(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: T, color: '#fff', fontWeight: 700, fontSize: 13, padding: '7px 14px', borderRadius: 9, border: 'none', cursor: 'pointer' }}>
                <Edit3 size={14} /> Edit
              </button>
            ) : (
              <>
                <button onClick={handleCancel}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#F3F4F6', color: '#374151', fontWeight: 600, fontSize: 13, padding: '7px 12px', borderRadius: 9, border: 'none', cursor: 'pointer' }}>
                  <X size={14} /> Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, background: T, color: '#fff', fontWeight: 700, fontSize: 13, padding: '7px 14px', borderRadius: 9, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                  <Save size={14} /> {saving ? 'Saving…' : 'Save'}
                </button>
              </>
            )}
            <button onClick={() => dispatch(logout())}
              style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>
              Logout
            </button>
          </div>
        </div>
        <div style={{ background: T, height: 4 }} />
      </header>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px 56px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Avatar card */}
        <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ height: 72, background: `linear-gradient(135deg,${T},#0F766E,#115E59)` }} />
          <div style={{ padding: '0 20px 20px', marginTop: -32 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ width: 68, height: 68, background: '#fff', borderRadius: '50%', border: `4px solid #fff`, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T, fontWeight: 900, fontSize: 24, flexShrink: 0 }}>
                {initials}
              </div>
              <div style={{ marginBottom: 4 }}>
                {profile?.bloodGroup && (
                  <span style={{ background: '#FEF2F2', color: '#DC2626', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20, border: '1px solid #FECACA' }}>
                    {profile.bloodGroup}
                  </span>
                )}
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <p style={{ fontSize: 20, fontWeight: 900, color: '#111827' }}>{profile?.name}</p>
              <p style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                {age ? `${age} years` : ''}{age && profile?.gender ? ' · ' : ''}{profile?.gender ? GENDER_MAP[profile.gender] : ''}
                {profile?.email ? (age || profile?.gender ? ' · ' : '') + profile.email : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: '18px 20px' }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#111827', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <User size={15} color={T} /> Personal Information
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>

            {/* Name */}
            <Field label="Full Name" icon={<User size={14} color="#9CA3AF" />}>
              {editing
                ? <input value={form.name} onChange={e => set('name', e.target.value)}
                    style={inputStyle} placeholder="Your full name" />
                : <Value>{profile?.name || '—'}</Value>}
            </Field>

            {/* Phone */}
            <Field label="Phone Number" icon={<Phone size={14} color="#9CA3AF" />}>
              {editing
                ? <input value={form.phone} onChange={e => set('phone', e.target.value)}
                    style={inputStyle} placeholder="+91 99999 99999" />
                : <Value>{profile?.phone || '—'}</Value>}
            </Field>

            {/* Email — read only */}
            <Field label="Email Address" icon={<Mail size={14} color="#9CA3AF" />}>
              <Value muted>{profile?.email || '—'}</Value>
              {editing && <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>Email cannot be changed</p>}
            </Field>

            {/* Date of Birth */}
            <Field label="Date of Birth" icon={<Calendar size={14} color="#9CA3AF" />}>
              {editing
                ? <input type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)}
                    style={inputStyle} max={new Date().toISOString().split('T')[0]} />
                : <Value>{dob ? dob.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</Value>}
            </Field>

            {/* Gender */}
            <Field label="Gender" icon={<User size={14} color="#9CA3AF" />}>
              {editing
                ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[['M','Male'], ['F','Female'], ['Other','Other']].map(([val, label]) => (
                      <button key={val} type="button" onClick={() => set('gender', val)}
                        style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: `1.5px solid ${form.gender === val ? T : '#E5E7EB'}`, background: form.gender === val ? '#F0FDF4' : '#fff', color: form.gender === val ? T : '#6B7280', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                        {label}
                      </button>
                    ))}
                  </div>
                )
                : <Value>{profile?.gender ? GENDER_MAP[profile.gender] : '—'}</Value>}
            </Field>

            {/* Blood Group */}
            <Field label="Blood Group" icon={<Droplets size={14} color="#9CA3AF" />}>
              {editing
                ? (
                  <select value={form.bloodGroup} onChange={e => set('bloodGroup', e.target.value)} style={inputStyle}>
                    <option value="">Select blood group</option>
                    {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                )
                : (
                  <span style={{ display: 'inline-block', background: profile?.bloodGroup ? '#FEF2F2' : 'transparent', color: profile?.bloodGroup ? '#DC2626' : '#9CA3AF', fontWeight: profile?.bloodGroup ? 700 : 400, fontSize: 14, padding: profile?.bloodGroup ? '3px 10px' : 0, borderRadius: 12 }}>
                    {profile?.bloodGroup || '—'}
                  </span>
                )}
            </Field>
          </div>
        </div>

        {/* Allergies */}
        <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: '18px 20px' }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#111827', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertCircle size={15} color="#F59E0B" /> Allergies
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: editing ? 12 : 0 }}>
            {form.allergies.length === 0
              ? <p style={{ fontSize: 13, color: '#9CA3AF' }}>No allergies recorded</p>
              : form.allergies.map(a => (
                <span key={a} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#FFF7ED', color: '#92400E', fontSize: 12, fontWeight: 600, padding: '5px 10px', borderRadius: 20, border: '1px solid #FED7AA' }}>
                  {a}
                  {editing && (
                    <button onClick={() => removeAllergy(a)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F97316', display: 'flex', padding: 0, marginLeft: 2 }}>
                      <X size={12} />
                    </button>
                  )}
                </span>
              ))}
          </div>

          {editing && (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={allergyInput}
                onChange={e => setAllergyInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                placeholder="e.g. Penicillin, Peanuts..."
                style={{ ...inputStyle, flex: 1 }}
              />
              <button onClick={addAllergy}
                style={{ background: T, color: '#fff', fontWeight: 700, fontSize: 13, padding: '0 16px', borderRadius: 9, border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                Add
              </button>
            </div>
          )}
        </div>

        {/* Account Info — read only */}
        <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: '18px 20px' }}>
          <p style={{ fontSize: 13, fontWeight: 800, color: '#111827', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Shield size={15} color={T} /> Account
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Role', value: 'Patient' },
              { label: 'Member Since', value: profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: '#F9FAFB', borderRadius: 10, padding: '12px 14px' }}>
                <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

/* ── Small helpers ── */

const inputStyle = {
  width: '100%', padding: '9px 12px', background: '#F9FAFB', border: '1.5px solid #E5E7EB',
  borderRadius: 9, fontSize: 13, color: '#111827', outline: 'none', boxSizing: 'border-box',
};

const Field = ({ label, icon, children }) => (
  <div>
    <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
      {icon} {label}
    </p>
    {children}
  </div>
);

const Value = ({ children, muted }) => (
  <p style={{ fontSize: 14, fontWeight: muted ? 400 : 600, color: muted ? '#9CA3AF' : '#111827' }}>{children}</p>
);
