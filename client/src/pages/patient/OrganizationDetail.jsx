import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { organizationAPI } from '../../services/api';
import { doctorAPI } from '../../services/api';
import {
  ChevronLeft, MapPin, Phone, Globe, Building2, Stethoscope, Star,
} from 'lucide-react';
import toast from 'react-hot-toast';

const T = '#0D9488';

const TYPE_LABELS = {
  HOSPITAL: 'Hospital',
  CLINIC: 'Clinic',
  CHAIN: 'Hospital Chain',
  DIAGNOSTIC_CENTER: 'Diagnostic Center',
};

const TYPE_COLORS = {
  HOSPITAL:          { bg: '#EFF6FF', text: '#1D4ED8' },
  CLINIC:            { bg: '#F0FDF4', text: '#065F46' },
  CHAIN:             { bg: '#FFF7ED', text: '#9A3412' },
  DIAGNOSTIC_CENTER: { bg: '#FDF4FF', text: '#7E22CE' },
};

export const OrganizationDetail = () => {
  const { orgId } = useParams();
  const navigate  = useNavigate();
  const user      = useSelector(s => s.auth.user);

  const [org,     setOrg]     = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await organizationAPI.getById(orgId);
        setOrg(res.data.organization);
        const doctorIds = res.data.doctors || [];
        const doctorRequests = doctorIds.map(id => doctorAPI.getDoctorById(id));
        const responses = await Promise.all(doctorRequests);
        // 3. Extract the data from each response and update state
        const fullDoctorsData = responses.map(r => r.data);
        setDoctors(fullDoctorsData || []);
      } catch {
        toast.error('Failed to load organization');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orgId]);

  const backPath = user ? '/patient/marketplace' : '/marketplace';
  const typeStyle = org?.type ? (TYPE_COLORS[org.type] || { bg: '#F3F4F6', text: '#374151' }) : {};
  const initials  = org ? org.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() : '';

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F5F7FA' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: '4px solid #1D4ED8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#374151', fontWeight: 600 }}>Loading...</p>
      </div>
    </div>
  );

  if (!org) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA', fontFamily: 'system-ui,-apple-system,sans-serif' }}>
      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #E8ECF0', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate(backPath)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#6B7280', display: 'flex' }}>
            <ChevronLeft size={22} />
          </button>
          <div onClick={() => navigate(user ? '/patient' : '/')} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#1D4ED8,#2563EB)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={16} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 16, color: '#1D4ED8', letterSpacing: '-0.3px' }}>MediQ</span>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px 48px' }}>
        {/* Org hero card */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1.5px solid #E5E7EB', overflow: 'hidden', marginBottom: 24 }}>
          <div style={{ height: 8, background: 'linear-gradient(90deg,#1D4ED8,#2563EB,#0EA5E9)' }} />
          <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {/* Logo / initials */}
              <div style={{ width: 80, height: 80, background: 'linear-gradient(135deg,#1D4ED8,#2563EB)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 28, flexShrink: 0 }}>
                {org.logo
                  ? <img src={org.logo} alt={org.name} style={{ width: 80, height: 80, borderRadius: 20, objectFit: 'cover' }} />
                  : initials}
              </div>

              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                  <h1 style={{ fontSize: 22, fontWeight: 900, color: '#111827', margin: 0 }}>{org.name}</h1>
                  {org.type && (
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: typeStyle.bg, color: typeStyle.text }}>
                      {TYPE_LABELS[org.type] || org.type}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: '#6B7280', marginBottom: 10 }}>
                  {org.city && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={13} color={T} />{org.city}
                    </span>
                  )}
                  {org.phone && (
                    <a href={`tel:${org.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6B7280', textDecoration: 'none' }}>
                      <Phone size={13} color={T} />{org.phone}
                    </a>
                  )}
                  {org.website && (
                    <a href={org.website} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#6B7280', textDecoration: 'none' }}>
                      <Globe size={13} color={T} />Website
                    </a>
                  )}
                </div>

                {org.description && (
                  <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: '0 0 10px' }}>{org.description}</p>
                )}

                {org.specialties?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {org.specialties.map(s => (
                      <span key={s} style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', background: '#F0FDF4', color: T, borderRadius: 10 }}>{s}</span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#EFF6FF', borderRadius: 14, padding: '14px 20px', textAlign: 'center', flexShrink: 0 }}>
                <p style={{ fontSize: 28, fontWeight: 900, color: '#1D4ED8', margin: 0 }}>{doctors.length}</p>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', margin: 0 }}>Doctors</p>
              </div>
            </div>

            {org.address && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #F3F4F6', fontSize: 13, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={13} color='#9CA3AF' />{org.address}{org.city ? `, ${org.city}` : ''}
              </div>
            )}
          </div>
        </div>

        {/* Doctors section */}
        <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 16 }}>
          Our Doctors
          <span style={{ fontSize: 13, fontWeight: 600, color: '#6B7280', marginLeft: 8 }}>({doctors.length})</span>
        </h2>

        {doctors.length === 0 ? (
          <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: '48px 16px', textAlign: 'center' }}>
            <Stethoscope size={44} color="#D1D5DB" style={{ margin: '0 auto 14px' }} />
            <p style={{ fontWeight: 700, color: '#111827', marginBottom: 4 }}>No doctors listed yet</p>
            <p style={{ fontSize: 13, color: '#6B7280' }}>Doctors from this organization will appear here</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
            {doctors.map(doc => {
              const rating = doc.averageRating > 0 ? doc.averageRating.toFixed(1) : null;
              return (
                <div key={doc._id}
                  style={{ background: '#fff', borderRadius: 16, border: '1.5px solid #E5E7EB', overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'box-shadow 0.15s, border-color 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.09)'; e.currentTarget.style.borderColor = '#99F6E4'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
                  onClick={() => navigate(user ? `/patient/doctors/${doc._id}` : `/doctors/${doc._id}`)}>
                  <div style={{ height: 5, background: `linear-gradient(90deg,${T},#14B8A6)` }} />
                  <div style={{ padding: '14px 16px 0' }}>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                      <div style={{ width: 48, height: 48, background: `linear-gradient(135deg,${T},#0F766E)`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
                        {doc.name?.charAt(0)}
                      </div>
                      <div>
                        <p style={{ fontWeight: 800, fontSize: 14, color: '#111827', margin: '0 0 2px' }}>
                          Dr. {doc.name?.replace(/^Dr\.?\s+/, '')}
                        </p>
                        <p style={{ fontSize: 12, color: T, fontWeight: 600, margin: 0 }}>{doc.specialization}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, fontSize: 12, color: '#6B7280', marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                      {doc.experience > 0 && <span>{doc.experience}yr exp</span>}
                      {doc.consultationFee > 0 && <><span style={{ color: '#D1D5DB' }}>·</span><span>₹{doc.consultationFee}</span></>}
                      {rating && (
                        <><span style={{ color: '#D1D5DB' }}>·</span>
                        <span style={{ color: '#F59E0B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Star size={11} fill="#F59E0B" color="#F59E0B" />{rating}
                        </span></>
                      )}
                    </div>
                  </div>
                  <div style={{ padding: '0 16px 14px', marginTop: 'auto' }}>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        if (user) navigate(`/patient/doctors/${doc._id}/book`);
                        else { toast.error('Login to book'); navigate('/login/patient'); }
                      }}
                      style={{ width: '100%', background: T, color: '#fff', fontWeight: 700, fontSize: 13, padding: '9px', borderRadius: 10, border: 'none', cursor: 'pointer' }}>
                      Book Appointment
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
