import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { setUser } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import { Stethoscope, Eye, EyeOff, Calendar, Users, BarChart2, Clock } from 'lucide-react';

const T = '#0D9488';

const FEATURES = [
  { icon: Calendar,   title: 'View Appointments',     sub: 'See all scheduled patient consultations' },
  { icon: Clock,      title: 'Manage Patient Queue',  sub: 'Track and manage real-time patient queue' },
  { icon: Users,      title: 'Patient Records',       sub: 'Access consultation history and notes' },
  { icon: BarChart2,  title: 'Clinic Analytics',      sub: 'Track performance and revenue insights' },
];

export const DoctorLogin = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPw, setShowPw]     = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    try {
      const res = await authAPI.login({ email, password });
      if (res.data.user.role !== 'DOCTOR') {
        toast.error('Please use your doctor account.');
        return;
      }
      dispatch(setUser({ user: res.data.user, token: res.data.token }));
      toast.success('Welcome back, Doctor!');
      navigate('/doctor');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'system-ui,-apple-system,sans-serif' }}>

      {/* Left panel */}
      <div style={{ display: 'none', flex: '0 0 45%', background: 'linear-gradient(145deg,#1E3A5F,#0F2944,#0D9488)', flexDirection: 'column', justifyContent: 'center', padding: '48px 52px' }}
        className="doc-left-panel">
        <style>{`.doc-left-panel{display:none} @media(min-width:768px){.doc-left-panel{display:flex!important}}`}</style>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
          <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.15)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Stethoscope size={24} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>ClinicFlow</span>
            <span style={{ fontSize: 12, color: '#99F6E4', display: 'block', fontWeight: 600, marginTop: -2 }}>for Doctors</span>
          </div>
        </div>

        <h2 style={{ fontSize: 30, fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 8 }}>
          Run your clinic<br />more efficiently.
        </h2>
        <p style={{ fontSize: 15, color: '#94A3B8', marginBottom: 44 }}>
          Everything you need to manage patients, queues and consultations.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {FEATURES.map(({ icon: Icon, title, sub }) => (
            <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ width: 38, height: 38, background: 'rgba(255,255,255,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={18} color="#5EEAD4" strokeWidth={2} />
              </div>
              <div>
                <p style={{ fontWeight: 700, color: '#fff', fontSize: 14, marginBottom: 2 }}>{title}</p>
                <p style={{ fontSize: 13, color: '#94A3B8' }}>{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#F5F7FA', padding: '32px 16px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32, justifyContent: 'center' }}
            className="doc-mobile-logo">
            <style>{`.doc-mobile-logo{display:flex} @media(min-width:768px){.doc-mobile-logo{display:none!important}}`}</style>
            <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#1E3A5F,#0D9488)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stethoscope size={20} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#1E3A5F' }}>ClinicFlow</span>
          </div>

          <div style={{ background: '#fff', borderRadius: 20, padding: '36px 32px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1.5px solid #E5E7EB' }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#111827', marginBottom: 4 }}>Doctor Login</h2>
            <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 28 }}>Manage your clinic and patients</p>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div>
                <label style={labelStyle}>Email address</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="doctor@clinic.com" style={inputStyle}
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
                style={{ width: '100%', background: loading ? '#9CA3AF' : '#1E3A5F', color: '#fff', fontWeight: 800, fontSize: 15, padding: '13px', borderRadius: 11, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 6 }}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 13, color: '#6B7280' }}>
                New doctor?{' '}
                <Link to="/register/doctor" style={{ color: T, fontWeight: 700, textDecoration: 'none' }}>Register your clinic</Link>
              </p>
              <Link to="/login/patient" style={{ fontSize: 12, color: '#9CA3AF', textDecoration: 'none' }}>
                Are you a patient? Login here →
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
