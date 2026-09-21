import { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { appointmentAPI, consultationAPI, prescriptionAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { Heart, LogOut, ArrowLeft, FileText, Plus, Trash2, X } from 'lucide-react';

const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'Four times daily', 'Every 6 hours', 'Every 8 hours', 'As needed'];
const DURATIONS = ['1 day', '2 days', '3 days', '5 days', '1 week', '2 weeks', '1 month', '3 months', 'Ongoing'];
const emptyMedicine = () => ({ name: '', dosage: '', frequency: 'Twice daily', duration: '5 days', instructions: '' });

const PrescriptionModal = ({ patient, onClose }) => {
  const [medicines, setMedicines] = useState([emptyMedicine()]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [validTill, setValidTill] = useState('');
  const [saving, setSaving] = useState(false);

  const addMedicine = () => setMedicines((prev) => [...prev, emptyMedicine()]);
  const removeMedicine = (i) => setMedicines((prev) => prev.filter((_, idx) => idx !== i));
  const updateMedicine = (i, field, value) =>
    setMedicines((prev) => prev.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const filled = medicines.filter((m) => m.name.trim());
    if (filled.length === 0) { toast.error('Add at least one medicine name'); return; }
    try {
      setSaving(true);
      await prescriptionAPI.createPrescription({
        patientId: patient._id,
        medicines: filled,
        additionalNotes: additionalNotes.trim() || undefined,
        validTill: validTill || undefined,
      });
      toast.success('Prescription saved successfully');
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
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Write Prescription</h3>
            <p className="text-sm text-gray-500">Patient: <span className="font-medium text-gray-700">{patient.name}</span></p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-800">Medicines</p>
              <button type="button" onClick={addMedicine} className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium">
                <Plus size={14} /> Add Medicine
              </button>
            </div>
            <div className="space-y-3">
              {medicines.map((med, i) => (
                <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-600">Medicine {i + 1}</span>
                    {medicines.length > 1 && (
                      <button type="button" onClick={() => removeMedicine(i)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">Medicine Name *</label>
                      <input type="text" value={med.name} onChange={(e) => updateMedicine(i, 'name', e.target.value)} placeholder="e.g., Paracetamol 500mg" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Dosage</label>
                      <input type="text" value={med.dosage} onChange={(e) => updateMedicine(i, 'dosage', e.target.value)} placeholder="e.g., 1 tablet" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Frequency</label>
                      <select value={med.frequency} onChange={(e) => updateMedicine(i, 'frequency', e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                        {FREQUENCIES.map((f) => <option key={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Duration</label>
                      <select value={med.duration} onChange={(e) => updateMedicine(i, 'duration', e.target.value)} className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                        {DURATIONS.map((d) => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Instructions</label>
                      <input type="text" value={med.instructions} onChange={(e) => updateMedicine(i, 'instructions', e.target.value)} placeholder="e.g., After food" className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Additional Notes</label>
              <textarea value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)} rows={3} placeholder="Diet, precautions, follow-up instructions..." className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Valid Till</label>
              <input type="date" value={validTill} onChange={(e) => setValidTill(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
              <p className="text-xs text-gray-400 mt-1">Leave blank for no expiry</p>
            </div>
          </div>
        </form>

        <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition">Cancel</button>
          <button type="submit" disabled={saving} onClick={handleSubmit} className="px-5 py-2 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 rounded-lg transition">
            {saving ? 'Saving...' : 'Save Prescription'}
          </button>
        </div>
      </div>
    </div>
  );
};

const TABS = ['All', 'Today', 'Completed', 'Cancelled'];

const TYPE_COLORS = {
  'General Consultation': 'bg-blue-100 text-blue-700',
  'New Patient': 'bg-purple-100 text-purple-700',
  'Follow-up': 'bg-yellow-100 text-yellow-700',
  'Specialist Consultation': 'bg-orange-100 text-orange-700',
  'Routine Check-up': 'bg-teal-100 text-teal-700',
  'Emergency': 'bg-red-100 text-red-600',
  'Vaccination': 'bg-green-100 text-green-700',
  'Teleconsultation': 'bg-indigo-100 text-indigo-700',
};

const APPOINTMENT_TYPE_FILTERS = ['All Types', 'General Consultation', 'New Patient', 'Follow-up', 'Specialist Consultation', 'Emergency', 'Vaccination', 'Teleconsultation'];

export const DoctorAppointments = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [activeTypeFilter, setActiveTypeFilter] = useState('All Types');
  const [expandedConsultation, setExpandedConsultation] = useState(null);
  const [consultationNotes, setConsultationNotes] = useState({});
  const [prescriptionPatient, setPrescriptionPatient] = useState(null);

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

  const stats = {
    total: appointments.length,
    completed: appointments.filter((a) => a.status === 'COMPLETED').length,
    waiting: appointments.filter((a) => a.status === 'WAITING').length,
    cancelled: appointments.filter((a) => a.status === 'CANCELLED').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Prescription modal */}
      {prescriptionPatient && (
        <PrescriptionModal
          patient={prescriptionPatient}
          onClose={() => setPrescriptionPatient(null)}
        />
      )}

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
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Appointments</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/doctor')}
              className="text-gray-700 hover:text-teal-600 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-teal-50 transition hidden sm:block"
            >
              Dashboard
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">My Appointments</h2>
          <p className="text-gray-600">Manage and track all your patient appointments</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
          <div className="bg-white border border-teal-200 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total</p>
            <p className="text-xl sm:text-3xl font-bold text-teal-600">{stats.total}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Completed</p>
            <p className="text-xl sm:text-3xl font-bold text-green-600">{stats.completed}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Waiting</p>
            <p className="text-xl sm:text-3xl font-bold text-yellow-600">{stats.waiting}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Cancelled</p>
            <p className="text-xl sm:text-3xl font-bold text-red-600">{stats.cancelled}</p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Type Filters */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {APPOINTMENT_TYPE_FILTERS.map((type) => (
              <button
                key={type}
                onClick={() => setActiveTypeFilter(type)}
                className={`px-3 py-1 rounded-lg font-medium transition whitespace-nowrap text-sm ${
                  activeTypeFilter === type
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Appointments List */}
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No {activeTab.toLowerCase()} appointments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAppointments.map((apt) => (
                <div key={apt._id}>
                  <div
                    onClick={() => apt.status === 'COMPLETED' && handleExpandConsultation(apt._id)}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-teal-400 transition gap-3 sm:gap-0 ${
                      apt.status === 'COMPLETED' ? 'cursor-pointer hover:bg-gray-100' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-start sm:items-center gap-2 sm:gap-4">
                        <span className="text-base sm:text-lg font-bold text-teal-600">#{apt.tokenNumber}</span>
                        <div>
                          <p className="font-medium text-sm sm:text-base text-gray-900">{apt.patientId.name}</p>
                          {apt.reason && <p className="text-xs text-gray-600">{apt.reason}</p>}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(apt.appointmentDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-600">{apt.appointmentTime}</p>
                      </div>
                      <div className="text-right sm:hidden text-xs">
                        <p className="font-medium text-gray-900">
                          {new Date(apt.appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-gray-600">{apt.appointmentTime}</p>
                      </div>
                      <span className={`badge text-xs px-2 sm:px-3 py-1 rounded-full text-xs ${TYPE_COLORS[apt.appointmentType] || TYPE_COLORS['General Consultation']}`}>
                        {apt.appointmentType?.split(' ')[0] || 'General'}
                      </span>
                      <span className={`badge text-xs px-2 sm:px-3 py-1 rounded-full font-medium ${
                        apt.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                        apt.status === 'WAITING' ? 'bg-yellow-100 text-yellow-700' :
                        apt.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {apt.status}
                      </span>
                      {apt.status === 'COMPLETED' && (
                        <span className="text-xs text-teal-600 font-medium hidden sm:inline">
                          {expandedConsultation === apt._id ? '▼' : '▶'} Notes
                        </span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); setPrescriptionPatient(apt.patientId); }}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition"
                      >
                        <FileText size={13} />
                        <span className="hidden sm:inline">Prescription</span>
                      </button>
                    </div>
                  </div>

                  {expandedConsultation === apt._id && consultationNotes[apt._id] && (
                    <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mt-2">
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
  );
};
