import { useState, useEffect } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { prescriptionAPI } from '../../services/api';
import { logout } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import { ChevronLeft, Stethoscope, FileText, Pill } from 'lucide-react';

const T = '#0D9488';

export const Prescriptions = () => {
  const isMobile = useIsMobile();
  const { user } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    prescriptionAPI.getPrescriptionsByPatient(user._id)
      .then(r => setPrescriptions(r.data))
      .catch(() => toast.error('Failed to load prescriptions'))
      .finally(() => setIsLoading(false));
  }, [user._id]);

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F5F7FA' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: `4px solid ${T}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#374151', fontWeight: 600 }}>Loading prescriptions...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA', fontFamily: 'system-ui,-apple-system,sans-serif' }}>

      <header style={{ background: '#fff', borderBottom: '1px solid #E8ECF0', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/patient')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex', padding: 4 }}>
            <ChevronLeft size={22} />
          </button>
          <div onClick={() => navigate('/patient')} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <div style={{ width: 32, height: 32, background: `linear-gradient(135deg,${T},#0F766E)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stethoscope size={16} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 16, color: T }}>ClinicFlow</span>
          </div>
          {!isMobile && <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginLeft: 4 }}>/ My Prescriptions</span>}
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

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '20px 16px 48px' }}>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
          <span style={{ fontWeight: 700, color: '#111827' }}>{prescriptions.length}</span> prescription{prescriptions.length !== 1 ? 's' : ''}
        </p>

        {prescriptions.length === 0 ? (
          <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: '56px 16px', textAlign: 'center' }}>
            <FileText size={48} color="#D1D5DB" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontWeight: 700, color: '#111827', marginBottom: 6 }}>No prescriptions yet</p>
            <p style={{ fontSize: 13, color: '#6B7280' }}>Your prescriptions will appear here after a consultation.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {prescriptions.map(p => (
              <div key={p._id} style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ height: 5, background: `linear-gradient(90deg,${T},#14B8A6)` }} />
                <div style={{ padding: '18px 20px' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div>
                      <p style={{ fontWeight: 800, fontSize: 15, color: '#111827', marginBottom: 2 }}>Dr. {p.doctorId?.name || 'Doctor'}</p>
                      <p style={{ fontSize: 12, color: '#6B7280' }}>{new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <span style={{ background: '#F0FDF4', color: T, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, border: '1px solid #BBF7D0' }}>
                      Prescription
                    </span>
                  </div>

                  {/* Medicines */}
                  <div style={{ marginBottom: p.additionalNotes ? 12 : 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Pill size={13} color={T} /> Medicines
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {p.medicines.map((m, i) => (
                        <div key={i} style={{ background: '#F5F7FA', borderRadius: 10, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                          <div>
                            <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 3 }}>{m.name}</p>
                            <p style={{ fontSize: 12, color: '#6B7280' }}>{[m.dosage, m.frequency, m.duration].filter(Boolean).join(' · ')}</p>
                            {m.instructions && <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>Note: {m.instructions}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  {p.additionalNotes && (
                    <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 14px', marginTop: 4 }}>
                      <p style={{ fontSize: 12, color: '#92400E' }}><span style={{ fontWeight: 700 }}>Doctor's Notes: </span>{p.additionalNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
