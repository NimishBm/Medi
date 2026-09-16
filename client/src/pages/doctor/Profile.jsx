import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Sidebar } from '../../components/Sidebar';
import { Navbar } from '../../components/Navbar';
import { doctorProfileAPI } from '../../services/api';
import { setUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

const doctorNav = [
  { path: '/doctor', label: 'Dashboard', icon: '📊' },
  { path: '/doctor/profile', label: 'My Profile', icon: '👤' },
  { path: '/doctor/queue', label: 'Live Queue', icon: '⏱️' },
  { path: '/doctor/appointments', label: 'Appointments', icon: '📋' },
];

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const COMMON_QUALIFICATIONS = ['MBBS', 'MD', 'MS', 'DM', 'DNB', 'MCh', 'FRCS', 'MRCP', 'MBA'];

export const DoctorProfile = () => {
  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newQualification, setNewQualification] = useState('');

  const [formData, setFormData] = useState({
    specialization: user?.specialization || '',
    consultationFee: user?.consultationFee || '',
    roomNumber: user?.roomNumber || '',
    experience: user?.experience || '',
    phone: user?.phone || '',
    qualifications: user?.qualifications || [],
    isActive: user?.isActive !== false,
    availability: user?.availability || {},
  });

  // Initialize availability with default empty slots for all days
  useEffect(() => {
    if (!formData.availability || Object.keys(formData.availability).length === 0) {
      const defaultAvailability = {};
      DAYS_OF_WEEK.forEach((day) => {
        defaultAvailability[day] = { start: '', end: '' };
      });
      setFormData((prev) => ({
        ...prev,
        availability: defaultAvailability,
      }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

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

  const handleAddQualification = () => {
    if (newQualification.trim() && !formData.qualifications.includes(newQualification.trim())) {
      setFormData((prev) => ({
        ...prev,
        qualifications: [...prev.qualifications, newQualification.trim()],
      }));
      setNewQualification('');
    }
  };

  const handleRemoveQualification = (index) => {
    setFormData((prev) => ({
      ...prev,
      qualifications: prev.qualifications.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await doctorProfileAPI.updateMe(formData);
      dispatch(
        setUser({
          user: response.data,
          token,
        })
      );
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <Sidebar navItems={doctorNav} />
      <div className="flex-1 flex flex-col">
        <Navbar title="My Profile" />
        <div className="p-8 max-w-4xl mx-auto w-full">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                  <input
                    type="text"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    placeholder="e.g. Cardiology, Dermatology"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    name="consultationFee"
                    value={formData.consultationFee}
                    onChange={handleChange}
                    placeholder="500"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Room Number</label>
                  <input
                    type="text"
                    name="roomNumber"
                    value={formData.roomNumber}
                    onChange={handleChange}
                    placeholder="e.g. 101, A-2"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience (Years)</label>
                  <input
                    type="number"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    placeholder="10"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                      className="mr-2 w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Qualifications */}
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Qualifications</h3>
              <div className="mb-4 flex gap-2">
                <input
                  type="text"
                  value={newQualification}
                  onChange={(e) => setNewQualification(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddQualification()}
                  placeholder="Enter qualification"
                  list="qualifications-list"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <datalist id="qualifications-list">
                  {COMMON_QUALIFICATIONS.map((qual) => (
                    <option key={qual} value={qual} />
                  ))}
                </datalist>
                <button
                  type="button"
                  onClick={handleAddQualification}
                  className="btn-primary"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.qualifications.map((qual, idx) => (
                  <div key={idx} className="badge badge-info flex items-center gap-2">
                    {qual}
                    <button
                      type="button"
                      onClick={() => handleRemoveQualification(idx)}
                      className="text-xs ml-1 hover:text-red-600 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Working Hours</h3>
              <div className="space-y-4">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day} className="flex items-center gap-4 pb-4 border-b border-gray-200">
                    <label className="w-20 font-medium text-gray-700 capitalize">{day}</label>
                    <div className="flex-1 flex gap-2 items-center">
                      <input
                        type="time"
                        value={formData.availability?.[day]?.start || ''}
                        onChange={(e) => handleAvailabilityChange(day, 'start', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="time"
                        value={formData.availability?.[day]?.end || ''}
                        onChange={(e) => handleAvailabilityChange(day, 'end', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      <button
                        type="button"
                        onClick={() => handleAvailabilityChange(day, 'start', '')}
                        className="text-xs text-red-600 hover:text-red-800 font-medium ml-4"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary text-lg"
              >
                {isSubmitting ? 'Saving...' : 'Save Profile'}
              </button>
              <a href="/doctor" className="btn-secondary text-lg">
                Cancel
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
