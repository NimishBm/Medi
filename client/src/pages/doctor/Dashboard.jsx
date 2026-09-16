import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Sidebar } from '../../components/Sidebar';
import { Navbar } from '../../components/Navbar';
import { appointmentAPI, analyticsAPI, consultationAPI } from '../../services/api';
import toast from 'react-hot-toast';

const doctorNav = [
  { path: '/doctor', label: 'Dashboard', icon: '📊' },
  { path: '/doctor/profile', label: 'My Profile', icon: '👤' },
  { path: '/doctor/queue', label: 'Live Queue', icon: '⏱️' },
  { path: '/doctor/appointments', label: 'Appointments', icon: '📋' },
];

export const DoctorDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [appointments, setAppointments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [monthlyAnalytics, setMonthlyAnalytics] = useState(null);
  const [recentConsultations, setRecentConsultations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const appRes = await appointmentAPI.getTodayAppointments();
        setAppointments(appRes.data);

        const anaRes = await analyticsAPI.getTodayAnalytics();
        setAnalytics(anaRes.data);

        const monthlyRes = await analyticsAPI.getDoctorAnalytics(user._id);
        setMonthlyAnalytics(monthlyRes.data);

        const consultRes = await consultationAPI.getConsultationsByDoctor(user._id);
        setRecentConsultations(consultRes.data.slice(0, 5));
      } catch (error) {
        toast.error('Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user._id]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const completed = appointments.filter((a) => a.status === 'COMPLETED').length;
  const waiting = appointments.filter((a) => a.status === 'WAITING').length;
  const consulting = appointments.filter((a) => a.status === 'CONSULTING').length;

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar navItems={doctorNav} />
      <div className="flex-1 flex flex-col">
        <Navbar title="Doctor Dashboard" />
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card border-l-4 border-blue-600">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Total Patients</h3>
              <p className="text-4xl font-bold text-blue-600">{appointments.length}</p>
            </div>
            <div className="card border-l-4 border-green-600">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Completed</h3>
              <p className="text-4xl font-bold text-green-600">{completed}</p>
            </div>
            <div className="card border-l-4 border-yellow-600">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Consulting</h3>
              <p className="text-4xl font-bold text-yellow-600">{consulting}</p>
            </div>
            <div className="card border-l-4 border-purple-600">
              <h3 className="text-sm font-medium text-gray-600 mb-2">Waiting</h3>
              <p className="text-4xl font-bold text-purple-600">{waiting}</p>
            </div>
          </div>

          {monthlyAnalytics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="card border-l-4 border-orange-600">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Total Revenue (30d)</h3>
                <p className="text-3xl font-bold text-orange-600">₹{monthlyAnalytics.totalRevenue || 0}</p>
              </div>
              <div className="card border-l-4 border-indigo-600">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Patients Served (30d)</h3>
                <p className="text-3xl font-bold text-indigo-600">{monthlyAnalytics.patientsServed || 0}</p>
              </div>
              <div className="card border-l-4 border-pink-600">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Avg. Consultation Time</h3>
                <p className="text-3xl font-bold text-pink-600">{monthlyAnalytics.averageConsultationTime || 0}m</p>
              </div>
            </div>
          )}

          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Today's Appointments</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Token</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Patient</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Time</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((apt) => (
                    <tr key={apt._id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-bold text-blue-600">#{apt.tokenNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{apt.patientId.name}</td>
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

          {recentConsultations.length > 0 && (
            <div className="card mt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Consultations</h2>
              <div className="space-y-3">
                {recentConsultations.map((consultation) => (
                  <div key={consultation._id} className="border border-gray-200 rounded p-3 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{consultation.patientId.name}</p>
                        <p className="text-sm text-gray-600">{consultation.diagnosis}</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(consultation.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <a href="/doctor/queue" className="btn-primary inline-block">
              Go to Queue Management
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
