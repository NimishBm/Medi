import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, Stethoscope, CreditCard, Home, ListChecks } from 'lucide-react';

const T = '#0D9488';

export const BookingConfirmed = () => {
  const { state } = useLocation();
  const navigate  = useNavigate();

  const stored = (() => {
    try { return JSON.parse(sessionStorage.getItem('bookingConfirmed') || 'null'); }
    catch { return null; }
  })();
  const { appointment, doctor, totalAmount, paymentId } = state || stored || {};

  const fmtDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—';

  return (
    <div style={{ minHeight: '100vh', background: '#F0FDF4', fontFamily: 'system-ui,-apple-system,sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* Success icon */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 80, height: 80, background: '#D1FAE5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle size={44} color='#059669' strokeWidth={2} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#111827', margin: '0 0 6px' }}>Booking Confirmed!</h1>
          <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
            {totalAmount > 0 ? 'Payment successful. Your appointment is booked.' : 'Your appointment has been booked.'}
          </p>
        </div>

        {/* Details card */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #D1FAE5', overflow: 'hidden', marginBottom: 16 }}>

          {/* Doctor row */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, background: `linear-gradient(135deg,${T},#0F766E)`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Stethoscope size={20} color='#fff' />
            </div>
            <div>
              <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 2px', textTransform: 'uppercase', fontWeight: 700 }}>Doctor</p>
              <p style={{ fontSize: 15, fontWeight: 800, color: '#111827', margin: 0 }}>Dr. {doctor?.name || '—'}</p>
              <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>{doctor?.specialization || ''}</p>
            </div>
          </div>

          {/* Date + time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid #F3F4F6' }}>
            <div style={{ padding: '14px 20px', borderRight: '1px solid #F3F4F6', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <Calendar size={16} color={T} style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 2px', fontWeight: 700, textTransform: 'uppercase' }}>Date</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0 }}>{fmtDate(appointment?.appointmentDate)}</p>
              </div>
            </div>
            <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <Clock size={16} color={T} style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 2px', fontWeight: 700, textTransform: 'uppercase' }}>Time</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0 }}>{appointment?.appointmentTime || '—'}</p>
              </div>
            </div>
          </div>

          {/* Token + type */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: totalAmount > 0 ? '1px solid #F3F4F6' : 'none' }}>
            <div style={{ padding: '14px 20px', borderRight: '1px solid #F3F4F6' }}>
              <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 4px', fontWeight: 700, textTransform: 'uppercase' }}>Token No.</p>
              <p style={{ fontSize: 22, fontWeight: 900, color: T, margin: 0 }}>#{appointment?.tokenNumber ?? '—'}</p>
            </div>
            <div style={{ padding: '14px 20px' }}>
              <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 4px', fontWeight: 700, textTransform: 'uppercase' }}>Type</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0 }}>{appointment?.appointmentType || '—'}</p>
            </div>
          </div>

          {/* Payment row — only if paid */}
          {totalAmount > 0 && (
            <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <CreditCard size={16} color='#059669' style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 2px', fontWeight: 700, textTransform: 'uppercase' }}>Amount Paid</p>
                <p style={{ fontSize: 15, fontWeight: 900, color: '#059669', margin: 0 }}>₹{totalAmount?.toLocaleString('en-IN')}</p>
              </div>
              {paymentId && (
                <span style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'monospace', wordBreak: 'break-all', textAlign: 'right', maxWidth: 120 }}>{paymentId}</span>
              )}
            </div>
          )}
        </div>

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => navigate('/patient/appointments')}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', background: T, color: '#fff', border: 'none', borderRadius: 14, fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
            <ListChecks size={16} /> My Appointments
          </button>
          <button
            onClick={() => navigate('/patient')}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', background: '#fff', color: '#374151', border: '1.5px solid #E5E7EB', borderRadius: 14, fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
            <Home size={16} /> Home
          </button>
        </div>

        <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 16 }}>
          You'll receive a notification when the doctor confirms your slot.
        </p>
      </div>
    </div>
  );
};
