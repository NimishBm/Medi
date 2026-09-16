import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../../components/Sidebar';
import { Navbar } from '../../components/Navbar';
import { doctorAPI, appointmentAPI } from '../../services/api';
import toast from 'react-hot-toast';

const SYMPTOM_MAP = {
  cardiologist: ['heart', 'chest', 'bp', 'blood pressure', 'palpitation', 'cardiac', 'arrhythmia'],
  dermatologist: ['skin', 'rash', 'acne', 'eczema', 'itching', 'hair', 'nail', 'mole', 'psoriasis'],
  'general physician': ['fever', 'cold', 'cough', 'flu', 'headache', 'fatigue', 'general', 'weakness', 'stomach', 'pain'],
  ophthalmologist: ['eye', 'vision', 'sight', 'glasses', 'contact', 'blurry', 'eye pain'],
  dentist: ['tooth', 'teeth', 'dental', 'cavity', 'gum', 'oral'],
  orthopedic: ['bone', 'fracture', 'joint', 'arthritis', 'back pain', 'knee', 'spine'],
};

const QUICK_SYMPTOMS = ['Fever', 'Skin Issues', 'Heart Pain', 'Eye Problem', 'Bone Pain'];
const SYMPTOM_KEYWORDS = {
  'Fever': 'fever',
  'Skin Issues': 'skin',
  'Heart Pain': 'heart',
  'Eye Problem': 'eye',
  'Bone Pain': 'bone',
};

const APPOINTMENT_TYPES = [
  { value: 'General Consultation', icon: '🏥' },
  { value: 'New Patient', icon: '👤' },
  { value: 'Follow-up', icon: '🔄' },
  { value: 'Specialist Consultation', icon: '🩺' },
  { value: 'Routine Check-up', icon: '✅' },
  { value: 'Emergency', icon: '🚨' },
  { value: 'Vaccination', icon: '💉' },
  { value: 'Teleconsultation', icon: '💻' },
];

const patientNav = [
  { path: '/patient', label: 'Dashboard', icon: '📊' },
  { path: '/patient/book-appointment', label: 'Book Appointment', icon: '📅' },
  { path: '/patient/appointments', label: 'My Appointments', icon: '📋' },
  { path: '/patient/family', label: 'Family Members', icon: '👨‍👩‍👧' },
  { path: '/patient/queue', label: 'Live Queue', icon: '⏱️' },
];

export const BookAppointment = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [bookFor, setBookFor] = useState('myself');
  const [selectedFamilyMember, setSelectedFamilyMember] = useState(null);
  const [appointmentType, setAppointmentType] = useState('General Consultation');

  const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30'];

  const filteredDoctors = useMemo(() => {
    if (!search.trim()) return doctors;
    const q = search.toLowerCase();

    // direct name or specialization match
    const direct = doctors.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.specialization?.toLowerCase().includes(q)
    );
    if (direct.length) return direct;

    // symptom keyword match → find matching specialization(s)
    const matchedSpecs = Object.entries(SYMPTOM_MAP)
      .filter(([, keywords]) => keywords.some(k => q.includes(k) || k.includes(q)))
      .map(([spec]) => spec);

    const bySymptom = doctors.filter(d =>
      matchedSpecs.some(s => d.specialization?.toLowerCase().includes(s))
    );
    if (bySymptom.length) return bySymptom;

    // fallback: general physician
    return doctors.filter(d =>
      d.specialization?.toLowerCase().includes('general')
    );
  }, [search, doctors]);

  const isGeneralFallback =
    search.trim().length > 0 &&
    filteredDoctors.length > 0 &&
    filteredDoctors.every(d => d.specialization?.toLowerCase().includes('general')) &&
    !doctors.filter(d =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.specialization?.toLowerCase().includes(search.toLowerCase())
    ).length;

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await doctorAPI.getDoctors();
        setDoctors(response.data);
      } catch (error) {
        toast.error('Failed to load doctors');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!selectedDoctor || !appointmentDate || !appointmentTime) {
      toast.error('Please fill in all fields');
      return;
    }

    if (bookFor === 'family' && !selectedFamilyMember) {
      toast.error('Please select a family member');
      return;
    }

    setIsSubmitting(true);
    try {
      const appointmentData = {
        patientId: user._id,
        doctorId: selectedDoctor._id,
        appointmentDate,
        appointmentTime,
        reason: reason || 'Regular checkup',
        appointmentType,
      };

      if (bookFor === 'family' && selectedFamilyMember) {
        appointmentData.bookedFor = {
          name: selectedFamilyMember.name,
          relationship: selectedFamilyMember.relationship,
          isFamilyMember: true,
        };
        appointmentData.bookedBy = user._id;
      }

      const response = await appointmentAPI.createAppointment(appointmentData);

      toast.success('Appointment booked successfully!');
      navigate('/patient/appointments');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to book appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar navItems={patientNav} />
      <div className="flex-1 flex flex-col">
        <Navbar title="Book Appointment" />
        <div className="p-8 max-w-4xl mx-auto w-full">
          <form onSubmit={handleBookAppointment} className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Doctor & Time</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search by Problem or Doctor Name</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="e.g. fever, skin rash, heart problem, or doctor name..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 mb-3"
              />
              <div className="flex flex-wrap gap-2">
                {QUICK_SYMPTOMS.map((symptom) => (
                  <button
                    key={symptom}
                    type="button"
                    onClick={() => setSearch(SYMPTOM_KEYWORDS[symptom])}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                      search === SYMPTOM_KEYWORDS[symptom]
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {symptom}
                  </button>
                ))}
              </div>
            </div>

            {isGeneralFallback && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  No specialist found for "{search}". Showing General Physicians instead.
                </p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Select Doctor {filteredDoctors.length < doctors.length && `(${filteredDoctors.length})`}</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDoctors.map((doctor) => (
                  <div
                    key={doctor._id}
                    onClick={() => setSelectedDoctor(doctor)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                      selectedDoctor?._id === doctor._id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-300 hover:border-blue-600'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">Dr. {doctor.name}</p>
                    <p className="text-sm text-gray-600 mb-2">{doctor.specialization}</p>
                    {doctor.experience && (
                      <p className="text-xs text-gray-600 mb-1">🎯 {doctor.experience} years experience</p>
                    )}
                    {doctor.qualifications?.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-1">
                        {doctor.qualifications.slice(0, 2).map((qual, idx) => (
                          <span key={idx} className="badge badge-info text-xs">
                            {qual}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-sm text-blue-600 font-medium mt-2">₹{doctor.consultationFee}/-</p>
                    <p className="text-xs text-gray-500 mt-1">Room {doctor.roomNumber}</p>
                  </div>
                ))}
              </div>
            </div>

            {selectedDoctor && (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Appointment Type</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {APPOINTMENT_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setAppointmentType(type.value)}
                        className={`p-3 border-2 rounded-lg transition text-center ${
                          appointmentType === type.value
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-300 hover:border-blue-600'
                        }`}
                      >
                        <div className="text-2xl mb-1">{type.icon}</div>
                        <p className="text-xs font-medium text-gray-900">{type.value}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Book Appointment For</label>
                  <div className="flex gap-6">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="bookFor"
                        value="myself"
                        checked={bookFor === 'myself'}
                        onChange={(e) => {
                          setBookFor(e.target.value);
                          setSelectedFamilyMember(null);
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Myself</span>
                    </label>
                    {user?.familyMembers?.length > 0 && (
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="bookFor"
                          value="family"
                          checked={bookFor === 'family'}
                          onChange={(e) => setBookFor(e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium text-gray-700">Family Member</span>
                      </label>
                    )}
                  </div>
                  {bookFor === 'family' && (
                    <select
                      value={selectedFamilyMember?._id || ''}
                      onChange={(e) => {
                        const member = user.familyMembers[parseInt(e.target.value)];
                        setSelectedFamilyMember(member);
                      }}
                      className="mt-3 w-full md:w-1/2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="">Select a family member...</option>
                      {user.familyMembers.map((member, idx) => (
                        <option key={idx} value={idx}>
                          {member.name} ({member.relationship})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Appointment Date</label>
                  <input
                    type="date"
                    required
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Select Time</label>
                  <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setAppointmentTime(time)}
                        className={`py-2 rounded-lg font-medium transition ${
                          appointmentTime === time
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Visit</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    rows="3"
                    placeholder="Describe your symptoms or reason for visit"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary text-lg"
                >
                  {isSubmitting ? 'Booking...' : 'Confirm Appointment'}
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
