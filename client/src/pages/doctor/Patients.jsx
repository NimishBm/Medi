import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { appointmentAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Heart, LogOut, Search, Mail, Phone, ArrowLeft } from 'lucide-react';

export const DoctorPatients = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await appointmentAPI.getAppointments();
        const uniquePatients = [];
        const patientIds = new Set();

        response.data.forEach((apt) => {
          if (!patientIds.has(apt.patientId._id)) {
            patientIds.add(apt.patientId._id);
            uniquePatients.push({
              ...apt.patientId,
              lastAppointment: apt.appointmentDate,
            });
          }
        });

        setPatients(uniquePatients);
        setFilteredPatients(uniquePatients);
      } catch (error) {
        toast.error('Failed to load patients');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      const filtered = patients.filter((patient) =>
        patient.name.toLowerCase().includes(query.toLowerCase()) ||
        patient.email?.toLowerCase().includes(query.toLowerCase()) ||
        patient.phone?.includes(query)
      );
      setFilteredPatients(filtered);
    } else {
      setFilteredPatients(patients);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

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
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Patients</h1>
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
              onClick={() => navigate('/doctor/queue')}
              className="text-gray-700 hover:text-teal-600 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-teal-50 transition hidden sm:block"
            >
              Live Queue
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">My Patients</h2>
          <p className="text-gray-600">View and manage all your registered patients</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-8">
          <div className="bg-white border border-teal-200 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total</p>
            <p className="text-xl sm:text-3xl font-bold text-teal-600">{patients.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Showing</p>
            <p className="text-xl sm:text-3xl font-bold text-green-600">{filteredPatients.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Today</p>
            <p className="text-xl sm:text-3xl font-bold text-orange-600">0</p>
          </div>
        </div>

        {/* Patients List */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {filteredPatients.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <p className="text-sm sm:text-lg text-gray-600">No patients found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="hidden sm:block">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold text-gray-900">Phone</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold text-gray-900">Last Appointment</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.map((patient) => (
                      <tr
                        key={patient._id}
                        className="border-b border-gray-200 hover:bg-gray-50 transition"
                      >
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <p className="font-medium text-sm text-gray-900">{patient.name}</p>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail size={16} className="hidden sm:block" />
                            <span className="text-xs sm:text-sm">{patient.email || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone size={16} className="hidden sm:block" />
                            <span className="text-xs sm:text-sm">{patient.phone || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <span className="text-xs sm:text-sm text-gray-600">
                            {new Date(patient.lastAppointment).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4">
                          <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile Card View */}
              <div className="sm:hidden space-y-2 p-3">
                {filteredPatients.map((patient) => (
                  <div key={patient._id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-sm text-gray-900">{patient.name}</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Mail size={14} />
                      <span>{patient.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Phone size={14} />
                      <span>{patient.phone || 'N/A'}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Last: {new Date(patient.lastAppointment).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
