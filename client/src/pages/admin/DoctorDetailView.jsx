import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Stethoscope, Mail, Phone, MapPin, Award,
  CheckCircle, XCircle, Calendar, Users, ClipboardList,
  DollarSign, Star, Clock, Building2,
} from 'lucide-react';

// ── shared helpers ────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const s = {
    PENDING:  'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100  text-green-800',
    REJECTED: 'bg-red-100    text-red-800',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
};

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

const StatTile = ({ label, value, sub }) => (
  <div className="bg-gray-50 rounded-lg p-3 text-center">
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    {sub && <p className="text-xs text-gray-400">{sub}</p>}
  </div>
);

const InfoRow = ({ label, value }) =>
  value ? (
    <div className="flex gap-2 text-sm">
      <span className="text-gray-500 w-40 shrink-0">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  ) : null;

// ── tabs ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'profile',       label: 'Profile',        icon: Stethoscope },
  { id: 'appointments',  label: 'Appointments',   icon: Calendar },
  { id: 'patients',      label: 'Patients',       icon: Users },
  { id: 'consultations', label: 'Consultations',  icon: ClipboardList },
  { id: 'revenue',       label: 'Revenue',        icon: DollarSign },
];

// ── Profile tab ───────────────────────────────────────────────────────────────

const ProfileTab = ({ doctor }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2.5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Personal Info</p>
      <InfoRow label="Full Name"     value={doctor.name} />
      <InfoRow label="Email"         value={doctor.email} />
      <InfoRow label="Phone"         value={doctor.phone} />
      <InfoRow label="Specialization" value={doctor.specialization} />
      <InfoRow label="Experience"    value={doctor.experience ? `${doctor.experience} years` : null} />
      <InfoRow label="Consultation Fee" value={doctor.consultationFee ? `₹${doctor.consultationFee}` : null} />
      <InfoRow label="License No."   value={doctor.licenseNumber} />
      <InfoRow label="Avg Consultation" value={doctor.averageConsultationTime ? `${doctor.averageConsultationTime} min` : null} />
      <InfoRow label="Rating"        value={doctor.averageRating ? `${doctor.averageRating} ★ (${doctor.totalReviews} reviews)` : null} />
    </div>

    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2.5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Clinic Info</p>
      <InfoRow label="Clinic Name"   value={doctor.clinicName} />
      <InfoRow label="Clinic Address" value={doctor.clinicAddress} />
      <InfoRow label="City"          value={doctor.clinicCity} />
      <InfoRow label="Clinic Phone"  value={doctor.clinicPhone} />
      <InfoRow label="Room Number"   value={doctor.roomNumber} />
      <InfoRow label="Availability"  value={doctor.availabilityStart ? `${doctor.availabilityStart} – ${doctor.availabilityEnd}` : null} />
      <InfoRow label="Days Off"      value={doctor.daysOff?.length ? doctor.daysOff.join(', ') : null} />
      <InfoRow label="Consult Type"  value={doctor.consultationType?.join(', ')} />
      {doctor.qualifications?.length > 0 && (
        <div className="flex gap-2 text-sm">
          <span className="text-gray-500 w-40 shrink-0">Qualifications</span>
          <span className="text-gray-800 font-medium">{doctor.qualifications.join(', ')}</span>
        </div>
      )}
    </div>

    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2.5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Verification</p>
      <div className="flex gap-2 text-sm">
        <span className="text-gray-500 w-40 shrink-0">Verification Status</span>
        <StatusBadge status={doctor.verificationStatus} />
      </div>
      <InfoRow label="License Check" value={doctor.licenseVerified ? 'Verified ✓' : 'Not verified'} />
      {doctor.verificationNote && <InfoRow label="Note" value={doctor.verificationNote} />}
      <InfoRow label="Active"        value={doctor.isActive ? 'Yes' : 'No'} />
      <InfoRow label="Member Since"  value={new Date(doctor.createdAt).toLocaleDateString()} />
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
              <th className="px-5 py-3 text-left font-semibold text-gray-600">Patient</th>
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
                  <p className="font-medium text-gray-900">{a.patientId?.name || a.bookedFor?.name || '—'}</p>
                  <p className="text-gray-400 text-xs">{a.patientId?.email || ''}</p>
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

// ── Patients tab ──────────────────────────────────────────────────────────────

const PatientsTab = ({ patients }) => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
    {patients.length === 0 ? (
      <div className="flex items-center justify-center h-40 text-gray-400">No patients yet</div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm select-none">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-5 py-3 text-left font-semibold text-gray-600">Patient</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-600">Phone</th>
              <th className="px-5 py-3 text-left font-semibold text-gray-600">Appointments</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {patients.map((p) => (
              <tr key={p._id} className="hover:bg-purple-50 transition-colors cursor-pointer">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0 text-purple-500 text-sm font-medium">
                      {p.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{p.name}</p>
                      <p className="text-gray-400 text-xs truncate">{p.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-gray-600">{p.phone || '—'}</td>
                <td className="px-5 py-3 text-gray-600">{p.appointmentCount}</td>
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
              <th className="px-5 py-3 text-left font-semibold text-gray-600">Patient</th>
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
                  <p className="font-medium text-gray-900">{c.patientId?.name || '—'}</p>
                  <p className="text-gray-400 text-xs">{c.patientId?.email || ''}</p>
                </td>
                <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                  {new Date(c.createdAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-3 text-gray-600 max-w-xs">
                  {c.symptoms?.join(', ') || '—'}
                </td>
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

// ── Revenue tab ───────────────────────────────────────────────────────────────

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

const RevenueTab = ({ payments, stats }) => (
  <div className="space-y-5">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatTile label="Total Billed"  value={`₹${stats.total.toLocaleString()}`} />
      <StatTile label="Collected"     value={`₹${stats.paid.toLocaleString()}`} sub="PAID" />
      <StatTile label="Pending"       value={`₹${stats.pending.toLocaleString()}`} sub="PENDING" />
      <StatTile label="Refunded"      value={`₹${stats.refunded.toLocaleString()}`} sub="REFUNDED" />
    </div>

    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {payments.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-gray-400">No payments yet</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Patient</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Date</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Amount</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Method</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{p.patientId?.name || '—'}</p>
                    <p className="text-gray-400 text-xs">{p.patientId?.email || ''}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
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

// ── main component ────────────────────────────────────────────────────────────

export const DoctorDetailView = ({ doctorId, onBack }) => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('profile');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await adminAPI.getDoctorFull(doctorId);
        setData(res.data);
      } catch {
        toast.error('Failed to load doctor details');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [doctorId]);

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>;
  if (!data) return null;

  const { doctor, appointments, consultations, payments, patients, revenueStats } = data;

  const counts = {
    appointments:  appointments.length,
    patients:      patients.length,
    consultations: consultations.length,
  };

  return (
    <div>
      {/* back */}
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors">
        <ArrowLeft size={15} /> Back to Doctors
      </button>

      {/* header card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5 shadow-sm">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
            <Stethoscope size={26} className="text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900">{doctor.name}</h2>
              <StatusBadge status={doctor.verificationStatus} />
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${doctor.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {doctor.isActive ? 'Active' : 'Inactive'}
              </span>
              {doctor.licenseVerified && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                  <CheckCircle size={11} /> License ✓
                </span>
              )}
            </div>
            <p className="text-slate-600 font-medium mt-0.5">{doctor.specialization}</p>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Mail size={13} />{doctor.email}</span>
              {doctor.phone && <span className="flex items-center gap-1"><Phone size={13} />{doctor.phone}</span>}
              {(doctor.clinicName || doctor.clinicCity) && (
                <span className="flex items-center gap-1">
                  <Building2 size={13} />
                  {[doctor.clinicName, doctor.clinicCity].filter(Boolean).join(', ')}
                </span>
              )}
              {doctor.consultationFee > 0 && (
                <span className="flex items-center gap-1"><DollarSign size={13} />₹{doctor.consultationFee} / visit</span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 shrink-0">
            <StatTile label="Appointments" value={counts.appointments} />
            <StatTile label="Patients"     value={counts.patients} />
            <StatTile label="Collected"    value={`₹${revenueStats.paid.toLocaleString()}`} />
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
            {counts[t.id] !== undefined && (
              <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                {counts[t.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* tab content */}
      {tab === 'profile'       && <ProfileTab       doctor={doctor} />}
      {tab === 'appointments'  && <AppointmentsTab  appointments={appointments} />}
      {tab === 'patients'      && <PatientsTab       patients={patients} />}
      {tab === 'consultations' && <ConsultationsTab  consultations={consultations} />}
      {tab === 'revenue'       && <RevenueTab        payments={payments} stats={revenueStats} />}
    </div>
  );
};
