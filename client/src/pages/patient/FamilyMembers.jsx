import { useState } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../../services/api';
import { setUser } from '../../store/slices/authSlice';
import { logout } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import { ChevronLeft, Stethoscope, Users, Plus, Trash2, AlertTriangle } from 'lucide-react';

const T = '#0D9488';

const RELATIONSHIPS = ['Spouse', 'Child', 'Parent', 'Sibling', 'Grandparent', 'Other'];

export const FamilyMembers = () => {
  const isMobile = useIsMobile();
  const { user, token } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', relationship: 'Child', dateOfBirth: '', gender: 'M', allergies: '' });

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleAdd = async e => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Enter member name'); return; }
    setIsSubmitting(true);
    try {
      const newMember = {
        name: form.name.trim(),
        relationship: form.relationship,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender,
        allergies: form.allergies.split(',').map(a => a.trim()).filter(Boolean),
      };
      const res = await userAPI.updateMe({ familyMembers: [...(user.familyMembers || []), newMember] });
      dispatch(setUser({ user: res.data, token }));
      toast.success(`${form.name} added!`);
      setForm({ name: '', relationship: 'Child', dateOfBirth: '', gender: 'M', allergies: '' });
      setShowForm(false);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to add member');
    } finally { setIsSubmitting(false); }
  };

  const handleRemove = async idx => {
    if (!window.confirm('Remove this family member?')) return;
    setIsSubmitting(true);
    try {
      const res = await userAPI.updateMe({ familyMembers: user.familyMembers.filter((_, i) => i !== idx) });
      dispatch(setUser({ user: res.data, token }));
      toast.success('Member removed');
    } catch { toast.error('Failed to remove'); }
    finally { setIsSubmitting(false); }
  };

  const inputStyle = { width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#F5F7FA' };
  const labelStyle = { fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 5, display: 'block' };

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
            <span style={{ fontWeight: 800, fontSize: 16, color: T }}>MediQ</span>
          </div>
          {!isMobile && <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginLeft: 4 }}>/ Family Members</span>}
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

        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111827', marginBottom: 2 }}>Family Members</h2>
            <p style={{ fontSize: 13, color: '#6B7280' }}>Manage family health profiles & book appointments for them</p>
          </div>
          {!showForm && (
            <button onClick={() => setShowForm(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: T, color: '#fff', fontWeight: 700, fontSize: 13, padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer' }}>
              <Plus size={16} /> Add Member
            </button>
          )}
        </div>

        {/* Add form */}
        {showForm && (
          <div style={{ background: '#fff', border: `1.5px solid #BBF7D0`, borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <p style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>Add Family Member</p>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 18 }}>✕</button>
            </div>
            <form onSubmit={handleAdd}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Name *</label>
                  <input type="text" value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Full name" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Relationship *</label>
                  <select value={form.relationship} onChange={e => setField('relationship', e.target.value)} style={inputStyle}>
                    {RELATIONSHIPS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Date of Birth</label>
                  <input type="date" value={form.dateOfBirth} onChange={e => setField('dateOfBirth', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Gender</label>
                  <select value={form.gender} onChange={e => setField('gender', e.target.value)} style={inputStyle}>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Allergies <span style={{ fontWeight: 400, color: '#9CA3AF' }}>(comma-separated)</span></label>
                  <input type="text" value={form.allergies} onChange={e => setField('allergies', e.target.value)} placeholder="e.g. Penicillin, Aspirin" style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" disabled={isSubmitting}
                  style={{ background: T, color: '#fff', fontWeight: 700, fontSize: 13, padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer' }}>
                  {isSubmitting ? 'Saving...' : 'Add Member'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ background: '#F3F4F6', color: '#374151', fontWeight: 700, fontSize: 13, padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Members grid */}
        {!user?.familyMembers?.length ? (
          <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: '56px 16px', textAlign: 'center' }}>
            <Users size={48} color="#D1D5DB" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontWeight: 700, color: '#111827', marginBottom: 6 }}>No family members added yet</p>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>Add family members to book appointments on their behalf.</p>
            {!showForm && (
              <button onClick={() => setShowForm(true)}
                style={{ background: T, color: '#fff', fontWeight: 700, fontSize: 13, padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer' }}>
                Add First Member
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
            {user.familyMembers.map((m, i) => (
              <div key={i} style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 16, overflow: 'hidden' }}>
                <div style={{ height: 5, background: `linear-gradient(90deg,${T},#14B8A6)` }} />
                <div style={{ padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 42, height: 42, background: '#F0FDF4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T, fontWeight: 800, fontSize: 18, border: `2px solid #BBF7D0` }}>
                        {m.name.charAt(0)}
                      </div>
                      <div>
                        <p style={{ fontWeight: 800, fontSize: 14, color: '#111827', marginBottom: 2 }}>{m.name}</p>
                        <span style={{ background: '#F0FDF4', color: T, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, border: '1px solid #BBF7D0' }}>{m.relationship}</span>
                      </div>
                    </div>
                    <button onClick={() => handleRemove(i)} disabled={isSubmitting}
                      style={{ background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 8, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {m.dateOfBirth && <p style={{ fontSize: 12, color: '#6B7280' }}>DOB: {new Date(m.dateOfBirth).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
                    {m.gender && <p style={{ fontSize: 12, color: '#6B7280' }}>Gender: {m.gender === 'M' ? 'Male' : m.gender === 'F' ? 'Female' : 'Other'}</p>}
                    {m.allergies?.length > 0 && (
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <AlertTriangle size={11} color="#F59E0B" /> Allergies
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {m.allergies.map((a, j) => (
                            <span key={j} style={{ background: '#FEF2F2', color: '#DC2626', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, border: '1px solid #FECACA' }}>{a}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
