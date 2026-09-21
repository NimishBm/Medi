import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/slices/authSlice';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Stethoscope, Eye, EyeOff, CheckCircle } from 'lucide-react';

const T = '#0D9488';

export const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showPw, setShowPw]       = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '+91', password: '', dateOfBirth: '', gender: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePhoneChange = (e) => {
    const val = e.target.value;
    if (!val.startsWith('+91')) return;
    const digits = val.slice(3).replace(/\D/g, '').slice(0, 10);
    let formatted = '+91';
    if (digits.length > 0) formatted += ' ' + digits.slice(0, 5);
    if (digits.length > 5)  formatted += ' ' + digits.slice(5);
    set('phone', formatted);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (form.phone.replace(/\D/g, '').length !== 12) {
      toast.error('Enter a valid 10-digit phone number');
      return;
    }
    setIsLoading(true);
    try {
      const res = await authAPI.register({ ...form, role: 'PATIENT' });
      dispatch(setUser({ user: res.data.user, token: res.data.token }));
      toast.success('Account created! Welcome to ClinicFlow.');
      navigate('/patient');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'system-ui,-apple-system,sans-serif' }}>

      {/* Left panel */}
      <div style={{ display: 'none', flex: '0 0 40%', background: `linear-gradient(145deg,${T},#0F766E,#115E59)`, flexDirection: 'column', justifyContent: 'center', padding: '48px 52px' }}
        className="reg-left">
        <style>{`.reg-left{display:none} @media(min-width:768px){.reg-left{display:flex!important}}`}</style>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
          <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Stethoscope size={24} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>ClinicFlow</span>
        </div>

        <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1.3, marginBottom: 8 }}>
          Join thousands of<br />patients who trust us.
        </h2>
        <p style={{ fontSize: 14, color: '#99F6E4', marginBottom: 36 }}>
          Your complete healthcare management platform.
        </p>

        {[
          'Book appointments with verified doctors',
          'Get real-time queue updates',
          'Access your prescriptions anytime',
          'Manage health for the whole family',
        ].map(item => (
          <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <CheckCircle size={16} color="#6EE7B7" strokeWidth={2.5} style={{ flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: '#E0FDF4', fontWeight: 500 }}>{item}</p>
          </div>
        ))}
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#F5F7FA', padding: '32px 16px' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28, justifyContent: 'center' }}
            className="reg-mobile-logo">
            <style>{`.reg-mobile-logo{display:flex} @media(min-width:768px){.reg-mobile-logo{display:none!important}}`}</style>
            <div style={{ width: 36, height: 36, background: `linear-gradient(135deg,${T},#0F766E)`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stethoscope size={18} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 19, fontWeight: 900, color: T }}>ClinicFlow</span>
          </div>

          <div style={{ background: '#fff', borderRadius: 20, padding: '32px 28px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1.5px solid #E5E7EB' }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#111827', marginBottom: 4 }}>Create your account</h2>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 24 }}>Free forever · No credit card required</p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              <div>
                <label style={labelStyle}>Full Name <Req /></label>
                <input value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="Rahul Sharma" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = T}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
              </div>

              <div>
                <label style={labelStyle}>Email Address <Req /></label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  placeholder="rahul@email.com" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = T}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
              </div>

              <div>
                <label style={labelStyle}>Phone Number <Req /></label>
                <input type="tel" value={form.phone} onChange={handlePhoneChange}
                  placeholder="+91 99999 99999" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = T}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
              </div>

              {/* DOB + Gender side by side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Date of Birth</label>
                  <input type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)}
                    style={inputStyle} max={new Date().toISOString().split('T')[0]}
                    onFocus={e => e.target.style.borderColor = T}
                    onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                </div>
                <div>
                  <label style={labelStyle}>Gender</label>
                  <select value={form.gender} onChange={e => set('gender', e.target.value)}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = T}
                    onBlur={e => e.target.style.borderColor = '#E5E7EB'}>
                    <option value="">Select</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Password <Req /></label>
                <div style={{ position: 'relative' }}>
                  <input type={showPw ? 'text' : 'password'} value={form.password}
                    onChange={e => set('password', e.target.value)}
                    placeholder="Min 6 characters" style={{ ...inputStyle, paddingRight: 40 }}
                    onFocus={e => e.target.style.borderColor = T}
                    onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
                  <button type="button" onClick={() => setShowPw(p => !p)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex' }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isLoading}
                style={{ width: '100%', background: isLoading ? '#9CA3AF' : T, color: '#fff', fontWeight: 800, fontSize: 15, padding: '13px', borderRadius: 11, border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', marginTop: 4 }}>
                {isLoading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: 13, color: '#6B7280', marginTop: 20 }}>
              Already have an account?{' '}
              <Link to="/login/patient" style={{ color: T, fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Req = () => <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>;
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 };
const inputStyle = {
  width: '100%', padding: '10px 13px', border: '1.5px solid #E5E7EB', borderRadius: 10,
  fontSize: 13, color: '#111827', background: '#FAFAFA', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};
