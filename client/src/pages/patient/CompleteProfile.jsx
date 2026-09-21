import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { userAPI } from '../../services/api';
import { setUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import { Stethoscope, User, Phone, Calendar, ChevronRight } from 'lucide-react';

const T = '#0D9488';

export const CompleteProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get('next') || '/patient';
  const { user, token } = useSelector(s => s.auth);

  const [form, setForm] = useState({
    phone:       user?.phone       || '+91',
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
    gender:      user?.gender      || '',
  });
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handlePhoneChange = (e) => {
    const val = e.target.value;
    if (!val.startsWith('+91')) return; // lock prefix
    const digits = val.slice(3).replace(/\D/g, '').slice(0, 10); // only digits, max 10
    let formatted = '+91';
    if (digits.length > 0) formatted += ' ' + digits.slice(0, 5);
    if (digits.length > 5)  formatted += ' ' + digits.slice(5);
    setForm(f => ({ ...f, phone: formatted }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const digits = form.phone.replace(/\D/g, ''); // e.g. "91XXXXXXXXXX" = 12 digits
    if (digits.length !== 12) { toast.error('Enter a valid 10-digit mobile number'); return; }
    setLoading(true);
    try {
      const payload = { phone: form.phone.trim() };
      if (form.dateOfBirth) payload.dateOfBirth = form.dateOfBirth;
      if (form.gender)      payload.gender      = form.gender;
      const res = await userAPI.updateMe(payload);
      dispatch(setUser({ user: { ...res.data, role: 'PATIENT' }, token }));
      toast.success('Profile updated!');
      navigate(nextPath);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: 'system-ui,-apple-system,sans-serif' }}>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
        <div style={{ width: 38, height: 38, background: `linear-gradient(135deg,${T},#0F766E)`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Stethoscope size={20} color="#fff" strokeWidth={2.5} />
        </div>
        <span style={{ fontSize: 20, fontWeight: 900, color: T }}>ClinicFlow</span>
      </div>

      <div style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: 20, padding: '36px 32px', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', border: '1.5px solid #E5E7EB' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
          <div style={{ width: 46, height: 46, background: '#F0FDF4', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <User size={22} color={T} strokeWidth={2} />
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#111827', margin: 0 }}>Complete your profile</h2>
            <p style={{ fontSize: 13, color: '#6B7280', margin: '2px 0 0' }}>A few details so doctors can serve you better</p>
          </div>
        </div>


        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          <div>
            <label style={labelStyle}>
              Phone number <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Phone size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input
                type="tel" value={form.phone} onChange={handlePhoneChange}
                placeholder="+91 98765 43210"
                style={{ ...inputStyle, paddingLeft: 36 }}
                onFocus={e => e.target.style.borderColor = T}
                onBlur={e => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>
              Date of birth <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(optional)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Calendar size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
              <input
                type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')}
                style={{ ...inputStyle, paddingLeft: 36 }}
                onFocus={e => e.target.style.borderColor = T}
                onBlur={e => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>
              Gender <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(optional)</span>
            </label>
            <select
              value={form.gender} onChange={set('gender')}
              style={{ ...inputStyle, cursor: 'pointer' }}
              onFocus={e => e.target.style.borderColor = T}
              onBlur={e => e.target.style.borderColor = '#E5E7EB'}
            >
              <option value="">Select gender</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="Other">Other / Prefer not to say</option>
            </select>
          </div>

          <button type="submit" disabled={loading}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', background: loading ? '#9CA3AF' : T, color: '#fff', fontWeight: 800, fontSize: 15, padding: '13px', borderRadius: 11, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4, transition: 'background 0.15s' }}>
            {loading ? 'Saving…' : (<>Save & Continue <ChevronRight size={16} /></>)}
          </button>

          <button type="button" onClick={() => navigate('/patient')}
            style={{ background: 'none', border: 'none', fontSize: 13, color: '#9CA3AF', cursor: 'pointer', textDecoration: 'underline', textAlign: 'center' }}>
            Skip for now
          </button>
        </form>
      </div>
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };
const inputStyle = {
  width: '100%', padding: '11px 14px', border: '1.5px solid #E5E7EB', borderRadius: 10,
  fontSize: 14, color: '#111827', background: '#FAFAFA', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};
