import { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { appointmentAPI } from '../../services/api';
import { logout } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import { ChevronLeft, Stethoscope, Star, Calendar, Clock, MapPin } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { NotificationBell } from '../../components/NotificationBell';
import { initSocket } from '../../services/socket';

const T = '#0D9488';

const TABS = ['Upcoming', 'Completed', 'Cancelled'];

const statusColor = s => ({
  BOOKED:     { bg: '#DBEAFE', color: '#1D4ED8' },
  COMPLETED:  { bg: '#D1FAE5', color: '#065F46' },
  CANCELLED:  { bg: '#F3F4F6', color: '#4B5563' },
  CHECKED_IN: { bg: '#EDE9FE', color: '#5B21B6' },
  WAITING:    { bg: '#EDE9FE', color: '#5B21B6' },
  CALLED:     { bg: '#FEF9C3', color: '#92400E' },
  CONSULTING: { bg: '#EDE9FE', color: '#5B21B6' },
}[s] || { bg: '#F3F4F6', color: '#4B5563' });

export const Appointments = () => {
  const user = useSelector(s => s.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Upcoming');
  const [cancelingId, setCancelingId] = useState(null);
  const isMobile = useIsMobile();
  const [reviews, setReviews] = useState({});

  useEffect(() => {
    appointmentAPI.getAppointments()
      .then(r => setAppointments(r.data))
      .catch(() => toast.error('Failed to load appointments'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!user?._id) return;
    try {
      const socket = initSocket();
      if (!socket) return;
      const onUpdate = () => {
        appointmentAPI.getAppointments()
          .then(r => setAppointments(r.data))
          .catch(() => {});
      };
      socket.on('new-notification', onUpdate);
      return () => socket.off('new-notification', onUpdate);
    } catch {}
  }, [user?._id]);

  const filtered = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return appointments.filter(a => {
      const d = new Date(a.appointmentDate); d.setHours(0, 0, 0, 0);
      if (activeTab === 'Upcoming')   return d >= today && a.status !== 'CANCELLED' && a.status !== 'COMPLETED';
      if (activeTab === 'Completed')  return a.status === 'COMPLETED';
      if (activeTab === 'Cancelled')  return a.status === 'CANCELLED';
      return true;
    });
  }, [appointments, activeTab]);

  const handleCancel = async id => {
    setCancelingId(id);
    try {
      await appointmentAPI.cancelAppointment(id);
      toast.success('Appointment cancelled');
      setAppointments(prev => prev.map(a => a._id === id ? { ...a, status: 'CANCELLED' } : a));
    } catch { toast.error('Failed to cancel'); }
    finally { setCancelingId(null); }
  };

  const updateReview = (id, field, val) =>
    setReviews(p => ({ ...p, [id]: { ...(p[id] || { rating: 0, comment: '', submitted: false }), [field]: val } }));

  const submitReview = id => {
    const r = reviews[id];
    if (!r || (!r.rating && !r.comment)) { toast.error('Add a rating or comment'); return; }
    updateReview(id, 'submitted', true);
    toast.success('Thank you for your review!');
  };

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F5F7FA' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: `4px solid ${T}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#374151', fontWeight: 600 }}>Loading appointments...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA', fontFamily: 'system-ui,-apple-system,sans-serif' }}>

      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #E8ECF0', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/patient')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex', padding: 4 }}>
            <ChevronLeft size={22} />
          </button>
          <div onClick={() => navigate('/patient')} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <div style={{ width: 32, height: 32, background: `linear-gradient(135deg,${T},#0F766E)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stethoscope size={16} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 16, color: T }}>MediQ</span>
          </div>
          {!isMobile && <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginLeft: 4 }}>/ My Appointments</span>}
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
        {/* Teal strip */}
        <div style={{ background: T, height: 4 }} />
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px 48px' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, background: '#fff', padding: '8px', borderRadius: 14, border: '1.5px solid #E5E7EB', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 20px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                background: activeTab === tab ? T : 'transparent',
                color: activeTab === tab ? '#fff' : '#6B7280',
              }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Count */}
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
          <span style={{ fontWeight: 700, color: '#111827' }}>{filtered.length}</span> {activeTab.toLowerCase()} appointment{filtered.length !== 1 ? 's' : ''}
        </p>

        {filtered.length === 0 ? (
          <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: '56px 16px', textAlign: 'center' }}>
            <Calendar size={48} color="#D1D5DB" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontWeight: 700, color: '#111827', marginBottom: 6 }}>No {activeTab.toLowerCase()} appointments</p>
            <button onClick={() => navigate('/patient/marketplace')}
              style={{ background: T, color: '#fff', fontWeight: 700, fontSize: 13, padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', marginTop: 8 }}>
              Find a Doctor
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map(apt => {
              const aptDate = new Date(apt.appointmentDate);
              const review = reviews[apt._id] || { rating: 0, comment: '', submitted: false };
              const doctorName = apt.doctorId?.name || 'Doctor';
              const sc = statusColor(apt.status);

              return (
                <div key={apt._id} style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 16, overflow: 'hidden' }}>
                  {/* Top strip by status */}
                  <div style={{ height: 5, background: apt.status === 'BOOKED' ? T : apt.status === 'COMPLETED' ? '#10B981' : '#9CA3AF' }} />

                  <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                    {/* Left: doctor info */}
                    <div style={{ flex: 1, minWidth: 260, padding: '18px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                        <div style={{ width: 52, height: 52, background: `linear-gradient(135deg,${T},#0F766E)`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 20, flexShrink: 0 }}>
                          {doctorName.charAt(0)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 800, fontSize: 15, color: '#111827', marginBottom: 2 }}>
                            Dr. {doctorName.replace(/^Dr\.?\s+/, '')}
                          </p>
                          {apt.doctorId?.specialization && <p style={{ fontSize: 13, color: T, fontWeight: 600, marginBottom: 4 }}>{apt.doctorId.specialization}</p>}
                          {apt.doctorId && <p style={{ fontSize: 12, color: '#6B7280' }}>{apt.doctorId.experience}yr exp · ₹{apt.doctorId.consultationFee}</p>}
                          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>For:</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: apt.bookedFor?.isFamilyMember ? '#7C3AED' : '#374151' }}>
                              {apt.bookedFor?.isFamilyMember ? apt.bookedFor.name : (user?.name || 'You')}
                            </span>
                            {apt.bookedFor?.isFamilyMember && apt.bookedFor.relationship && (
                              <span style={{ fontSize: 10, background: '#F3E8FF', color: '#7C3AED', padding: '1px 7px', borderRadius: 8, fontWeight: 700 }}>
                                {apt.bookedFor.relationship}
                              </span>
                            )}
                          </div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: sc.bg, color: sc.color, flexShrink: 0 }}>{apt.status}</span>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div style={{ background: '#F5F7FA', borderRadius: 10, padding: '10px 12px' }}>
                          <p style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>Date</p>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
                            {aptDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div style={{ background: '#F5F7FA', borderRadius: 10, padding: '10px 12px' }}>
                          <p style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>Time</p>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{apt.appointmentTime}</p>
                        </div>
                        <div style={{ background: '#F5F7FA', borderRadius: 10, padding: '10px 12px' }}>
                          <p style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>Token</p>
                          <p style={{ fontSize: 18, fontWeight: 900, color: T }}>#{apt.tokenNumber}</p>
                        </div>
                        <div style={{ background: '#F5F7FA', borderRadius: 10, padding: '10px 12px' }}>
                          <p style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3 }}>Room</p>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Room {apt.doctorId?.roomNumber || 'N/A'}</p>
                        </div>
                      </div>


                      {apt.reason && (
                        <p style={{ marginTop: 10, fontSize: 12, color: '#6B7280' }}>
                          <span style={{ fontWeight: 600 }}>Reason: </span>{apt.reason}
                        </p>
                      )}

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                        {apt.status === 'BOOKED' && (
                          <button onClick={() => handleCancel(apt._id)} disabled={cancelingId === apt._id}
                            style={{ fontSize: 12, fontWeight: 700, padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#FEE2E2', color: '#991B1B' }}>
                            {cancelingId === apt._id ? 'Cancelling...' : 'Cancel Appointment'}
                          </button>
                        )}
                        {['CHECKED_IN', 'WAITING', 'CALLED', 'CONSULTING'].includes(apt.status) && (
                          <Link to="/patient/queue"
                            style={{ fontSize: 12, fontWeight: 700, padding: '8px 16px', borderRadius: 8, background: '#D1FAE5', color: '#065F46', textDecoration: 'none' }}>
                            Track Live Queue →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Review section */}
                  {apt.status === 'COMPLETED' && (
                    <div style={{ borderTop: '1.5px solid #F3F4F6', background: '#FAFAFA', padding: '16px 20px' }}>
                      <p style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 12 }}>How was your visit?</p>
                      {!review.submitted ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {[1,2,3,4,5].map(star => (
                              <button key={star} onClick={() => updateReview(apt._id, 'rating', star)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                                <Star size={22} fill={review.rating >= star ? '#F59E0B' : 'none'} color={review.rating >= star ? '#F59E0B' : '#D1D5DB'} />
                              </button>
                            ))}
                          </div>
                          <textarea placeholder="Share your feedback (optional)" value={review.comment}
                            onChange={e => updateReview(apt._id, 'comment', e.target.value)} rows={2}
                            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
                          <button onClick={() => submitReview(apt._id)}
                            style={{ width: 'fit-content', background: T, color: '#fff', fontWeight: 700, fontSize: 13, padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer' }}>
                            Submit Review
                          </button>
                        </div>
                      ) : (
                        <p style={{ fontSize: 13, color: '#065F46', fontWeight: 600 }}>✓ Thank you for your review!</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
