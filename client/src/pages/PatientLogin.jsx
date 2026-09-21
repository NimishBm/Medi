import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { authAPI } from '../services/api';
import { setUser } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import { Stethoscope, Eye, EyeOff, CheckCircle, Calendar, Clock, Users } from 'lucide-react';

const T = '#0D9488';

const FEATURES = [
  { icon: Stethoscope, title: 'Find Verified Doctors',   sub: 'Search by specialty, location and availability' },
  { icon: Calendar,    title: 'Book Appointments',        sub: 'Instant booking with no waiting on hold' },
  { icon: Clock,       title: 'Live Queue Tracking',      sub: 'Know your wait time before you leave home' },
  { icon: Users,       title: 'Family Health Management', sub: 'Manage appointments for your whole family' },
];

export const PatientLogin = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const res = await authAPI.googleLogin(credentialResponse.credential);
      dispatch(setUser({ user: res.data.user, token: res.data.token }));
      toast.success('Welcome!');
      navigate('/patient');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    try {
      const res = await authAPI.login({ email, password });
      if (res.data.user.role !== 'PATIENT') {
        toast.error('Please use your patient account.');
        return;
      }
      dispatch(setUser({ user: res.data.user, token: res.data.token }));
      toast.success('Welcome back!');
      navigate('/patient');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'system-ui,-apple-system,sans-serif' }}>

      {/* Left panel — desktop only */}
      <div style={{ display: 'none', flex: '0 0 45%', background: `linear-gradient(145deg,${T},#0F766E,#115E59)`, flexDirection: 'column', justifyContent: 'center', padding: '48px 52px' }}
        className="login-left-panel">
        <style>{`.login-left-panel{display:none} @media(min-width:768px){.login-left-panel{display:flex!important}}`}</style>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
          <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Stethoscope size={24} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>ClinicFlow</span>
        </div>

        <h2 style={{ fontSize: 32, fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 8 }}>
          Your Health,<br />Simplified.
        </h2>
        <p style={{ fontSize: 15, color: '#99F6E4', marginBottom: 44 }}>
          Everything you need to manage your healthcare in one place.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {FEATURES.map(({ icon: Icon, title, sub }) => (
            <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 38, height: 38, background: 'rgba(255,255,255,0.15)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={18} color="#fff" strokeWidth={2} />
              </div>
              <div>
                <p style={{ fontWeight: 700, color: '#fff', fontSize: 14, marginBottom: 2 }}>{title}</p>
                <p style={{ fontSize: 13, color: '#CCFBF1' }}>{sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 52, padding: '16px 20px', background: 'rgba(255,255,255,0.1)', borderRadius: 14, borderLeft: '3px solid rgba(255,255,255,0.4)' }}>
          <p style={{ color: '#E0FDF4', fontSize: 13, fontStyle: 'italic', lineHeight: 1.6 }}>
            "ClinicFlow cut my waiting room time in half. I knew exactly when to arrive."
          </p>
          <p style={{ color: '#99F6E4', fontSize: 12, fontWeight: 600, marginTop: 8 }}>— Patient, Mumbai</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#F5F7FA', padding: '32px 16px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32, justifyContent: 'center' }}
            className="mobile-logo">
            <style>{`.mobile-logo{display:flex} @media(min-width:768px){.mobile-logo{display:none!important}}`}</style>
            <div style={{ width: 38, height: 38, background: `linear-gradient(135deg,${T},#0F766E)`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stethoscope size={20} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 20, fontWeight: 900, color: T }}>ClinicFlow</span>
          </div>

          <div style={{ background: '#fff', borderRadius: 20, padding: '36px 32px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1.5px solid #E5E7EB' }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#111827', marginBottom: 4 }}>Welcome back</h2>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 28 }}>Sign in to your patient account</p>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div>
                <label style={labelStyle}>Email address</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com" style={inputStyle}
                  onFocus={e => e.target.style.borderColor = T}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                />
              </div>

              <div>
                <label style={labelStyle}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" style={{ ...inputStyle, paddingRight: 40 }}
                    onFocus={e => e.target.style.borderColor = T}
                    onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex' }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                style={{ width: '100%', background: loading ? '#9CA3AF' : T, color: '#fff', fontWeight: 800, fontSize: 15, padding: '13px', borderRadius: 11, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 6, transition: 'background 0.15s' }}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 16px' }}>
              <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
              <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>or</span>
              <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error('Google sign-in failed')}
                width="368"
                text="signin_with"
                shape="rectangular"
                theme="outline"
              />
            </div>

            <div style={{ textAlign: 'center', marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 13, color: '#6B7280' }}>
                Don't have an account?{' '}
                <Link to="/register" style={{ color: T, fontWeight: 700, textDecoration: 'none' }}>Create account</Link>
              </p>
              <Link to="/login/doctor" style={{ fontSize: 12, color: '#9CA3AF', textDecoration: 'none' }}>
                Are you a doctor? Login here →
              </Link>
            </div>
          </div>
        </div>
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
