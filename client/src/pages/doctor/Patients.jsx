import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { appointmentAPI, prescriptionAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  Heart, LogOut, Search, Mail, Phone, ArrowLeft,
  FileText, Plus, Trash2, X, ChevronDown, ChevronUp, Pencil,
} from 'lucide-react';
import { NotificationBell } from '../../components/NotificationBell';
import { useDoctorNotifications } from '../../hooks/useDoctorNotifications';

const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'Four times daily', 'Every 6 hours', 'Every 8 hours', 'As needed'];
const DURATIONS   = ['1 day', '2 days', '3 days', '5 days', '1 week', '2 weeks', '1 month', '3 months', 'Ongoing'];
const emptyMed    = () => ({ name: '', dosage: '', frequency: 'Twice daily', duration: '5 days', instructions: '' });

// ─── Medicine form rows (shared by both modals) ──────────────────────────────
const MedicineRows = ({ medicines, onChange, onAdd, onRemove }) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <p className="text-sm font-semibold text-gray-800">Medicines</p>
      <button type="button" onClick={onAdd} className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium">
        <Plus size={13} /> Add Medicine
      </button>
    </div>
    <div className="space-y-3">
      {medicines.map((med, i) => (
        <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-600">Medicine {i + 1}</span>
            {medicines.length > 1 && (
              <button type="button" onClick={() => onRemove(i)} className="text-red-400 hover:text-red-600">
                <Trash2 size={13} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Name *</label>
              <input value={med.name} onChange={(e) => onChange(i, 'name', e.target.value)} placeholder="e.g., Paracetamol 500mg"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Dosage</label>
              <input value={med.dosage} onChange={(e) => onChange(i, 'dosage', e.target.value)} placeholder="e.g., 1 tablet"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Frequency</label>
              <select value={med.frequency} onChange={(e) => onChange(i, 'frequency', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                {FREQUENCIES.map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Duration</label>
              <select value={med.duration} onChange={(e) => onChange(i, 'duration', e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                {DURATIONS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Instructions</label>
              <input value={med.instructions} onChange={(e) => onChange(i, 'instructions', e.target.value)} placeholder="e.g., After food"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── Write Prescription Modal ─────────────────────────────────────────────────
const WritePrescriptionModal = ({ patient, onClose, onSaved }) => {
  const [medicines, setMedicines] = useState([emptyMed()]);
  const [notes, setNotes]         = useState('');
  const [validTill, setValidTill] = useState('');
  const [saving, setSaving]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const filled = medicines.filter((m) => m.name.trim());
    if (!filled.length) { toast.error('Add at least one medicine name'); return; }
    try {
      setSaving(true);
      const res = await prescriptionAPI.createPrescription({
        patientId: patient._id,
        medicines: filled,
        additionalNotes: notes.trim() || undefined,
        validTill: validTill || undefined,
      });
      toast.success('Prescription saved');
      onSaved(res.data.prescription);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
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
          <MedicineRows
            medicines={medicines}
            onChange={(i, f, v) => setMedicines((p) => p.map((m, idx) => idx === i ? { ...m, [f]: v } : m))}
            onAdd={() => setMedicines((p) => [...p, emptyMed()])}
            onRemove={(i) => setMedicines((p) => p.filter((_, idx) => idx !== i))}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Additional Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                placeholder="Diet, precautions, follow-up..." className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Valid Till</label>
              <input type="date" value={validTill} onChange={(e) => setValidTill(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
              <p className="text-xs text-gray-400 mt-1">Leave blank for no expiry</p>
            </div>
          </div>
        </form>

        <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition">Cancel</button>
          <button disabled={saving} onClick={handleSubmit} className="px-5 py-2 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 rounded-lg transition">
            {saving ? 'Saving...' : 'Save Prescription'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Edit Prescription Modal ──────────────────────────────────────────────────
const EditPrescriptionModal = ({ prescription, onClose, onSaved }) => {
  const [medicines, setMedicines] = useState(prescription.medicines.map((m) => ({ ...m })));
  const [notes, setNotes]         = useState(prescription.additionalNotes || '');
  const [validTill, setValidTill] = useState(
    prescription.validTill ? new Date(prescription.validTill).toISOString().split('T')[0] : ''
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const filled = medicines.filter((m) => m.name.trim());
    if (!filled.length) { toast.error('Add at least one medicine name'); return; }
    try {
      setSaving(true);
      const res = await prescriptionAPI.updatePrescription(prescription._id, {
        medicines: filled,
        additionalNotes: notes.trim() || '',
        validTill: validTill || '',
      });
      toast.success('Prescription updated');
      onSaved(res.data.prescription);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Edit Prescription</h3>
            <p className="text-sm text-gray-500">
              {prescription.patientId?.name} &middot; <span className="text-gray-400">{new Date(prescription.createdAt).toLocaleDateString()}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <MedicineRows
            medicines={medicines}
            onChange={(i, f, v) => setMedicines((p) => p.map((m, idx) => idx === i ? { ...m, [f]: v } : m))}
            onAdd={() => setMedicines((p) => [...p, emptyMed()])}
            onRemove={(i) => setMedicines((p) => p.filter((_, idx) => idx !== i))}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Additional Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                placeholder="Diet, precautions, follow-up..." className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1">Valid Till</label>
              <input type="date" value={validTill} onChange={(e) => setValidTill(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
              <p className="text-xs text-gray-400 mt-1">Leave blank for no expiry</p>
            </div>
          </div>
        </form>

        <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition">Cancel</button>
          <button disabled={saving} onClick={handleSubmit} className="px-5 py-2 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 rounded-lg transition">
            {saving ? 'Saving...' : 'Update Prescription'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Prescriptions Panel (expanded per patient) ───────────────────────────────
const PatientPrescriptions = ({ patient, onWriteNew, allPrescriptions, onEdit }) => {
  const rxList = allPrescriptions.filter((rx) => rx.patientId?._id === patient._id || rx.patientId === patient._id);

  return (
    <div className="bg-teal-50 border border-teal-200 rounded-b-lg px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-teal-800">
          Prescriptions ({rxList.length})
        </p>
        <button
          onClick={() => onWriteNew(patient)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition"
        >
          <Plus size={13} /> New Prescription
        </button>
      </div>

      {rxList.length === 0 ? (
        <p className="text-xs text-teal-600 py-1">No prescriptions written yet.</p>
      ) : (
        <div className="space-y-2">
          {rxList.map((rx) => (
            <div key={rx._id} className="bg-white border border-teal-100 rounded-lg p-3">
              {/* Prescription header */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-700">
                  {new Date(rx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                <div className="flex items-center gap-2">
                  {rx.validTill && (
                    <span className="text-xs text-gray-400">
                      Valid till {new Date(rx.validTill).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                  )}
                  <button
                    onClick={() => onEdit(rx)}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-teal-600 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition"
                  >
                    <Pencil size={11} /> Edit
                  </button>
                </div>
              </div>

              {/* Medicine table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-100">
                      <th className="text-left pb-1 font-medium pr-3">Medicine</th>
                      <th className="text-left pb-1 font-medium pr-3">Dosage</th>
                      <th className="text-left pb-1 font-medium pr-3">Frequency</th>
                      <th className="text-left pb-1 font-medium pr-3">Duration</th>
                      <th className="text-left pb-1 font-medium">Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rx.medicines.map((m, idx) => (
                      <tr key={idx} className="border-b border-gray-50 last:border-0">
                        <td className="py-1 pr-3 font-medium text-gray-800">{m.name}</td>
                        <td className="py-1 pr-3 text-gray-600">{m.dosage || '—'}</td>
                        <td className="py-1 pr-3 text-gray-600">{m.frequency || '—'}</td>
                        <td className="py-1 pr-3 text-gray-600">{m.duration || '—'}</td>
                        <td className="py-1 text-gray-600">{m.instructions || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {rx.additionalNotes && (
                <p className="mt-2 text-xs text-gray-500 italic border-t border-gray-100 pt-2">
                  Notes: {rx.additionalNotes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const DoctorPatients = () => {
  const { user }   = useSelector((state) => state.auth);
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  useDoctorNotifications(user?._id);

  const [patients, setPatients]                 = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [isLoading, setIsLoading]               = useState(true);
  const [searchQuery, setSearchQuery]           = useState('');

  // all prescriptions written by this doctor
  const [allRx, setAllRx] = useState([]);

  // expanded patient row id
  const [expandedId, setExpandedId] = useState(null);

  // modals
  const [writeForPatient, setWriteForPatient] = useState(null);
  const [editingRx, setEditingRx]             = useState(null);

  // fetch patients from appointments
  useEffect(() => {
    const load = async () => {
      try {
        const res = await appointmentAPI.getAppointments();
        const unique = [];
        const seen   = new Set();
        res.data.forEach((apt) => {
          if (!seen.has(apt.patientId._id)) {
            seen.add(apt.patientId._id);
            unique.push({ ...apt.patientId, lastAppointment: apt.appointmentDate });
          }
        });
        setPatients(unique);
        setFilteredPatients(unique);
      } catch {
        toast.error('Failed to load patients');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // fetch all prescriptions by this doctor once
  useEffect(() => {
    prescriptionAPI.getByDoctor()
      .then((res) => setAllRx(res.data))
      .catch(() => {/* silently ignore */});
  }, []);

  const handleSearch = (q) => {
    setSearchQuery(q);
    setFilteredPatients(
      q.trim()
        ? patients.filter((p) =>
            p.name.toLowerCase().includes(q.toLowerCase()) ||
            p.email?.toLowerCase().includes(q.toLowerCase()) ||
            p.phone?.includes(q)
          )
        : patients
    );
  };

  const toggleExpand = (patientId) =>
    setExpandedId((prev) => (prev === patientId ? null : patientId));

  // called after writing a new prescription
  const handleWriteSaved = useCallback((newRx) => {
    setAllRx((prev) => [newRx, ...prev]);
  }, []);

  // called after editing an existing prescription
  const handleEditSaved = useCallback((updated) => {
    setAllRx((prev) => prev.map((rx) => (rx._id === updated._id ? updated : rx)));
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen text-gray-500">Loading...</div>;
  }

  const totalRx = allRx.length;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Write modal */}
      {writeForPatient && (
        <WritePrescriptionModal
          patient={writeForPatient}
          onClose={() => setWriteForPatient(null)}
          onSaved={handleWriteSaved}
        />
      )}

      {/* Edit modal */}
      {editingRx && (
        <EditPrescriptionModal
          prescription={editingRx}
          onClose={() => setEditingRx(null)}
          onSaved={handleEditSaved}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#1E3A5F] border-b border-[#2D4F7C] shadow-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/doctor')} className="sm:hidden text-teal-300 hover:text-white p-2">
              <ArrowLeft size={24} />
            </button>
            <div className="w-10 h-10 bg-[#0D9488] rounded-lg flex items-center justify-center">
              <Heart className="text-white" size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white leading-tight">Patients</h1>
              <p className="text-xs text-teal-300 hidden sm:block">MediQ</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/doctor')} className="text-slate-200 hover:text-teal-300 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition hidden sm:block">Dashboard</button>
            <button onClick={() => navigate('/doctor/appointments')} className="text-slate-200 hover:text-teal-300 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition hidden sm:block">Appointments</button>
            <button onClick={() => navigate('/doctor/queue')} className="text-slate-200 hover:text-teal-300 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition hidden sm:block">Live Queue</button>
            <button onClick={() => navigate('/doctor/profile')} className="text-slate-200 hover:text-teal-300 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition hidden sm:block">My Profile</button>
            <div className="hidden sm:block h-6 border-l border-white/20" />
            <div className="hidden sm:flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
              <span className="text-sm font-medium text-white">{user?.name?.split(' ')[0]}</span>
            </div>
            <NotificationBell />
            <button onClick={() => dispatch(logout())} className="text-slate-300 hover:text-red-400 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Title */}
        <div className="mb-4 sm:mb-8 hidden sm:block">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">My Patients</h2>
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
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Patients</p>
            <p className="text-xl sm:text-3xl font-bold text-teal-600">{patients.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Showing</p>
            <p className="text-xl sm:text-3xl font-bold text-green-600">{filteredPatients.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total Prescriptions</p>
            <p className="text-xl sm:text-3xl font-bold text-orange-600">{totalRx}</p>
          </div>
        </div>

        {/* Patients List */}
        {filteredPatients.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg text-center py-12">
            <p className="text-gray-500">No patients found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPatients.map((patient) => {
              const isExpanded = expandedId === patient._id;
              const rxCount = allRx.filter(
                (rx) => rx.patientId?._id === patient._id || rx.patientId === patient._id
              ).length;

              return (
                <div key={patient._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">

                  {/* ── Patient Row ── */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 gap-3 sm:gap-0">

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-gray-900">{patient.name}</p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
                        {rxCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
                            <FileText size={10} /> {rxCount} Rx
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Mail size={11} />{patient.email || 'N/A'}</span>
                        <span className="flex items-center gap-1"><Phone size={11} />{patient.phone || 'N/A'}</span>
                        <span>Last visit: {new Date(patient.lastAppointment).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setWriteForPatient(patient)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition"
                      >
                        <FileText size={13} />
                        <span>Prescription</span>
                      </button>
                      <button
                        onClick={() => toggleExpand(patient._id)}
                        title={isExpanded ? 'Hide prescriptions' : 'View prescriptions'}
                        className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                          isExpanded
                            ? 'bg-teal-50 text-teal-700 border-teal-300'
                            : 'bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        <span className="hidden sm:inline">{isExpanded ? 'Hide' : 'View Rx'}</span>
                      </button>
                    </div>
                  </div>

                  {/* ── Expanded Prescriptions ── */}
                  {isExpanded && (
                    <PatientPrescriptions
                      patient={patient}
                      onWriteNew={setWriteForPatient}
                      allPrescriptions={allRx}
                      onEdit={setEditingRx}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
