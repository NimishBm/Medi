import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { paymentAPI } from '../../services/api';
import { logout } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import { ChevronLeft, Stethoscope, CreditCard, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';

const T = '#0D9488';

const statusStyle = s => ({
  PAID:    { bg: '#D1FAE5', color: '#065F46' },
  PENDING: { bg: '#FEF9C3', color: '#92400E' },
  FAILED:  { bg: '#FEE2E2', color: '#991B1B' },
}[s] || { bg: '#F3F4F6', color: '#4B5563' });

export const Payments = () => {
  const { user } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    paymentAPI.getPaymentsByPatient(user._id)
      .then(r => setPayments(r.data))
      .catch(() => toast.error('Failed to load payments'))
      .finally(() => setIsLoading(false));
  }, [user._id]);

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F5F7FA' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: `4px solid ${T}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#374151', fontWeight: 600 }}>Loading payments...</p>
      </div>
    </div>
  );

  const totalPaid    = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.totalAmount, 0);
  const totalPending = payments.filter(p => p.status === 'PENDING').reduce((s, p) => s + p.totalAmount, 0);

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA', fontFamily: 'system-ui,-apple-system,sans-serif' }}>

      <header style={{ background: '#fff', borderBottom: '1px solid #E8ECF0', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/patient')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex', padding: 4 }}>
            <ChevronLeft size={22} />
          </button>
          <div onClick={() => navigate('/patient')} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <div style={{ width: 32, height: 32, background: `linear-gradient(135deg,${T},#0F766E)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stethoscope size={16} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 16, color: T }}>ClinicFlow</span>
          </div>
          {!isMobile && <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginLeft: 4 }}>/ Payments & Bills</span>}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F3F4F6', padding: '5px 10px', borderRadius: 20 }}>
              <div style={{ width: 24, height: 24, background: T, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12 }}>
                {user?.name?.charAt(0)}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{user?.name?.split(' ')[0]}</span>
            </div>
            <button onClick={() => dispatch(logout())} style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>Logout</button>
          </div>
        </div>
        <div style={{ background: T, height: 4 }} />
      </header>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '20px 16px 48px' }}>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total Paid', value: `₹${totalPaid.toLocaleString()}`, icon: CheckCircle, bg: '#D1FAE5', color: '#065F46', iconBg: '#BBF7D0' },
            { label: 'Pending',    value: `₹${totalPending.toLocaleString()}`, icon: Clock, bg: '#FEF9C3', color: '#92400E', iconBg: '#FDE68A' },
            { label: 'Transactions', value: payments.length, icon: CreditCard, bg: '#DBEAFE', color: '#1D4ED8', iconBg: '#BFDBFE' },
          ].map(({ label, value, icon: Icon, bg, color, iconBg }) => (
            <div key={label} style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, background: iconBg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={22} color={color} strokeWidth={2} />
              </div>
              <div>
                <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 3 }}>{label}</p>
                <p style={{ fontSize: 22, fontWeight: 900, color: '#111827' }}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Payments list */}
        {payments.length === 0 ? (
          <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: '56px 16px', textAlign: 'center' }}>
            <CreditCard size={48} color="#D1D5DB" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontWeight: 700, color: '#111827', marginBottom: 6 }}>No payment records</p>
            <p style={{ fontSize: 13, color: '#6B7280' }}>Your consultation bills will appear here.</p>
          </div>
        ) : (
          <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={16} color={T} />
              <p style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>Payment History</p>
            </div>

            {/* Table: header + rows share the same scroll container */}
            <div style={{ overflowX: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 90px 90px 100px 90px 90px', padding: '8px 20px', background: '#F9FAFB', borderBottom: '1px solid #F3F4F6', gap: 8, minWidth: 700 }}>
                {['Date', 'Doctor', 'Consult Fee', 'Extra', 'Total', 'Method', 'Status'].map(h => (
                  <p key={h} style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase' }}>{h}</p>
                ))}
              </div>

              {payments.map(p => {
                const sc = statusStyle(p.status);
                return (
                  <div key={p._id} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 90px 90px 100px 90px 90px', padding: '13px 20px', borderBottom: '1px solid #F9FAFB', gap: 8, alignItems: 'center', minWidth: 700 }}>
                    <p style={{ fontSize: 13, color: '#374151' }}>{new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Dr. {p.doctorId?.name || '—'}</p>
                    <p style={{ fontSize: 13, color: '#374151' }}>₹{p.consultationFee}</p>
                    <p style={{ fontSize: 13, color: '#374151' }}>₹{p.additionalCharges}</p>
                    <p style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>₹{p.totalAmount}</p>
                    <p style={{ fontSize: 12, color: '#6B7280' }}>{p.paymentMethod}</p>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 12, background: sc.bg, color: sc.color, width: 'fit-content' }}>{p.status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
