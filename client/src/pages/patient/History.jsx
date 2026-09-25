import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { appointmentAPI, consultationAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  ChevronLeft, Stethoscope, Calendar, Clock, ChevronDown, ChevronUp,
  FileText, AlertCircle, CheckCircle, XCircle,
} from 'lucide-react';

const T = '#0D9488';

const statusMeta = (s) => ({
  COMPLETED:  { bg: '#D1FAE5', color: '#065F46', icon: <CheckCircle size={12} />, label: 'Completed' },
  CANCELLED:  { bg: '#F3F4F6', color: '#6B7280', icon: <XCircle size={12} />,    label: 'Cancelled' },
  BOOKED:     { bg: '#DBEAFE', color: '#1D4ED8', icon: <Calendar size={12} />,   label: 'Booked' },
  CHECKED_IN: { bg: '#EDE9FE', color: '#5B21B6', icon: <Clock size={12} />,      label: 'Checked In' },
  WAITING:    { bg: '#EDE9FE', color: '#5B21B6', icon: <Clock size={12} />,      label: 'Waiting' },
  NO_SHOW:    { bg: '#FEE2E2', color: '#991B1B', icon: <AlertCircle size={12} />,label: 'No Show' },
}[s] || { bg: '#F3F4F6', color: '#4B5563', icon: null, label: s });

const TABS = ['All', 'Completed', 'Upcoming', 'Cancelled'];

export const History = () => {
  const { user } = useSelector((s) => s.auth);
  const navigate  = useNavigate();
  const [appointments, setAppointments]     = useState([]);
  const [consultations, setConsultations]   = useState([]);
  const [isLoading, setIsLoading]           = useState(true);
  const [activeTab, setActiveTab]           = useState('All');
  const [expandedId, setExpandedId]         = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [aptRes, conRes] = await Promise.allSettled([
          appointmentAPI.getAppointments(),
          consultationAPI.getConsultationsByPatient(user._id),
        ]);
        if (aptRes.status === 'fulfilled') setAppointments(aptRes.value.data);
        if (conRes.status === 'fulfilled') setConsultations(conRes.value.data);
      } catch {
        toast.error('Failed to load history');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user._id]);

  // Build a map: appointmentId → consultation
  const consultationMap = consultations.reduce((m, c) => {
    const key = c.appointmentId?._id || c.appointmentId;
    if (key) m[key] = c;
    return m;
  }, {});

  const filtered = appointments
    .filter((a) => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const d = new Date(a.appointmentDate); d.setHours(0, 0, 0, 0);
      if (activeTab === 'Completed') return a.status === 'COMPLETED';
      if (activeTab === 'Cancelled') return a.status === 'CANCELLED';
      if (activeTab === 'Upcoming')  return d >= today && !['COMPLETED', 'CANCELLED'].includes(a.status);
      return true;
    })
    .sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F5F7FA' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: `4px solid ${T}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#374151', fontWeight: 600 }}>Loading history...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA', fontFamily: 'system-ui,-apple-system,sans-serif' }}>

      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #E8ECF0', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/patient')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 4, display: 'flex' }}>
            <ChevronLeft size={22} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => navigate('/patient')}>
            <div style={{ width: 32, height: 32, background: `linear-gradient(135deg,${T},#0F766E)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stethoscope size={16} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 16, color: T }}>MediQ</span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginLeft: 4 }}>/ Appointment History</span>
        </div>
        <div style={{ background: T, height: 4 }} />
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px 60px' }}>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Total',     value: appointments.length,                                          color: T },
            { label: 'Completed', value: appointments.filter(a => a.status === 'COMPLETED').length,    color: '#10B981' },
            { label: 'Upcoming',  value: appointments.filter(a => !['COMPLETED','CANCELLED'].includes(a.status)).length, color: '#3B82F6' },
            { label: 'Cancelled', value: appointments.filter(a => a.status === 'CANCELLED').length,    color: '#9CA3AF' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 12, padding: '12px', textAlign: 'center' }}>
              <p style={{ fontSize: 22, fontWeight: 900, color: s.color, margin: 0 }}>{s.value}</p>
              <p style={{ fontSize: 11, color: '#6B7280', fontWeight: 600, marginTop: 2 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: '#fff', padding: 6, borderRadius: 12, border: '1.5px solid #E5E7EB' }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ flex: 1, padding: '7px 0', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', border: 'none',
                background: activeTab === tab ? T : 'transparent',
                color: activeTab === tab ? '#fff' : '#6B7280' }}>
              {tab}
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: '56px 16px', textAlign: 'center' }}>
            <Calendar size={48} color="#D1D5DB" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontWeight: 700, color: '#111827', marginBottom: 4 }}>No {activeTab.toLowerCase()} appointments</p>
            <button onClick={() => navigate('/patient/marketplace')}
              style={{ background: T, color: '#fff', fontWeight: 700, fontSize: 13, padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', marginTop: 12 }}>
              Book Appointment
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((apt) => {
              const meta       = statusMeta(apt.status);
              const consult    = consultationMap[apt._id];
              const aptDate    = new Date(apt.appointmentDate);
              const isExpanded = expandedId === apt._id;
              const doctorName = apt.doctorId?.name || 'Doctor';

              return (
                <div key={apt._id} style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 14, overflow: 'hidden' }}>

                  {/* colour strip */}
                  <div style={{ height: 4, background: apt.status === 'COMPLETED' ? '#10B981' : apt.status === 'CANCELLED' ? '#D1D5DB' : T }} />

                  {/* Main row */}
                  <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    {/* Avatar */}
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg,${T},#0F766E)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
                      {doctorName.charAt(0)}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                        <p style={{ fontWeight: 800, fontSize: 14, color: '#111827', margin: 0 }}>
                          Dr. {doctorName.replace(/^Dr\.?\s+/i, '')}
                        </p>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: meta.bg, color: meta.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                          {meta.icon}{meta.label}
                        </span>
                      </div>

                      {apt.doctorId?.specialization && (
                        <p style={{ fontSize: 12, color: T, fontWeight: 600, margin: '0 0 8px' }}>{apt.doctorId.specialization}</p>
                      )}

                      {/* Date / Time / Token grid */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: '#374151', background: '#F5F7FA', padding: '4px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={11} color="#9CA3AF" />
                          {aptDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span style={{ fontSize: 12, color: '#374151', background: '#F5F7FA', padding: '4px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={11} color="#9CA3AF" />
                          {apt.appointmentTime}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: T, background: '#F0FDFA', padding: '4px 10px', borderRadius: 8 }}>
                          Token #{apt.tokenNumber}
                        </span>
                        {apt.appointmentType && (
                          <span style={{ fontSize: 11, color: '#6B7280', background: '#F9FAFB', padding: '4px 10px', borderRadius: 8, border: '1px solid #E5E7EB' }}>
                            {apt.appointmentType}
                          </span>
                        )}
                      </div>

                      {apt.reason && (
                        <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 6px' }}>
                          <span style={{ fontWeight: 600 }}>Reason: </span>{apt.reason}
                        </p>
                      )}

                      {/* Consultation notes expand toggle */}
                      {consult && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : apt._id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: T, fontSize: 12, fontWeight: 700, padding: 0, marginTop: 4 }}>
                          <FileText size={13} />
                          Consultation Notes
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded consultation notes */}
                  {isExpanded && consult && (
                    <div style={{ background: '#F0FDFA', borderTop: '1.5px solid #CCFBF1', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {consult.symptoms?.length > 0 && (
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: 4 }}>Symptoms</p>
                          <p style={{ fontSize: 13, color: '#374151', margin: 0 }}>
                            {Array.isArray(consult.symptoms) ? consult.symptoms.join(', ') : consult.symptoms}
                          </p>
                        </div>
                      )}
                      {consult.diagnosis && (
                        <div style={{ background: '#fff', border: '1px solid #D1FAE5', borderRadius: 8, padding: '10px 12px' }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: '#065F46', textTransform: 'uppercase', marginBottom: 4 }}>Diagnosis</p>
                          <p style={{ fontSize: 13, color: '#374151', margin: 0 }}>{consult.diagnosis}</p>
                        </div>
                      )}
                      {consult.treatmentPlan && (
                        <div style={{ background: '#fff', border: '1px solid #DBEAFE', borderRadius: 8, padding: '10px 12px' }}>
                          <p style={{ fontSize: 11, fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase', marginBottom: 4 }}>Treatment Plan</p>
                          <p style={{ fontSize: 13, color: '#374151', margin: 0 }}>{consult.treatmentPlan}</p>
                        </div>
                      )}
                      {consult.followUpDate && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Calendar size={13} color={T} />
                          <span style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>
                            Follow-up: {new Date(consult.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      )}
                      {consult.followUpNotes && (
                        <p style={{ fontSize: 12, color: '#6B7280', margin: 0, fontStyle: 'italic' }}>
                          Note: {consult.followUpNotes}
                        </p>
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
