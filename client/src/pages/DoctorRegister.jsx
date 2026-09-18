import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { setUser } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import { Heart, Eye, EyeOff } from 'lucide-react';

const SPECIALIZATIONS = [
  'General Physician',
  'Cardiologist',
  'Dermatologist',
  'Ophthalmologist',
  'Dentist',
  'Pediatrician',
  'Orthopedic Surgeon',
  'Neurologist',
  'Psychiatrist',
  'ENT Specialist',
  'Gynecologist',
  'Urologist',
  'Oncologist',
  'Endocrinologist',
  'Pulmonologist',
];

export const DoctorRegister = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    specialization: '',
    experience: '',
    qualifications: '',
    consultationFee: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.specialization || !formData.experience || !formData.consultationFee) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await authAPI.registerDoctor(formData);
      dispatch(setUser({ user: response.data.user, token: response.data.token }));
      toast.success('Registration successful!');
      navigate('/doctor');
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
        {/* Left Panel */}
        <div className="hidden md:flex flex-col justify-center items-start p-12 bg-gradient-to-br from-slate-800 via-slate-700 to-blue-800 text-white">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mb-6">
            <Heart className="text-white" size={28} strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-bold mb-1">ClinicFlow</h1>
          <p className="text-blue-100 text-lg mb-12">for Doctors</p>
          <div className="space-y-6 text-sm text-blue-100">
            <p>Join our network of verified doctors and manage your clinic digitally.</p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-green-300 rounded-full"></span>Set your availability and consultation fee</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-green-300 rounded-full"></span>Manage patient queue in real time</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-green-300 rounded-full"></span>View and manage appointments</li>
            </ul>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex flex-col justify-center items-center p-6 md:p-12 bg-gray-50 overflow-y-auto">
          <div className="w-full max-w-sm">
            <div className="md:hidden flex items-center gap-2 mb-8">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Heart className="text-white" size={22} strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">ClinicFlow</h1>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-1">Doctor Registration</h2>
            <p className="text-gray-600 mb-8">Create your clinic profile</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Dr. John Smith"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="doctor@clinic.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 9876543210"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialization *</label>
                <select
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option value="">Select specialization</option>
                  {SPECIALIZATIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years) *</label>
                  <input
                    type="number"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    placeholder="5"
                    min="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee (₹) *</label>
                  <input
                    type="number"
                    name="consultationFee"
                    value={formData.consultationFee}
                    onChange={handleChange}
                    placeholder="500"
                    min="0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Qualifications <span className="text-gray-400 font-normal">(comma separated)</span></label>
                <input
                  type="text"
                  name="qualifications"
                  value={formData.qualifications}
                  onChange={handleChange}
                  placeholder="MBBS, MD, DNB"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 6 characters"
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2.5 rounded-lg font-bold transition-colors mt-2"
              >
                {loading ? 'Registering...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-gray-600 text-sm">
                Already have an account?{' '}
                <Link to="/login/doctor" className="text-blue-600 hover:text-blue-700 font-medium">
                  Login here
                </Link>
              </p>
              <p className="text-gray-500 text-xs">
                <Link to="/login/patient" className="text-blue-600 hover:text-blue-700 font-medium">
                  Are you a patient? →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
