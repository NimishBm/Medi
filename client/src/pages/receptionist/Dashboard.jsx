import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Sidebar } from '../../components/Sidebar';
import { Navbar } from '../../components/Navbar';
import { analyticsAPI, appointmentAPI } from '../../services/api';
import toast from 'react-hot-toast';

const receptionistNav = [
  { path: '/receptionist', label: 'Dashboard', icon: '📊' },
  { path: '/receptionist/appointments', label: 'Appointments', icon: '📋' },
  { path: '/receptionist/queue', label: 'Queue', icon: '⏱️' },
];

export const ReceptionistDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const assignedDoctor = user?.assignedDoctorId;
  const doctorName = typeof assignedDoctor === 'object' ? assignedDoctor?.name : null;
  const [analytics, setAnalytics] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const anaRes = await analyticsAPI.getClinicAnalytics();
        setAnalytics(anaRes.data);

        const appRes = await appointmentAPI.getTodayAppointments();
        setAppointments(appRes.data);
      } catch (error) {
        toast.error('Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar navItems={receptionistNav} />
      <div className="flex-1 flex flex-col">
        <Navbar title="Clinic Dashboard" />
        <div className="p-8">
          {doctorName && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm text-emerald-800">
                Managing appointments for: <span className="font-bold">Dr. {doctorName}</span>
              </p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="card border-l-4 border-blue-600">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Total Today</h3>
              <p className="text-3xl font-bold text-blue-600">{analytics?.totalAppointmentsToday || 0}</p>
            </div>
            <div className="card border-l-4 border-green-600">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Completed</h3>
              <p className="text-3xl font-bold text-green-600">{analytics?.completedToday || 0}</p>
            </div>
            <div className="card border-l-4 border-yellow-600">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Waiting</h3>
              <p className="text-3xl font-bold text-yellow-600">{analytics?.waitingToday || 0}</p>
            </div>
            <div className="card border-l-4 border-red-600">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Cancelled</h3>
              <p className="text-3xl font-bold text-red-600">{analytics?.cancelledToday || 0}</p>
            </div>
            <div className="card border-l-4 border-purple-600">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Revenue</h3>
              <p className="text-3xl font-bold text-purple-600">₹{analytics?.revenueToday || 0}</p>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Today's Appointments</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Token</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Patient</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Doctor</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Time</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((apt) => (
                    <tr key={apt._id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-bold text-blue-600">#{apt.tokenNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{apt.patientId.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Dr. {apt.doctorId.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{apt.appointmentTime}</td>
                      <td className="px-4 py-3">
                        <span className="badge badge-info text-xs">{apt.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
