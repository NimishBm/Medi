import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useIsMobile } from '../../hooks/useIsMobile';
import { logout } from '../../store/slices/authSlice';
import { paymentAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  ChevronLeft, Stethoscope, Lock, Calendar, Clock, User,
  CheckCircle, ShieldCheck, CreditCard,
} from 'lucide-react';

const T = '#0D9488';

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

// Dynamically load the Razorpay checkout script
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (document.getElementById('razorpay-sdk')) { resolve(true); return; }
    const script = document.createElement('script');
    script.id  = 'razorpay-sdk';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export const PaymentPage = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const isMobile  = useIsMobile();
  const { user }  = useSelector((s) => s.auth);

  const { payload, doctor, attendeeCount } = location.state || {};

  if (!payload || !doctor) {
    navigate('/patient', { replace: true });
    return null;
  }

  const totalFee = (doctor.consultationFee || 0) * (attendeeCount || 1);
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    setPaying(true);
    try {
      // 1. Load Razorpay SDK
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Failed to load payment gateway. Check your internet connection.');
        setPaying(false);
        return;
      }

      // 2. Create order on backend
      const orderRes = await paymentAPI.createRazorpayOrder(totalFee);
      const order    = orderRes.data;

      // 3. Open Razorpay checkout modal
      const options = {
        key:      import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount:   order.amount,
        currency: order.currency,
        name:     'ClinicFlow',
        description: `Appointment with Dr. ${doctor.name.replace(/^Dr\.?\s+/, '')}`,
        order_id: order.id,
        prefill: {
          name:    user?.name || '',
          email:   user?.email || '',
          contact: user?.phone || '',
        },
        theme: { color: T },
        modal: {
          ondismiss: () => {
            toast('Payment cancelled.', { icon: '⚠️' });
            setPaying(false);
          },
        },
        handler: async ({ razorpay_payment_id, razorpay_order_id, razorpay_signature }) => {
          try {
            // 4. Verify on backend — also creates appointment + payment record
            const res = await paymentAPI.verifyRazorpayPayment({
              razorpay_order_id,
              razorpay_payment_id,
              razorpay_signature,
              appointmentPayload: payload,
              totalAmount: totalFee,
            });

            toast.success('Payment successful! Appointment confirmed.');
            navigate('/patient/booking-confirmed', {
              state: { appointment: res.data, doctor, totalFee, attendeeCount },
              replace: true,
            });
          } catch (e) {
            toast.error(e.response?.data?.message || 'Payment verification failed. Contact support.');
            setPaying(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        toast.error(`Payment failed: ${response.error?.description || 'Unknown error'}`);
        setPaying(false);
      });
      rzp.open();

    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not initiate payment. Try again.');
      setPaying(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA', fontFamily: 'system-ui,-apple-system,sans-serif' }}>

      {/* Navbar */}
      <header style={{ background: '#fff', borderBottom: '1px solid #E8ECF0', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex', padding: 4 }}>
            <ChevronLeft size={22} />
          </button>
          <div onClick={() => navigate('/patient')} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <div style={{ width: 32, height: 32, background: `linear-gradient(135deg,${T},#0F766E)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stethoscope size={16} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 16, color: T }}>ClinicFlow</span>
          </div>
          {!isMobile && <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginLeft: 4 }}>/ Secure Payment</span>}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F3F4F6', padding: '5px 10px', borderRadius: 20 }}>
              <div style={{ width: 24, height: 24, background: T, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12 }}>
                {user?.name?.charAt(0)}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{user?.name?.split(' ')[0]}</span>
            </div>
            <button onClick={() => dispatch(logout())}
              style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>
              Logout
            </button>
          </div>
        </div>
        <div style={{ background: T, height: 4 }} />
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px 48px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 340px', gap: 20, alignItems: 'start' }}>

        {/* ── Left: Payment panel ── */}
        <div>
          {/* Secure badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <Lock size={14} color={T} />
            <span style={{ fontSize: 12, color: T, fontWeight: 700 }}>256-bit SSL Encrypted — Safe & Secure Payment</span>
          </div>

          {/* Payment card */}
          <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ height: 5, background: `linear-gradient(90deg,${T},#14B8A6)` }} />
            <div style={{ padding: '28px 24px' }}>

              {/* Amount */}
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>Total Amount Due</p>
                <p style={{ fontSize: 40, fontWeight: 900, color: '#111827', lineHeight: 1 }}>
                  ₹{totalFee.toLocaleString('en-IN')}
                </p>
                {attendeeCount > 1 && (
                  <p style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                    ₹{doctor.consultationFee} × {attendeeCount} persons
                  </p>
                )}
              </div>

              {/* Accepted methods */}
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textAlign: 'center', marginBottom: 12 }}>
                  ACCEPTED PAYMENT METHODS
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                  {['Visa', 'Mastercard', 'UPI', 'Net Banking', 'Wallets'].map(m => (
                    <span key={m} style={{ padding: '4px 12px', border: '1.5px solid #E5E7EB', borderRadius: 20, fontSize: 12, fontWeight: 600, color: '#374151', background: '#F9FAFB' }}>
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              {/* Razorpay pay button */}
              <button onClick={handlePay} disabled={paying}
                style={{
                  width: '100%', padding: '16px', borderRadius: 14, border: 'none',
                  background: paying ? '#9CA3AF' : '#072654',
                  color: '#fff', fontWeight: 800, fontSize: 16, cursor: paying ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  transition: 'background 0.15s',
                }}>
                {paying ? (
                  <>
                    <div style={{ width: 18, height: 18, border: '3px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    Opening payment…
                  </>
                ) : (
                  <>
                    <CreditCard size={18} />
                    Pay ₹{totalFee.toLocaleString('en-IN')} with Razorpay
                  </>
                )}
              </button>

              {/* Trust badges */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6B7280' }}>
                  <ShieldCheck size={13} color={T} /> 100% Secure
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6B7280' }}>
                  <Lock size={12} color={T} /> Powered by Razorpay
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6B7280' }}>
                  <CheckCircle size={12} color={T} /> PCI-DSS Compliant
                </div>
              </div>
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: 11, color: '#9CA3AF', marginTop: 10 }}>
            By paying you agree to our terms. Free cancellation up to 24 hrs before the appointment.
          </p>
        </div>

        {/* ── Right: Order summary ── */}
        <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 16, overflow: 'hidden', position: isMobile ? 'static' : 'sticky', top: 76 }}>
          <div style={{ height: 5, background: `linear-gradient(90deg,${T},#14B8A6)` }} />
          <div style={{ padding: '20px' }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: '#111827', marginBottom: 14 }}>Order Summary</p>

            {/* Doctor */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #F3F4F6' }}>
              <div style={{ width: 44, height: 44, background: `linear-gradient(135deg,${T},#0F766E)`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 18, flexShrink: 0 }}>
                {doctor.name.charAt(0)}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', margin: 0 }}>Dr. {doctor.name.replace(/^Dr\.?\s+/, '')}</p>
                <p style={{ fontSize: 12, color: T, fontWeight: 600, margin: '2px 0 0' }}>{doctor.specialization}</p>
              </div>
            </div>

            {/* Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <SummaryRow icon={<Calendar size={14} color="#6B7280" />} label="Date"    value={fmtDate(payload.appointmentDate)} />
              <SummaryRow icon={<Clock size={14} color="#6B7280" />}    label="Time"    value={payload.appointmentTime} />
              <SummaryRow icon={<User size={14} color="#6B7280" />}     label="Type"    value={payload.appointmentType} />
              {attendeeCount > 1 && (
                <SummaryRow icon={<User size={14} color="#6B7280" />} label="Patients" value={`${attendeeCount} persons`} />
              )}
            </div>

            {/* Fee breakdown */}
            <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6B7280' }}>
                <span>Consultation × {attendeeCount}</span>
                <span>₹{(doctor.consultationFee * attendeeCount).toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6B7280' }}>
                <span>Platform fee</span>
                <span style={{ color: '#16A34A', fontWeight: 600 }}>FREE</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, color: '#111827', paddingTop: 8, borderTop: '1.5px dashed #E5E7EB', marginTop: 4 }}>
                <span>Total</span>
                <span style={{ color: T }}>₹{totalFee.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div style={{ marginTop: 16, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={15} color={T} />
              <p style={{ fontSize: 11, color: '#15803D', fontWeight: 600, margin: 0 }}>Free cancellation up to 24 hrs before appointment</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

const SummaryRow = ({ icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    {icon}
    <span style={{ fontSize: 12, color: '#6B7280', minWidth: 50 }}>{label}</span>
    <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginLeft: 'auto', textAlign: 'right' }}>{value}</span>
  </div>
);
