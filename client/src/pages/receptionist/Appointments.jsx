import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Navbar } from '../../components/Navbar';
import { appointmentAPI } from '../../services/api';
import toast from 'react-hot-toast';

const receptionistNav = [
  { path: '/receptionist', label: 'Dashboard', icon: '📊' },
  { path: '/receptionist/appointments', label: 'Appointments', icon: '📋' },
];

export const ReceptionistAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

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

  const handleCheckIn = async (appointmentId) => {
    try {
      await appointmentAPI.checkInPatient(appointmentId);
      setAppointments(appointments.map((a) =>
        a._id === appointmentId ? { ...a, status: 'CHECKED_IN' } : a
      ));
      toast.success('Patient checked in');
    } catch (error) {
      toast.error('Failed to check in patient');
    }
  };

  const handleCancel = async (appointmentId) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await appointmentAPI.cancelAppointment(appointmentId);
      setAppointments(appointments.map((a) =>
        a._id === appointmentId ? { ...a, status: 'CANCELLED' } : a
      ));
      toast.success('Appointment cancelled');
    } catch (error) {
      toast.error('Failed to cancel appointment');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const filtered = filter === 'ALL' ? appointments : appointments.filter((a) => a.status === filter);

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar navItems={receptionistNav} />
      <div className="flex-1 flex flex-col">
        <Navbar title="Manage Appointments" />
        <div className="p-8">
          <div className="card mb-6">
            <div className="flex gap-2 flex-wrap">
              {['ALL', 'BOOKED', 'CHECKED_IN', 'WAITING', 'CONSULTING', 'COMPLETED'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`btn btn-small ${
                    filter === status ? 'btn-primary' : 'btn-secondary'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Appointments ({filtered.length})</h2>
            <div className="space-y-3">
              {filtered.map((apt) => (
                <div key={apt._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xl font-bold text-blue-600">#{apt.tokenNumber}</span>
                        <h3 className="font-semibold text-gray-900">{apt.patientId.name}</h3>
                        <span className="badge badge-info text-xs">{apt.status}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <strong>Doctor:</strong> Dr. {apt.doctorId.name}
                        </div>
                        <div>
                          <strong>Date:</strong> {new Date(apt.appointmentDate).toLocaleDateString()}
                        </div>
                        <div>
                          <strong>Time:</strong> {apt.appointmentTime}
                        </div>
                        <div>
                          <strong>Room:</strong> {apt.doctorId.roomNumber}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {apt.status === 'BOOKED' && (
                      <>
                        <button
                          onClick={() => handleCheckIn(apt._id)}
                          className="btn btn-primary btn-small"
                        >
                          Check In
                        </button>
                        <button
                          onClick={() => handleCancel(apt._id)}
                          className="btn btn-danger btn-small"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
