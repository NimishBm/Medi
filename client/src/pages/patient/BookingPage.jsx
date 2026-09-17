import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { doctorAPI, appointmentAPI } from '../../services/api';
import { logout } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import { ChevronLeft, Heart } from 'lucide-react';

const appointmentTypes = [
  'General Consultation',
  'New Patient',
  'Follow-up',
  'Specialist Consultation',
  'Routine Check-up',
  'Emergency',
  'Vaccination',
  'Teleconsultation',
];

// Dummy time slots for testing - will be replaced with doctor's availableTimeSlots
const DUMMY_TIME_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30'];

export const BookingPage = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  const [formData, setFormData] = useState({
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '',
    appointmentType: 'General Consultation',
    reason: '',
    bookFor: 'self',
    selectedFamilyMember: '',
  });

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        setLoading(true);
        const docRes = await doctorAPI.getDoctorById(doctorId);
        setDoctor(docRes.data);
      } catch (error) {
        toast.error('Failed to load doctor details');
        navigate('/patient/marketplace');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctor();
  }, [doctorId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.appointmentDate || !formData.appointmentTime) {
      toast.error('Please select date and time');
      return;
    }

    try {
      setBooking(true);
      const payload = {
        patientId: user._id,
        doctorId,
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime,
        appointmentType: formData.appointmentType,
        reason: formData.reason || 'Consultation',
      };

      if (formData.bookFor === 'family' && formData.selectedFamilyMember) {
        const familyMember = user.familyMembers[parseInt(formData.selectedFamilyMember)];
        payload.bookedFor = {
          name: familyMember.name,
          relationship: familyMember.relationship,
          isFamilyMember: true,
        };
        payload.bookedBy = user._id;
      }

      await appointmentAPI.createAppointment(payload);
      toast.success('Appointment booked successfully!');
      navigate('/patient/my-appointments');
    } catch (error) {
      console.error('Booking error:', error.response?.data);
      const message = error.response?.data?.message || error.response?.data?.error || 'Failed to book appointment';
      toast.error(message);
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-3"></div>
          <p className="text-gray-700 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <p className="text-gray-600">Doctor not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(`/patient/doctors/${doctorId}`)} className="text-gray-600 hover:text-gray-900 p-1">
              <ChevronLeft size={22} />
            </button>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Heart className="text-white" size={18} strokeWidth={2.5} />
            </div>
            <h1 className="text-base font-bold text-gray-900">ClinicFlow</h1>
          </div>
          <h2 className="text-base font-bold text-gray-900">Book Appointment</h2>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center bg-gray-100 px-3 py-1.5 rounded-full">
              <span className="text-xs font-medium text-gray-700">{user?.name?.split(' ')[0]}</span>
            </div>
            <button
              onClick={() => dispatch(logout())}
              className="text-gray-700 hover:text-red-600 font-medium text-xs px-3 py-1.5"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Doctor Summary Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-2xl font-bold text-white">
            {doctor.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900">Dr. {doctor.name.replace(/^Dr\.?\s+/, '')}</h3>
            <p className="text-sm text-blue-600 font-semibold">{doctor.specialization}</p>
            <p className="text-xs text-gray-600 mt-1">₹{doctor.consultationFee} • {doctor.experience}y experience</p>
          </div>
        </div>

        {/* Booking Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Select Date & Time</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Appointment Type */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">What's your concern?</label>
              <select
                value={formData.appointmentType}
                onChange={(e) => setFormData({ ...formData, appointmentType: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {appointmentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">Describe your symptoms (optional)</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Tell us more about your symptoms or health concern..."
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">Select Date</label>
              <input
                type="date"
                value={formData.appointmentDate}
                onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Time Slots - From Doctor Profile */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">Select Time Slot</label>
              {doctor?.availableTimeSlots && doctor.availableTimeSlots.length > 0 ? (
                <div className="grid grid-cols-4 gap-3">
                  {doctor.availableTimeSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setFormData({ ...formData, appointmentTime: slot })}
                      className={`py-3 rounded-lg font-medium transition-all ${
                        formData.appointmentTime === slot
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                    {DUMMY_TIME_SLOTS.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setFormData({ ...formData, appointmentTime: slot })}
                        className={`py-3 rounded-lg font-medium transition-all ${
                          formData.appointmentTime === slot
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Booking For */}
            <div className="border-t pt-6">
              <label className="block text-sm font-semibold text-gray-900 mb-4">Booking for</label>
              <div className="space-y-3">
                <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="bookFor"
                    value="self"
                    checked={formData.bookFor === 'self'}
                    onChange={(e) => setFormData({ ...formData, bookFor: e.target.value })}
                    className="mr-3 w-4 h-4"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Myself</p>
                    <p className="text-xs text-gray-600">{user.name}</p>
                  </div>
                </label>

                {user.familyMembers && user.familyMembers.length > 0 && (
                  <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="bookFor"
                      value="family"
                      checked={formData.bookFor === 'family'}
                      onChange={(e) => setFormData({ ...formData, bookFor: e.target.value })}
                      className="mr-3 w-4 h-4"
                    />
                    <p className="font-medium text-gray-900">Family Member</p>
                  </label>
                )}
              </div>

              {formData.bookFor === 'family' && user.familyMembers && user.familyMembers.length > 0 && (
                <select
                  value={formData.selectedFamilyMember}
                  onChange={(e) => setFormData({ ...formData, selectedFamilyMember: e.target.value })}
                  className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a family member</option>
                  {user.familyMembers.map((member, idx) => (
                    <option key={idx} value={idx}>
                      {member.name} ({member.relationship})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={booking || !formData.appointmentTime}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-400 text-white py-4 rounded-lg font-bold transition-all"
            >
              {booking ? 'Booking...' : 'Confirm Booking'}
            </button>
          </form>

          {/* Cancellation Policy */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <span className="font-semibold">Note:</span> You can cancel or reschedule your appointment up to 24 hours before the scheduled time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
