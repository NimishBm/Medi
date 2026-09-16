import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Sidebar } from '../../components/Sidebar';
import { Navbar } from '../../components/Navbar';
import { appointmentAPI, queueAPI } from '../../services/api';
import { initSocket } from '../../services/socket';
import toast from 'react-hot-toast';

const patientNav = [
  { path: '/patient', label: 'Dashboard', icon: '📊' },
  { path: '/patient/book-appointment', label: 'Book Appointment', icon: '📅' },
  { path: '/patient/appointments', label: 'My Appointments', icon: '📋' },
  { path: '/patient/family', label: 'Family Members', icon: '👨‍👩‍👧' },
  { path: '/patient/queue', label: 'Live Queue', icon: '⏱️' },
  { path: '/patient/prescriptions', label: 'Prescriptions', icon: '💊' },
  { path: '/patient/history', label: 'Medical History', icon: '📚' },
  { path: '/patient/payments', label: 'Payments', icon: '💰' },
];

export const PatientDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [nextAppointment, setNextAppointment] = useState(null);
  const [queue, setQueue] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const appRes = await appointmentAPI.getAppointments();
        setAppointments(appRes.data);

        const upcomingApp = appRes.data
          .filter((a) => a.status !== 'CANCELLED' && a.status !== 'NO_SHOW')
          .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))[0];

        if (upcomingApp) {
          setNextAppointment(upcomingApp);
          const queueRes = await queueAPI.getQueueByDoctorId(upcomingApp.doctorId._id);
          setQueue(queueRes.data.queue);
        }
      } catch (error) {
        toast.error('Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    initSocket();
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const findMyQueue = queue?.find((q) => q.patientId._id === user._id);
  const patientsAhead = queue?.filter(
    (q) => q.tokenNumber < (findMyQueue?.tokenNumber || 0) && q.status === 'WAITING'
  ).length || 0;

  const estimatedWait = patientsAhead * 10;

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar navItems={patientNav} />
      <div className="flex-1 flex flex-col">
        <Navbar title="Patient Dashboard" />
        <div className="p-8">
          {nextAppointment ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="card border-l-4 border-blue-600">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Next Appointment</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(nextAppointment.appointmentDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`badge badge-${
                    nextAppointment.status === 'COMPLETED' ? 'success' :
                    nextAppointment.status === 'CANCELLED' ? 'danger' : 'info'
                  }`}>
                    {nextAppointment.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm">
                    <strong>Doctor:</strong> Dr. {nextAppointment.doctorId.name}
                  </p>
                  <p className="text-sm">
                    <strong>Specialization:</strong> {nextAppointment.doctorId.specialization}
                  </p>
                  <p className="text-sm">
                    <strong>Time:</strong> {nextAppointment.appointmentTime}
                  </p>
                  <p className="text-sm">
                    <strong>Room:</strong> {nextAppointment.doctorId.roomNumber}
                  </p>
                </div>

                <a href="/patient/queue" className="text-blue-600 hover:underline text-sm font-medium">
                  View Live Queue →
                </a>
              </div>

              {findMyQueue && (
                <div className="card border-l-4 border-green-600">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Queue Status</h3>
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Your Token</p>
                      <p className="text-4xl font-bold text-blue-600">#{findMyQueue.tokenNumber}</p>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Currently Serving</p>
                      <p className="text-3xl font-bold text-green-600">
                        #{queue.find((q) => q.status === 'CONSULTING')?.tokenNumber || '—'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-gray-600">Ahead</p>
                        <p className="text-2xl font-bold text-gray-900">{patientsAhead}</p>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg text-center">
                        <p className="text-xs text-gray-600">Est. Wait</p>
                        <p className="text-2xl font-bold text-yellow-600">~{estimatedWait}m</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card text-center py-12 bg-blue-50">
              <p className="text-gray-600 mb-4">No upcoming appointments</p>
              <a href="/patient/book-appointment" className="btn-primary inline-block">
                Book an Appointment
              </a>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-2">Upcoming Visits</h3>
              <p className="text-3xl font-bold text-blue-600">
                {appointments.filter((a) => {
                  const d = new Date(a.appointmentDate);
                  d.setHours(0, 0, 0, 0);
                  const now = new Date();
                  now.setHours(0, 0, 0, 0);
                  return d >= now && a.status !== 'CANCELLED';
                }).length}
              </p>
            </div>
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-2">Total Appointments</h3>
              <p className="text-3xl font-bold text-green-600">
                {appointments.filter((a) => a.status !== 'CANCELLED').length}
              </p>
            </div>
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-2">Completed</h3>
              <p className="text-3xl font-bold text-purple-600">
                {appointments.filter((a) => a.status === 'COMPLETED').length}
              </p>
            </div>
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-2">Family Members</h3>
              <p className="text-3xl font-bold text-orange-600">
                {user?.familyMembers?.length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
