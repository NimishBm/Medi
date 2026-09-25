import { useLocation, useNavigate } from 'react-router-dom';
import { XCircle, RefreshCw, Home, Stethoscope, IndianRupee, AlertTriangle } from 'lucide-react';

export const PaymentFailed = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const stored = (() => {
    try { return JSON.parse(sessionStorage.getItem('paymentFailed') || 'null'); }
    catch { return null; }
  })();
  const { doctor, totalAmount, errorReason, errorCode } = state || stored || {};

  return (
    <div style={{ minHeight: '100vh', background: '#FFF1F2', fontFamily: 'system-ui,-apple-system,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* Failure icon */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 80, height: 80, background: '#FFE4E6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <XCircle size={44} color='#E11D48' strokeWidth={2} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#111827', margin: '0 0 6px' }}>Payment Failed</h1>
          <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
            Your payment could not be processed. No amount has been deducted.
          </p>
        </div>

        {/* Details card */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #FFE4E6', overflow: 'hidden', marginBottom: 16 }}>

          {/* Doctor row — only if we have doctor info */}
          {doctor && (
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#6B7280,#4B5563)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Stethoscope size={20} color='#fff' />
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 2px', textTransform: 'uppercase', fontWeight: 700 }}>Doctor</p>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#111827', margin: 0 }}>Dr. {doctor.name}</p>
                <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>{doctor.specialization || ''}</p>
              </div>
            </div>
          )}

          {/* Amount */}
          {totalAmount > 0 && (
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 12 }}>
              <IndianRupee size={18} color='#E11D48' style={{ flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 2px', textTransform: 'uppercase', fontWeight: 700 }}>Amount</p>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#E11D48', margin: 0 }}>₹{totalAmount?.toLocaleString('en-IN')} — not charged</p>
              </div>
            </div>
          )}

          {/* Error reason */}
          <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <AlertTriangle size={18} color='#F59E0B' style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 2px', textTransform: 'uppercase', fontWeight: 700 }}>Reason</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: 0 }}>
                {errorReason || 'Payment was declined or cancelled.'}
              </p>
              {errorCode && (
                <p style={{ fontSize: 11, color: '#9CA3AF', margin: '4px 0 0', fontFamily: 'monospace' }}>Code: {errorCode}</p>
              )}
            </div>
          </div>
        </div>

        {/* Helper note */}
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10 }}>
          <AlertTriangle size={15} color='#D97706' style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12, color: '#92400E', margin: 0, lineHeight: 1.5 }}>
            If money was deducted from your account, it will be automatically refunded within 5–7 business days.
          </p>
        </div>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', background: '#E11D48', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
            <RefreshCw size={16} /> Try Again
          </button>
          <button
            onClick={() => navigate('/patient')}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', background: '#fff', color: '#374151', border: '1.5px solid #E5E7EB', borderRadius: 14, fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
            <Home size={16} /> Go Home
          </button>
        </div>

        <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 16 }}>
          Need help? Contact support with your order details.
        </p>
      </div>
    </div>
  );
};
