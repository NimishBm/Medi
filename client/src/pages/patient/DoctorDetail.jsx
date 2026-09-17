import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { doctorAPI, queueAPI } from '../../services/api';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

const REVIEWS = [
  { name: 'Rajesh Kumar', rating: 5, text: 'Excellent doctor, very professional and caring', date: '2 weeks ago' },
  { name: 'Priya Singh', rating: 4.5, text: 'Great experience, helped me recover quickly', date: '1 month ago' },
  { name: 'Amit Patel', rating: 5, text: 'Best consultation I had, highly recommended', date: '1 month ago' },
  { name: 'Sneha Desai', rating: 4, text: 'Good doctor, a bit busy but helpful', date: '2 months ago' },
];

export const DoctorDetail = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const [doctor, setDoctor] = useState(null);
  const [queueStats, setQueueStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const docRes = await doctorAPI.getDoctorById(doctorId);
        setDoctor(docRes.data);

        const queueRes = await queueAPI.getQueueByDoctorId(doctorId);
        setQueueStats(queueRes.data);
      } catch (error) {
        toast.error('Failed to load doctor details');
        navigate('/patient/marketplace');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [doctorId, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-3"></div>
          <p className="text-gray-700 font-medium">Loading profile...</p>
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

  const waitTime = (queueStats?.waiting || 0) * (doctor.averageConsultationTime || 10);
  const avgRating = REVIEWS.reduce((sum, r) => sum + r.rating, 0) / REVIEWS.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/patient/marketplace')} className="text-gray-600 hover:text-gray-900 text-2xl">
            ←
          </button>
          <h1 className="text-lg font-bold text-gray-900">Doctor Profile</h1>
          <button
            onClick={() => dispatch(logout())}
            className="text-gray-700 hover:text-red-600 font-medium text-xs px-3 py-1.5"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Doctor Header Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden">
          {/* Banner */}
          <div className="h-24 bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600"></div>

          {/* Doctor Info */}
          <div className="p-6 -mt-8 relative">
            <div className="flex items-end gap-4 mb-6">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-3xl font-bold text-blue-600 shadow-lg border-4 border-white">
                {doctor.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">Dr. {doctor.name.replace(/^Dr\.?\s+/, '')}</h2>
                <p className="text-lg text-blue-600 font-semibold">{doctor.specialization}</p>
              </div>
              <button
                onClick={() => navigate(`/patient/doctors/${doctorId}/book`)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-colors"
              >
                Book Now
              </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4 pb-6 border-b border-gray-200">
              <div>
                <p className="text-xs text-gray-600">Experience</p>
                <p className="text-xl font-bold text-gray-900">{doctor.experience}y</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Rating</p>
                <p className="text-xl font-bold text-yellow-500">{avgRating.toFixed(1)}⭐</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Fees</p>
                <p className="text-xl font-bold text-gray-900">₹{doctor.consultationFee}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Queue</p>
                <p className={`text-xl font-bold ${queueStats?.waiting > 5 ? 'text-red-600' : queueStats?.waiting > 2 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {queueStats?.waiting || 0}
                </p>
              </div>
            </div>

            {/* Queue Alert */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                <span className="font-bold">Est. Wait Time: {waitTime}m</span> • {queueStats?.waiting || 0} patients waiting
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-2 space-y-6">
            {/* About Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">About Dr. {doctor.name.replace(/^Dr\.?\s+/, '')}</h3>

              {doctor.qualifications && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-semibold">Qualifications:</span> {doctor.qualifications.join(', ')}
                  </p>
                </div>
              )}

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-semibold">Location:</span> Room {doctor.roomNumber}, Clinic
                </p>
              </div>

              <p className="text-sm text-gray-700">
                Experienced {doctor.specialization} with {doctor.experience} years of practice. Specializes in comprehensive patient care with focus on
                quality and patient satisfaction. Average consultation time: {doctor.averageConsultationTime} minutes.
              </p>
            </div>

            {/* Availability */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Weekly Schedule</h3>
              <div className="grid grid-cols-2 gap-3">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map((day) => {
                  const avail = doctor.availability?.[day];
                  const isOpen = avail && avail.start && avail.end;
                  return (
                    <div key={day} className={`p-3 rounded-lg border ${isOpen ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                      <p className="text-xs font-semibold text-gray-700 capitalize">{day}</p>
                      <p className={`text-sm font-medium ${isOpen ? 'text-green-700' : 'text-gray-500'}`}>
                        {isOpen ? `${avail.start} - ${avail.end}` : 'Closed'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Patient Reviews ({REVIEWS.length})</h3>
              <div className="space-y-4">
                {REVIEWS.map((review, idx) => (
                  <div key={idx} className="pb-4 border-b border-gray-200 last:border-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{review.name}</p>
                        <p className="text-xs text-gray-500">{review.date}</p>
                      </div>
                      <p className="text-yellow-500 font-bold">{review.rating}⭐</p>
                    </div>
                    <p className="text-sm text-gray-700">{review.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Book */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-sm p-6 text-white">
              <h4 className="font-bold mb-4">Quick Book</h4>
              <button
                onClick={() => navigate(`/patient/doctors/${doctorId}/book`)}
                className="w-full bg-white text-blue-600 hover:bg-gray-100 py-3 rounded-lg font-bold transition-colors mb-3"
              >
                Book Appointment
              </button>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-blue-100">Wait Time</p>
                  <p className="text-2xl font-bold">{waitTime}m</p>
                </div>
                <div className="pt-2 border-t border-blue-400">
                  <p className="text-blue-100">Next Available</p>
                  <p className="font-bold">Today, 3:00 PM</p>
                </div>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
              <div>
                <p className="text-xs text-gray-600">Avg Consultation</p>
                <p className="font-bold text-gray-900">{doctor.averageConsultationTime} minutes</p>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600">Patient Satisfaction</p>
                <p className="font-bold text-green-600">98% Happy</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
