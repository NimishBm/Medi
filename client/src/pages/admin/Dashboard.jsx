import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import { logout } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import {
  ShieldCheck, LogOut, LayoutDashboard, Stethoscope,
  Users, CheckCircle, XCircle, RefreshCw, Search, Clock,
} from 'lucide-react';

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
  <div className={`bg-white rounded-xl border border-gray-200 p-5 border-l-4 ${color}`}>
    <p className="text-sm text-gray-500 mb-1">{label}</p>
    <p className="text-3xl font-bold text-gray-900">{value ?? '—'}</p>
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

  // patients
  const [patients, setPatients]       = useState([]);
  const [patLoading, setPatLoading]   = useState(false);
  const [patSearch, setPatSearch]     = useState('');

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
      const res = await adminAPI.getDoctors(docTab === 'ALL' ? null : docTab);
      setDoctors(res.data);
    } catch {
      toast.error('Failed to load doctors');
    } finally {
      setDocLoading(false);
    }
  }, [docTab]);

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

  // ── doctor actions ─────────────────────────────────────────────────────────

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

  // ── filtered lists ─────────────────────────────────────────────────────────

  const filteredDoctors = doctors.filter(
    (d) =>
      d.name.toLowerCase().includes(docSearch.toLowerCase()) ||
      d.email.toLowerCase().includes(docSearch.toLowerCase()) ||
      (d.licenseNumber || '').toLowerCase().includes(docSearch.toLowerCase()),
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
        <aside className="w-56 bg-white border-r border-gray-200 flex flex-col py-6 shrink-0">
          <nav className="flex flex-col gap-1 px-3">
            {NAV.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setPage(id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  page === id
                    ? 'bg-slate-800 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={17} />
                {label}
                {id === 'doctors' && stats?.pendingDoctors > 0 && (
                  <span className="ml-auto bg-yellow-400 text-yellow-900 text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {stats.pendingDoctors}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto p-6">

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
                  <p className="text-sm text-gray-500 mt-1">Approve, reject and verify doctor registrations</p>
                </button>
                <button
                  onClick={() => setPage('patients')}
                  className="bg-white border border-gray-200 rounded-xl p-5 text-left hover:border-slate-400 transition-colors"
                >
                  <Users size={22} className="text-slate-600 mb-3" />
                  <p className="font-semibold text-gray-900">View Patients</p>
                  <p className="text-sm text-gray-500 mt-1">Browse all registered patient accounts</p>
                </button>
              </div>
            </div>
          )}

          {/* ════ DOCTORS ════ */}
          {page === 'doctors' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-5">Registered Doctors</h2>

              {/* filter bar */}
              <div className="flex flex-wrap gap-2 mb-5">
                {DOCTOR_STATUS_TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setDocTab(tab)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                      docTab === tab
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-slate-400'
                    }`}
                  >
                    {tab}
                    <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${docTab === tab ? 'bg-white text-slate-800' : 'bg-gray-100 text-gray-600'}`}>
                      {docCounts[tab] ?? 0}
                    </span>
                  </button>
                ))}
                <div className="ml-auto flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                  <Search size={14} className="text-gray-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Name, email or license…"
                    value={docSearch}
                    onChange={(e) => setDocSearch(e.target.value)}
                    className="outline-none text-sm text-gray-700 w-44"
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
                    <table className="w-full text-sm">
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
                          <tr key={doc._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-4">
                              <p className="font-medium text-gray-900">{doc.name}</p>
                              <p className="text-gray-400 text-xs">{doc.email}</p>
                              {doc.phone && <p className="text-gray-400 text-xs">{doc.phone}</p>}
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
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleVerifyLicense(doc._id)}
                                  disabled={actionLoading === doc._id}
                                  title="Re-run AskMyDoc license check"
                                  className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 disabled:opacity-40 transition-colors"
                                >
                                  <RefreshCw size={15} className={actionLoading === doc._id ? 'animate-spin' : ''} />
                                </button>
                                {doc.verificationStatus !== 'APPROVED' && (
                                  <button
                                    onClick={() => openModal(doc._id, 'approve')}
                                    disabled={actionLoading === doc._id}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium disabled:opacity-40 transition-colors"
                                  >
                                    <CheckCircle size={13} /> Approve
                                  </button>
                                )}
                                {doc.verificationStatus !== 'REJECTED' && (
                                  <button
                                    onClick={() => openModal(doc._id, 'reject')}
                                    disabled={actionLoading === doc._id}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium disabled:opacity-40 transition-colors"
                                  >
                                    <XCircle size={13} /> Reject
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════ PATIENTS ════ */}
          {page === 'patients' && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-5">Registered Patients</h2>

              {/* search */}
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 w-full max-w-sm mb-5">
                <Search size={14} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Name, email or phone…"
                  value={patSearch}
                  onChange={(e) => setPatSearch(e.target.value)}
                  className="outline-none text-sm text-gray-700 flex-1"
                />
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                {patLoading ? (
                  <div className="flex items-center justify-center h-48 text-gray-400">Loading…</div>
                ) : filteredPatients.length === 0 ? (
                  <div className="flex items-center justify-center h-48 text-gray-400">No patients found</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-5 py-3 text-left font-semibold text-gray-600">Patient</th>
                          <th className="px-5 py-3 text-left font-semibold text-gray-600">Phone</th>
                          <th className="px-5 py-3 text-left font-semibold text-gray-600">Gender</th>
                          <th className="px-5 py-3 text-left font-semibold text-gray-600">Date of Birth</th>
                          <th className="px-5 py-3 text-left font-semibold text-gray-600">Family Members</th>
                          <th className="px-5 py-3 text-left font-semibold text-gray-600">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredPatients.map((pat) => (
                          <tr key={pat._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-4">
                              <p className="font-medium text-gray-900">{pat.name}</p>
                              <p className="text-gray-400 text-xs">{pat.email}</p>
                            </td>
                            <td className="px-5 py-4 text-gray-600">{pat.phone || '—'}</td>
                            <td className="px-5 py-4 text-gray-600">{pat.gender || '—'}</td>
                            <td className="px-5 py-4 text-gray-600">
                              {pat.dateOfBirth ? new Date(pat.dateOfBirth).toLocaleDateString() : '—'}
                            </td>
                            <td className="px-5 py-4 text-gray-600">{pat.familyMembers?.length ?? 0}</td>
                            <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {new Date(pat.createdAt).toLocaleDateString()}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
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
    </div>
  );
};
