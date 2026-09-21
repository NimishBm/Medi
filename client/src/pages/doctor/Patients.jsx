import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { appointmentAPI, prescriptionAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Heart, LogOut, Search, Mail, Phone, ArrowLeft, FileText, Plus, Trash2, X } from 'lucide-react';

const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'Four times daily', 'Every 6 hours', 'Every 8 hours', 'As needed'];
const DURATIONS = ['1 day', '2 days', '3 days', '5 days', '1 week', '2 weeks', '1 month', '3 months', 'Ongoing'];

const emptyMedicine = () => ({ name: '', dosage: '', frequency: 'Twice daily', duration: '5 days', instructions: '' });

// ─── Prescription Modal ──────────────────────────────────────────────────────
const PrescriptionModal = ({ patient, onClose, onSaved }) => {
  const [medicines, setMedicines] = useState([emptyMedicine()]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [validTill, setValidTill] = useState('');
  const [saving, setSaving] = useState(false);

  const addMedicine = () => setMedicines((prev) => [...prev, emptyMedicine()]);

  const removeMedicine = (i) =>
    setMedicines((prev) => prev.filter((_, idx) => idx !== i));

  const updateMedicine = (i, field, value) =>
    setMedicines((prev) => prev.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const filled = medicines.filter((m) => m.name.trim());
    if (filled.length === 0) {
      toast.error('Add at least one medicine name');
      return;
    }
    try {
      setSaving(true);
      await prescriptionAPI.createPrescription({
        patientId: patient._id,
        medicines: filled,
        additionalNotes: additionalNotes.trim() || undefined,
        validTill: validTill || undefined,
      });
      toast.success('Prescription saved successfully');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save prescription');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Write Prescription</h3>
            <p className="text-sm text-gray-500">Patient: <span className="font-medium text-gray-700">{patient.name}</span></p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Medicines */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-800">Medicines</p>
              <button
                type="button"
                onClick={addMedicine}
                className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
              >
                <Plus size={14} /> Add Medicine
              </button>
            </div>

            <div className="space-y-3">
              {medicines.map((med, i) => (
                <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-600">Medicine {i + 1}</span>
                    {medicines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedicine(i)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">Medicine Name *</label>
                      <input
                        type="text"
                        value={med.name}
                        onChange={(e) => updateMedicine(i, 'name', e.target.value)}
                        placeholder="e.g., Paracetamol 500mg"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Dosage</label>
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={(e) => updateMedicine(i, 'dosage', e.target.value)}
                        placeholder="e.g., 1 tablet"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Frequency</label>
                      <select
                        value={med.frequency}
                        onChange={(e) => updateMedicine(i, 'frequency', e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                      >
                        {FREQUENCIES.map((f) => <option key={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Duration</label>
                      <select
                        value={med.duration}
                        onChange={(e) => updateMedicine(i, 'duration', e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                      >
                        {DURATIONS.map((d) => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Instructions</label>
                      <input
                        type="text"
                        value={med.instructions}
                        onChange={(e) => updateMedicine(i, 'instructions', e.target.value)}
                        placeholder="e.g., After food"
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes + Valid Till */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Additional Notes</label>
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                rows={3}
                placeholder="Diet, precautions, follow-up instructions..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Valid Till</label>
              <input
                type="date"
                value={validTill}
                onChange={(e) => setValidTill(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <p className="text-xs text-gray-400 mt-1">Leave blank for no expiry</p>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            onClick={handleSubmit}
            className="px-5 py-2 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 rounded-lg transition"
          >
            {saving ? 'Saving...' : 'Save Prescription'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────
export const DoctorPatients = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [prescriptionPatient, setPrescriptionPatient] = useState(null);
  const [savedCount, setSavedCount] = useState(0);

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
      {/* Prescription modal */}
      {prescriptionPatient && (
        <PrescriptionModal
          patient={prescriptionPatient}
          onClose={() => setPrescriptionPatient(null)}
          onSaved={() => setSavedCount((c) => c + 1)}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
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
            <button onClick={() => navigate('/doctor')} className="text-gray-700 hover:text-teal-600 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-teal-50 transition hidden sm:block">Dashboard</button>
            <button onClick={() => navigate('/doctor/appointments')} className="text-gray-700 hover:text-teal-600 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-teal-50 transition hidden sm:block">Appointments</button>
            <button onClick={() => navigate('/doctor/queue')} className="text-gray-700 hover:text-teal-600 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-teal-50 transition hidden sm:block">Live Queue</button>
            <button onClick={() => navigate('/doctor/profile')} className="text-gray-700 hover:text-teal-600 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-teal-50 transition hidden sm:block">My Profile</button>
            <div className="hidden sm:block h-6 border-l border-gray-300"></div>
            <div className="hidden sm:flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
              <span className="text-sm font-medium text-gray-700">{user?.name?.split(' ')[0]}</span>
            </div>
            <button onClick={() => dispatch(logout())} className="text-gray-700 hover:text-red-600 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-red-50 transition">
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

        {/* Search */}
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
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Prescriptions Written</p>
            <p className="text-xl sm:text-3xl font-bold text-orange-600">{savedCount}</p>
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
              {/* Desktop Table */}
              <div className="hidden sm:block">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Phone</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Last Appointment</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.map((patient) => (
                      <tr key={patient._id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <p className="font-medium text-sm text-gray-900">{patient.name}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail size={16} />
                            <span className="text-sm">{patient.email || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone size={16} />
                            <span className="text-sm">{patient.phone || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600">
                            {new Date(patient.lastAppointment).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setPrescriptionPatient(patient)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition"
                          >
                            <FileText size={14} />
                            Prescription
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
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
                      <Mail size={14} /><span>{patient.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Phone size={14} /><span>{patient.phone || 'N/A'}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Last: {new Date(patient.lastAppointment).toLocaleDateString()}
                    </p>
                    <button
                      onClick={() => setPrescriptionPatient(patient)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition w-full justify-center"
                    >
                      <FileText size={14} />
                      Write Prescription
                    </button>
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
