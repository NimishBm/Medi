import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { appointmentAPI, queueAPI } from '../../services/api';
import { logout } from '../../store/slices/authSlice';
import { initSocket } from '../../services/socket';
import toast from 'react-hot-toast';
import { ChevronLeft, Stethoscope, Clock, Users, CheckCircle, AlertCircle, Activity } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';

const T = '#0D9488';

const STATUS_COLORS = {
  COMPLETED:  { bg: '#D1FAE5', color: '#065F46' },
  CONSULTING: { bg: '#DBEAFE', color: '#1D4ED8' },
  CALLED:     { bg: '#FEF9C3', color: '#92400E' },
  WAITING:    { bg: '#F3F4F6', color: '#4B5563' },
  SKIPPED:    { bg: '#FEE2E2', color: '#991B1B' },
};

export const LiveQueue = () => {
  const { user } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [nextAppt, setNextAppt]   = useState(null);
  const [queue, setQueue]         = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchQueue = async () => {
    try {
      const appRes = await appointmentAPI.getAppointments();
      const upcoming = appRes.data
        .filter(a => a.status !== 'CANCELLED' && a.status !== 'NO_SHOW')
        .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))[0];
      if (upcoming) {
        setNextAppt(upcoming);
        const qRes = await queueAPI.getQueueByDoctorId(upcoming.doctorId._id);
        setQueue(qRes.data.queue || []);
      }
    } catch { toast.error('Failed to load queue'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchQueue(); }, []);

  useEffect(() => {
    if (!nextAppt?._id) return;
    const socket = initSocket();
    socket.emit('join-queue', { doctorId: nextAppt.doctorId._id });
    socket.on('queue-update', fetchQueue);
    return () => {
      socket.off('queue-update', fetchQueue);
      socket.emit('leave-queue', { doctorId: nextAppt.doctorId._id });
    };
  }, [nextAppt?._id]);

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F5F7FA' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: `4px solid ${T}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#374151', fontWeight: 600 }}>Loading queue...</p>
      </div>
    </div>
  );

  const myPos       = queue.find(q =>
    (q.patientId?._id === user._id || q.patientId === user._id) &&
    (!nextAppt || String(q.appointmentId?._id || q.appointmentId) === String(nextAppt._id))
  ) || queue.find(q => q.patientId?._id === user._id || q.patientId === user._id);
  const consulting  = queue.find(q => q.status === 'CONSULTING');
  const waiting     = queue.filter(q => q.status === 'WAITING');
  const ahead       = waiting.filter(q => q.tokenNumber < (myPos?.tokenNumber || 0)).length;
  const avgTime     = nextAppt?.doctorId?.averageConsultationTime || 10;
  const estWait     = ahead * avgTime;

  const Header = () => (
    <header style={{ background: '#fff', borderBottom: '1px solid #E8ECF0', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => navigate('/patient')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex', padding: 4 }}>
          <ChevronLeft size={22} />
        </button>
        <div onClick={() => navigate('/patient')} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <div style={{ width: 32, height: 32, background: `linear-gradient(135deg,${T},#0F766E)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Stethoscope size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, color: T }}>ClinicFlow</span>
        </div>
        {!isMobile && <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginLeft: 4 }}>/ Live Queue</span>}
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
  );

  if (!nextAppt) return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
      <Header />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 16px', textAlign: 'center' }}>
        <Activity size={48} color="#D1D5DB" style={{ margin: '0 auto 16px' }} />
        <p style={{ fontWeight: 700, color: '#111827', marginBottom: 6 }}>No upcoming appointments</p>
        <button onClick={() => navigate('/patient/marketplace')}
          style={{ background: T, color: '#fff', fontWeight: 700, fontSize: 13, padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', marginTop: 8 }}>
          Book an Appointment
        </button>
      </div>
    </div>
  );

  const myStatus = myPos?.status;
  const statusMsg = {
    CALLED:     { text: "It's your turn!", sub: 'Please proceed to the consultation room.', color: '#065F46', bg: '#D1FAE5' },
    CONSULTING: { text: 'In Consultation',  sub: 'Your consultation is in progress.',         color: '#1D4ED8', bg: '#DBEAFE' },
    WAITING:    { text: `You're #${ahead + 1} in line`, sub: `~${estWait} minutes estimated wait`, color: '#92400E', bg: '#FEF9C3' },
    COMPLETED:  { text: 'Consultation done', sub: 'Thank you for visiting.',                  color: '#065F46', bg: '#D1FAE5' },
  }[myStatus] || { text: 'Tracking queue', sub: 'Waiting for status update.', color: '#374151', bg: '#F3F4F6' };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
      <Header />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px 48px' }}>

        {/* Doctor card */}
        <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ height: 5, background: `linear-gradient(90deg,${T},#14B8A6)` }} />
          <div style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{ width: 50, height: 50, background: `linear-gradient(135deg,${T},#0F766E)`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 20 }}>
                {nextAppt.doctorId?.name?.charAt(0)}
              </div>
              <div>
                <p style={{ fontWeight: 800, fontSize: 15, color: '#111827' }}>Dr. {(nextAppt.doctorId?.name || '').replace(/^Dr\.?\s+/, '')}</p>
                <p style={{ fontSize: 13, color: T, fontWeight: 600 }}>{nextAppt.doctorId?.specialization}</p>
                {nextAppt.doctorId?.roomNumber && <p style={{ fontSize: 12, color: '#6B7280' }}>Room {nextAppt.doctorId.roomNumber}</p>}
              </div>
            </div>

            {/* 4 stat tiles */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 10 }}>
              {[
                { label: 'Now Serving', value: `#${consulting?.tokenNumber || '—'}`, bg: '#DBEAFE', color: '#1D4ED8' },
                { label: 'Your Token',  value: `#${myPos?.tokenNumber || '—'}`,      bg: '#D1FAE5', color: '#065F46' },
                { label: 'Ahead',       value: `${ahead}`,                           bg: '#FEF9C3', color: '#92400E' },
                { label: 'Est. Wait',   value: `~${estWait}m`,                        bg: '#F3E8FF', color: '#7C3AED' },
              ].map(({ label, value, bg, color }) => (
                <div key={label} style={{ background: bg, borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
                  <p style={{ fontSize: 10, color: '#6B7280', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{label}</p>
                  <p style={{ fontSize: 22, fontWeight: 900, color }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* My status */}
        {myPos && (
          <div style={{ background: statusMsg.bg, border: `1.5px solid ${statusMsg.color}30`, borderRadius: 16, padding: '16px 20px', marginBottom: 16 }}>
            <p style={{ fontWeight: 800, fontSize: 16, color: statusMsg.color, marginBottom: 4 }}>{statusMsg.text}</p>
            <p style={{ fontSize: 13, color: '#374151' }}>{statusMsg.sub}</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1fr) 260px', gap: 16, alignItems: 'start' }}>

          {/* Queue list */}
          <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #F3F4F6' }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>Queue List</p>
            </div>
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {queue.length === 0 ? (
                <p style={{ padding: '24px 18px', color: '#9CA3AF', fontSize: 13, textAlign: 'center' }}>Queue is empty</p>
              ) : queue.map(item => {
                const isMe = (item.patientId?._id === user._id || item.patientId === user._id) &&
                  (!nextAppt || String(item.appointmentId?._id || item.appointmentId) === String(nextAppt._id));
                const isFamily = item.appointmentId?.bookedFor?.isFamilyMember;
                const displayName = isFamily && item.appointmentId.bookedFor.name
                  ? item.appointmentId.bookedFor.name
                  : item.patientId?.name || 'Patient';
                const sc = STATUS_COLORS[item.status] || STATUS_COLORS.WAITING;
                return (
                  <div key={item._id} style={{ padding: '12px 18px', borderBottom: '1px solid #F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isMe ? '#F0FDF4' : '#fff', borderLeft: isMe ? `4px solid ${T}` : '4px solid transparent' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 18, fontWeight: 900, color: isMe ? T : '#374151', minWidth: 36 }}>#{item.tokenNumber}</span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{displayName}</p>
                          {isFamily && <span style={{ fontSize: 10, background: '#F3E8FF', color: '#7C3AED', padding: '1px 6px', borderRadius: 8, fontWeight: 700 }}>{item.appointmentId.bookedFor.relationship || 'Family'}</span>}
                        </div>
                        {isMe && <p style={{ fontSize: 11, color: T, fontWeight: 700 }}>You</p>}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 12, background: sc.bg, color: sc.color }}>{item.status}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats card */}
          <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: '16px 18px' }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#111827', marginBottom: 14 }}>Queue Stats</p>
            {[
              { label: 'Total in Queue', value: queue.length },
              { label: 'Currently Waiting', value: waiting.length },
              { label: 'In Consultation', value: queue.filter(q => q.status === 'CONSULTING').length },
              { label: 'Completed Today', value: queue.filter(q => q.status === 'COMPLETED').length },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
                <span style={{ fontSize: 13, color: '#6B7280' }}>{label}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>{value}</span>
              </div>
            ))}
            <div style={{ marginTop: 14, padding: '12px', background: '#F0FDF4', borderRadius: 10, textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: T, fontWeight: 700, marginBottom: 2 }}>AUTO-UPDATING</p>
              <p style={{ fontSize: 12, color: '#6B7280' }}>Queue updates in real-time via live connection</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
