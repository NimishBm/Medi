import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Sidebar } from '../../components/Sidebar';
import { Navbar } from '../../components/Navbar';
import { appointmentAPI, consultationAPI } from '../../services/api';
import toast from 'react-hot-toast';

const TABS = ['All', 'Today', 'Completed', 'Cancelled'];

const TYPE_COLORS = {
  'General Consultation': 'bg-blue-100 text-blue-700',
  'New Patient': 'bg-purple-100 text-purple-700',
  'Follow-up': 'bg-yellow-100 text-yellow-700',
  'Specialist Consultation': 'bg-orange-100 text-orange-700',
  'Routine Check-up': 'bg-teal-100 text-teal-700',
  'Emergency': 'bg-red-100 text-red-700',
  'Vaccination': 'bg-green-100 text-green-700',
  'Teleconsultation': 'bg-indigo-100 text-indigo-700',
};

const APPOINTMENT_TYPE_FILTERS = ['All Types', 'General Consultation', 'New Patient', 'Follow-up', 'Specialist Consultation', 'Emergency', 'Vaccination', 'Teleconsultation'];

const doctorNav = [
  { path: '/doctor', label: 'Dashboard', icon: '📊' },
  { path: '/doctor/profile', label: 'My Profile', icon: '👤' },
  { path: '/doctor/queue', label: 'Live Queue', icon: '⏱️' },
  { path: '/doctor/appointments', label: 'Appointments', icon: '📋' },
];

export const DoctorAppointments = () => {
  const { user } = useSelector((state) => state.auth);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [activeTypeFilter, setActiveTypeFilter] = useState('All Types');
  const [expandedConsultation, setExpandedConsultation] = useState(null);
  const [consultationNotes, setConsultationNotes] = useState({});

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
    now.setHours(0, 0, 0, 0);

    return appointments.filter((apt) => {
      const aptDate = new Date(apt.appointmentDate);
      aptDate.setHours(0, 0, 0, 0);

      let tabMatch = true;
      if (activeTab === 'Today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        tabMatch = aptDate.getTime() === today.getTime();
      } else if (activeTab === 'Completed') {
        tabMatch = apt.status === 'COMPLETED';
      } else if (activeTab === 'Cancelled') {
        tabMatch = apt.status === 'CANCELLED';
      }

      let typeMatch = true;
      if (activeTypeFilter !== 'All Types') {
        typeMatch = apt.appointmentType === activeTypeFilter;
      }

      return tabMatch && typeMatch;
    });
  }, [appointments, activeTab, activeTypeFilter]);

  const handleExpandConsultation = async (appointmentId) => {
    if (expandedConsultation === appointmentId) {
      setExpandedConsultation(null);
      return;
    }

    try {
      if (!consultationNotes[appointmentId]) {
        const response = await consultationAPI.getConsultationsByPatient(appointmentId);
        const notes = response.data.find((c) => c.appointmentId === appointmentId);
        setConsultationNotes((prev) => ({
          ...prev,
          [appointmentId]: notes,
        }));
      }
      setExpandedConsultation(appointmentId);
    } catch (error) {
      toast.error('Failed to load consultation notes');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar navItems={doctorNav} />
      <div className="flex-1 flex flex-col">
        <Navbar title="My Appointments" />
        <div className="p-8 max-w-6xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="card border-l-4 border-blue-600">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Total</h3>
              <p className="text-3xl font-bold text-blue-600">{appointments.length}</p>
            </div>
            <div className="card border-l-4 border-green-600">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Completed</h3>
              <p className="text-3xl font-bold text-green-600">
                {appointments.filter((a) => a.status === 'COMPLETED').length}
              </p>
            </div>
            <div className="card border-l-4 border-yellow-600">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Waiting</h3>
              <p className="text-3xl font-bold text-yellow-600">
                {appointments.filter((a) => a.status === 'WAITING').length}
              </p>
            </div>
            <div className="card border-l-4 border-red-600">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Cancelled</h3>
              <p className="text-3xl font-bold text-red-600">
                {appointments.filter((a) => a.status === 'CANCELLED').length}
              </p>
            </div>
          </div>

          <div className="card">
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
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

            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {APPOINTMENT_TYPE_FILTERS.map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveTypeFilter(type)}
                  className={`px-3 py-1 rounded-lg font-medium transition whitespace-nowrap text-sm ${
                    activeTypeFilter === type
                      ? 'btn-primary'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {filteredAppointments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No {activeTab.toLowerCase()} appointments</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAppointments.map((apt) => (
                  <div key={apt._id}>
                    <div
                      onClick={() => apt.status === 'COMPLETED' && handleExpandConsultation(apt._id)}
                      className={`flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 ${
                        apt.status === 'COMPLETED' ? 'cursor-pointer hover:bg-gray-100' : ''
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-bold text-blue-600">#{apt.tokenNumber}</span>
                          <div>
                            <p className="font-medium text-gray-900">{apt.patientId.name}</p>
                            {apt.reason && <p className="text-xs text-gray-600">{apt.reason}</p>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(apt.appointmentDate).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-600">{apt.appointmentTime}</p>
                        </div>
                        <span className={`badge text-xs ${TYPE_COLORS[apt.appointmentType] || TYPE_COLORS['General Consultation']}`}>
                          {apt.appointmentType || 'General'}
                        </span>
                        <span className="badge badge-info text-xs">{apt.status}</span>
                        {apt.status === 'COMPLETED' && (
                          <span className="text-xs text-blue-600 font-medium">
                            {expandedConsultation === apt._id ? '▼' : '▶'} Notes
                          </span>
                        )}
                      </div>
                    </div>

                    {expandedConsultation === apt._id && consultationNotes[apt._id] && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-2">
                        <div className="space-y-3">
                          {consultationNotes[apt._id].symptoms && (
                            <div>
                              <p className="text-xs font-semibold text-gray-700 mb-1">Symptoms:</p>
                              <p className="text-sm text-gray-600">{consultationNotes[apt._id].symptoms}</p>
                            </div>
                          )}
                          {consultationNotes[apt._id].diagnosis && (
                            <div>
                              <p className="text-xs font-semibold text-gray-700 mb-1">Diagnosis:</p>
                              <p className="text-sm text-gray-600">{consultationNotes[apt._id].diagnosis}</p>
                            </div>
                          )}
                          {consultationNotes[apt._id].treatmentPlan && (
                            <div>
                              <p className="text-xs font-semibold text-gray-700 mb-1">Treatment Plan:</p>
                              <p className="text-sm text-gray-600">{consultationNotes[apt._id].treatmentPlan}</p>
                            </div>
                          )}
                          {consultationNotes[apt._id].followUpDate && (
                            <div>
                              <p className="text-xs font-semibold text-gray-700 mb-1">Follow-up:</p>
                              <p className="text-sm text-gray-600">
                                {new Date(consultationNotes[apt._id].followUpDate).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
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
