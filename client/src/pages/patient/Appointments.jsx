import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { appointmentAPI } from '../../services/api';
import { logout } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

const TABS = ['Upcoming', 'Completed', 'Cancelled'];

export const Appointments = () => {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Upcoming');
  const [cancelingId, setCancelingId] = useState(null);
  const [reviews, setReviews] = useState({});

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setIsLoading(true);
        const response = await appointmentAPI.getAppointments();
        setAppointments(response.data);
      } catch (error) {
        toast.error('Failed to load appointments');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const filteredAppointments = useMemo(() => {
    const now = new Date();
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.appointmentDate);
      aptDate.setHours(0, 0, 0, 0);
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      if (activeTab === 'Upcoming') {
        return aptDate >= todayDate && apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED';
      }
      if (activeTab === 'Completed') {
        return apt.status === 'COMPLETED';
      }
      if (activeTab === 'Cancelled') {
        return apt.status === 'CANCELLED';
      }
      return true;
    });
  }, [appointments, activeTab]);

  const handleCancel = async (appointmentId) => {
    try {
      setCancelingId(appointmentId);
      await appointmentAPI.cancelAppointment(appointmentId);
      toast.success('Appointment cancelled');
      setAppointments(appointments.map((apt) =>
        apt._id === appointmentId ? { ...apt, status: 'CANCELLED' } : apt
      ));
    } catch (error) {
      toast.error('Failed to cancel appointment');
    } finally {
      setCancelingId(null);
    }
  };

  const updateReview = (appointmentId, field, value) => {
    setReviews((prev) => ({
      ...prev,
      [appointmentId]: {
        ...(prev[appointmentId] || { rating: 0, comment: '', submitted: false }),
        [field]: value,
      },
    }));
  };

  const submitReview = (appointmentId) => {
    const review = reviews[appointmentId];
    if (!review || (review.rating === 0 && !review.comment)) {
      toast.error('Please add a rating or comment');
      return;
    }
    updateReview(appointmentId, 'submitted', true);
    toast.success('Thank you for your review!');
    // TODO: Call API when backend supports reviews
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'BOOKED':
        return 'bg-blue-100 text-blue-700';
      case 'COMPLETED':
        return 'bg-green-100 text-green-700';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-700';
      case 'CHECKED_IN':
      case 'WAITING':
      case 'CALLED':
      case 'CONSULTING':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-3"></div>
          <p className="text-gray-700 font-medium">Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => navigate('/patient')} className="text-gray-600 hover:text-gray-900 text-2xl">
            ←
          </button>
          <h1 className="text-lg font-bold text-gray-900">My Appointments</h1>
          <button
            onClick={() => dispatch(logout())}
            className="text-gray-700 hover:text-red-600 font-medium text-xs px-3 py-1.5"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 bg-white p-3 rounded-lg shadow-sm">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Appointments List */}
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <p className="text-gray-600 text-lg mb-4">No {activeTab.toLowerCase()} appointments</p>
            <Link to="/patient" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium">
              Browse Doctors
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => {
              const aptDate = new Date(appointment.appointmentDate);
              const review = reviews[appointment._id] || { rating: 0, comment: '', submitted: false };

              return (
                <div key={appointment._id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden">
                  {/* Main Card Content */}
                  <div className="flex">
                    {/* LEFT PANEL - Doctor & Booking Details (65%) */}
                    <div className="flex-1 p-5">
                      {/* Doctor Header */}
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
                          {appointment.doctorId.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-base">Dr. {appointment.doctorId.name.replace(/^Dr\.?\s+/, '')}</h3>
                          <p className="text-sm text-blue-600 font-semibold">{appointment.doctorId.specialization}</p>
                          <p className="text-xs text-gray-600 mt-1">{appointment.doctorId.experience}y exp • ₹{appointment.doctorId.consultationFee}</p>
                        </div>
                      </div>

                      <hr className="my-4 border-gray-200" />

                      {/* Booking Details */}
                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="text-xs text-gray-500 font-medium">PATIENT</p>
                          {appointment.bookedFor?.isFamilyMember ? (
                            <p className="text-gray-900 font-semibold">
                              {appointment.bookedFor.name}
                              <span className="text-xs text-gray-500 font-normal ml-1">({appointment.bookedFor.relationship})</span>
                            </p>
                          ) : (
                            <p className="text-gray-900 font-semibold">Self</p>
                          )}
                        </div>

                        {appointment.reason && (
                          <div>
                            <p className="text-xs text-gray-500 font-medium">REASON</p>
                            <p className="text-gray-900">{appointment.reason}</p>
                          </div>
                        )}

                        <div>
                          <p className="text-xs text-gray-500 font-medium">TYPE</p>
                          <p className="text-gray-900">{appointment.appointmentType}</p>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT PANEL - Receipt Style (35%) */}
                    <div className="w-56 bg-gray-50 border-l border-dashed border-gray-300 p-4 flex flex-col justify-between">
                      {/* Receipt Content */}
                      <div className="space-y-3">
                        {/* Token */}
                        <div className="text-center pb-3 border-b border-dashed border-gray-300">
                          <p className="text-xs text-gray-500 font-medium">TOKEN</p>
                          <p className="text-3xl font-black text-gray-800">#{appointment.tokenNumber}</p>
                        </div>

                        {/* Date, Time, Room */}
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-gray-500">Date</p>
                            <p className="text-sm font-semibold text-gray-900">{aptDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Time</p>
                            <p className="text-sm font-semibold text-gray-900">{appointment.appointmentTime}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Room</p>
                            <p className="text-sm font-semibold text-gray-900">Room {appointment.doctorId.roomNumber}</p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="pt-2">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${getStatusBadgeColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="pt-3 border-t border-dashed border-gray-300">
                        {appointment.status === 'BOOKED' && (
                          <button
                            onClick={() => handleCancel(appointment._id)}
                            disabled={cancelingId === appointment._id}
                            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-2 rounded-lg font-semibold text-xs transition-colors"
                          >
                            {cancelingId === appointment._id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        )}
                        {(appointment.status === 'CHECKED_IN' || appointment.status === 'WAITING' || appointment.status === 'CALLED' || appointment.status === 'CONSULTING') && (
                          <Link
                            to="/patient/queue"
                            className="block text-center bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold text-xs transition-colors"
                          >
                            Track Queue →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* REVIEW SECTION (COMPLETED only) */}
                  {appointment.status === 'COMPLETED' && (
                    <div className="border-t border-gray-200 bg-blue-50 p-5">
                      <h4 className="font-bold text-gray-900 mb-3 text-sm">How was your visit?</h4>

                      {!review.submitted ? (
                        <div className="space-y-3">
                          {/* Star Rating */}
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => updateReview(appointment._id, 'rating', star)}
                                className="transition-transform hover:scale-110"
                              >
                                <span className={`text-2xl ${review.rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}>
                                  ★
                                </span>
                              </button>
                            ))}
                          </div>

                          {/* Comment Textarea */}
                          <textarea
                            placeholder="Share your feedback (optional)"
                            value={review.comment}
                            onChange={(e) => updateReview(appointment._id, 'comment', e.target.value)}
                            rows="2"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm placeholder-gray-500 resize-none"
                          />

                          {/* Submit Button */}
                          <button
                            onClick={() => submitReview(appointment._id)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold text-xs transition-colors"
                          >
                            Submit Review
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-green-700">
                          <span className="text-lg">✅</span>
                          <p className="text-sm font-medium">Thank you for your review!</p>
                        </div>
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
