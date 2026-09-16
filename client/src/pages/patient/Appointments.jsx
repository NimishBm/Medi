import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Sidebar } from '../../components/Sidebar';
import { Navbar } from '../../components/Navbar';
import { appointmentAPI } from '../../services/api';
import toast from 'react-hot-toast';

const patientNav = [
  { path: '/patient', label: 'Dashboard', icon: '📊' },
  { path: '/patient/book-appointment', label: 'Book Appointment', icon: '📅' },
  { path: '/patient/appointments', label: 'My Appointments', icon: '📋' },
  { path: '/patient/family', label: 'Family Members', icon: '👨‍👩‍👧' },
  { path: '/patient/queue', label: 'Live Queue', icon: '⏱️' },
];

const TABS = ['All', 'Upcoming', 'Past', 'Cancelled'];

export const Appointments = () => {
  const { user } = useSelector((state) => state.auth);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [cancelingId, setCancelingId] = useState(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
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
      now.setHours(0, 0, 0, 0);

      if (activeTab === 'Upcoming') {
        return aptDate >= now && apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED';
      }
      if (activeTab === 'Past') {
        return aptDate < now || apt.status === 'COMPLETED';
      }
      if (activeTab === 'Cancelled') {
        return apt.status === 'CANCELLED';
      }
      return true;
    });
  }, [appointments, activeTab]);

  const handleCancel = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    setCancelingId(appointmentId);
    try {
      await appointmentAPI.cancelAppointment(appointmentId);
      setAppointments(appointments.map((a) => a._id === appointmentId ? { ...a, status: 'CANCELLED' } : a));
      toast.success('Appointment cancelled');
    } catch (error) {
      toast.error('Failed to cancel appointment');
    } finally {
      setCancelingId(null);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar navItems={patientNav} />
      <div className="flex-1 flex flex-col">
        <Navbar title="My Appointments" />
        <div className="p-8 max-w-6xl mx-auto w-full">
          <div className="card">
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                    activeTab === tab
                      ? 'btn-primary'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {filteredAppointments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg mb-4">No {activeTab.toLowerCase()} appointments</p>
                <a href="/patient/book-appointment" className="btn-primary inline-block">
                  Book Appointment
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAppointments.map((appointment) => (
                  <div key={appointment._id} className="border border-gray-300 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">Dr. {appointment.doctorId.name}</h3>
                        <p className="text-sm text-gray-600">{appointment.doctorId.specialization}</p>
                      </div>
                      <span className={`badge text-xs ${
                        appointment.status === 'BOOKED' ? 'badge-info' :
                        appointment.status === 'COMPLETED' ? 'badge-success' :
                        appointment.status === 'CANCELLED' ? 'badge-danger' :
                        'badge-warning'
                      }`}>
                        {appointment.status}
                      </span>
                    </div>

                    {appointment.bookedFor?.isFamilyMember && (
                      <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
                        <p className="text-xs text-blue-700">
                          <strong>Booked for:</strong> {appointment.bookedFor.name} ({appointment.bookedFor.relationship})
                        </p>
                      </div>
                    )}

                    <div className="space-y-1 text-sm text-gray-700 mb-4">
                      <p><strong>Date:</strong> {new Date(appointment.appointmentDate).toLocaleDateString()}</p>
                      <p><strong>Time:</strong> {appointment.appointmentTime}</p>
                      <p><strong>Token:</strong> #{appointment.tokenNumber}</p>
                      <p><strong>Room:</strong> {appointment.doctorId.roomNumber}</p>
                    </div>

                    {appointment.reason && (
                      <p className="text-xs text-gray-600 mb-4"><strong>Reason:</strong> {appointment.reason}</p>
                    )}

                    {appointment.status === 'BOOKED' && (
                      <button
                        onClick={() => handleCancel(appointment._id)}
                        disabled={cancelingId === appointment._id}
                        className="btn btn-danger btn-small w-full"
                      >
                        {cancelingId === appointment._id ? 'Cancelling...' : 'Cancel'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
