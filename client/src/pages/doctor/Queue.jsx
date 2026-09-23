import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { queueAPI, consultationAPI } from '../../services/api';
import { initSocket, joinRooms } from '../../services/socket';
import toast from 'react-hot-toast';
import {
  Heart, LogOut, AlertCircle, Phone, ArrowLeft,
  Clock, Users, CheckCircle, SkipForward, UserX,
  Stethoscope, ChevronRight, Activity, Calendar,
  RotateCcw, FileText, User, Mail, ShieldAlert
} from 'lucide-react';
import { NotificationBell } from '../../components/NotificationBell';
import { useDoctorNotifications } from '../../hooks/useDoctorNotifications';

// ─── helpers ────────────────────────────────────────────────────────────────

const calcAge = (dob) =>
  dob ? Math.floor((Date.now() - new Date(dob)) / (365.25 * 24 * 3600 * 1000)) : null;

const fmt2 = (n) => String(n).padStart(2, '0');

const fmtDuration = (secs) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${fmt2(m)}:${fmt2(s)}`;
};

const STATUS_LABEL = {
  WAITING: 'Waiting',
  CALLED: 'Called',
  CONSULTING: 'In Consultation',
  COMPLETED: 'Completed',
  SKIPPED: 'Skipped',
  NO_SHOW: 'No Show',
};

const STATUS_PILL = {
  WAITING:    'bg-teal-100 text-teal-700',
  CALLED:     'bg-yellow-100 text-yellow-700',
  CONSULTING: 'bg-green-100 text-green-700',
  COMPLETED:  'bg-blue-100 text-blue-700',
  SKIPPED:    'bg-orange-100 text-orange-700',
  NO_SHOW:    'bg-red-100 text-red-700',
};

// ─── component ──────────────────────────────────────────────────────────────

export const DoctorQueue = () => {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  useDoctorNotifications(user?._id);

  const [queue, setQueue]                       = useState([]);
  const [isLoading, setIsLoading]               = useState(true);
  const [currentPatient, setCurrentPatient]     = useState(null);
  const [isSubmittingNotes, setIsSubmittingNotes] = useState(false);
  const [isActionLoading, setIsActionLoading]   = useState(false);
  const [consultationNotes, setConsultationNotes] = useState({
    symptoms: '', diagnosis: '', treatmentPlan: '', followUpDate: '',
  });

  // Live stopwatch for CONSULTING status
  const [elapsed, setElapsed]   = useState(0);
  const timerRef                = useRef(null);

  // ── fetch / socket ─────────────────────────────────────────────────────────

  const applyQueue = (raw) => {
    const sorted = [...raw].sort((a, b) => a.tokenNumber - b.tokenNumber);
    setQueue(sorted);
    const active =
      sorted.find((q) => q.status === 'CONSULTING') ||
      sorted.find((q) => q.status === 'CALLED');
    setCurrentPatient(active || null);
    if (!active) {
      setConsultationNotes({ symptoms: '', diagnosis: '', treatmentPlan: '', followUpDate: '' });
    }
  };

  useEffect(() => {
    let mounted = true;
    const fetchQueue = async () => {
      try {
        const res = await queueAPI.getQueueByDoctorId(user._id);
        if (mounted) { applyQueue(res.data.queue); setIsLoading(false); }
      } catch {
        if (mounted) { toast.error('Failed to load queue'); setIsLoading(false); }
      }
    };

    fetchQueue();
    const socket = initSocket();

    // Join doctor-specific rooms so targeted server emits are received
    joinRooms('doctor', user._id);

    // Re-join rooms after reconnection (socket re-assigns a new socket.id)
    socket.on('connect', () => joinRooms('doctor', user._id));

    socket.on('queue-update', fetchQueue);
    return () => {
      mounted = false;
      socket.off('queue-update', fetchQueue);
      socket.off('connect');
    };
  }, [user._id]);

  // ── consultation timer ─────────────────────────────────────────────────────

  useEffect(() => {
    clearInterval(timerRef.current);
    if (currentPatient?.status === 'CONSULTING' && currentPatient.consultationStartAt) {
      const start = new Date(currentPatient.consultationStartAt).getTime();
      const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
      tick();
      timerRef.current = setInterval(tick, 1000);
    } else {
      setElapsed(0);
    }
    return () => clearInterval(timerRef.current);
  }, [currentPatient?._id, currentPatient?.status]);

  // ── actions ────────────────────────────────────────────────────────────────

  const withLoading = (fn) => async (...args) => {
    setIsActionLoading(true);
    try { await fn(...args); }
    finally { setIsActionLoading(false); }
  };

  const handleCallNext = withLoading(async () => {
    const waiting = queue.filter((q) => q.status === 'WAITING');
    if (!waiting.length) { toast.error('No patients waiting'); return; }
    await queueAPI.callNextPatient({ doctorId: user._id });
    toast.success(`Calling token #${waiting[0].tokenNumber}`);
  });

  const handleStartConsultation = withLoading(async () => {
    await queueAPI.startConsultation({ queueId: currentPatient._id });
    toast.success('Consultation started');
  });

  const handleSkip = withLoading(async () => {
    await queueAPI.skipPatient({ queueId: currentPatient._id });
    toast.success('Patient skipped');
  });

  const handleRecall = withLoading(async (queueId) => {
    await queueAPI.recallPatient({ queueId });
    toast.success('Patient recalled back to queue');
  });

  const handleNoShow = withLoading(async () => {
    const pName = currentPatient?.appointmentId?.bookedFor?.name || currentPatient?.patientId?.name || 'Patient';
    if (!window.confirm(`Mark ${pName} as no-show?`)) return;
    await queueAPI.markNoShow({ queueId: currentPatient._id });
    toast.success('Marked as no-show');
  });

  const handleCompleteWithNotes = async () => {
    if (!consultationNotes.diagnosis.trim()) { toast.error('Diagnosis is required'); return; }
    setIsSubmittingNotes(true);
    try {
      const apptId = currentPatient.appointmentId?._id || currentPatient.appointmentId;
      const patId = currentPatient.patientId?._id || currentPatient.patientId;
      await consultationAPI.createConsultation({
        appointmentId: apptId,
        patientId:     patId,
        symptoms:      consultationNotes.symptoms,
        diagnosis:     consultationNotes.diagnosis,
        treatmentPlan: consultationNotes.treatmentPlan,
        followUpDate:  consultationNotes.followUpDate || undefined,
      });
      await queueAPI.completeConsultation({ queueId: currentPatient._id });
      toast.success('Consultation completed & notes saved');
      setConsultationNotes({ symptoms: '', diagnosis: '', treatmentPlan: '', followUpDate: '' });
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save');
    } finally {
      setIsSubmittingNotes(false);
    }
  };

  const handleCompleteWithoutNotes = withLoading(async () => {
    await queueAPI.completeConsultation({ queueId: currentPatient._id });
    toast.success('Consultation completed');
    setConsultationNotes({ symptoms: '', diagnosis: '', treatmentPlan: '', followUpDate: '' });
  });

  // ── derived stats ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3 bg-gray-50">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Loading queue…</p>
      </div>
    );
  }

  const stats = {
    total:     queue.length,
    waiting:   queue.filter((q) => q.status === 'WAITING').length,
    called:    queue.filter((q) => q.status === 'CALLED').length,
    consulting: queue.filter((q) => q.status === 'CONSULTING').length,
    completed: queue.filter((q) => q.status === 'COMPLETED').length,
    skipped:   queue.filter((q) => q.status === 'SKIPPED' || q.status === 'NO_SHOW').length,
  };

  const progress = stats.total > 0
    ? Math.round(((stats.completed + stats.skipped) / stats.total) * 100)
    : 0;

  const waitingList = queue.filter((q) => q.status === 'WAITING');

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-[#1E3A5F] border-b border-[#2D4F7C] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/doctor')}
              className="sm:hidden text-teal-300 hover:text-white p-2"
            >
              <ArrowLeft size={22} />
            </button>
            <div className="w-9 h-9 bg-[#0D9488] rounded-lg flex items-center justify-center">
              <Heart className="text-white" size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white leading-tight">Live Queue</h1>
              <p className="text-xs text-teal-300 hidden sm:block">Real-time patient management</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {['Dashboard:/doctor', 'Appointments:/doctor/appointments', 'Profile:/doctor/profile'].map((s) => {
              const [label, path] = s.split(':');
              return (
                <button key={label} type="button" onClick={() => navigate(path)}
                  className="text-slate-200 hover:text-teal-300 text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition hidden sm:block">
                  {label}
                </button>
              );
            })}
            <div className="hidden sm:block h-5 border-l border-white/20 mx-1" />
            <div className="bg-white/10 px-3 py-1.5 rounded-full hidden sm:flex items-center gap-1.5">
              <div className="w-5 h-5 bg-[#0D9488] rounded-full flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-white">{user?.name?.split(' ')[0]}</span>
            </div>
            <NotificationBell />
            <button type="button" onClick={() => dispatch(logout())}
              className="text-slate-300 hover:text-red-400 p-2 rounded-lg hover:bg-white/10 transition"
              title="Logout">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-5">

        {/* ── Page title + progress ── */}
        <div className="mb-5 hidden sm:block">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-2xl font-bold text-gray-900">Live Queue Management</h2>
            <span className="text-sm text-gray-500">{stats.completed} of {stats.total} completed</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-teal-500 h-2 rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* ── Stat bar ── */}
        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Waiting',    value: stats.waiting,   color: 'teal',   icon: Clock },
            { label: 'Called',     value: stats.called,    color: 'yellow', icon: Phone },
            { label: 'Completed',  value: stats.completed, color: 'green',  icon: CheckCircle },
            { label: 'Skipped',    value: stats.skipped,   color: 'orange', icon: SkipForward },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className={`bg-white rounded-lg border border-${color}-200 p-3 sm:p-4 flex items-center gap-3`}>
              <div className={`w-9 h-9 bg-${color}-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
                <Icon size={18} className={`text-${color}-600`} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
                <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── LEFT: Current Patient ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Current Patient Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Card header bar */}
              <div className={`px-5 py-3 flex items-center justify-between ${
                currentPatient?.status === 'CONSULTING' ? 'bg-green-600' :
                currentPatient?.status === 'CALLED'     ? 'bg-yellow-500' :
                'bg-teal-600'
              }`}>
                <div className="flex items-center gap-2 text-white">
                  <Stethoscope size={18} />
                  <span className="font-semibold text-sm">
                    {currentPatient
                      ? STATUS_LABEL[currentPatient.status] || currentPatient.status
                      : 'No Active Patient'}
                  </span>
                </div>
                {currentPatient?.status === 'CONSULTING' && (
                  <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-white text-sm font-mono font-semibold">
                    <Activity size={14} className="animate-pulse" />
                    {fmtDuration(elapsed)}
                  </div>
                )}
              </div>

              {/* Card body */}
              <div className="p-5">
                {currentPatient ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {(() => {
                      const isFamily = currentPatient.appointmentId?.bookedFor?.isFamilyMember;
                      const displayName = isFamily && currentPatient.appointmentId.bookedFor.name
                        ? currentPatient.appointmentId.bookedFor.name
                        : currentPatient.patientId?.name || 'Unknown Patient';
                      const phone = currentPatient.patientId?.phone || currentPatient.appointmentId?.bookedFor?.phone || '—';
                      const email = currentPatient.patientId?.email || '—';
                      const dob = (isFamily && currentPatient.appointmentId.bookedFor.dateOfBirth)
                        ? currentPatient.appointmentId.bookedFor.dateOfBirth
                        : currentPatient.patientId?.dateOfBirth;
                      const age = calcAge(dob);
                      const gender = (isFamily && currentPatient.appointmentId.bookedFor.gender)
                        ? currentPatient.appointmentId.bookedFor.gender
                        : currentPatient.patientId?.gender;
                      const bloodGroup = (isFamily && currentPatient.appointmentId.bookedFor.bloodGroup)
                        ? currentPatient.appointmentId.bookedFor.bloodGroup
                        : currentPatient.patientId?.bloodGroup;
                      const allergies = currentPatient.patientId?.allergies || [];
                      const history = currentPatient.patientId?.medicalHistory || [];
                      const apptType = currentPatient.appointmentId?.appointmentType || 'General Consultation';
                      const reason = currentPatient.appointmentId?.reason;

                      return (
                        <div>
                          {/* Token + name */}
                          <div className="flex items-start gap-4 mb-4">
                            <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 text-center min-w-[72px] shadow-sm">
                              <p className="text-xs text-teal-600 font-bold uppercase tracking-wider">Token</p>
                              <p className="text-3xl font-black text-teal-700">#{currentPatient.tokenNumber}</p>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-xl font-bold text-gray-900 leading-tight">{displayName}</p>
                                {isFamily && (
                                  <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                                    Family ({currentPatient.appointmentId.bookedFor.relationship || 'Member'})
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                                <Phone size={13} className="text-gray-400" /> {phone}
                                {email && email !== '—' && (
                                  <>
                                    <span className="text-gray-300">•</span>
                                    <Mail size={13} className="text-gray-400" /> <span className="truncate">{email}</span>
                                  </>
                                )}
                              </p>
                              {currentPatient.calledAt && (
                                <p className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded inline-flex items-center gap-1 mt-1 font-medium">
                                  <Clock size={11} />
                                  Called at {new Date(currentPatient.calledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Demographics & tags */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {age !== null && (
                              <span className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full font-medium">
                                {age} yrs
                              </span>
                            )}
                            {gender && (
                              <span className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full font-medium capitalize">
                                {gender === 'M' ? 'Male' : gender === 'F' ? 'Female' : gender}
                              </span>
                            )}
                            {bloodGroup && (
                              <span className="bg-red-50 text-red-700 border border-red-200 text-xs px-2.5 py-1 rounded-full font-bold">
                                {bloodGroup}
                              </span>
                            )}
                            <span className="bg-teal-50 text-teal-700 border border-teal-200 text-xs px-2.5 py-1 rounded-full font-semibold">
                              {apptType}
                            </span>
                          </div>

                          {/* Visit Reason */}
                          {reason && (
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 mb-3">
                              <p className="text-xs font-bold text-slate-700 mb-0.5 flex items-center gap-1">
                                <FileText size={12} className="text-slate-500" /> Reason for Visit
                              </p>
                              <p className="text-xs text-slate-600 italic">"{reason}"</p>
                            </div>
                          )}

                          {/* Allergies */}
                          {allergies.length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 mb-3">
                              <p className="text-xs font-bold text-red-700 mb-1 flex items-center gap-1">
                                <ShieldAlert size={12} className="text-red-600" /> ALLERGIES
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {allergies.map((a, i) => (
                                  <span key={i} className="bg-red-200 text-red-800 text-xs px-2 py-0.5 rounded-full font-medium">{a}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Medical history */}
                          {history.length > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
                              <p className="text-xs font-bold text-blue-700 mb-1">Medical History</p>
                              <div className="space-y-1">
                                {history.map((h, i) => (
                                  <p key={i} className="text-xs text-gray-700">
                                    <span className="font-semibold">{h.condition}</span>
                                    {h.diagnosis && <span className="text-gray-500"> — {h.diagnosis}</span>}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Right: actions + consultation notes */}
                    <div className="flex flex-col gap-3">

                      {currentPatient.status === 'CALLED' && (
                        <>
                          <button type="button" onClick={handleStartConsultation} disabled={isActionLoading}
                            className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2">
                            <Stethoscope size={16} /> Start Consultation
                          </button>
                          <button type="button" onClick={handleSkip} disabled={isActionLoading}
                            className="w-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2">
                            <SkipForward size={15} /> Skip Patient
                          </button>
                          <button type="button" onClick={handleNoShow} disabled={isActionLoading}
                            className="w-full bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 font-medium py-2.5 rounded-lg border border-red-200 transition flex items-center justify-center gap-2">
                            <UserX size={15} /> Mark No-Show
                          </button>
                        </>
                      )}

                      {currentPatient.status === 'CONSULTING' && (
                        <>
                          {/* Consultation notes form */}
                          <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 space-y-2.5">
                            <p className="text-xs font-bold text-teal-800">📋 Consultation Notes</p>
                            <input
                              type="text"
                              placeholder="Symptoms (e.g. Fever, Cough)"
                              value={consultationNotes.symptoms}
                              onChange={(e) => setConsultationNotes({ ...consultationNotes, symptoms: e.target.value })}
                              className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                            />
                            <textarea
                              placeholder="Diagnosis *"
                              value={consultationNotes.diagnosis}
                              onChange={(e) => setConsultationNotes({ ...consultationNotes, diagnosis: e.target.value })}
                              rows={2}
                              className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white resize-none"
                            />
                            <textarea
                              placeholder="Treatment plan"
                              value={consultationNotes.treatmentPlan}
                              onChange={(e) => setConsultationNotes({ ...consultationNotes, treatmentPlan: e.target.value })}
                              rows={2}
                              className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white resize-none"
                            />
                            <input
                              type="date"
                              value={consultationNotes.followUpDate}
                              onChange={(e) => setConsultationNotes({ ...consultationNotes, followUpDate: e.target.value })}
                              className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white"
                            />
                          </div>

                          <button type="button" onClick={handleCompleteWithNotes} disabled={isSubmittingNotes}
                            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2">
                            <CheckCircle size={16} />
                            {isSubmittingNotes ? 'Saving…' : 'Complete & Save Notes'}
                          </button>
                          <button type="button" onClick={handleCompleteWithoutNotes} disabled={isActionLoading}
                            className="w-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-600 font-medium py-2.5 rounded-lg transition text-sm">
                            Complete without notes
                          </button>
                          <button type="button" onClick={handleNoShow} disabled={isActionLoading}
                            className="w-full bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 font-medium py-2 rounded-lg border border-red-200 transition text-sm flex items-center justify-center gap-1.5">
                            <UserX size={14} /> No-Show
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Empty state */
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users size={28} className="text-teal-400" />
                    </div>
                    <p className="text-gray-700 font-semibold mb-1">No active patient</p>
                    <p className="text-gray-400 text-sm mb-6">
                      {waitingList.length > 0
                        ? `${waitingList.length} patient${waitingList.length > 1 ? 's' : ''} waiting — call the next one to begin`
                        : 'All patients have been seen for today'}
                    </p>
                    {waitingList.length > 0 && (
                      <button type="button" onClick={handleCallNext} disabled={isActionLoading}
                        className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold px-8 py-3 rounded-lg transition inline-flex items-center gap-2">
                        <ChevronRight size={18} /> Call Next Patient
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Footer action when there's a current patient and waiting patients exist */}
              {currentPatient && waitingList.length > 0 && currentPatient.status !== 'CONSULTING' && (
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs text-gray-500">{waitingList.length} more waiting</p>
                  <button type="button" onClick={handleCallNext} disabled={isActionLoading}
                    className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1">
                    Call next <ChevronRight size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* ── Today's Full Queue Table ── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Calendar size={16} className="text-teal-600" /> Today's Queue
                </h3>
                <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                  {stats.total} total · {stats.waiting} waiting
                </span>
              </div>
              <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                {queue.length === 0 ? (
                  <p className="text-center text-gray-400 py-10 text-sm">No patients booked for today</p>
                ) : (
                  queue.map((item, idx) => {
                    const isCurrent = currentPatient?._id === item._id;
                    const estWait = waitingList.findIndex((w) => w._id === item._id);
                    const avgMin = user?.averageConsultationTime || 10;
                    const isFamily = item.appointmentId?.bookedFor?.isFamilyMember;
                    const displayName = isFamily && item.appointmentId.bookedFor.name
                      ? item.appointmentId.bookedFor.name
                      : item.patientId?.name || 'Patient';
                    const phone = item.patientId?.phone || item.appointmentId?.bookedFor?.phone || '';
                    const canRecall = item.status === 'SKIPPED' || item.status === 'NO_SHOW';

                    return (
                      <div key={item._id}
                        onClick={() => setCurrentPatient(item)}
                        role="button"
                        tabIndex={0}
                        className={`flex items-center justify-between px-5 py-3 transition cursor-pointer hover:bg-teal-50/50 ${
                          isCurrent                         ? 'bg-teal-50 border-l-4 border-teal-600 pl-4' :
                          item.status === 'COMPLETED'       ? 'opacity-60 bg-gray-50/30' :
                          item.status === 'SKIPPED' || item.status === 'NO_SHOW' ? 'opacity-70 bg-amber-50/20' : ''
                        }`}>
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Token bubble */}
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-xs ${
                            item.status === 'CONSULTING' ? 'bg-green-100 text-green-700' :
                            item.status === 'CALLED'     ? 'bg-yellow-100 text-yellow-700' :
                            item.status === 'COMPLETED'  ? 'bg-blue-100 text-blue-700' :
                            item.status === 'WAITING'    ? 'bg-teal-100 text-teal-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {item.tokenNumber}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                              {isFamily && (
                                <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.2 rounded border border-purple-200">
                                  {item.appointmentId.bookedFor.relationship || 'Family'}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                              {phone && <span>{phone}</span>}
                              {item.appointmentId?.appointmentType && (
                                <>
                                  <span>•</span>
                                  <span className="text-gray-500">{item.appointmentId.appointmentType}</span>
                                </>
                              )}
                              {estWait >= 0 && item.status === 'WAITING' && (
                                <span className="ml-1 text-teal-600 font-medium">
                                  ~{estWait === 0 ? 'next' : `${estWait * avgMin}m wait`}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_PILL[item.status] || 'bg-gray-100 text-gray-600'}`}>
                            {STATUS_LABEL[item.status] || item.status}
                          </span>
                          {canRecall && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRecall(item._id);
                              }}
                              disabled={isActionLoading}
                              className="text-xs bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 px-2 py-1 rounded-md flex items-center gap-1 transition"
                              title="Recall patient back to waiting queue"
                            >
                              <RotateCcw size={11} /> Recall
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <div className="space-y-5">

            {/* Call Next CTA */}
            {!currentPatient && waitingList.length > 0 && (
              <button type="button" onClick={handleCallNext} disabled={isActionLoading}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition flex items-center justify-center gap-2 shadow-sm">
                <ChevronRight size={20} /> Call Next Patient
              </button>
            )}

            {/* Next up */}
            {waitingList.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900 text-sm">Up Next</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {waitingList.slice(0, 5).map((item, idx) => {
                    const avgMin = user?.averageConsultationTime || 10;
                    const isFamily = item.appointmentId?.bookedFor?.isFamilyMember;
                    const displayName = isFamily && item.appointmentId.bookedFor.name
                      ? item.appointmentId.bookedFor.name
                      : item.patientId?.name || 'Patient';

                    return (
                      <div
                        key={item._id}
                        onClick={() => setCurrentPatient(item)}
                        role="button"
                        tabIndex={0}
                        className="px-4 py-3 flex items-center justify-between hover:bg-teal-50/50 cursor-pointer transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-xs font-bold text-teal-700 flex-shrink-0">
                            {item.tokenNumber}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                            <p className="text-xs text-gray-400">
                              {idx === 0 ? 'Next in line' : `~${idx * avgMin} min wait`}
                            </p>
                          </div>
                        </div>
                        {idx === 0 && (
                          <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">Next</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Summary stats */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="font-bold text-gray-900 text-sm mb-3">Today's Summary</h3>
              <div className="space-y-2.5">
                {[
                  { label: 'Total booked',  value: stats.total,     color: 'gray' },
                  { label: 'Waiting',       value: stats.waiting,   color: 'teal' },
                  { label: 'Completed',     value: stats.completed, color: 'green' },
                  { label: 'Skipped / NS',  value: stats.skipped,   color: 'orange' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{label}</span>
                    <span className={`text-sm font-bold text-${color}-600`}>{value}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="mt-1.5 bg-gray-100 rounded-full h-1.5">
                    <div className="bg-teal-500 h-1.5 rounded-full transition-all duration-700"
                      style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Avg consultation time */}
            {user?.averageConsultationTime > 0 && (
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Clock size={18} className="text-teal-600" />
                </div>
                <div>
                  <p className="text-xs text-teal-600 font-medium">Avg consultation</p>
                  <p className="text-xl font-bold text-teal-800">{user.averageConsultationTime} min</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
