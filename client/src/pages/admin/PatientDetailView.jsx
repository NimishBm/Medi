import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  ArrowLeft, User, Mail, Phone, Calendar, Pill,
  DollarSign, ClipboardList, Users, Heart, AlertCircle,
} from 'lucide-react';

// ── helpers ───────────────────────────────────────────────────────────────────

const ApptStatusBadge = ({ status }) => {
  const s = {
    BOOKED:      'bg-blue-100 text-blue-700',
    CHECKED_IN:  'bg-indigo-100 text-indigo-700',
    WAITING:     'bg-yellow-100 text-yellow-700',
    CALLED:      'bg-orange-100 text-orange-700',
    CONSULTING:  'bg-purple-100 text-purple-700',
    COMPLETED:   'bg-green-100 text-green-700',
    CANCELLED:   'bg-red-100 text-red-700',
    SKIPPED:     'bg-gray-100 text-gray-600',
    NO_SHOW:     'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s[status] || 'bg-gray-100 text-gray-600'}`}>
      {status?.replace('_', ' ')}
    </span>
  );
};

const PaymentStatusBadge = ({ status }) => {
  const s = {
    PAID:     'bg-green-100 text-green-700',
    PENDING:  'bg-yellow-100 text-yellow-700',
    REFUNDED: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
};

const StatTile = ({ label, value }) => (
  <div className="bg-gray-50 rounded-lg p-3 text-center">
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
  </div>
);

const InfoRow = ({ label, value }) =>
  value ? (
    <div className="flex gap-2 text-sm">
      <span className="text-gray-500 w-36 shrink-0">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  ) : null;

// ── tabs ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'profile',       label: 'Profile',       icon: User },
  { id: 'appointments',  label: 'Appointments',  icon: Calendar },
  { id: 'consultations', label: 'Consultations', icon: ClipboardList },
  { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
  { id: 'payments',      label: 'Payments',      icon: DollarSign },
  { id: 'family',        label: 'Family',        icon: Users },
];

// ── Profile tab ───────────────────────────────────────────────────────────────

const ProfileTab = ({ patient }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2.5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Personal Info</p>
      <InfoRow label="Full Name"    value={patient.name} />
      <InfoRow label="Email"        value={patient.email} />
      <InfoRow label="Phone"        value={patient.phone} />
      <InfoRow label="Gender"       value={patient.gender} />
      <InfoRow label="Date of Birth" value={patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : null} />
      <InfoRow label="Blood Group"  value={patient.bloodGroup} />
      <InfoRow label="Member Since" value={new Date(patient.createdAt).toLocaleDateString()} />
    </div>

    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Medical Info</p>
      {patient.allergies?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
            <AlertCircle size={12} /> Allergies
          </p>
          <div className="flex flex-wrap gap-1.5">
            {patient.allergies.map((a, i) => (
              <span key={i} className="bg-red-50 text-red-700 text-xs px-2 py-0.5 rounded-full">{a}</span>
            ))}
          </div>
        </div>
      )}
      {patient.medicalHistory?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1">
            <Heart size={12} /> Medical History
          </p>
          <div className="space-y-1.5">
            {patient.medicalHistory.map((h, i) => (
              <div key={i} className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
                <span className="font-medium">{h.condition}</span>
                {h.diagnosis && <span className="text-gray-500"> — {h.diagnosis}</span>}
                {h.date && <span className="text-gray-400 text-xs ml-2">{new Date(h.date).toLocaleDateString()}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
      {!patient.allergies?.length && !patient.medicalHistory?.length && (
        <p className="text-sm text-gray-400">No medical history recorded</p>
      )}
    </div>
  </div>
);

// ── Appointments tab ──────────────────────────────────────────────────────────

const AppointmentsTab = ({ appointments }) => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
    {appointments.length === 0 ? (
      <div className="flex items-center justify-center h-40 text-gray-400">No appointments yet</div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-5 py-3 text-left font-semibold text-gray-600">Doctor</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-600">Date</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-600">Time</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-600">Type</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-600">Token</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {appointments.map((a) => (
              <tr key={a._id} className="hover:bg-gray-50">
                <td className="px-5 py-3">
                  <p className="font-medium text-gray-900">{a.doctorId?.name || '—'}</p>
                  <p className="text-gray-400 text-xs">{a.doctorId?.specialization || ''}</p>
                </td>
                <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                  {new Date(a.appointmentDate).toLocaleDateString()}
                </td>
                <td className="px-5 py-3 text-gray-600">{a.appointmentTime}</td>
                <td className="px-5 py-3 text-gray-600 text-xs">{a.appointmentType}</td>
                <td className="px-5 py-3 text-gray-600">#{a.tokenNumber ?? '—'}</td>
                <td className="px-5 py-3"><ApptStatusBadge status={a.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

// ── Consultations tab ─────────────────────────────────────────────────────────

const ConsultationsTab = ({ consultations }) => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
    {consultations.length === 0 ? (
      <div className="flex items-center justify-center h-40 text-gray-400">No consultations yet</div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-5 py-3 text-left font-semibold text-gray-600">Doctor</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-600">Date</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-600">Symptoms</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-600">Diagnosis</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-600">Follow-up</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {consultations.map((c) => (
              <tr key={c._id} className="hover:bg-gray-50">
                <td className="px-5 py-3">
                  <p className="font-medium text-gray-900">{c.doctorId?.name || '—'}</p>
                  <p className="text-gray-400 text-xs">{c.doctorId?.specialization || ''}</p>
                </td>
                <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                  {new Date(c.createdAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-3 text-gray-600 max-w-xs">{c.symptoms?.join(', ') || '—'}</td>
                <td className="px-5 py-3 text-gray-600 max-w-xs truncate" title={c.diagnosis}>
                  {c.diagnosis || '—'}
                </td>
                <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                  {c.followUpDate ? new Date(c.followUpDate).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

// ── Prescriptions tab ─────────────────────────────────────────────────────────

const PrescriptionsTab = ({ prescriptions }) => (
  <div className="space-y-3">
    {prescriptions.length === 0 ? (
      <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center h-40 text-gray-400">
        No prescriptions yet
      </div>
    ) : (
      prescriptions.map((rx) => (
        <div key={rx._id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-gray-900">{rx.doctorId?.name || '—'}</p>
              <p className="text-sm text-gray-500">{rx.doctorId?.specialization || ''}</p>
            </div>
            <div className="text-right text-sm text-gray-400">
              <p>{new Date(rx.createdAt).toLocaleDateString()}</p>
              {rx.validTill && <p className="text-xs">Valid till {new Date(rx.validTill).toLocaleDateString()}</p>}
            </div>
          </div>
          {rx.medicines?.length > 0 && (
            <div className="space-y-1.5">
              {rx.medicines.map((m, i) => (
                <div key={i} className="flex gap-3 text-sm bg-gray-50 rounded-lg px-3 py-2">
                  <span className="font-medium text-gray-900 w-40 shrink-0">{m.name}</span>
                  <span className="text-gray-600">{m.dosage}</span>
                  <span className="text-gray-500">{m.frequency}</span>
                  <span className="text-gray-500">{m.duration}</span>
                  {m.instructions && <span className="text-gray-400 text-xs italic">{m.instructions}</span>}
                </div>
              ))}
            </div>
          )}
          {rx.additionalNotes && (
            <p className="mt-2 text-sm text-gray-500 italic">{rx.additionalNotes}</p>
          )}
        </div>
      ))
    )}
  </div>
);

// ── Payments tab ──────────────────────────────────────────────────────────────

const PaymentsTab = ({ payments }) => {
  const total   = payments.reduce((s, p) => s + p.totalAmount, 0);
  const paid    = payments.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.totalAmount, 0);
  const pending = payments.filter((p) => p.status === 'PENDING').reduce((s, p) => s + p.totalAmount, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <StatTile label="Total Billed" value={`₹${total.toLocaleString()}`} />
        <StatTile label="Paid"         value={`₹${paid.toLocaleString()}`} />
        <StatTile label="Pending"      value={`₹${pending.toLocaleString()}`} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {payments.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-gray-400">No payments yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Doctor</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Date</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Fee</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Total</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Method</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{p.doctorId?.name || '—'}</p>
                      <p className="text-gray-400 text-xs">{p.doctorId?.specialization || ''}</p>
                    </td>
                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-gray-600">₹{p.consultationFee?.toLocaleString()}</td>
                    <td className="px-5 py-3 font-medium text-gray-900">₹{p.totalAmount?.toLocaleString()}</td>
                    <td className="px-5 py-3 text-gray-600">{p.paymentMethod}</td>
                    <td className="px-5 py-3"><PaymentStatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Family tab ────────────────────────────────────────────────────────────────

const FamilyTab = ({ members }) => (
  <div className="space-y-3">
    {members.length === 0 ? (
      <div className="bg-white rounded-xl border border-gray-200 flex items-center justify-center h-40 text-gray-400">
        No family members added
      </div>
    ) : (
      members.map((m, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
              <User size={18} className="text-purple-500" />
            </div>
            <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <InfoRow label="Name"         value={m.name} />
              <InfoRow label="Relationship" value={m.relationship} />
              <InfoRow label="Gender"       value={m.gender} />
              <InfoRow label="Blood Group"  value={m.bloodGroup} />
              <InfoRow label="Phone"        value={m.phone} />
              <InfoRow label="Date of Birth" value={m.dateOfBirth ? new Date(m.dateOfBirth).toLocaleDateString() : null} />
            </div>
          </div>
          {m.allergies?.length > 0 && (
            <div className="mt-3 ml-14">
              <p className="text-xs text-gray-500 mb-1">Allergies:</p>
              <div className="flex flex-wrap gap-1.5">
                {m.allergies.map((a, j) => (
                  <span key={j} className="bg-red-50 text-red-700 text-xs px-2 py-0.5 rounded-full">{a}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))
    )}
  </div>
);

// ── main component ────────────────────────────────────────────────────────────

const InfoRowLocal = InfoRow;

export const PatientDetailView = ({ patientId, onBack }) => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('profile');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await adminAPI.getPatientFull(patientId);
        setData(res.data);
      } catch {
        toast.error('Failed to load patient details');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [patientId]);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>;
  if (!data) return null;

  const { patient, appointments, prescriptions, payments, consultations } = data;

  const counts = {
    appointments:  appointments.length,
    consultations: consultations.length,
    prescriptions: prescriptions.length,
    payments:      payments.length,
    family:        patient.familyMembers?.length ?? 0,
  };

  return (
    <div>
      {/* back */}
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors">
        <ArrowLeft size={15} /> Back to Patients
      </button>

      {/* header card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5 shadow-sm">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
            <User size={26} className="text-purple-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900">{patient.name}</h2>
              {patient.bloodGroup && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                  {patient.bloodGroup}
                </span>
              )}
              {patient.gender && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                  {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : 'Other'}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Mail size={13} />{patient.email}</span>
              {patient.phone && <span className="flex items-center gap-1"><Phone size={13} />{patient.phone}</span>}
              {patient.dateOfBirth && (
                <span className="flex items-center gap-1">
                  <Calendar size={13} />
                  {new Date(patient.dateOfBirth).toLocaleDateString()}
                </span>
              )}
            </div>
            {patient.allergies?.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <AlertCircle size={13} className="text-red-400 shrink-0" />
                {patient.allergies.map((a, i) => (
                  <span key={i} className="bg-red-50 text-red-700 text-xs px-2 py-0.5 rounded-full">{a}</span>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3 shrink-0">
            <StatTile label="Appointments"  value={counts.appointments} />
            <StatTile label="Prescriptions" value={counts.prescriptions} />
            <StatTile label="Family"        value={counts.family} />
          </div>
        </div>
      </div>

      {/* tab bar */}
      <div className="flex gap-0 mb-5 border-b border-gray-200 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
              tab === t.id
                ? 'border-slate-800 text-slate-800'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <t.icon size={14} />
            {t.label}
            {counts[t.id] !== undefined && counts[t.id] > 0 && (
              <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                {counts[t.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* tab content */}
      {tab === 'profile'       && <ProfileTab       patient={patient} />}
      {tab === 'appointments'  && <AppointmentsTab  appointments={appointments} />}
      {tab === 'consultations' && <ConsultationsTab consultations={consultations} />}
      {tab === 'prescriptions' && <PrescriptionsTab prescriptions={prescriptions} />}
      {tab === 'payments'      && <PaymentsTab      payments={payments} />}
      {tab === 'family'        && <FamilyTab        members={patient.familyMembers ?? []} />}
    </div>
  );
};
