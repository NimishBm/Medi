import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { doctorProfileAPI } from '../../services/api';
import { setUser } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import { Heart, LogOut, Plus, X, Edit2, MapPin, Clock, DollarSign, Globe, Briefcase, Award, Users, Star, CheckCircle, Camera, Upload } from 'lucide-react';
import { NotificationBell } from '../../components/NotificationBell';
import { useDoctorNotifications } from '../../hooks/useDoctorNotifications';

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const COMMON_QUALIFICATIONS = ['MBBS', 'MD', 'MS', 'DM', 'DNB', 'MCh', 'FRCS', 'MRCP', 'MBA'];

export const DoctorProfile = () => {
  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  useDoctorNotifications(user?._id);
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(() => {
    const photo = user?.profilePhoto;
    if (!photo) return null;
    // If it's already a full URL, return it as is
    if (photo.startsWith('http')) return photo;
    // If it's a relative path, construct the full URL
    const apiUrl = import.meta.env.VITE_API_URL;
    const baseUrl = (apiUrl && !apiUrl.includes('localhost')) ? apiUrl.replace('/api', '') : '';
    return `${baseUrl}${photo}`;
  });
  const [newQualification, setNewQualification] = useState('');
  const [newTreatment, setNewTreatment] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newSpecialization, setNewSpecialization] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const [newAchievement, setNewAchievement] = useState('');

  const [formData, setFormData] = useState({
    specialization: user?.specialization || '',
    consultationFee: user?.consultationFee || '',
    videoConsultationFee: user?.videoConsultationFee || '',
    roomNumber: user?.roomNumber || '',
    experience: user?.experience || '',
    phone: user?.phone || '',
    qualifications: user?.qualifications || [],
    boardCertifications: user?.boardCertifications || [],
    specializations: user?.specializations || [],
    isActive: user?.isActive !== false,
    availability: user?.availability || {},
    aboutMe: user?.aboutMe || '',
    treatments: user?.treatments || [],
    languages: user?.languages || [],
    achievements: user?.achievements || [],
    registrationNumber: user?.registrationNumber || '',
    hospital: user?.hospital || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    zipCode: user?.zipCode || '',
    insurance: user?.insurance || '',
    website: user?.website || '',
    consultationDuration: user?.consultationDuration || 30,
    onlineConsultation: user?.onlineConsultation !== false,
    emergencyConsultation: user?.emergencyConsultation || false,
    waitingTime: user?.waitingTime || 30,
    patientsSeen: user?.patientsSeen || 0,
    successRate: user?.successRate || 0,
    rating: user?.rating || 0,
  });

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

  const addToArray = (fieldName, value, setterFn) => {
    if (value.trim() && !formData[fieldName].includes(value.trim())) {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: [...prev[fieldName], value.trim()],
      }));
      setterFn('');
    }
  };

  const removeFromArray = (fieldName, index) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: prev[fieldName].filter((_, i) => i !== index),
    }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploadingPhoto(true);

    try {
      const response = await doctorProfileAPI.uploadPhoto(file);
      setProfilePhoto(response.data.profilePhoto);
      dispatch(
        setUser({
          user: response.data.user,
          token,
        })
      );
      toast.success('Photo uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
    }
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
      setIsEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#1E3A5F] border-b border-[#2D4F7C] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0D9488] rounded-lg flex items-center justify-center">
              <Heart className="text-white" size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white leading-tight">ClinicFlow</h1>
              <p className="text-xs text-teal-300 hidden sm:block">My Profile</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/doctor')}
              className="text-slate-200 hover:text-teal-300 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition hidden sm:block"
            >
              Dashboard
            </button>
            <div className="hidden sm:block h-6 border-l border-white/20"></div>
            <div className="hidden sm:flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
              <span className="text-sm font-medium text-white">{user?.name?.split(' ')[0]}</span>
            </div>
            <NotificationBell />
            <button
              onClick={() => dispatch(logout())}
              className="text-slate-300 hover:text-red-400 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-white/10 transition"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Profile Header Card */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-8">
          <div className="h-40 bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-400"></div>

          <div className="px-8 pb-8">
            <div className="flex flex-col md:flex-row md:items-start gap-8 -mt-20 relative z-10 mb-8">
              <div className="flex-shrink-0 relative group">
                <div className="w-40 h-40 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl border-4 border-white flex items-center justify-center text-white text-6xl font-bold shadow-lg overflow-hidden">
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt={user?.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : null}
                  {!profilePhoto && (
                    <span>{user?.name?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                {isEditing && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="absolute bottom-0 right-0 p-2 bg-teal-600 hover:bg-teal-700 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
                    title="Upload photo"
                  >
                    {isUploadingPhoto ? (
                      <div className="w-6 h-6 animate-spin border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <Camera size={20} />
                    )}
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={isUploadingPhoto}
                  className="hidden"
                />
              </div>

              <div className="flex-1 pt-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900">{user?.name}</h1>
                    <p className="text-lg text-gray-600 mt-1">{formData.specialization || 'Medical Professional'}</p>

                    <div className="flex gap-2 mt-4 flex-wrap">
                      <span className="px-4 py-2 bg-teal-100 text-teal-800 rounded-full text-sm font-semibold">
                        {formData.specialization || 'Specialist'}
                      </span>
                      {formData.isActive && (
                        <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold flex items-center gap-2">
                          <CheckCircle size={16} /> Verified
                        </span>
                      )}
                      {formData.rating > 0 && (
                        <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold flex items-center gap-2">
                          <Star size={16} /> {formData.rating}/5
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-semibold"
                  >
                    <Edit2 size={20} />
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                  </button>
                </div>

                {!isEditing && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                    {formData.experience && (
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <Clock size={18} className="text-teal-600" />
                        <div>
                          <p className="text-xs text-gray-600">Experience</p>
                          <p className="font-bold text-gray-900">{formData.experience} yrs</p>
                        </div>
                      </div>
                    )}
                    {formData.consultationFee && (
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <DollarSign size={18} className="text-green-600" />
                        <div>
                          <p className="text-xs text-gray-600">Fee</p>
                          <p className="font-bold text-gray-900">₹{formData.consultationFee}</p>
                        </div>
                      </div>
                    )}
                    {formData.patientsSeen > 0 && (
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <Users size={18} className="text-emerald-600" />
                        <div>
                          <p className="text-xs text-gray-600">Patients</p>
                          <p className="font-bold text-gray-900">{formData.patientsSeen}+</p>
                        </div>
                      </div>
                    )}
                    {formData.successRate > 0 && (
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <Award size={18} className="text-orange-600" />
                        <div>
                          <p className="text-xs text-gray-600">Success</p>
                          <p className="font-bold text-gray-900">{formData.successRate}%</p>
                        </div>
                      </div>
                    )}
                    {formData.waitingTime && (
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <Briefcase size={18} className="text-red-600" />
                        <div>
                          <p className="text-xs text-gray-600">Wait</p>
                          <p className="font-bold text-gray-900">{formData.waitingTime} min</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form or View */}
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Specialization</label>
                  <input type="text" name="specialization" value={formData.specialization} onChange={handleChange} placeholder="e.g. Cardiology" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Registration Number</label>
                  <input type="text" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} placeholder="e.g. MCI12345" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Years of Experience</label>
                  <input type="number" name="experience" value={formData.experience} onChange={handleChange} min="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Room Number</label>
                  <input type="text" name="roomNumber" value={formData.roomNumber} onChange={handleChange} placeholder="e.g. 101" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 98765 43210" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Website</label>
                  <input type="url" name="website" value={formData.website} onChange={handleChange} placeholder="https://example.com" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">📍 Location Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Hospital/Clinic Name</label>
                  <input type="text" name="hospital" value={formData.hospital} onChange={handleChange} placeholder="e.g. Apollo Hospital" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="e.g. Mumbai" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                  <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="e.g. Maharashtra" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Zip Code</label>
                  <input type="text" name="zipCode" value={formData.zipCode} onChange={handleChange} placeholder="e.g. 400001" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                  <textarea name="address" value={formData.address} onChange={handleChange} placeholder="Full address" rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"></textarea>
                </div>
              </div>
            </div>

            {/* Consultation Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">💰 Consultation Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">In-Person Consultation Fee (₹)</label>
                  <input type="number" name="consultationFee" value={formData.consultationFee} onChange={handleChange} min="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Video Consultation Fee (₹)</label>
                  <input type="number" name="videoConsultationFee" value={formData.videoConsultationFee} onChange={handleChange} min="0" placeholder="If different from in-person" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Consultation Duration (minutes)</label>
                  <input type="number" name="consultationDuration" value={formData.consultationDuration} onChange={handleChange} min="5" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Average Waiting Time (minutes)</label>
                  <input type="number" name="waitingTime" value={formData.waitingTime} onChange={handleChange} min="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Patients Seen (approx)</label>
                  <input type="number" name="patientsSeen" value={formData.patientsSeen} onChange={handleChange} min="0" placeholder="e.g. 5000" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Success Rate (%)</label>
                  <input type="number" name="successRate" value={formData.successRate} onChange={handleChange} min="0" max="100" placeholder="e.g. 95" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-teal-50">
                  <input type="checkbox" name="onlineConsultation" checked={formData.onlineConsultation} onChange={handleChange} className="w-4 h-4 accent-teal-600" />
                  <span className="font-medium text-gray-700">Online Consultation</span>
                </label>
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-teal-50">
                  <input type="checkbox" name="emergencyConsultation" checked={formData.emergencyConsultation} onChange={handleChange} className="w-4 h-4 accent-teal-600" />
                  <span className="font-medium text-gray-700">Emergency Available</span>
                </label>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Insurance Accepted</label>
                  <input type="text" name="insurance" value={formData.insurance} onChange={handleChange} placeholder="e.g. ICICI, HDFC" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
              </div>
            </div>

            {/* About Me */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">About Me</h3>
              <textarea name="aboutMe" value={formData.aboutMe} onChange={handleChange} placeholder="Write a brief professional introduction about yourself..." rows="5" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>

            {/* Qualifications */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">🎓 Qualifications</h3>
              <div className="mb-4 flex gap-2">
                <input type="text" value={newQualification} onChange={(e) => setNewQualification(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addToArray('qualifications', newQualification, setNewQualification)} placeholder="e.g. MBBS, MD" list="qualifications-list" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                <datalist id="qualifications-list">
                  {COMMON_QUALIFICATIONS.map((qual) => (<option key={qual} value={qual} />))}
                </datalist>
                <button type="button" onClick={() => addToArray('qualifications', newQualification, setNewQualification)} className="bg-teal-600 text-white hover:bg-teal-700 px-4 py-2 rounded-lg font-medium transition flex items-center gap-2">
                  <Plus size={18} /> Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.qualifications.map((qual, idx) => (
                  <div key={idx} className="bg-teal-100 text-teal-800 px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium">
                    {qual}
                    <button type="button" onClick={() => removeFromArray('qualifications', idx)} className="hover:text-teal-600">
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Board Certifications */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">🏆 Board Certifications</h3>
              <div className="mb-4 flex gap-2">
                <input type="text" value={newCertification} onChange={(e) => setNewCertification(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addToArray('boardCertifications', newCertification, setNewCertification)} placeholder="e.g. FRCS, MRCP" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                <button type="button" onClick={() => addToArray('boardCertifications', newCertification, setNewCertification)} className="bg-teal-600 text-white hover:bg-teal-700 px-4 py-2 rounded-lg font-medium transition flex items-center gap-2">
                  <Plus size={18} /> Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.boardCertifications.map((cert, idx) => (
                  <div key={idx} className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium">
                    {cert}
                    <button type="button" onClick={() => removeFromArray('boardCertifications', idx)} className="hover:text-amber-600">
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Specializations */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">🔬 Specializations</h3>
              <div className="mb-4 flex gap-2">
                <input type="text" value={newSpecialization} onChange={(e) => setNewSpecialization(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addToArray('specializations', newSpecialization, setNewSpecialization)} placeholder="e.g. Cardiology, Interventional" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                <button type="button" onClick={() => addToArray('specializations', newSpecialization, setNewSpecialization)} className="bg-teal-600 text-white hover:bg-teal-700 px-4 py-2 rounded-lg font-medium transition flex items-center gap-2">
                  <Plus size={18} /> Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.specializations.map((spec, idx) => (
                  <div key={idx} className="bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium">
                    {spec}
                    <button type="button" onClick={() => removeFromArray('specializations', idx)} className="hover:text-emerald-600">
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">🗣️ Languages</h3>
              <div className="mb-4 flex gap-2">
                <input type="text" value={newLanguage} onChange={(e) => setNewLanguage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addToArray('languages', newLanguage, setNewLanguage)} placeholder="e.g. English, Hindi" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                <button type="button" onClick={() => addToArray('languages', newLanguage, setNewLanguage)} className="bg-teal-600 text-white hover:bg-teal-700 px-4 py-2 rounded-lg font-medium transition flex items-center gap-2">
                  <Plus size={18} /> Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.languages.map((lang, idx) => (
                  <div key={idx} className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium">
                    {lang}
                    <button type="button" onClick={() => removeFromArray('languages', idx)} className="hover:text-purple-600">
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Treatments */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">🏥 Treatments & Procedures</h3>
              <div className="mb-4 flex gap-2">
                <input type="text" value={newTreatment} onChange={(e) => setNewTreatment(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addToArray('treatments', newTreatment, setNewTreatment)} placeholder="e.g. Surgery, Consultation" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                <button type="button" onClick={() => addToArray('treatments', newTreatment, setNewTreatment)} className="bg-teal-600 text-white hover:bg-teal-700 px-4 py-2 rounded-lg font-medium transition flex items-center gap-2">
                  <Plus size={18} /> Add
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {formData.treatments.map((treatment, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <span className="text-sm text-gray-800">✓ {treatment}</span>
                    <button type="button" onClick={() => removeFromArray('treatments', idx)} className="text-red-600 hover:text-red-800">
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">⭐ Awards & Achievements</h3>
              <div className="mb-4 flex gap-2">
                <input type="text" value={newAchievement} onChange={(e) => setNewAchievement(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addToArray('achievements', newAchievement, setNewAchievement)} placeholder="e.g. Best Doctor Award" className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                <button type="button" onClick={() => addToArray('achievements', newAchievement, setNewAchievement)} className="bg-teal-600 text-white hover:bg-teal-700 px-4 py-2 rounded-lg font-medium transition flex items-center gap-2">
                  <Plus size={18} /> Add
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {formData.achievements.map((achievement, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <span className="text-sm text-gray-800">🏅 {achievement}</span>
                    <button type="button" onClick={() => removeFromArray('achievements', idx)} className="text-red-600 hover:text-red-800">
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end sticky bottom-0 bg-white border-t border-gray-200 p-4 rounded-lg">
              <button type="submit" disabled={isSubmitting} className="bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 px-8 py-3 rounded-lg font-semibold transition">
                {isSubmitting ? 'Saving...' : '💾 Save Changes'}
              </button>
              <button type="button" onClick={() => setIsEditing(false)} className="bg-gray-400 text-white hover:bg-gray-500 px-8 py-3 rounded-lg font-semibold transition">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-8">
            {/* About */}
            {formData.aboutMe && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">About</h3>
                <p className="text-gray-700 leading-relaxed text-base">{formData.aboutMe}</p>
              </div>
            )}

            {/* Location Info */}
            {(formData.hospital || formData.address || formData.city) && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin size={22} className="text-teal-600" />
                  Location
                </h3>
                <div className="space-y-2 text-gray-700">
                  {formData.hospital && <p className="font-semibold text-lg">{formData.hospital}</p>}
                  {formData.address && <p>{formData.address}</p>}
                  <p>{formData.city}{formData.state && `, ${formData.state}`} {formData.zipCode && formData.zipCode}</p>
                </div>
              </div>
            )}

            {/* Qualifications */}
            {formData.qualifications.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Award size={22} className="text-teal-600" />
                  Education & Qualifications
                </h3>
                <div className="flex flex-wrap gap-3">
                  {formData.qualifications.map((qual, idx) => (
                    <div key={idx} className="bg-teal-50 border border-teal-200 text-teal-800 px-4 py-2 rounded-lg font-medium text-sm">
                      {qual}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Board Certifications */}
            {formData.boardCertifications.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle size={22} className="text-amber-600" />
                  Board Certifications
                </h3>
                <div className="flex flex-wrap gap-3">
                  {formData.boardCertifications.map((cert, idx) => (
                    <div key={idx} className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg font-medium text-sm">
                      {cert}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Specializations */}
            {formData.specializations.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase size={22} className="text-emerald-600" />
                  Specializations
                </h3>
                <div className="flex flex-wrap gap-3">
                  {formData.specializations.map((spec, idx) => (
                    <div key={idx} className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-lg font-medium text-sm">
                      {spec}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {formData.languages.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Globe size={22} className="text-purple-600" />
                  Languages
                </h3>
                <div className="flex flex-wrap gap-3">
                  {formData.languages.map((lang, idx) => (
                    <div key={idx} className="bg-purple-50 border border-purple-200 text-purple-800 px-4 py-2 rounded-lg font-medium text-sm">
                      {lang}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Treatments */}
            {formData.treatments.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase size={22} className="text-orange-600" />
                  Treatments & Procedures
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.treatments.map((treatment, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                      <span className="text-gray-800">{treatment}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Achievements */}
            {formData.achievements.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Star size={22} className="text-yellow-600" />
                  Awards & Achievements
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.achievements.map((achievement, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <span className="text-2xl">🏅</span>
                      <span className="text-gray-800 font-medium">{achievement}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Consultation Info */}
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg border border-teal-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign size={22} className="text-teal-600" />
                Consultation Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.consultationFee && (
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600">In-Person Fee</p>
                    <p className="text-xl font-bold text-gray-900">₹{formData.consultationFee}</p>
                  </div>
                )}
                {formData.videoConsultationFee && (
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Video Consultation</p>
                    <p className="text-xl font-bold text-gray-900">₹{formData.videoConsultationFee}</p>
                  </div>
                )}
                {formData.consultationDuration && (
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="text-xl font-bold text-gray-900">{formData.consultationDuration} min</p>
                  </div>
                )}
                {formData.waitingTime && (
                  <div className="bg-white p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Wait Time</p>
                    <p className="text-xl font-bold text-gray-900">{formData.waitingTime} min</p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-teal-200">
                {formData.onlineConsultation && (
                  <div className="flex items-center gap-2 text-green-700 bg-white p-2 rounded">
                    <CheckCircle size={18} /> Online
                  </div>
                )}
                {formData.emergencyConsultation && (
                  <div className="flex items-center gap-2 text-red-700 bg-white p-2 rounded">
                    <Clock size={18} /> Emergency
                  </div>
                )}
                {formData.insurance && (
                  <div className="text-sm bg-white p-2 rounded">
                    <span className="font-semibold">Insurance:</span> {formData.insurance}
                  </div>
                )}
              </div>
            </div>

            {/* Edit Button at Bottom */}
            <div className="flex justify-center pt-8">
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-8 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-semibold"
              >
                <Edit2 size={20} />
                Edit Profile
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
