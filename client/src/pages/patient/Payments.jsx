import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { paymentAPI } from '../../services/api';
import { logout } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import {
  ChevronLeft, Stethoscope, CreditCard, TrendingUp, Clock,
  CheckCircle, Download, X, Hash,
} from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { NotificationBell } from '../../components/NotificationBell';

const T = '#0D9488';

const statusStyle = s => ({
  PAID:     { bg: '#D1FAE5', color: '#065F46' },
  PENDING:  { bg: '#FEF9C3', color: '#92400E' },
  REFUNDED: { bg: '#DBEAFE', color: '#1D4ED8' },
  FAILED:   { bg: '#FEE2E2', color: '#991B1B' },
}[s] || { bg: '#F3F4F6', color: '#4B5563' });

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

const fmtDateTime = (iso) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const Payments = () => {
  const { user }  = useSelector(s => s.auth);
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const isMobile  = useIsMobile();

  const [payments, setPayments]         = useState([]);
  const [isLoading, setIsLoading]       = useState(true);
  const [receiptPayment, setReceiptPayment] = useState(null);

  useEffect(() => {
    paymentAPI.getPaymentsByPatient(user._id)
      .then(r => setPayments(r.data))
      .catch(() => toast.error('Failed to load payments'))
      .finally(() => setIsLoading(false));
  }, [user._id]);

  const openReceipt  = (p) => setReceiptPayment(p);
  const closeReceipt = () => setReceiptPayment(null);
  const printReceipt = () => window.print();

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
    <>
      {/* Print strategy:
          - Hide everything via body > * { visibility: hidden }
          - .receipt-printable + descendants become visible, positioned full-page
          - .receipt-modal-actions hides the close/print buttons from the printout */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media print {
          body > * { visibility: hidden !important; }
          .receipt-modal-backdrop { visibility: hidden !important; }
          .receipt-modal-actions  { display: none !important; }
          .receipt-printable, .receipt-printable * { visibility: visible !important; }
          .receipt-printable {
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 100% !important;
            background: #fff !important;
            z-index: 9999 !important;
          }
        }
      `}</style>

      {/* Receipt modal */}
      {receiptPayment && (
        <div
          className="receipt-modal-backdrop"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            {/* Close button */}
            <button
              className="receipt-modal-actions"
              onClick={closeReceipt}
              style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.08)', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1 }}>
              <X size={16} color="#374151" />
            </button>

            {/* Receipt content — this is what prints */}
            <div className="receipt-printable">
              <ReceiptCard payment={receiptPayment} user={user} />
            </div>

            {/* Action buttons */}
            <div className="receipt-modal-actions" style={{ padding: '0 24px 24px', display: 'flex', gap: 10 }}>
              <button
                onClick={printReceipt}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px', background: T, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                <Download size={16} /> Download / Print
              </button>
              <button
                onClick={closeReceipt}
                style={{ flex: 1, padding: '11px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main page */}
      <div style={{ minHeight: '100vh', background: '#F5F7FA', fontFamily: 'system-ui,-apple-system,sans-serif' }}>

        {/* Navbar */}
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
              <NotificationBell userId={user?._id} />
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
              { label: 'Total Paid',   value: `₹${totalPaid.toLocaleString('en-IN')}`,    icon: CheckCircle, iconBg: '#BBF7D0', color: '#065F46' },
              { label: 'Pending',      value: `₹${totalPending.toLocaleString('en-IN')}`, icon: Clock,        iconBg: '#FDE68A', color: '#92400E' },
              { label: 'Transactions', value: payments.length,                             icon: CreditCard,   iconBg: '#BFDBFE', color: '#1D4ED8' },
            ].map(({ label, value, icon: Icon, iconBg, color }) => (
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

          {/* Payments table */}
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
                <p style={{ fontSize: 14, fontWeight: 800, color: '#111827', margin: 0 }}>Payment History</p>
              </div>

              <div style={{ overflowX: 'auto' }}>
                {/* Header */}
                <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 90px 90px 100px 100px 80px 80px', padding: '8px 20px', background: '#F9FAFB', borderBottom: '1px solid #F3F4F6', gap: 8, minWidth: 760 }}>
                  {['Date', 'Doctor', 'Consult Fee', 'Extra', 'Total', 'Method', 'Status', 'Receipt'].map(h => (
                    <p key={h} style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', margin: 0 }}>{h}</p>
                  ))}
                </div>

                {payments.map(p => {
                  const sc = statusStyle(p.status);
                  return (
                    <div key={p._id} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 90px 90px 100px 100px 80px 80px', padding: '13px 20px', borderBottom: '1px solid #F9FAFB', gap: 8, alignItems: 'center', minWidth: 760 }}>
                      <p style={{ fontSize: 13, color: '#374151', margin: 0 }}>
                        {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>Dr. {p.doctorId?.name || '—'}</p>
                      <p style={{ fontSize: 13, color: '#374151', margin: 0 }}>₹{p.consultationFee}</p>
                      <p style={{ fontSize: 13, color: '#374151', margin: 0 }}>₹{p.additionalCharges || 0}</p>
                      <p style={{ fontSize: 14, fontWeight: 800, color: '#111827', margin: 0 }}>₹{p.totalAmount}</p>
                      <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>{p.paymentMethod}</p>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 12, background: sc.bg, color: sc.color, width: 'fit-content' }}>
                        {p.status}
                      </span>
                      <button
                        onClick={() => openReceipt(p)}
                        title="View & download receipt"
                        style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', color: T, fontWeight: 700, fontSize: 12, whiteSpace: 'nowrap' }}>
                        <Download size={13} /> PDF
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

/* ── Receipt card ─────────────────────────────────────────────────── */
const ReceiptCard = ({ payment: p, user }) => {
  const ref = p._id?.slice(-8).toUpperCase() || 'N/A';
  const sc  = statusStyle(p.status);

  return (
    <div style={{ padding: '24px 24px 16px' }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg,${T},#0F766E)`, borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Stethoscope size={20} color="#fff" />
          <div>
            <p style={{ fontWeight: 800, fontSize: 15, color: '#fff', margin: 0 }}>ClinicFlow</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', margin: '2px 0 0' }}>Payment Receipt</p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', margin: 0 }}>Issued</p>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', margin: '2px 0 0' }}>{fmtDateTime(p.createdAt)}</p>
        </div>
      </div>

      {/* Ref + status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '10px 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Hash size={14} color={T} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Receipt No.</span>
          <span style={{ fontSize: 14, fontWeight: 800, color: T, letterSpacing: 1 }}>{ref}</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12, background: sc.bg, color: sc.color }}>{p.status}</span>
      </div>

      <Section label="Patient">
        <Row label="Name"  value={user?.name} />
        <Row label="Email" value={user?.email} />
        <Row label="Phone" value={user?.phone || '—'} />
      </Section>

      <Section label="Doctor">
        <Row label="Name"           value={`Dr. ${p.doctorId?.name || '—'}`} />
        <Row label="Specialization" value={p.doctorId?.specialization || '—'} />
      </Section>

      <Section label="Payment Details">
        <Row label="Date"           value={fmtDate(p.paymentDate || p.createdAt)} />
        <Row label="Payment Method" value={p.paymentMethod} />
        {p.razorpayPaymentId && <Row label="Transaction ID" value={p.razorpayPaymentId} mono />}
        {p.razorpayOrderId   && <Row label="Order ID"       value={p.razorpayOrderId}   mono />}
      </Section>

      <div style={{ border: '1.5px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '10px 16px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', margin: 0 }}>Amount Breakdown</p>
        </div>
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <AmtRow label="Consultation Fee"   value={`₹${p.consultationFee}`} />
          <AmtRow label="Additional Charges" value={`₹${p.additionalCharges || 0}`} />
          <AmtRow label="Platform Fee"       value="FREE" valueColor="#16A34A" />
          <div style={{ borderTop: '1.5px dashed #E5E7EB', paddingTop: 10, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>Total Paid</span>
            <span style={{ fontSize: 15, fontWeight: 900, color: T }}>₹{p.totalAmount}</span>
          </div>
        </div>
      </div>

      <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginBottom: 4 }}>
        Computer-generated receipt — no signature required.
      </p>
    </div>
  );
};

const Section = ({ label, children }) => (
  <div style={{ border: '1.5px solid #E5E7EB', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
    <div style={{ padding: '8px 16px', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', margin: 0 }}>{label}</p>
    </div>
    <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
  </div>
);

const Row = ({ label, value, mono }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
    <span style={{ fontSize: 12, color: '#6B7280' }}>{label}</span>
    <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', textAlign: 'right', fontFamily: mono ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>{value}</span>
  </div>
);

const AmtRow = ({ label, value, valueColor }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
    <span style={{ fontSize: 13, color: '#6B7280' }}>{label}</span>
    <span style={{ fontSize: 13, fontWeight: 600, color: valueColor || '#111827' }}>{value}</span>
  </div>
);
