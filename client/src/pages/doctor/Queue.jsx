import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { queueAPI, consultationAPI, appointmentAPI } from '../../services/api';
import { initSocket } from '../../services/socket';
import toast from 'react-hot-toast';
import { Heart, LogOut, AlertCircle, CheckCircle, Phone, ArrowLeft } from 'lucide-react';

export const DoctorQueue = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [showConsultationNotes, setShowConsultationNotes] = useState(false);
  const [isSubmittingNotes, setIsSubmittingNotes] = useState(false);
  const [consultationNotes, setConsultationNotes] = useState({
    symptoms: '',
    diagnosis: '',
    treatmentPlan: '',
    followUpDate: '',
  });

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const res = await queueAPI.getQueueByDoctorId(user._id);
        setQueue(res.data.queue);
        const consulting = res.data.queue.find((q) => q.status === 'CONSULTING');
        setCurrentPatient(consulting);
        if (!consulting) {
          setShowConsultationNotes(false);
          setConsultationNotes({
            symptoms: '',
            diagnosis: '',
            treatmentPlan: '',
            followUpDate: '',
          });
        }
      } catch (error) {
        toast.error('Failed to load queue');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQueue();
    const socket = initSocket();
    socket.on('queue-update', fetchQueue);

    return () => socket.off('queue-update', fetchQueue);
  }, [user._id]);

  const handleCallNext = async () => {
    try {
      await queueAPI.callNextPatient({ doctorId: user._id });
      toast.success('Next patient called');
    } catch (error) {
      toast.error('Failed to call next patient');
    }
  };

  const handleStartConsultation = async (queueId) => {
    try {
      await queueAPI.startConsultation({ queueId });
      toast.success('Consultation started');
    } catch (error) {
      toast.error('Failed to start consultation');
    }
  };

  const handleSkipPatient = async (appointmentId) => {
    try {
      await queueAPI.skipPatient({ appointmentId, doctorId: user._id });
      toast.success('Patient skipped');
    } catch (error) {
      toast.error('Failed to skip patient');
    }
  };

  const handleNoShow = async (appointmentId) => {
    if (window.confirm('Mark patient as no-show?')) {
      try {
        await queueAPI.markNoShow({ appointmentId, doctorId: user._id });
        toast.success('Patient marked as no-show');
      } catch (error) {
        toast.error('Failed to mark no-show');
      }
    }
  };

  const handleCompleteWithNotes = async () => {
    if (!consultationNotes.diagnosis.trim()) {
      toast.error('Please enter diagnosis');
      return;
    }

    setIsSubmittingNotes(true);
    try {
      await consultationAPI.createConsultation({
        appointmentId: currentPatient.appointmentId,
        symptoms: consultationNotes.symptoms,
        diagnosis: consultationNotes.diagnosis,
        treatmentPlan: consultationNotes.treatmentPlan,
        followUpDate: consultationNotes.followUpDate,
      });

      await queueAPI.completeConsultation({ queueId: currentPatient._id });

      toast.success('Consultation completed and notes saved!');
      setShowConsultationNotes(false);
      setConsultationNotes({
        symptoms: '',
        diagnosis: '',
        treatmentPlan: '',
        followUpDate: '',
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save consultation');
    } finally {
      setIsSubmittingNotes(false);
    }
  };

  const handleCompleteWithoutNotes = async () => {
    try {
      await queueAPI.completeConsultation({ queueId: currentPatient._id });
      toast.success('Consultation completed');
      setShowConsultationNotes(false);
    } catch (error) {
      toast.error('Failed to complete consultation');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const queueStats = {
    waiting: queue.filter((q) => q.status === 'WAITING').length,
    called: queue.filter((q) => q.status === 'CALLED').length,
    completed: queue.filter((q) => q.status === 'COMPLETED').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/doctor')}
              className="sm:hidden text-teal-600 hover:text-teal-700 p-2"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
              <Heart className="text-white" size={24} strokeWidth={2.5} />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Live Queue</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/doctor')}
              className="text-gray-700 hover:text-teal-600 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-teal-50 transition hidden sm:block"
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('/doctor/appointments')}
              className="text-gray-700 hover:text-teal-600 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-teal-50 transition hidden sm:block"
            >
              Appointments
            </button>
            <button
              onClick={() => navigate('/doctor/profile')}
              className="text-gray-700 hover:text-teal-600 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-teal-50 transition hidden sm:block"
            >
              My Profile
            </button>
            <div className="hidden sm:block h-6 border-l border-gray-300"></div>
            <div className="hidden sm:flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
              <span className="text-sm font-medium text-gray-700">{user?.name?.split(' ')[0]}</span>
            </div>
            <button
              onClick={() => dispatch(logout())}
              className="text-gray-700 hover:text-red-600 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        {/* Title */}
        <div className="mb-4 sm:mb-8 hidden sm:block">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Live Queue Management</h2>
          <p className="text-gray-600">Manage your current patients and consultation queue</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Current Patient - Large Section */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
              {currentPatient ? (
                <>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                    <Phone size={24} className="text-teal-600" />
                    Current Patient
                  </h2>
                  <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-4 sm:p-8 rounded-lg mb-4 sm:mb-6 border border-teal-200">
                    <p className="text-xs sm:text-sm text-teal-700 mb-2 font-medium">Token Number</p>
                    <p className="text-4xl sm:text-6xl font-bold text-teal-600 mb-4 sm:mb-6">#{currentPatient.tokenNumber}</p>
                    <div className="border-t border-teal-200 pt-4 sm:pt-6">
                      <p className="text-lg sm:text-2xl font-bold text-gray-900 mb-2">{currentPatient.patientId.name}</p>
                      <p className="text-sm sm:text-base text-gray-700 mb-3">
                        <span className="font-medium">Phone:</span> {currentPatient.patientId.phone}
                      </p>
                      {currentPatient.patientId.allergies?.length > 0 && (
                        <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                          <p className="text-xs font-bold text-red-800 mb-2">⚠️ Allergies:</p>
                          <div className="flex flex-wrap gap-2">
                            {currentPatient.patientId.allergies.map((allergy, idx) => (
                              <span key={idx} className="badge bg-red-200 text-red-800 text-xs px-2 py-1 rounded-full">
                                {allergy}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {currentPatient.status === 'CONSULTING' ? (
                    !showConsultationNotes ? (
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowConsultationNotes(true)}
                          className="flex-1 bg-green-600 text-white hover:bg-green-700 px-4 py-3 rounded-lg font-medium transition"
                        >
                          Complete Consultation
                        </button>
                        <button
                          onClick={() => handleNoShow(currentPatient.appointmentId)}
                          className="flex-1 bg-red-600 text-white hover:bg-red-700 px-4 py-3 rounded-lg font-medium transition"
                        >
                          No-Show
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-teal-300 p-6 rounded-lg bg-teal-50">
                        <h3 className="font-bold text-gray-900 mb-4 text-lg">📋 Consultation Notes</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Symptoms</label>
                            <input
                              type="text"
                              placeholder="e.g. Fever, Cough, Headache"
                              value={consultationNotes.symptoms}
                              onChange={(e) => setConsultationNotes({
                                ...consultationNotes,
                                symptoms: e.target.value,
                              })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Diagnosis *</label>
                            <textarea
                              placeholder="Enter diagnosis"
                              value={consultationNotes.diagnosis}
                              onChange={(e) => setConsultationNotes({
                                ...consultationNotes,
                                diagnosis: e.target.value,
                              })}
                              rows="3"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Treatment Plan</label>
                            <textarea
                              placeholder="Medication, lifestyle changes, etc."
                              value={consultationNotes.treatmentPlan}
                              onChange={(e) => setConsultationNotes({
                                ...consultationNotes,
                                treatmentPlan: e.target.value,
                              })}
                              rows="3"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Follow-up Date</label>
                            <input
                              type="date"
                              value={consultationNotes.followUpDate}
                              onChange={(e) => setConsultationNotes({
                                ...consultationNotes,
                                followUpDate: e.target.value,
                              })}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                            />
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={handleCompleteWithNotes}
                              disabled={isSubmittingNotes}
                              className="flex-1 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 px-4 py-3 rounded-lg font-medium transition"
                            >
                              {isSubmittingNotes ? 'Saving...' : 'Save & Complete'}
                            </button>
                            <button
                              onClick={handleCompleteWithoutNotes}
                              className="flex-1 bg-gray-400 text-white hover:bg-gray-500 px-4 py-3 rounded-lg font-medium transition"
                            >
                              Skip Notes
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleStartConsultation(currentPatient._id)}
                        className="flex-1 bg-teal-600 text-white hover:bg-teal-700 px-4 py-3 rounded-lg font-medium transition"
                      >
                        Start Consultation
                      </button>
                      <button
                        onClick={() => handleSkipPatient(currentPatient.appointmentId)}
                        className="flex-1 bg-gray-400 text-white hover:bg-gray-500 px-4 py-3 rounded-lg font-medium transition"
                      >
                        Skip
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16">
                  <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-6 text-lg font-medium">No patient currently consulting</p>
                  <button onClick={handleCallNext} className="bg-teal-600 text-white hover:bg-teal-700 px-8 py-3 rounded-lg font-medium transition">
                    Call Next Patient
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Stats & Queue Summary */}
          <div className="space-y-6">
            {/* Queue Stats */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Queue Stats</h3>
              <div className="space-y-4">
                <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                  <p className="text-xs text-gray-600 font-medium mb-1">Waiting</p>
                  <p className="text-3xl font-bold text-teal-600">{queueStats.waiting}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-xs text-gray-600 font-medium mb-1">Called</p>
                  <p className="text-3xl font-bold text-yellow-600">{queueStats.called}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-xs text-gray-600 font-medium mb-1">Completed</p>
                  <p className="text-3xl font-bold text-green-600">{queueStats.completed}</p>
                </div>
              </div>
              {!currentPatient && (
                <button onClick={handleCallNext} className="w-full bg-teal-600 text-white hover:bg-teal-700 px-4 py-3 rounded-lg font-medium transition mt-4">
                  Call Next Patient
                </button>
              )}
            </div>

            {/* Next in Queue */}
            {queue.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Next 3 in Queue</h3>
                <div className="space-y-2">
                  {queue.slice(0, 3).map((item, idx) => (
                    <div key={item._id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-teal-400 transition">
                      <p className="font-bold text-lg text-teal-600">#{item.tokenNumber}</p>
                      <p className="text-sm font-medium text-gray-900">{item.patientId.name}</p>
                      <p className="text-xs text-gray-600 mt-1 capitalize">{item.status}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Full Queue List */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Full Queue</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {queue.length === 0 ? (
              <p className="text-center text-gray-600 py-8">No patients in queue</p>
            ) : (
              queue.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-teal-400 transition"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-bold text-gray-900 min-w-[50px]">#{item.tokenNumber}</span>
                    <div>
                      <p className="font-medium text-gray-900">{item.patientId.name}</p>
                      <p className="text-xs text-gray-600">{item.patientId.phone}</p>
                    </div>
                  </div>
                  <span className={`badge text-xs px-3 py-1 rounded-full font-medium ${
                    item.status === 'CONSULTING' ? 'bg-green-100 text-green-700' :
                    item.status === 'CALLED' ? 'bg-yellow-100 text-yellow-700' :
                    item.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
