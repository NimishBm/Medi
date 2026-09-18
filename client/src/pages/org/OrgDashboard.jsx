import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { organizationAPI, doctorAPI } from '../../services/api';
import { logout } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import { Building2, LogOut, Users, Calendar, Plus, Trash2 } from 'lucide-react';

const orgNav = [
  { label: 'Dashboard', icon: '📊', tab: 'dashboard' },
  { label: 'Doctors', icon: '👨‍⚕️', tab: 'doctors' },
  { label: 'Requests', icon: '🔔', tab: 'requests' },
  { label: 'Appointments', icon: '📋', tab: 'appointments' },
];

export const OrgDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [analytics, setAnalytics] = useState(null);
  const [orgDoctors, setOrgDoctors] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addDoctorId, setAddDoctorId] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [anaRes, docRes, allDocRes, appRes, reqRes] = await Promise.all([
          organizationAPI.getAnalytics(),
          organizationAPI.getDoctors(),
          doctorAPI.getDoctors(),
          organizationAPI.getTodayAppointments(),
          organizationAPI.getRequests(),
        ]);
        setAnalytics(anaRes.data);
        setOrgDoctors(docRes.data);
        setAllDoctors(allDocRes.data);
        setAppointments(appRes.data);
        setRequests(reqRes.data);
      } catch (error) {
        toast.error('Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddDoctor = async () => {
    if (!addDoctorId) return toast.error('Please select a doctor');
    try {
      await organizationAPI.addDoctor(addDoctorId);
      toast.success('Doctor added to organization');
      const [docRes, allDocRes] = await Promise.all([
        organizationAPI.getDoctors(),
        doctorAPI.getDoctors(),
      ]);
      setOrgDoctors(docRes.data);
      setAllDoctors(allDocRes.data);
      setAddDoctorId('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add doctor');
    }
  };

  const handleRemoveDoctor = async (doctorId) => {
    if (!window.confirm('Remove this doctor from your organization?')) return;
    try {
      await organizationAPI.removeDoctor(doctorId);
      toast.success('Doctor removed');
      setOrgDoctors(orgDoctors.filter((d) => d._id !== doctorId));
    } catch (error) {
      toast.error('Failed to remove doctor');
    }
  };

  const handleApprove = async (doctorId) => {
    try {
      const res = await organizationAPI.approveRequest(doctorId);
      toast.success(res.data.message);
      setRequests(requests.filter((r) => r._id !== doctorId));
      const docRes = await organizationAPI.getDoctors();
      setOrgDoctors(docRes.data);
    } catch (error) {
      toast.error('Failed to approve request');
    }
  };

  const handleReject = async (doctorId) => {
    try {
      const res = await organizationAPI.rejectRequest(doctorId);
      toast.success(res.data.message);
      setRequests(requests.filter((r) => r._id !== doctorId));
    } catch (error) {
      toast.error('Failed to reject request');
    }
  };

  // Doctors not yet in this org
  const orgDoctorIds = new Set(orgDoctors.map((d) => d._id));
  const availableDoctors = allDoctors.filter((d) => !orgDoctorIds.has(d._id) && !d.organizationId);

  if (isLoading) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  return (
    <div className="flex bg-gray-100 min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md h-screen flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2 mb-1">
            <Building2 size={20} className="text-violet-600" />
            <h1 className="text-lg font-bold text-violet-600">ClinicFlow</h1>
          </div>
          <p className="text-xs text-gray-500 font-mono bg-violet-50 px-2 py-1 rounded mt-1">
            {user?.orgId}
          </p>
        </div>
        <nav className="flex-1 p-4">
          {orgNav.map((item) => (
            <button
              key={item.tab}
              onClick={() => setActiveTab(item.tab)}
              className={`w-full flex items-center px-4 py-3 rounded-lg mb-2 transition-all text-left ${
                activeTab === item.tab
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-3 text-xl">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t">
          <p className="font-medium text-gray-900 text-sm truncate">{user?.name}</p>
          <p className="text-xs text-gray-500 truncate mb-3">{user?.email}</p>
          <button
            onClick={() => dispatch(logout())}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <header className="bg-white shadow-sm px-8 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {activeTab === 'dashboard' && 'Organization Dashboard'}
            {activeTab === 'doctors' && 'Manage Doctors'}
            {activeTab === 'requests' && (
              <span className="flex items-center gap-2">
                Join Requests
                {requests.length > 0 && (
                  <span className="text-sm bg-orange-500 text-white px-2 py-0.5 rounded-full font-medium">
                    {requests.length}
                  </span>
                )}
              </span>
            )}
            {activeTab === 'appointments' && "Today's Appointments"}
          </h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Building2 size={16} className="text-violet-600" />
            <span className="font-medium">{user?.name}</span>
          </div>
        </header>

        <div className="p-8">

          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <div className="card border-l-4 border-violet-600">
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Total Doctors</h3>
                  <p className="text-3xl font-bold text-violet-600">{analytics?.totalDoctors || 0}</p>
                </div>
                <div className="card border-l-4 border-blue-600">
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Today Total</h3>
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
              </div>

              <div className="card">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Your Doctors</h2>
                {orgDoctors.length === 0 ? (
                  <p className="text-gray-500 text-sm">No doctors assigned yet. Go to the Doctors tab to add.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {orgDoctors.map((doc) => (
                      <div key={doc._id} className="border border-gray-200 rounded-lg p-4">
                        <p className="font-semibold text-gray-900">Dr. {doc.name}</p>
                        <p className="text-sm text-gray-500">{doc.specialization}</p>
                        {doc.roomNumber && <p className="text-xs text-gray-400">Room {doc.roomNumber}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* DOCTORS TAB */}
          {activeTab === 'doctors' && (
            <>
              {/* Add doctor */}
              <div className="card mb-6">
                <h3 className="text-base font-bold text-gray-900 mb-3">Add Doctor to Organization</h3>
                <div className="flex gap-3">
                  <select
                    value={addDoctorId}
                    onChange={(e) => setAddDoctorId(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                  >
                    <option value="">Select a doctor...</option>
                    {availableDoctors.map((doc) => (
                      <option key={doc._id} value={doc._id}>
                        Dr. {doc.name} — {doc.specialization}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddDoctor}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm font-medium"
                  >
                    <Plus size={16} /> Add
                  </button>
                </div>
              </div>

              {/* Current org doctors */}
              <div className="card">
                <h3 className="text-base font-bold text-gray-900 mb-4">
                  Doctors in Your Organization ({orgDoctors.length})
                </h3>
                {orgDoctors.length === 0 ? (
                  <p className="text-gray-500 text-sm">No doctors added yet.</p>
                ) : (
                  <div className="space-y-3">
                    {orgDoctors.map((doc) => (
                      <div
                        key={doc._id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">Dr. {doc.name}</p>
                          <p className="text-sm text-gray-500">{doc.specialization}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded font-medium">
                              {user?.orgId}
                            </span>
                            {doc.roomNumber && (
                              <span className="text-xs text-gray-400">Room {doc.roomNumber}</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveDoctor(doc._id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 text-sm"
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* REQUESTS TAB */}
          {activeTab === 'requests' && (
            <div className="card">
              <h3 className="text-base font-bold text-gray-900 mb-4">
                Pending Join Requests ({requests.length})
              </h3>
              {requests.length === 0 ? (
                <p className="text-gray-500 text-sm">No pending requests.</p>
              ) : (
                <div className="space-y-3">
                  {requests.map((doc) => (
                    <div
                      key={doc._id}
                      className="flex items-center justify-between p-4 border border-orange-200 bg-orange-50 rounded-lg"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">Dr. {doc.name}</p>
                        <p className="text-sm text-gray-500">{doc.specialization}</p>
                        <p className="text-xs text-gray-400">{doc.email}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(doc._id)}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleReject(doc._id)}
                          className="px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium"
                        >
                          ✗ Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* APPOINTMENTS TAB */}
          {activeTab === 'appointments' && (
            <div className="card">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Today's Appointments ({appointments.length})
              </h2>
              {appointments.length === 0 ? (
                <p className="text-gray-500 text-sm">No appointments today.</p>
              ) : (
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
                          <td className="px-4 py-3 text-sm font-bold text-violet-600">#{apt.tokenNumber}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{apt.patientId?.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">Dr. {apt.doctorId?.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{apt.appointmentTime}</td>
                          <td className="px-4 py-3">
                            <span className="badge badge-info text-xs">{apt.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
