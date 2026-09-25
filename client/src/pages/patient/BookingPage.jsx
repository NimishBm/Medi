import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { doctorAPI, appointmentAPI, paymentAPI } from '../../services/api';
import { logout } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import { ChevronLeft, Stethoscope, Calendar, Clock, User, Users, Paperclip, X } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';

const T = '#0D9488';

const APPOINTMENT_TYPES = [
  'General Consultation', 'New Patient', 'Follow-up',
  'Specialist Consultation', 'Routine Check-up', 'Emergency', 'Vaccination', 'Teleconsultation',
];

const DAY_KEYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

const generateSlots = (start, end, intervalMin) => {
  const slots = [];
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let cur = sh * 60 + sm;
  const endTotal = eh * 60 + em;
  while (cur + intervalMin <= endTotal) {
    slots.push(`${String(Math.floor(cur / 60)).padStart(2,'0')}:${String(cur % 60).padStart(2,'0')}`);
    cur += intervalMin;
  }
  return slots;
};

const computeSlots = (doctor, dateStr) => {
  if (!doctor || !dateStr) return [];
  const dayKey  = DAY_KEYS[new Date(dateStr + 'T00:00:00').getDay()];
  if (doctor.daysOff?.includes(dayKey)) return [];
  const dayAvail = doctor.availability?.[dayKey];
  // Day toggled off in Schedule page (start/end set to empty string)
  if (dayAvail && (!dayAvail.start || !dayAvail.end)) return [];
  const start    = dayAvail?.start || doctor.availabilityStart || '09:00';
  const end      = dayAvail?.end   || doctor.availabilityEnd   || '17:00';
  const interval = doctor.consultationDuration || doctor.averageConsultationTime || 30;
  return generateSlots(start, end, interval);
};

export const BookingPage = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector(s => s.auth.user);

  // Redirect to complete-profile if phone is missing
  useEffect(() => {
    if (user && !user.phone) {
      navigate(`/patient/complete-profile?next=${encodeURIComponent(location.pathname)}`, { replace: true });
    }
  }, [user]);

  const isMobile = useIsMobile();
  const [doctor, setDoctor]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [form, setForm] = useState({
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '',
    appointmentType: 'General Consultation',
    reason: '',
    prescriptionFile: null,
  });

  // attendees: set of keys — 'self' or the index of the family member as a string
  const [selectedAttendees, setSelectedAttendees] = useState(new Set(['self']));

  const toggleAttendee = (key) => {
    setSelectedAttendees(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        // always keep at least one selected
        if (next.size === 1) return prev;
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  useEffect(() => {
    doctorAPI.getDoctorById(doctorId)
      .then(r => setDoctor(r.data))
      .catch(() => { toast.error('Failed to load doctor'); navigate('/patient/marketplace'); })
      .finally(() => setLoading(false));
  }, [doctorId]);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.appointmentDate || !form.appointmentTime) { toast.error('Select date and time'); return; }
    setBooking(true);
    try {
      const attendees = [];
      if (selectedAttendees.has('self')) {
        attendees.push({ isFamilyMember: false });
      }
      if (user?.familyMembers?.length > 0) {
        user.familyMembers.forEach((fm, i) => {
          if (selectedAttendees.has(String(i))) {
            attendees.push({
              isFamilyMember: true,
              name: fm.name,
              relationship: fm.relationship,
              dateOfBirth: fm.dateOfBirth,
              gender: fm.gender,
              bloodGroup: fm.bloodGroup,
              phone: fm.phone,
              allergies: fm.allergies,
              medicalHistory: fm.medicalHistory,
            });
          }
        });
      }

      const appointmentPayload = {
        patientId: user._id,
        doctorId,
        appointmentDate: form.appointmentDate,
        appointmentTime: form.appointmentTime,
        appointmentType: form.appointmentType,
        reason: form.reason || 'Consultation',
        bookedBy: user._id,
        attendees,
      };

      const totalAmount = (doctor.consultationFee || 0) * (attendees.length || 1);

      // Free consultation — skip Razorpay, create appointment directly
      if (totalAmount === 0) {
        await appointmentAPI.createAppointment(appointmentPayload);
        toast.success('Appointment booked!');
        navigate('/patient/booking-confirmed', {
          state: { doctor, appointmentPayload, totalAmount: 0 },
        });
        return;
      }

      // Paid — open Razorpay checkout
      const { data: order } = await paymentAPI.createRazorpayOrder({ amount: totalAmount });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        order_id: order.id,
        name: 'ClinicFlow',
        description: `Appointment with Dr. ${doctor.name}`,
        handler: async (response) => {
          try {
            const { data: appt } = await paymentAPI.verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              appointmentPayload,
              totalAmount,
            });
            toast.success('Payment successful! Appointment booked.');
            const appointment = Array.isArray(appt) ? appt[0] : appt;
            // Use window.location as a fallback if navigate doesn't fire
            const confirmed = new URL('/patient/booking-confirmed', window.location.origin);
            sessionStorage.setItem('bookingConfirmed', JSON.stringify({
              appointment,
              doctor,
              totalAmount,
              paymentId: response.razorpay_payment_id,
            }));
            navigate('/patient/booking-confirmed', {
              state: { appointment, doctor, totalAmount, paymentId: response.razorpay_payment_id },
              replace: true,
            });
            // Hard fallback after 300ms if navigate didn't work
            setTimeout(() => {
              if (!window.location.pathname.includes('booking-confirmed')) {
                window.location.href = confirmed.toString();
              }
            }, 300);
          } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Payment verification failed';
            console.error('Verify error:', err);
            toast.error(msg);
            setBooking(false);
          }
        },
        prefill: { name: user?.name, email: user?.email, contact: user?.phone },
        theme: { color: '#0D9488' },
        modal: { ondismiss: () => setBooking(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        const errorReason = response?.error?.description || 'Payment was declined or cancelled.';
        const errorCode   = response?.error?.code || null;
        paymentAPI.recordFailure({
          doctorId: doctor._id,
          totalAmount,
          razorpayOrderId: order.id,
          failureReason: errorReason,
          errorCode,
        }).catch(() => {});
        sessionStorage.setItem('paymentFailed', JSON.stringify({ doctor, totalAmount, errorReason, errorCode }));
        window.location.href = '/patient/payment-failed';
      });
      rzp.open();
      // booking state stays true until handler resolves or modal dismissed
      return;
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to book appointment');
    } finally { setBooking(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F5F7FA' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 44, height: 44, border: `4px solid ${T}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#374151', fontWeight: 600 }}>Loading...</p>
      </div>
    </div>
  );

  if (!doctor) return null;

  const slots = computeSlots(doctor, form.appointmentDate);

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA', fontFamily: 'system-ui,-apple-system,sans-serif' }}>

      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #E8ECF0', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate(`/patient/doctors/${doctorId}`)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', display: 'flex', padding: 4 }}>
            <ChevronLeft size={22} />
          </button>
          <div onClick={() => navigate('/patient')} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <div style={{ width: 32, height: 32, background: `linear-gradient(135deg,${T},#0F766E)`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stethoscope size={16} color="#fff" strokeWidth={2.5} />
            </div>
            <span style={{ fontWeight: 800, fontSize: 16, color: T }}>ClinicFlow</span>
          </div>
          {!isMobile && <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginLeft: 4 }}>/ Book Appointment</span>}
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

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px 48px' }}>

        {/* Doctor summary */}
        <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: '16px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 54, height: 54, background: `linear-gradient(135deg,${T},#0F766E)`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 22, flexShrink: 0 }}>
            {doctor.name.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 800, fontSize: 15, color: '#111827', marginBottom: 2 }}>Dr. {doctor.name.replace(/^Dr\.?\s+/, '')}</p>
            <p style={{ fontSize: 13, color: T, fontWeight: 600, marginBottom: 2 }}>{doctor.specialization}</p>
            <p style={{ fontSize: 12, color: '#6B7280' }}>₹{doctor.consultationFee} · {doctor.experience}yr experience</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Appointment type */}
            <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: '18px 20px' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 10 }}>What's your concern?</p>
              <select value={form.appointmentType} onChange={e => set('appointmentType', e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, outline: 'none', background: '#F5F7FA', cursor: 'pointer' }}>
                {APPOINTMENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            {/* Reason */}
            <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: '18px 20px' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 10 }}>Describe your symptoms <span style={{ color: '#9CA3AF', fontWeight: 400 }}>(optional)</span></p>
              <textarea value={form.reason} onChange={e => set('reason', e.target.value)}
                placeholder="Tell us about your symptoms or health concern..."
                rows={3} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
            </div>

            {/* Date */}
            <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: '18px 20px' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={15} color={T} /> Select Date
              </p>
              <input type="date" value={form.appointmentDate} onChange={e => setForm(p => ({ ...p, appointmentDate: e.target.value, appointmentTime: '' }))}
                min={new Date().toISOString().split('T')[0]} required
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E5E7EB', borderRadius: 10, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>

            {/* Time slots */}
            <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: '18px 20px' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={15} color={T} /> Select Time Slot
              </p>
              {slots.length === 0 ? (
                <p style={{ fontSize: 13, color: '#EF4444', fontWeight: 600 }}>
                  Doctor is not available on this day. Please pick another date.
                </p>
              ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(80px,1fr))', gap: 8 }}>
                {slots.map(slot => (
                  <button key={slot} type="button" onClick={() => set('appointmentTime', slot)}
                    style={{
                      padding: '10px 6px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', border: `1.5px solid ${form.appointmentTime === slot ? T : '#E5E7EB'}`,
                      background: form.appointmentTime === slot ? T : '#F5F7FA',
                      color: form.appointmentTime === slot ? '#fff' : '#374151',
                      transition: 'all 0.15s',
                    }}>
                    {slot}
                  </button>
                ))}
              </div>
              )}
            </div>

            {/* Booking for */}
            <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: '18px 20px' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Booking for</p>
              <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 12 }}>Select everyone you want to book an appointment for.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

                {/* Myself */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: `1.5px solid ${selectedAttendees.has('self') ? T : '#E5E7EB'}`, borderRadius: 12, cursor: 'pointer', background: selectedAttendees.has('self') ? '#F0FDF4' : '#fff' }}>
                  <input type="checkbox" checked={selectedAttendees.has('self')} onChange={() => toggleAttendee('self')} style={{ width: 16, height: 16, accentColor: T }} />
                  <User size={18} color={T} />
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Myself</p>
                    <p style={{ fontSize: 12, color: '#6B7280' }}>{user?.name}</p>
                  </div>
                </label>

                {/* Family members — each as its own checkbox */}
                {user?.familyMembers?.map((fm, i) => (
                  <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: `1.5px solid ${selectedAttendees.has(String(i)) ? T : '#E5E7EB'}`, borderRadius: 12, cursor: 'pointer', background: selectedAttendees.has(String(i)) ? '#F0FDF4' : '#fff' }}>
                    <input type="checkbox" checked={selectedAttendees.has(String(i))} onChange={() => toggleAttendee(String(i))} style={{ width: 16, height: 16, accentColor: T }} />
                    <Users size={18} color={T} />
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{fm.name}</p>
                      <p style={{ fontSize: 12, color: '#6B7280' }}>{fm.relationship}{fm.gender ? ` · ${fm.gender}` : ''}{fm.bloodGroup ? ` · ${fm.bloodGroup}` : ''}</p>
                    </div>
                  </label>
                ))}

                {(!user?.familyMembers || user.familyMembers.length === 0) && (
                  <p style={{ fontSize: 12, color: '#9CA3AF', padding: '8px 2px' }}>
                    No family members added yet.{' '}
                    <span onClick={() => navigate('/patient/family')} style={{ color: T, cursor: 'pointer', fontWeight: 600 }}>Add one →</span>
                  </p>
                )}
              </div>

              {selectedAttendees.size > 1 && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: 10 }}>
                  <p style={{ fontSize: 12, color: '#1D4ED8', fontWeight: 600 }}>
                    {selectedAttendees.size} appointments will be created — one per person, each with their own token number.
                  </p>
                </div>
              )}
            </div>

            {/* Previous Prescription Upload */}
            <div style={{ background: '#fff', border: '1.5px solid #E5E7EB', borderRadius: 16, padding: '18px 20px' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Paperclip size={15} color={T} /> Upload Previous Prescription
                <span style={{ fontSize: 11, fontWeight: 400, color: '#9CA3AF', marginLeft: 4 }}>(optional)</span>
              </p>
              <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 12 }}>Help the doctor review your history before the visit.</p>

              {!form.prescriptionFile ? (
                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, border: '2px dashed #D1D5DB', borderRadius: 12, padding: '20px', cursor: 'pointer', background: '#FAFAFA', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = T}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#D1D5DB'}>
                  <Paperclip size={22} color="#9CA3AF" />
                  <p style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>Click to browse or drag & drop</p>
                  <p style={{ fontSize: 11, color: '#9CA3AF' }}>PDF, JPG, PNG — max 5MB</p>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) { toast.error('File too large (max 5MB)'); return; }
                      set('prescriptionFile', file);
                    }}
                  />
                </label>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Paperclip size={16} color={T} />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{form.prescriptionFile.name}</p>
                      <p style={{ fontSize: 11, color: '#6B7280' }}>{(form.prescriptionFile.size / 1024).toFixed(0)} KB</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => set('prescriptionFile', null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', padding: 2 }}>
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Summary + submit */}
            {form.appointmentTime && (
              <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 16, padding: '16px 20px', marginBottom: 4 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: T, marginBottom: 6 }}>Booking Summary</p>
                <p style={{ fontSize: 13, color: '#374151' }}>Dr. {doctor.name.replace(/^Dr\.?\s+/, '')} · {form.appointmentDate} · {form.appointmentTime}</p>
                <p style={{ fontSize: 13, color: '#374151' }}>
                  Fee: ₹{doctor.consultationFee}{selectedAttendees.size > 1 ? ` × ${selectedAttendees.size} people = ₹${doctor.consultationFee * selectedAttendees.size}` : ''}
                </p>
                {selectedAttendees.size > 1 && (
                  <p style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                    Booking for: {[
                      selectedAttendees.has('self') ? user?.name : null,
                      ...(user?.familyMembers || []).map((fm, i) => selectedAttendees.has(String(i)) ? fm.name : null)
                    ].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            )}

            <button type="submit" disabled={!form.appointmentTime || slots.length === 0}
              style={{ width: '100%', background: !form.appointmentTime ? '#9CA3AF' : T, color: '#fff', fontWeight: 800, fontSize: 15, padding: '14px', borderRadius: 14, border: 'none', cursor: form.appointmentTime ? 'pointer' : 'not-allowed', transition: 'background 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              💳 Pay & Confirm{selectedAttendees.size > 1 ? ` (${selectedAttendees.size})` : ''}
            </button>

            <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: -6 }}>
              You can cancel or reschedule up to 24 hours before the appointment.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
