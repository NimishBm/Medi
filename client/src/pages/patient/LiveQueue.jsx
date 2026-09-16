import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Sidebar } from '../../components/Sidebar';
import { Navbar } from '../../components/Navbar';
import { appointmentAPI, queueAPI } from '../../services/api';
import { initSocket, getSocket } from '../../services/socket';
import toast from 'react-hot-toast';

const patientNav = [
  { path: '/patient', label: 'Dashboard', icon: '📊' },
  { path: '/patient/book-appointment', label: 'Book Appointment', icon: '📅' },
  { path: '/patient/appointments', label: 'My Appointments', icon: '📋' },
  { path: '/patient/queue', label: 'Live Queue', icon: '⏱️' },
];

const getStatusColor = (status) => {
  switch (status) {
    case 'COMPLETED': return 'bg-green-100 text-green-800';
    case 'CONSULTING': return 'bg-blue-100 text-blue-800';
    case 'CALLED': return 'bg-yellow-100 text-yellow-800';
    case 'WAITING': return 'bg-gray-100 text-gray-800';
    case 'SKIPPED': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const LiveQueue = () => {
  const { user } = useSelector((state) => state.auth);
  const [nextAppointment, setNextAppointment] = useState(null);
  const [queue, setQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const appRes = await appointmentAPI.getAppointments();
        const upcoming = appRes.data
          .filter((a) => a.status !== 'CANCELLED' && a.status !== 'NO_SHOW')
          .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))[0];

        if (upcoming) {
          setNextAppointment(upcoming);
          const queueRes = await queueAPI.getQueueByDoctorId(upcoming.doctorId._id);
          setQueue(queueRes.data.queue);
        }
      } catch (error) {
        toast.error('Failed to load queue');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const socket = initSocket();

    if (nextAppointment?._id) {
      socket.emit('join-queue', { doctorId: nextAppointment.doctorId._id });

      const handleQueueUpdate = () => {
        fetchData();
      };

      socket.on('queue-update', handleQueueUpdate);

      return () => {
        socket.off('queue-update', handleQueueUpdate);
        socket.emit('leave-queue', { doctorId: nextAppointment.doctorId._id });
      };
    }
  }, [nextAppointment?.doctorId._id]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!nextAppointment) {
    return (
      <div className="flex bg-gray-100 min-h-screen">
        <Sidebar navItems={patientNav} />
        <div className="flex-1 flex flex-col">
          <Navbar title="Live Queue" />
          <div className="p-8 flex items-center justify-center">
            <div className="card text-center py-12 bg-blue-50">
              <p className="text-gray-600 mb-4">No upcoming appointments</p>
              <a href="/patient/book-appointment" className="btn-primary inline-block">
                Book an Appointment
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const myPosition = queue.find((q) => q.patientId._id === user._id);
  const consulting = queue.find((q) => q.status === 'CONSULTING');
  const waiting = queue.filter((q) => q.status === 'WAITING');
  const patientsAhead = waiting.filter((q) => q.tokenNumber < (myPosition?.tokenNumber || 0)).length;

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar navItems={patientNav} />
      <div className="flex-1 flex flex-col">
        <Navbar title="Live Queue Status" />
        <div className="p-8">
          <div className="mb-8">
            <div className="card border-b-4 border-blue-600">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Dr. {nextAppointment.doctorId.name}</h2>
                  <p className="text-gray-600">{nextAppointment.doctorId.specialization} • Room {nextAppointment.doctorId.roomNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 uppercase">Currently Serving</p>
                  <p className="text-3xl font-bold text-blue-600">#{consulting?.tokenNumber || '—'}</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 uppercase">Your Token</p>
                  <p className="text-3xl font-bold text-green-600">#{myPosition?.tokenNumber || '—'}</p>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 uppercase">Ahead of You</p>
                  <p className="text-3xl font-bold text-yellow-600">{patientsAhead}</p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-xs text-gray-600 uppercase">Est. Wait Time</p>
                  <p className="text-3xl font-bold text-purple-600">~{patientsAhead * 10}m</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Queue List</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {queue.map((item, index) => (
                    <div
                      key={item._id}
                      className={`p-3 rounded-lg flex items-center justify-between border ${
                        item.patientId._id === user._id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold text-gray-900">#{item.tokenNumber}</span>
                        <div>
                          <p className="font-medium text-gray-900">{item.patientId.name}</p>
                          {item.patientId._id === user._id && (
                            <p className="text-xs text-blue-600 font-medium">You</p>
                          )}
                        </div>
                      </div>
                      <span className={`badge ${getStatusColor(item.status)} text-xs`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="card bg-green-50 border-l-4 border-green-600">
                <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
                <p className="text-2xl font-bold text-green-600 mb-2">
                  {myPosition?.status === 'CALLED' && '✓ Your Turn!'}
                  {myPosition?.status === 'CONSULTING' && '🔵 In Consultation'}
                  {myPosition?.status === 'WAITING' && `⏳ Waiting`}
                  {myPosition?.status === 'COMPLETED' && '✓ Completed'}
                </p>
                <p className="text-sm text-gray-700">
                  {myPosition?.status === 'CALLED' && 'Please proceed to the consultation room.'}
                  {myPosition?.status === 'WAITING' && `You are #${patientsAhead + 1} in line.`}
                  {myPosition?.status === 'CONSULTING' && 'Your consultation is in progress.'}
                </p>
              </div>

              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-3">Queue Stats</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total in Queue:</span>
                    <span className="font-medium text-gray-900">{queue.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Waiting:</span>
                    <span className="font-medium text-gray-900">{waiting.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed:</span>
                    <span className="font-medium text-gray-900">
                      {queue.filter((q) => q.status === 'COMPLETED').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
