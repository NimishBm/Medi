import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useIsMobile } from '../../hooks/useIsMobile';
import { logout } from '../../store/slices/authSlice';
import {
  Stethoscope, CheckCircle, Calendar, Clock, User, CreditCard,
  Download, CalendarCheck, Home, Hash,
} from 'lucide-react';

const T = '#0D9488';

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const fmtDateTime = () =>
  new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const BookingConfirmed = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const isMobile  = useIsMobile();
  const { user }  = useSelector((s) => s.auth);

  const { appointment, doctor, totalFee, attendeeCount } = location.state || {};

  if (!appointment || !doctor) {
    navigate('/patient', { replace: true });
    return null;
  }

  const appt = Array.isArray(appointment) ? appointment[0] : appointment;
  const bookingRef = appt?._id?.slice(-8).toUpperCase() || 'N/A';

  const handleDownload = () => window.print();

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #receipt, #receipt * { visibility: visible; }
          #receipt { position: fixed; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
        }
        @keyframes pop {
          0%   { transform: scale(0.5); opacity: 0; }
          70%  { transform: scale(1.1); }
          100% { transform: scale(1);   opacity: 1; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#F5F7FA', fontFamily: 'system-ui,-apple-system,sans-serif' }}>

        {/* Navbar */}
        <header className="no-print" style={{ background: '#fff', borderBottom: '1px solid #E8ECF0', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div onClick={() => navigate('/patient')} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <div style={{ width: 32, height: 32, background: `linear-gradient(135deg,${T},#0F766E)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Stethoscope size={16} color="#fff" strokeWidth={2.5} />
              </div>
              <span style={{ fontWeight: 800, fontSize: 16, color: T }}>ClinicFlow</span>
            </div>
            {!isMobile && <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginLeft: 4 }}>/ Booking Confirmed</span>}
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

        <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px 48px' }}>

          {/* Success banner */}
          <div className="no-print" style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ animation: 'pop 0.4s ease forwards', display: 'inline-flex', width: 72, height: 72, background: '#DCFCE7', borderRadius: '50%', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <CheckCircle size={40} color="#16A34A" strokeWidth={2} />
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>Booking Confirmed!</h1>
            <p style={{ fontSize: 14, color: '#6B7280', margin: 0 }}>
              Your appointment has been successfully booked and payment received.
            </p>
          </div>

          {/* Receipt card */}
          <div id="receipt" style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 16, overflow: 'hidden', marginBottom: 20 }}>

            {/* Receipt header */}
            <div style={{ background: `linear-gradient(135deg,${T},#0F766E)`, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Stethoscope size={22} color="#fff" />
                <div>
                  <p style={{ fontWeight: 800, fontSize: 16, color: '#fff', margin: 0 }}>ClinicFlow</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', margin: '2px 0 0' }}>Appointment Receipt</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', margin: 0 }}>Issued</p>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', margin: '2px 0 0' }}>{fmtDateTime()}</p>
              </div>
            </div>

            <div style={{ padding: '22px 24px' }}>

              {/* Booking reference */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 10, padding: '10px 16px', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Hash size={16} color={T} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Booking Reference</span>
                </div>
                <span style={{ fontSize: 15, fontWeight: 800, color: T, letterSpacing: 1 }}>{bookingRef}</span>
              </div>

              {/* Doctor */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 18, borderBottom: '1px solid #F3F4F6', marginBottom: 18 }}>
                <div style={{ width: 52, height: 52, background: `linear-gradient(135deg,${T},#0F766E)`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 20, flexShrink: 0 }}>
                  {doctor.name.charAt(0)}
                </div>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 16, color: '#111827', margin: 0 }}>Dr. {doctor.name.replace(/^Dr\.?\s+/, '')}</p>
                  <p style={{ fontSize: 13, color: T, fontWeight: 600, margin: '3px 0 0' }}>{doctor.specialization}</p>
                </div>
              </div>

              {/* Appointment details grid */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 20 }}>
                <DetailItem icon={<Calendar size={15} color={T} />} label="Appointment Date" value={fmtDate(appt.appointmentDate)} />
                <DetailItem icon={<Clock size={15} color={T} />} label="Time Slot" value={appt.appointmentTime} />
                <DetailItem icon={<User size={15} color={T} />} label="Appointment Type" value={appt.appointmentType} />
                <DetailItem icon={<User size={15} color={T} />} label="Patient(s)" value={attendeeCount > 1 ? `${attendeeCount} persons` : user?.name} />
                {appt.reason && appt.reason !== 'Consultation' && (
                  <DetailItem icon={<User size={15} color={T} />} label="Reason" value={appt.reason} />
                )}
              </div>

              {/* Payment summary */}
              <div style={{ background: '#F9FAFB', border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '16px' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CreditCard size={15} color={T} /> Payment Summary
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <FeeRow label={`Consultation fee × ${attendeeCount}`} value={`₹${totalFee.toLocaleString('en-IN')}`} />
                  <FeeRow label="Platform fee" value="FREE" valueColor="#16A34A" />
                  <div style={{ borderTop: '1.5px dashed #E5E7EB', marginTop: 4, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>Total Paid</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: T }}>₹{totalFee.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 16, margin: '16px 0 0' }}>
                Please arrive 10 minutes before your appointment. Bring this receipt and a valid ID.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="no-print" style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 12 }}>
            <button onClick={handleDownload}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', border: `2px solid ${T}`, borderRadius: 12, background: '#fff', color: T, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              <Download size={16} /> Download Receipt
            </button>
            <button onClick={() => navigate('/patient/my-appointments')}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', border: 'none', borderRadius: 12, background: T, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              <CalendarCheck size={16} /> View Appointments
            </button>
            <button onClick={() => navigate('/patient')}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', border: '2px solid #E5E7EB', borderRadius: 12, background: '#fff', color: '#374151', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              <Home size={16} /> Back to Home
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const DetailItem = ({ icon, label, value }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {icon}
      <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
    </div>
    <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', paddingLeft: 21 }}>{value}</span>
  </div>
);

const FeeRow = ({ label, value, valueColor }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6B7280' }}>
    <span>{label}</span>
    <span style={{ fontWeight: 600, color: valueColor || '#111827' }}>{value}</span>
  </div>
);
