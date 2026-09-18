import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { setUser } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import { Heart, CheckCircle } from 'lucide-react';

export const PatientLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const response = await authAPI.login({ email, password });
      const { user, token } = response.data;

      if (user.role !== 'PATIENT') {
        toast.error('Access denied. Patient credentials required.');
        return;
      }

      dispatch(setUser({ user, token }));
      toast.success('Login successful!');
      navigate('/patient');
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="grid grid-cols-1 md:grid-cols-2 h-screen">
        {/* Left Panel - Branding */}
        <div className="hidden md:flex flex-col justify-center items-start p-12 bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 text-white">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mb-6">
            <Heart className="text-white" size={28} strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-bold mb-2">ClinicFlow</h1>
          <p className="text-blue-100 text-lg mb-12">Your Health, Simplified</p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-green-300 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-base">Book Appointments</p>
                <p className="text-blue-100 text-sm">Find and book with verified doctors instantly</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-green-300 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-base">Track Queue Live</p>
                <p className="text-blue-100 text-sm">Know your wait time before you leave home</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-green-300 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-base">Manage Family Health</p>
                <p className="text-blue-100 text-sm">Book appointments for family members too</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="flex flex-col justify-center items-center p-6 md:p-12 bg-gray-50">
          <div className="w-full max-w-sm">
            {/* Mobile Logo */}
            <div className="md:hidden flex items-center gap-2 mb-8">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Heart className="text-white" size={22} strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">ClinicFlow</h1>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
            <p className="text-gray-600 mb-8">Patient Login</p>

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2.5 rounded-lg font-bold transition-colors mt-6"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            {/* Links */}
            <div className="mt-6 space-y-3 text-center">
              <p className="text-gray-600 text-sm">
                Don't have an account?{' '}
                <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                  Register here
                </Link>
              </p>
              <p className="text-gray-500 text-xs">
                <Link to="/login/doctor" className="text-blue-600 hover:text-blue-700 font-medium">
                  Are you a doctor? Login here →
                </Link>
              </p>
              <p className="text-gray-500 text-xs">
                <Link to="/login/receptionist" className="text-emerald-600 hover:text-emerald-700 font-medium">
                  Are you a receptionist? Login here →
                </Link>
              </p>
              <p className="text-gray-500 text-xs">
                <Link to="/login/organization" className="text-violet-600 hover:text-violet-700 font-medium">
                  Organization Login →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
