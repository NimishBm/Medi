import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { logout } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import {
  ShieldCheck, LogOut, LayoutDashboard, Stethoscope,
  Users, CheckCircle, XCircle, RefreshCw, Search, Clock,
  Plus, Pencil, Trash2,
} from 'lucide-react';
import { DoctorDetailView } from './DoctorDetailView';
import { PatientDetailView } from './PatientDetailView';

// ── small reusable badges ────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const styles = {
    PENDING:  'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100  text-green-800',
    REJECTED: 'bg-red-100    text-red-800',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
};

const LicenseBadge = ({ verified }) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${verified ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>
    {verified ? <CheckCircle size={11} /> : <XCircle size={11} />}
    {verified ? 'Verified' : 'Unverified'}
  </span>
);

const StatCard = ({ label, value, color }) => (
  <div className={`bg-white rounded-xl border border-gray-200 p-5 border-l-4 ${color} shadow-sm hover:shadow-md transition-shadow`}>
    <p className="text-sm text-gray-500 mb-1">{label}</p>
    <p className="text-3xl font-bold text-gray-900">{value ?? '—'}</p>
  </div>
);

// ── field helpers ────────────────────────────────────────────────────────────

const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
    {children}
  </div>
);

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400';
const selectCls = inputCls;

// ── Doctor Form Modal ────────────────────────────────────────────────────────

const DOCTOR_BLANK = {
  name: '', email: '', phone: '', password: '',
  specialization: '', experience: '', consultationFee: '',
  licenseNumber: '', clinicName: '', clinicCity: '',
  verificationStatus: 'PENDING', isActive: true,
};

const DoctorModal = ({ initialData, onSave, onClose }) => {
  const isEdit = !!initialData?._id;
  const [form, setForm] = useState(() => ({
    ...DOCTOR_BLANK,
    ...(initialData || {}),
    password: '',
  }));
  const [saving, setSaving] = useState(false);

  const set = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (payload.experience !== '') payload.experience = Number(payload.experience);
      if (payload.consultationFee !== '') payload.consultationFee = Number(payload.consultationFee);
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
          <h3 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Doctor' : 'Add Doctor'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <XCircle size={20} />
          </button>
        </div>
        <form onSubmit={submit} className="overflow-y-auto px-6 py-4 space-y-3 flex-1">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full Name *">
              <input name="name" value={form.name} onChange={set} required className={inputCls} placeholder="Dr. Jane Smith" />
            </Field>
            <Field label="Email *">
              <input name="email" type="email" value={form.email} onChange={set} required className={inputCls} placeholder="dr@email.com" />
            </Field>
            <Field label="Phone *">
              <input name="phone" value={form.phone} onChange={set} required className={inputCls} placeholder="9876543210" />
            </Field>
            <Field label={isEdit ? 'New Password (leave blank to keep)' : 'Password *'}>
              <input name="password" type="password" value={form.password} onChange={set} required={!isEdit} className={inputCls} placeholder="••••••••" />
            </Field>
            <Field label="Specialization *">
              <input name="specialization" value={form.specialization} onChange={set} required className={inputCls} placeholder="Cardiology" />
            </Field>
            <Field label="License Number">
              <input name="licenseNumber" value={form.licenseNumber} onChange={set} className={inputCls} placeholder="MCI-12345" />
            </Field>
            <Field label="Experience (yrs)">
              <input name="experience" type="number" min="0" value={form.experience} onChange={set} className={inputCls} />
            </Field>
            <Field label="Consultation Fee (₹)">
              <input name="consultationFee" type="number" min="0" value={form.consultationFee} onChange={set} className={inputCls} />
            </Field>
            <Field label="Clinic Name">
              <input name="clinicName" value={form.clinicName} onChange={set} className={inputCls} />
            </Field>
            <Field label="Clinic City">
              <input name="clinicCity" value={form.clinicCity} onChange={set} className={inputCls} />
            </Field>
            <Field label="Verification Status">
              <select name="verificationStatus" value={form.verificationStatus} onChange={set} className={selectCls}>
                <option value="PENDING">PENDING</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </Field>
            <Field label="Active">
              <div className="flex items-center h-9">
                <input name="isActive" type="checkbox" checked={form.isActive} onChange={set} className="w-4 h-4 accent-slate-700" />
                <span className="ml-2 text-sm text-gray-600">{form.isActive ? 'Active' : 'Inactive'}</span>
              </div>
            </Field>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 font-medium">
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Doctor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Patient Form Modal ───────────────────────────────────────────────────────

const PATIENT_BLANK = {
  name: '', email: '', phone: '', password: '',
  gender: '', dateOfBirth: '', bloodGroup: '', allergies: '',
};

const PatientModal = ({ initialData, onSave, onClose }) => {
  const isEdit = !!initialData?._id;
  const [form, setForm] = useState(() => ({
    ...PATIENT_BLANK,
    ...(initialData || {}),
    password: '',
    allergies: Array.isArray(initialData?.allergies) ? initialData.allergies.join(', ') : '',
    dateOfBirth: initialData?.dateOfBirth
      ? new Date(initialData.dateOfBirth).toISOString().split('T')[0]
      : '',
  }));
  const [saving, setSaving] = useState(false);

  const set = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (!payload.gender) delete payload.gender;
      if (!payload.bloodGroup) delete payload.bloodGroup;
      if (!payload.dateOfBirth) delete payload.dateOfBirth;
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
          <h3 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Patient' : 'Add Patient'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <XCircle size={20} />
          </button>
        </div>
        <form onSubmit={submit} className="overflow-y-auto px-6 py-4 space-y-3 flex-1">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full Name *">
              <input name="name" value={form.name} onChange={set} required className={inputCls} placeholder="John Doe" />
            </Field>
            <Field label="Email *">
              <input name="email" type="email" value={form.email} onChange={set} required className={inputCls} placeholder="patient@email.com" />
            </Field>
            <Field label="Phone *">
              <input name="phone" value={form.phone} onChange={set} required className={inputCls} placeholder="9876543210" />
            </Field>
            <Field label={isEdit ? 'New Password (leave blank to keep)' : 'Password *'}>
              <input name="password" type="password" value={form.password} onChange={set} required={!isEdit} className={inputCls} placeholder="••••••••" />
            </Field>
            <Field label="Gender">
              <select name="gender" value={form.gender} onChange={set} className={selectCls}>
                <option value="">— select —</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="Other">Other</option>
              </select>
            </Field>
            <Field label="Blood Group">
              <select name="bloodGroup" value={form.bloodGroup} onChange={set} className={selectCls}>
                <option value="">— select —</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </Field>
            <Field label="Date of Birth">
              <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={set} className={inputCls} />
            </Field>
            <Field label="Allergies (comma-separated)">
              <input name="allergies" value={form.allergies} onChange={set} className={inputCls} placeholder="Penicillin, Pollen" />
            </Field>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-50 font-medium">
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Delete Confirm Modal ─────────────────────────────────────────────────────

const DeleteModal = ({ label, onConfirm, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
          <Trash2 size={18} className="text-red-600" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900">Delete {label}?</h3>
          <p className="text-sm text-gray-500">This action cannot be undone.</p>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-4">
        <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
          Cancel
        </button>
        <button onClick={onConfirm} className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium">
          Delete
        </button>
      </div>
    </div>
  </div>
);

// ── nav items ────────────────────────────────────────────────────────────────

const NAV = [
  { id: 'overview',  label: 'Overview',  icon: LayoutDashboard },
  { id: 'doctors',   label: 'Doctors',   icon: Stethoscope },
  { id: 'patients',  label: 'Patients',  icon: Users },
];

const DOCTOR_STATUS_TABS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];

// ── main component ───────────────────────────────────────────────────────────

export const AdminDashboard = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { user }  = useSelector((state) => state.auth);

  const [page, setPage]               = useState('overview');

  // detail views
  const [viewDoctorId, setViewDoctorId]   = useState(null);
  const [viewPatientId, setViewPatientId] = useState(null);

  // overview
  const [stats, setStats]             = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // doctors
  const [doctors, setDoctors]         = useState([]);
  const [docLoading, setDocLoading]   = useState(false);
  const [docTab, setDocTab]           = useState('PENDING');
  const [docSearch, setDocSearch]     = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [noteModal, setNoteModal]     = useState(null);
  const [note, setNote]               = useState('');
  const [doctorModal, setDoctorModal] = useState(null);
  const [deleteDoctorConfirm, setDeleteDoctorConfirm] = useState(null);

  // patients
  const [patients, setPatients]       = useState([]);
  const [patLoading, setPatLoading]   = useState(false);
  const [patSearch, setPatSearch]     = useState('');
  const [patientModal, setPatientModal] = useState(null);
  const [deletePatientConfirm, setDeletePatientConfirm] = useState(null);

  // ── fetch helpers ──────────────────────────────────────────────────────────

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await adminAPI.getStats();
      setStats(res.data);
    } catch {
      toast.error('Failed to load stats');
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchDoctors = useCallback(async () => {
    setDocLoading(true);
    try {
      const res = await adminAPI.getDoctors(null);
      setDoctors(res.data);
    } catch {
      toast.error('Failed to load doctors');
    } finally {
      setDocLoading(false);
    }
  }, []);

  const fetchPatients = useCallback(async () => {
    setPatLoading(true);
    try {
      const res = await adminAPI.getPatients();
      setPatients(res.data);
    } catch {
      toast.error('Failed to load patients');
    } finally {
      setPatLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { if (page === 'doctors')  fetchDoctors();  }, [page, fetchDoctors]);
  useEffect(() => { if (page === 'patients') fetchPatients(); }, [page, fetchPatients]);

  // ── doctor approve / reject ────────────────────────────────────────────────

  const openModal = (id, action) => { setNote(''); setNoteModal({ id, action }); };

  const confirmAction = async () => {
    const { id, action } = noteModal;
    setNoteModal(null);
    setActionLoading(id);
    try {
      if (action === 'approve') {
        await adminAPI.approveDoctor(id, note);
        toast.success('Doctor approved');
      } else {
        await adminAPI.rejectDoctor(id, note);
        toast.success('Doctor rejected');
      }
      fetchDoctors();
      fetchStats();
    } catch {
      toast.error('Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerifyLicense = async (id) => {
    setActionLoading(id);
    try {
      const res = await adminAPI.verifyLicense(id);
      toast.success(`License check: ${res.data.licenseVerified ? 'Valid ✓' : 'Not found ✗'}`);
      fetchDoctors();
    } catch {
      toast.error('License verification failed');
    } finally {
      setActionLoading(null);
    }
  };

  // ── doctor CRUD ────────────────────────────────────────────────────────────

  const handleSaveDoctor = async (data) => {
    try {
      if (doctorModal?.data?._id) {
        await adminAPI.updateDoctor(doctorModal.data._id, data);
        toast.success('Doctor updated');
      } else {
        await adminAPI.createDoctor(data);
        toast.success('Doctor created');
      }
      setDoctorModal(null);
      fetchDoctors();
      fetchStats();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Save failed');
      throw err;
    }
  };

  const handleDeleteDoctor = async () => {
    const id = deleteDoctorConfirm;
    setDeleteDoctorConfirm(null);
    try {
      await adminAPI.deleteDoctor(id);
      toast.success('Doctor deleted');
      fetchDoctors();
      fetchStats();
    } catch {
      toast.error('Delete failed');
    }
  };

  // ── patient CRUD ───────────────────────────────────────────────────────────

  const handleSavePatient = async (data) => {
    try {
      if (patientModal?.data?._id) {
        await adminAPI.updatePatient(patientModal.data._id, data);
        toast.success('Patient updated');
      } else {
        await adminAPI.createPatient(data);
        toast.success('Patient created');
      }
      setPatientModal(null);
      fetchPatients();
      fetchStats();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Save failed');
      throw err;
    }
  };

  const handleDeletePatient = async () => {
    const id = deletePatientConfirm;
    setDeletePatientConfirm(null);
    try {
      await adminAPI.deletePatient(id);
      toast.success('Patient deleted');
      fetchPatients();
      fetchStats();
    } catch {
      toast.error('Delete failed');
    }
  };

  // ── filtered lists ─────────────────────────────────────────────────────────

  const filteredDoctors = doctors.filter(
    (d) => {
      const matchesSearch = d.name.toLowerCase().includes(docSearch.toLowerCase()) ||
        d.email.toLowerCase().includes(docSearch.toLowerCase()) ||
        (d.licenseNumber || '').toLowerCase().includes(docSearch.toLowerCase());

      const matchesStatus = docTab === 'ALL' || d.verificationStatus === docTab;

      return matchesSearch && matchesStatus;
    }
  );

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(patSearch.toLowerCase()) ||
      p.email.toLowerCase().includes(patSearch.toLowerCase()) ||
      (p.phone || '').includes(patSearch),
  );

  const docCounts = {
    ALL:      doctors.length,
    PENDING:  doctors.filter((d) => d.verificationStatus === 'PENDING').length,
    APPROVED: doctors.filter((d) => d.verificationStatus === 'APPROVED').length,
    REJECTED: doctors.filter((d) => d.verificationStatus === 'REJECTED').length,
  };

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── Top Nav ── */}
      <header className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between shadow z-10">
        <div className="flex items-center gap-3">
          <ShieldCheck size={22} />
          <span className="font-bold text-lg">ClinicFlow Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-300 text-sm hidden sm:block">{user?.email}</span>
          <button
            onClick={() => { dispatch(logout()); navigate('/admin/login'); }}
            className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors"
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ── */}
        <aside className="w-56 bg-gradient-to-b from-slate-50 to-gray-50 border-r border-gray-200 flex flex-col py-6 shrink-0">
          <nav className="flex flex-col gap-1 px-4 space-y-0.5">
            {NAV.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setPage(id); setViewDoctorId(null); setViewPatientId(null); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  page === id
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-white hover:shadow-sm'
                }`}
              >
                <Icon size={17} className="shrink-0" />
                {label}
                {id === 'doctors' && stats?.pendingDoctors > 0 && (
                  <span className="ml-auto bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                    {stats.pendingDoctors}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50 via-white to-gray-50">

          {/* ════ OVERVIEW ════ */}
          {page === 'overview' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Overview</h2>
              {statsLoading ? (
                <p className="text-gray-400">Loading…</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  <StatCard label="Total Doctors"    value={stats?.totalDoctors}    color="border-blue-500" />
                  <StatCard label="Pending Review"   value={stats?.pendingDoctors}  color="border-yellow-500" />
                  <StatCard label="Approved Doctors" value={stats?.approvedDoctors} color="border-green-500" />
                  <StatCard label="Rejected Doctors" value={stats?.rejectedDoctors} color="border-red-500" />
                  <StatCard label="Total Patients"   value={stats?.totalPatients}   color="border-purple-500" />
                </div>
              )}

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setPage('doctors')}
                  className="bg-white border border-gray-200 rounded-xl p-5 text-left hover:border-slate-400 transition-colors"
                >
                  <Stethoscope size={22} className="text-slate-600 mb-3" />
                  <p className="font-semibold text-gray-900">Manage Doctors</p>
                  <p className="text-sm text-gray-500 mt-1">Create, edit, delete and verify doctors</p>
                </button>
                <button
                  onClick={() => setPage('patients')}
                  className="bg-white border border-gray-200 rounded-xl p-5 text-left hover:border-slate-400 transition-colors"
                >
                  <Users size={22} className="text-slate-600 mb-3" />
                  <p className="font-semibold text-gray-900">Manage Patients</p>
                  <p className="text-sm text-gray-500 mt-1">Create, edit and delete patient accounts</p>
                </button>
              </div>
            </div>
          )}

          {/* ════ DOCTORS ════ */}
          {page === 'doctors' && (
            <div>
              {viewDoctorId ? (
                <DoctorDetailView
                  doctorId={viewDoctorId}
                  onBack={() => setViewDoctorId(null)}
                />
              ) : (
              <>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-gray-900">Registered Doctors</h2>
                <button
                  onClick={() => setDoctorModal({ data: null })}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
                >
                  <Plus size={15} /> Add Doctor
                </button>
              </div>

              {/* filter bar */}
              <div className="flex flex-wrap gap-2 mb-5">
                {DOCTOR_STATUS_TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setDocTab(tab)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                      docTab === tab
                        ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    {tab}
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${docTab === tab ? 'bg-slate-700 text-slate-100' : 'bg-gray-100 text-gray-700'}`}>
                      {docCounts[tab] ?? 0}
                    </span>
                  </button>
                ))}
                <div className="ml-auto flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm hover:border-slate-300 transition-colors">
                  <Search size={14} className="text-gray-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search by name, email…"
                    value={docSearch}
                    onChange={(e) => setDocSearch(e.target.value)}
                    className="outline-none text-sm text-gray-700 w-48 bg-transparent"
                  />
                </div>
              </div>

              {/* table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                {docLoading ? (
                  <div className="flex items-center justify-center h-48 text-gray-400">Loading…</div>
                ) : filteredDoctors.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-gray-400">No doctors found</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm select-none">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-5 py-3 text-left font-semibold text-gray-600">Doctor</th>
                          <th className="px-5 py-3 text-left font-semibold text-gray-600">Specialization</th>
                          <th className="px-5 py-3 text-left font-semibold text-gray-600">License No.</th>
                          <th className="px-5 py-3 text-left font-semibold text-gray-600">API Check</th>
                          <th className="px-5 py-3 text-left font-semibold text-gray-600">Status</th>
                          <th className="px-5 py-3 text-left font-semibold text-gray-600">Joined</th>
                          <th className="px-5 py-3 text-right font-semibold text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredDoctors.map((doc) => (
                          <tr key={doc._id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => setViewDoctorId(doc._id)}>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                  <Stethoscope size={16} className="text-slate-500" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-gray-900 hover:text-slate-600 truncate">{doc.name}</p>
                                  <p className="text-gray-400 text-xs truncate">{doc.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-gray-600">{doc.specialization}</td>
                            <td className="px-5 py-4 font-mono text-gray-700">{doc.licenseNumber || '—'}</td>
                            <td className="px-5 py-4"><LicenseBadge verified={doc.licenseVerified} /></td>
                            <td className="px-5 py-4">
                              <StatusBadge status={doc.verificationStatus} />
                              {doc.verificationNote && (
                                <p className="text-xs text-gray-400 mt-1 max-w-xs truncate" title={doc.verificationNote}>
                                  {doc.verificationNote}
                                </p>
                              )}
                            </td>
                            <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">
                              {new Date(doc.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleVerifyLicense(doc._id); }}
                                  disabled={actionLoading === doc._id}
                                  title="Re-run AskMyDoc license check"
                                  className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 disabled:opacity-40 transition-colors"
                                >
                                  <RefreshCw size={15} className={actionLoading === doc._id ? 'animate-spin' : ''} />
                                </button>
                                {doc.verificationStatus !== 'APPROVED' && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); openModal(doc._id, 'approve'); }}
                                    disabled={actionLoading === doc._id}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium disabled:opacity-40 transition-colors"
                                  >
                                    <CheckCircle size={13} /> Approve
                                  </button>
                                )}
                                {doc.verificationStatus !== 'REJECTED' && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); openModal(doc._id, 'reject'); }}
                                    disabled={actionLoading === doc._id}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium disabled:opacity-40 transition-colors"
                                  >
                                    <XCircle size={13} /> Reject
                                  </button>
                                )}
                                <button
                                  onClick={(e) => { e.stopPropagation(); setDoctorModal({ data: doc }); }}
                                  title="Edit doctor"
                                  className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setDeleteDoctorConfirm(doc._id); }}
                                  title="Delete doctor"
                                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              </>
              )}
            </div>
          )}

          {/* ════ PATIENTS ════ */}
          {page === 'patients' && (
            <div>
              {viewPatientId ? (
                <PatientDetailView
                  patientId={viewPatientId}
                  onBack={() => setViewPatientId(null)}
                />
              ) : (
              <>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-gray-900">Registered Patients</h2>
                <button
                  onClick={() => setPatientModal({ data: null })}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
                >
                  <Plus size={15} /> Add Patient
                </button>
              </div>

              {/* search */}
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 w-full max-w-sm mb-5 shadow-sm hover:border-slate-300 transition-colors">
                <Search size={14} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search by name, email…"
                  value={patSearch}
                  onChange={(e) => setPatSearch(e.target.value)}
                  className="outline-none text-sm text-gray-700 flex-1 bg-transparent"
                />
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                {patLoading ? (
                  <div className="flex items-center justify-center h-48 text-gray-400">Loading…</div>
                ) : filteredPatients.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-gray-400">No patients found</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm select-none">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-5 py-3 text-left font-semibold text-gray-600">Patient</th>
                          <th className="px-5 py-3 text-left font-semibold text-gray-600">Phone</th>
                          <th className="px-5 py-3 text-left font-semibold text-gray-600">Gender</th>
                          <th className="px-5 py-3 text-left font-semibold text-gray-600">Date of Birth</th>
                          <th className="px-5 py-3 text-left font-semibold text-gray-600">Blood Group</th>
                          <th className="px-5 py-3 text-left font-semibold text-gray-600">Family</th>
                          <th className="px-5 py-3 text-left font-semibold text-gray-600">Joined</th>
                          <th className="px-5 py-3 text-right font-semibold text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredPatients.map((pat) => (
                          <tr key={pat._id} className="hover:bg-purple-50 transition-colors cursor-pointer" onClick={() => setViewPatientId(pat._id)}>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                                  <Users size={16} className="text-purple-500" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium text-gray-900 truncate">{pat.name}</p>
                                  <p className="text-gray-400 text-xs truncate">{pat.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-gray-600">{pat.phone || '—'}</td>
                            <td className="px-5 py-4 text-gray-600">{pat.gender || '—'}</td>
                            <td className="px-5 py-4 text-gray-600">
                              {pat.dateOfBirth ? new Date(pat.dateOfBirth).toLocaleDateString() : '—'}
                            </td>
                            <td className="px-5 py-4 text-gray-600">{pat.bloodGroup || '—'}</td>
                            <td className="px-5 py-4 text-gray-600">{pat.familyMembers?.length ?? 0}</td>
                            <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {new Date(pat.createdAt).toLocaleDateString()}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setPatientModal({ data: pat })}
                                  title="Edit patient"
                                  className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  onClick={() => setDeletePatientConfirm(pat._id)}
                                  title="Delete patient"
                                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              </>
              )}
            </div>
          )}

        </main>
      </div>

      {/* ── Approve / Reject modal ── */}
      {noteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1 capitalize">{noteModal.action} Doctor</h3>
            <p className="text-gray-500 text-sm mb-4">Add an optional note stored with this decision.</p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Optional note (e.g. reason for rejection)…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setNoteModal(null)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`px-4 py-2 text-sm rounded-lg font-semibold text-white transition-colors ${
                  noteModal.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Confirm {noteModal.action}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Doctor CRUD modals ── */}
      {doctorModal && (
        <DoctorModal
          initialData={doctorModal.data}
          onSave={handleSaveDoctor}
          onClose={() => setDoctorModal(null)}
        />
      )}
      {deleteDoctorConfirm && (
        <DeleteModal
          label="doctor"
          onConfirm={handleDeleteDoctor}
          onClose={() => setDeleteDoctorConfirm(null)}
        />
      )}

      {/* ── Patient CRUD modals ── */}
      {patientModal && (
        <PatientModal
          initialData={patientModal.data}
          onSave={handleSavePatient}
          onClose={() => setPatientModal(null)}
        />
      )}
      {deletePatientConfirm && (
        <DeleteModal
          label="patient"
          onConfirm={handleDeletePatient}
          onClose={() => setDeletePatientConfirm(null)}
        />
      )}
    </div>
  );
};
