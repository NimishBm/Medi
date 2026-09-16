import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Navbar } from '../../components/Navbar';
import { queueAPI, doctorAPI } from '../../services/api';
import { initSocket } from '../../services/socket';
import toast from 'react-hot-toast';

const receptionistNav = [
  { path: '/receptionist', label: 'Dashboard', icon: '📊' },
  { path: '/receptionist/queue', label: 'Queue', icon: '⏱️' },
];

export const ReceptionistQueue = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [queue, setQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await doctorAPI.getDoctors();
        setDoctors(response.data);
        if (response.data.length > 0) {
          setSelectedDoctorId(response.data[0]._id);
        }
      } catch (error) {
        toast.error('Failed to load doctors');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  useEffect(() => {
    if (!selectedDoctorId) return;

    const fetchQueue = async () => {
      try {
        const response = await queueAPI.getQueueByDoctorId(selectedDoctorId);
        setQueue(response.data.queue);
      } catch (error) {
        toast.error('Failed to load queue');
      }
    };

    fetchQueue();
    const socket = initSocket();
    socket.on('queue-update', fetchQueue);

    return () => socket.off('queue-update', fetchQueue);
  }, [selectedDoctorId]);

  const handleSkip = async (queueId) => {
    try {
      await queueAPI.skipPatient({ queueId });
      toast.success('Patient skipped');
    } catch (error) {
      toast.error('Failed to skip patient');
    }
  };

  const handleRecall = async (queueId) => {
    try {
      await queueAPI.recallPatient({ queueId });
      toast.success('Patient recalled');
    } catch (error) {
      toast.error('Failed to recall patient');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const selectedDoctor = doctors.find((d) => d._id === selectedDoctorId);

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar navItems={receptionistNav} />
      <div className="flex-1 flex flex-col">
        <Navbar title="Queue Management" />
        <div className="p-8">
          <div className="card mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Doctor</label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {doctors.map((doctor) => (
                <option key={doctor._id} value={doctor._id}>
                  Dr. {doctor.name} - {doctor.specialization} (Room {doctor.roomNumber})
                </option>
              ))}
            </select>
          </div>

          {selectedDoctor && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="card border-l-4 border-blue-600">
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Total</h3>
                  <p className="text-3xl font-bold text-blue-600">{queue.length}</p>
                </div>
                <div className="card border-l-4 border-yellow-600">
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Waiting</h3>
                  <p className="text-3xl font-bold text-yellow-600">
                    {queue.filter((q) => q.status === 'WAITING').length}
                  </p>
                </div>
                <div className="card border-l-4 border-green-600">
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Completed</h3>
                  <p className="text-3xl font-bold text-green-600">
                    {queue.filter((q) => q.status === 'COMPLETED').length}
                  </p>
                </div>
                <div className="card border-l-4 border-red-600">
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Skipped</h3>
                  <p className="text-3xl font-bold text-red-600">
                    {queue.filter((q) => q.status === 'SKIPPED').length}
                  </p>
                </div>
              </div>

              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Queue</h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {queue.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <span className="text-xl font-bold text-gray-900 min-w-12">#{item.tokenNumber}</span>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.patientId.name}</p>
                          <p className="text-xs text-gray-600">{item.patientId.phone}</p>
                        </div>
                        <span className="badge badge-info text-xs">{item.status}</span>
                      </div>
                      <div className="flex gap-2">
                        {item.status === 'WAITING' && (
                          <button
                            onClick={() => handleSkip(item._id)}
                            className="btn btn-secondary btn-small text-xs"
                          >
                            Skip
                          </button>
                        )}
                        {item.status === 'SKIPPED' && (
                          <button
                            onClick={() => handleRecall(item._id)}
                            className="btn btn-primary btn-small text-xs"
                          >
                            Recall
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
