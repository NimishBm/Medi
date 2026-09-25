import { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { doctorAPI, queueAPI, appointmentAPI } from '../../services/api';
import { logout } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import { ChevronLeft, Stethoscope, Star, Clock, MapPin, Phone, CheckCircle, Calendar, Building2 } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';

const T = '#0D9488';

export const DoctorDetail = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(s => s.auth.user);

  const [doctor, setDoctor]         = useState(null);
  const [queueStats, setQueueStats] = useState(null);
  const [myAppt, setMyAppt]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetch = async () => {
      try {
        const [docRes, qRes, apptRes] = await Promise.all([
          doctorAPI.getDoctorById(doctorId),
          queueAPI.getQueueByDoctorId(doctorId),
          user?.role === 'PATIENT' ? appointmentAPI.getAppointments() : Promise.resolve({ data: [] }),
        ]);
        if (docRes.data.verificationStatus === 'REJECTED') {
          toast.error('This doctor profile is not available');
          navigate(user ? '/patient/marketplace' : '/marketplace');
          return;
        }
        setDoctor(docRes.data);
        setQueueStats(qRes.data);

        // Find the nearest upcoming/today appointment with this specific doctor
        const todayStr = new Date().toISOString().slice(0, 10);
        const appts = (Array.isArray(apptRes.data) ? apptRes.data : [])
          .filter(a => a.status !== 'CANCELLED')
          .filter(a => {
            const did = a.doctorId?._id || a.doctorId;
            return String(did) === String(doctorId);
          })
          .filter(a => new Date(a.appointmentDate).toISOString().slice(0, 10) >= todayStr)
          .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate));
        setMyAppt(appts[0] || null);
      } catch {
        toast.error('Failed to load doctor details');
        navigate(user ? '/patient/marketplace' : '/marketplace');
      } finally { setLoading(false); }
    };
    fetch();
  }, [doctorId, navigate, user]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F5F7FA' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: `4px solid ${T}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#374151', fontWeight: 600 }}>Loading profile...</p>
      </div>
    </div>
  );

  if (!doctor) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <p style={{ color: '#6B7280' }}>Doctor not found</p>
    </div>
  );

  const bookRoute = user ? `/patient/doctors/${doctorId}/book` : null;

  const fmtTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  const fmtApptLabel = () => {
    if (!myAppt) return null;
    const dateStr = new Date(myAppt.appointmentDate).toISOString().slice(0, 10);
    const todayStr = new Date().toISOString().slice(0, 10);
    const datePart = dateStr === todayStr
      ? 'Today'
      : new Date(myAppt.appointmentDate).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
    return `${datePart} · ${fmtTime(myAppt.appointmentTime)}`;
  };

  const handleBook = () => {
    if (user) navigate(bookRoute);
    else { toast.error('Login to book an appointment'); navigate('/login/patient'); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
      {user && user.role !== 'PATIENT' && <Navigate to="/doctor" replace />}

      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #E8ECF0', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate(user ? '/patient/marketplace' : '/marketplace')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex', padding: 4 }}>
            <ChevronLeft size={22} />
          </button>
          <div onClick={() => navigate(user ? '/patient' : '/')} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <div style={{ width: 32, height: 32, background: `linear-gradient(135deg,${T},#0F766E)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stethoscope size={16} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 16, color: T }}>MediQ</span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {user ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F3F4F6', padding: '5px 10px', borderRadius: 20 }}>
                  <div style={{ width: 24, height: 24, background: T, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12 }}>
                    {user.name?.charAt(0)}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{user.name?.split(' ')[0]}</span>
                </div>
                <button onClick={() => dispatch(logout())} style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>Logout</button>
              </>
            ) : (
              <button onClick={() => navigate('/login/patient')}
                style={{ background: T, color: '#fff', fontWeight: 700, fontSize: 12, padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
                Login to Book
              </button>
            )}
          </div>
        </div>
        <div style={{ background: T, height: 4 }} />
      </header>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px 48px' }}>

        {/* Hero card */}
        <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 20, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ height: 80, background: `linear-gradient(135deg,${T},#0F766E,#115E59)` }} />
          <div style={{ padding: '0 24px 24px', marginTop: -32 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
                <div style={{ width: 72, height: 72, background: '#fff', borderRadius: '50%', border: `4px solid #fff`,marginTop:'-16px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T, fontWeight: 900, fontSize: 28 }}>
                  {doctor.name.replace(/^Dr\.?\s+/, '').charAt(0)}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                    <h2 style={{ fontSize: 22, fontWeight: 900, color: '#111827', margin: 0 }}>
                      Dr. {doctor.name.replace(/^Dr\.?\s+/, '')}
                    </h2>
                    <VerificationBadge status={doctor.verificationStatus || 'PENDING'} />
                  </div>
                  <p style={{ fontSize: 14, color: '#6B7280', fontWeight: 600 }}>{doctor.specialization}</p>
                  {doctor.organizationIds?.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                      {doctor.organizationIds.map(org => (
                        <button key={org._id}
                          onClick={() => navigate(user ? `/patient/organizations/${org._id}` : `/organizations/${org._id}`)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '3px 9px', background: '#EFF6FF', color: '#1D4ED8', border: '1.5px solid #BFDBFE', borderRadius: 20, cursor: 'pointer' }}>
                          <Building2 size={11} />{org.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button onClick={handleBook}
                style={{ background: '#fff', color: T, fontWeight: 800, fontSize: 14, padding: '12px 28px', borderRadius: 12, border: `2px solid ${T}`, cursor: 'pointer' }}>
                Book Appointment
              </button>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(100px,1fr))', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'Experience', value: `${doctor.experience}yr` },
                { label: 'Fees', value: `₹${doctor.consultationFee}` },
                { label: 'Rating', value: doctor.averageRating > 0 ? `${doctor.averageRating.toFixed(1)} ★` : '—' },
                { label: 'In Queue', value: `${queueStats?.waiting || 0}` },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: '#F5F7FA', borderRadius: 12, padding: '12px 14px' }}>
                  <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{label}</p>
                  <p style={{ fontSize: 18, fontWeight: 900, color: '#111827' }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Appointment / queue status */}
            {myAppt ? (
              <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Calendar size={18} color={T} />
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: '#065F46' }}>
                    Your appointment: {fmtApptLabel()}
                  </p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                    {myAppt.tokenNumber && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#1D4ED8', background: '#EFF6FF', padding: '2px 8px', borderRadius: 6 }}>
                        Token #{myAppt.tokenNumber}
                      </span>
                    )}
                    <span style={{ fontSize: 12, color: '#6B7280' }}>
                      {queueStats?.waiting || 0} patients currently in queue
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: '#F5F7FA', border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Clock size={18} color="#9CA3AF" />
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: '#374151' }}>
                    {queueStats?.waiting === 0 ? 'No one in queue right now' : `${queueStats?.waiting || 0} patients currently in queue`}
                  </p>
                  <p style={{ fontSize: 12, color: '#9CA3AF' }}>Book an appointment to secure your slot</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1fr) 280px', gap: 20, alignItems: 'start' }}>

          {/* Main column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* About */}
            <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: '20px 24px' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 14 }}>
                About Dr. {doctor.name.replace(/^Dr\.?\s+/, '')}
              </h3>
              {doctor.qualifications?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {doctor.qualifications.map((q, i) => (
                    <span key={i} style={{ background: '#F0FDF4', color: T, fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20, border: '1px solid #BBF7D0' }}>{q}</span>
                  ))}
                </div>
              )}
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7 }}>
                Experienced {doctor.specialization} with {doctor.experience} years of practice. Specializes in comprehensive patient care
                with a focus on quality and patient satisfaction. Average consultation time: {doctor.averageConsultationTime || 10} minutes.
              </p>
              {doctor.clinicName && (
                <div style={{ marginTop: 14, padding: '12px 14px', background: '#F5F7FA', borderRadius: 10 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>{doctor.clinicName}</p>
                  {(doctor.clinicAddress || doctor.clinicCity) && <p style={{ fontSize: 12, color: '#6B7280' }}>{[doctor.clinicAddress, doctor.clinicCity].filter(Boolean).join(', ')}</p>}
                  {doctor.clinicPhone && <p style={{ fontSize: 12, color: T, marginTop: 4, fontWeight: 600 }}>{doctor.clinicPhone}</p>}
                </div>
              )}
            </div>

            {/* Schedule */}
            <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: '20px 24px' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 14 }}>Weekly Schedule</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 8 }}>
                {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(day => {
                  const avail = doctor.availability?.[day];
                  const open = avail?.start && avail?.end;
                  const isDayOff = doctor.daysOff?.includes(day);
                  return (
                    <div key={day} style={{ padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${open && !isDayOff ? '#BBF7D0' : '#E5E7EB'}`, background: open && !isDayOff ? '#F0FDF4' : '#FAFAFA' }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'capitalize', marginBottom: 2 }}>{day}</p>
                      <p style={{ fontSize: 12, fontWeight: 600, color: open && !isDayOff ? T : '#9CA3AF' }}>
                        {isDayOff ? 'Day Off' : open ? `${avail.start} – ${avail.end}` : 'Closed'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reviews placeholder */}
            <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: '20px 24px' }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 14 }}>Patient Reviews</h3>
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <Star size={36} color="#D1D5DB" style={{ margin: '0 auto 10px' }} />
                <p style={{ color: '#6B7280', fontSize: 13 }}>No reviews yet. Be the first to share your experience.</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Book card */}
            <div style={{ background: `linear-gradient(135deg,${T},#0F766E)`, borderRadius: 16, padding: '20px', color: '#fff' }}>
              <p style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Book Now</p>
              <p style={{ fontSize: 13, color: '#99F6E4', marginBottom: 16 }}>₹{doctor.consultationFee} consultation fee</p>
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px 12px', marginBottom: 14 }}>
                {myAppt ? (
                  <>
                    <p style={{ fontSize: 11, color: '#CCFBF1' }}>Your appointment</p>
                    <p style={{ fontSize: 16, fontWeight: 900 }}>{fmtApptLabel()}</p>
                    {myAppt.tokenNumber && (
                      <p style={{ fontSize: 12, color: '#99F6E4', marginTop: 2 }}>Token #{myAppt.tokenNumber}</p>
                    )}
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: 11, color: '#CCFBF1' }}>Currently in queue</p>
                    <p style={{ fontSize: 22, fontWeight: 900 }}>{queueStats?.waiting || 0}</p>
                  </>
                )}
              </div>
              <button onClick={handleBook}
                style={{ width: '100%', background: '#fff', color: T, fontWeight: 800, fontSize: 14, padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer' }}>
                Select Time Slot
              </button>
            </div>

            {/* Info card */}
            <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: '16px 18px' }}>
              {[
                { label: 'License No.', value: doctor.licenseNumber || 'Verified' },
                { label: 'Location', value: doctor.officeLocation || doctor.clinicCity || 'Clinic' },
                { label: 'Consultation', value: `${doctor.averageConsultationTime || 10} minutes avg` },
                { label: 'Availability', value: doctor.availabilityStart ? `${doctor.availabilityStart} – ${doctor.availabilityEnd}` : '9:00 – 18:00' },
              ].map(({ label, value }) => (
                <div key={label} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #F3F4F6' }}>
                  <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>{label}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{value}</p>
                </div>
              ))}
              <div style={{ paddingTop: 8 }}>
                {(doctor.verificationStatus || 'PENDING') === 'APPROVED' ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#065F46', fontWeight: 700, marginBottom: 4 }}>
                      <CheckCircle size={14} color="#059669" /> Verified Doctor
                    </div>
                    <p style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>Admin approved - Credentials verified and validated</p>
                  </div>
                ) : (doctor.verificationStatus || 'PENDING') === 'REJECTED' ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#991B1B', fontWeight: 600, marginBottom: 4 }}>
                      <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#FEE2E2', border: '1.5px solid #DC2626', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#DC2626' }}>✕</span>
                      Verification Rejected
                    </div>
                    <p style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>Admin rejected - Credentials did not meet requirements</p>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#92400E', fontWeight: 600, marginBottom: 4 }}>
                      <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#FEF3C7', border: '1.5px solid #D97706', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#D97706' }}>!</span>
                      Verification Pending
                    </div>
                    <p style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>Under admin review - Credentials being validated</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const VerificationBadge = ({ status }) => {
  const badges = {
    APPROVED: {
      bg: '#D1FAE5',
      border: '#6EE7B7',
      text: '#065F46',
      label: 'Verified',
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L14.5 7.5L21 8.27L16.5 12.64L17.68 19.1L12 16.1L6.32 19.1L7.5 12.64L3 8.27L9.5 7.5L12 2Z" fill="#059669" />
          <path d="M9 12L11 14L15 10" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    PENDING: {
      bg: '#FEF3C7',
      border: '#D97706',
      text: '#92400E',
      label: 'Pending',
      icon: <span style={{ fontSize: 10, fontWeight: 900, color: '#D97706' }}>!</span>
    },
    REJECTED: {
      bg: '#FEE2E2',
      border: '#DC2626',
      text: '#991B1B',
      label: 'Rejected',
      icon: <span style={{ fontSize: 10, fontWeight: 900, color: '#DC2626' }}>✕</span>
    }
  };

  const badge = badges[status] || badges.PENDING;

  return (
    <div title={`Verification: ${status}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: badge.bg, border: `1.5px solid ${badge.border}`, borderRadius: 20, padding: '3px 9px', flexShrink: 0 }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14 }}>
        {badge.icon}
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: badge.text }}>{badge.label}</span>
    </div>
  );
};
