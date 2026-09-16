import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Sidebar } from '../../components/Sidebar';
import { Navbar } from '../../components/Navbar';
import { queueAPI, consultationAPI, appointmentAPI } from '../../services/api';
import { initSocket } from '../../services/socket';
import toast from 'react-hot-toast';

const doctorNav = [
  { path: '/doctor', label: 'Dashboard', icon: '📊' },
  { path: '/doctor/profile', label: 'My Profile', icon: '👤' },
  { path: '/doctor/queue', label: 'Live Queue', icon: '⏱️' },
  { path: '/doctor/appointments', label: 'Appointments', icon: '📋' },
];

export const DoctorQueue = () => {
  const { user } = useSelector((state) => state.auth);
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

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar navItems={doctorNav} />
      <div className="flex-1 flex flex-col">
        <Navbar title="Queue Management" />
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <div className="card">
                {currentPatient ? (
                  <>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Patient</h2>
                    <div className="bg-blue-50 p-6 rounded-lg mb-6">
                      <p className="text-sm text-gray-600 mb-2">Token Number</p>
                      <p className="text-5xl font-bold text-blue-600 mb-4">#{currentPatient.tokenNumber}</p>
                      <p className="text-xl font-semibold text-gray-900">{currentPatient.patientId.name}</p>
                      <p className="text-sm text-gray-600">Phone: {currentPatient.patientId.phone}</p>
                      {currentPatient.patientId.allergies?.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <p className="text-xs font-medium text-gray-700 mb-1">Allergies:</p>
                          <div className="flex flex-wrap gap-1">
                            {currentPatient.patientId.allergies.map((allergy, idx) => (
                              <span key={idx} className="badge badge-danger text-xs">
                                {allergy}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {currentPatient.status === 'CONSULTING' ? (
                      !showConsultationNotes ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowConsultationNotes(true)}
                            className="flex-1 btn bg-green-600 text-white hover:bg-green-700"
                          >
                            Complete Consultation
                          </button>
                          <button
                            onClick={() => handleNoShow(currentPatient.appointmentId)}
                            className="flex-1 btn btn-danger"
                          >
                            No-Show
                          </button>
                        </div>
                      ) : (
                        <div className="border border-blue-200 p-4 rounded-lg bg-blue-50">
                          <h3 className="font-semibold text-gray-900 mb-4">Consultation Notes</h3>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms</label>
                              <input
                                type="text"
                                placeholder="e.g. Fever, Cough, Headache"
                                value={consultationNotes.symptoms}
                                onChange={(e) => setConsultationNotes({
                                  ...consultationNotes,
                                  symptoms: e.target.value,
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis *</label>
                              <textarea
                                placeholder="Enter diagnosis"
                                value={consultationNotes.diagnosis}
                                onChange={(e) => setConsultationNotes({
                                  ...consultationNotes,
                                  diagnosis: e.target.value,
                                })}
                                rows="3"
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Plan</label>
                              <textarea
                                placeholder="Medication, lifestyle changes, etc."
                                value={consultationNotes.treatmentPlan}
                                onChange={(e) => setConsultationNotes({
                                  ...consultationNotes,
                                  treatmentPlan: e.target.value,
                                })}
                                rows="3"
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
                              <input
                                type="date"
                                value={consultationNotes.followUpDate}
                                onChange={(e) => setConsultationNotes({
                                  ...consultationNotes,
                                  followUpDate: e.target.value,
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={handleCompleteWithNotes}
                                disabled={isSubmittingNotes}
                                className="flex-1 btn bg-green-600 text-white hover:bg-green-700"
                              >
                                {isSubmittingNotes ? 'Saving...' : 'Save & Complete'}
                              </button>
                              <button
                                onClick={handleCompleteWithoutNotes}
                                className="flex-1 btn-secondary"
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
                          className="flex-1 btn-primary"
                        >
                          Start Consultation
                        </button>
                        <button
                          onClick={() => handleSkipPatient(currentPatient.appointmentId)}
                          className="flex-1 btn-secondary"
                        >
                          Skip
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-600 mb-4">No patient currently consulting</p>
                    <button onClick={handleCallNext} className="btn-primary">
                      Call Next Patient
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="card">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Queue Stats</h3>
                <div className="space-y-3">
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Waiting</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {queue.filter((q) => q.status === 'WAITING').length}
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Called</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {queue.filter((q) => q.status === 'CALLED').length}
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-green-600">
                      {queue.filter((q) => q.status === 'COMPLETED').length}
                    </p>
                  </div>
                </div>
              </div>

              {!currentPatient && (
                <button onClick={handleCallNext} className="w-full btn-primary mt-4">
                  Call Next Patient
                </button>
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Full Queue</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {queue.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-bold text-gray-900">#{item.tokenNumber}</span>
                    <div>
                      <p className="font-medium text-gray-900">{item.patientId.name}</p>
                      <p className="text-xs text-gray-600">{item.patientId.phone}</p>
                    </div>
                  </div>
                  <span className="badge badge-info text-xs">{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
