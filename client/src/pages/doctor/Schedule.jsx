import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { doctorProfileAPI } from '../../services/api';
import { setUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import { Heart, LogOut, Save, Clock, Plus, X, Trash2, Copy, ArrowLeft } from 'lucide-react';
import { NotificationBell } from '../../components/NotificationBell';

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const DoctorSchedule = () => {
  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeDay, setActiveDay] = useState('monday');

  const [formData, setFormData] = useState({
    availability: user?.availability || {},
    consultationDuration: user?.consultationDuration || 30,
    breaks: user?.breaks || [],
  });

  useEffect(() => {
    if (!formData.availability || Object.keys(formData.availability).length === 0) {
      const defaultAvailability = {};
      DAYS_OF_WEEK.forEach((day) => {
        defaultAvailability[day] = { start: '09:00', end: '17:00' };
      });
      setFormData((prev) => ({
        ...prev,
        availability: defaultAvailability,
      }));
    }
  }, []);

  const handleAvailabilityChange = (day, field, value) => {
    setFormData((prev) => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...(prev.availability[day] || {}),
          [field]: value,
        },
      },
    }));
  };

  const handleCopySchedule = (fromDay, toDay) => {
    const sourceSchedule = formData.availability[fromDay];
    if (sourceSchedule?.start && sourceSchedule?.end) {
      handleAvailabilityChange(toDay, 'start', sourceSchedule.start);
      handleAvailabilityChange(toDay, 'end', sourceSchedule.end);
      toast.success(`Schedule copied from ${fromDay}`);
    }
  };

  const copyToAllDays = (day) => {
    const sourceSchedule = formData.availability[day];
    if (!sourceSchedule?.start || !sourceSchedule?.end) {
      toast.error('Please set start and end time first');
      return;
    }
    DAYS_OF_WEEK.forEach((d) => {
      if (d !== day) {
        handleAvailabilityChange(d, 'start', sourceSchedule.start);
        handleAvailabilityChange(d, 'end', sourceSchedule.end);
      }
    });
    toast.success('Schedule copied to all days');
  };

  const toggleDayOff = (day) => {
    if (formData.availability[day]?.start) {
      handleAvailabilityChange(day, 'start', '');
      handleAvailabilityChange(day, 'end', '');
    } else {
      handleAvailabilityChange(day, 'start', '09:00');
      handleAvailabilityChange(day, 'end', '17:00');
    }
  };

  const handleAddBreak = (day) => {
    const breakStart = prompt('Break start time (HH:MM):');
    if (!breakStart) return;
    const breakEnd = prompt('Break end time (HH:MM):');
    if (!breakEnd) return;
    const breakTitle = prompt('Break title (e.g., Lunch):');
    if (!breakTitle) return;

    setFormData((prev) => ({
      ...prev,
      breaks: [...prev.breaks, { id: Date.now(), day, start: breakStart, end: breakEnd, title: breakTitle }],
    }));
    toast.success('Break added');
  };

  const handleRemoveBreak = (id) => {
    setFormData((prev) => ({
      ...prev,
      breaks: prev.breaks.filter((b) => b.id !== id),
    }));
    toast.success('Break removed');
  };

  const getDayBreaks = (day) => {
    return formData.breaks.filter((b) => b.day === day);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await doctorProfileAPI.updateMe({
        availability: formData.availability,
        consultationDuration: formData.consultationDuration,
        breaks: formData.breaks,
      });
      dispatch(
        setUser({
          user: { ...response.data, role: user?.role || 'DOCTOR' },
          token,
        })
      );
      toast.success('Schedule saved successfully!');
      navigate('/doctor');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWorkingDaysCount = () => {
    return DAYS_OF_WEEK.filter((day) => formData.availability[day]?.start && formData.availability[day]?.end).length;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#1E3A5F] border-b border-[#2D4F7C] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/doctor')}
              className="sm:hidden text-teal-300 hover:text-white p-2"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="w-10 h-10 bg-[#0D9488] rounded-lg flex items-center justify-center">
              <Heart className="text-white" size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white leading-tight">Schedule</h1>
              <p className="text-xs text-teal-300 hidden sm:block">ClinicFlow</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/doctor')}
              className="text-slate-200 hover:text-teal-300 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition hidden sm:block"
            >
              Dashboard
            </button>
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <div className="w-8 h-8 bg-[#0D9488] rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-white">{user?.name}</span>
            </div>
            <NotificationBell />
            <button type="button" onClick={() => dispatch(logout())} className="text-slate-300 hover:text-red-400 p-2 rounded-lg hover:bg-white/10 transition">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Page Title */}
        <div className="mb-4 sm:mb-8 hidden sm:block">
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-1">
            <Clock className="text-teal-600" size={30} />
            Smart Scheduling
          </h2>
          <p className="text-gray-500">Set your availability and let patients book appointments automatically</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-4">
            <div className="bg-white rounded-lg border border-teal-200 p-3 sm:p-6">
              <p className="text-xs sm:text-sm text-gray-600 mb-2">Working Days</p>
              <p className="text-2xl sm:text-4xl font-bold text-teal-600">{getWorkingDaysCount()}</p>
              <p className="text-xs text-gray-500 mt-1 sm:mt-2 hidden sm:block">days per week</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-6">
              <p className="text-xs sm:text-sm text-gray-600 mb-2">Duration</p>
              <p className="text-2xl sm:text-4xl font-bold text-green-600">{formData.consultationDuration}</p>
              <p className="text-xs text-gray-500 mt-1 sm:mt-2 hidden sm:block">minutes</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-6">
              <p className="text-xs sm:text-sm text-gray-600 mb-2">Breaks</p>
              <p className="text-2xl sm:text-4xl font-bold text-orange-600">{formData.breaks.length}</p>
              <p className="text-xs text-gray-500 mt-1 sm:mt-2 hidden sm:block">scheduled</p>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Consultation Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Consultation Duration</label>
                <select
                  value={formData.consultationDuration}
                  onChange={(e) => setFormData((prev) => ({ ...prev, consultationDuration: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                >
                  <option value="10">10 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="20">20 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Weekly Schedule */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Weekly Schedule</h3>
              <p className="text-sm text-gray-600 mt-1">Set your working hours for each day</p>
            </div>

            {/* Day Tabs */}
            <div className="flex flex-wrap border-b border-gray-200 bg-gray-50">
              {DAY_LABELS.map((label, idx) => (
                <button
                  key={DAYS_OF_WEEK[idx]}
                  type="button"
                  onClick={() => setActiveDay(DAYS_OF_WEEK[idx])}
                  className={`flex-1 px-4 py-3 text-center font-medium transition ${
                    activeDay === DAYS_OF_WEEK[idx]
                      ? 'text-teal-600 border-b-2 border-teal-600 bg-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {label.slice(0, 3)}
                  <div className={`text-xs mt-1 ${
                    formData.availability[DAYS_OF_WEEK[idx]]?.start
                      ? 'text-green-600 font-semibold'
                      : 'text-red-600'
                  }`}>
                    {formData.availability[DAYS_OF_WEEK[idx]]?.start ? '✓ Open' : '✕ Off'}
                  </div>
                </button>
              ))}
            </div>

            {/* Day Details */}
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-gray-900">{DAY_LABELS[DAYS_OF_WEEK.indexOf(activeDay)]}</h4>
                    <button
                      type="button"
                      onClick={() => toggleDayOff(activeDay)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                        formData.availability[activeDay]?.start
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {formData.availability[activeDay]?.start ? 'Mark as Off' : 'Mark as Open'}
                    </button>
                  </div>

                  {formData.availability[activeDay]?.start ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time</label>
                          <input
                            type="time"
                            value={formData.availability[activeDay]?.start || '09:00'}
                            onChange={(e) => handleAvailabilityChange(activeDay, 'start', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-lg font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">End Time</label>
                          <input
                            type="time"
                            value={formData.availability[activeDay]?.end || '17:00'}
                            onChange={(e) => handleAvailabilityChange(activeDay, 'end', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-lg font-medium"
                          />
                        </div>
                      </div>

                      {/* Breaks for this day */}
                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-semibold text-gray-900">Breaks</h5>
                          <button
                            type="button"
                            onClick={() => handleAddBreak(activeDay)}
                            className="text-teal-600 hover:text-teal-700 text-sm font-medium flex items-center gap-1"
                          >
                            <Plus size={16} /> Add Break
                          </button>
                        </div>

                        {getDayBreaks(activeDay).length > 0 ? (
                          <div className="space-y-2">
                            {getDayBreaks(activeDay).map((brk) => (
                              <div key={brk.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div>
                                  <p className="font-medium text-gray-900">{brk.title}</p>
                                  <p className="text-sm text-gray-600">{brk.start} - {brk.end}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveBreak(brk.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <X size={18} />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic">No breaks added</p>
                        )}
                      </div>

                      {/* Copy Actions */}
                      <div className="border-t border-gray-200 pt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => copyToAllDays(activeDay)}
                          className="flex-1 px-3 py-2 bg-teal-50 text-teal-600 hover:bg-teal-100 rounded-lg font-medium text-sm transition flex items-center justify-center gap-2"
                        >
                          <Copy size={16} />
                          Copy to All Days
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Clock size={40} className="mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-600 font-medium">Day Off</p>
                      <p className="text-sm text-gray-500 mt-1">No appointments available on this day</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end sticky bottom-0 bg-white border-t border-gray-200 p-4 rounded-lg">
            <button
              type="button"
              onClick={() => navigate('/doctor')}
              className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 rounded-lg font-medium transition flex items-center gap-2"
            >
              <Save size={18} />
              {isSubmitting ? 'Saving...' : 'Save Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
