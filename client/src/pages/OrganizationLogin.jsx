import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { organizationAPI } from '../services/api';
import { setUser } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import { Building2, CheckCircle } from 'lucide-react';

export const OrganizationLogin = () => {
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
      const response = await organizationAPI.login({ email, password });
      const { user, token } = response.data;
      dispatch(setUser({ user, token }));
      toast.success('Login successful!');
      navigate('/org');
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
        {/* Left Panel */}
        <div className="hidden md:flex flex-col justify-center items-start p-12 bg-gradient-to-br from-violet-800 via-violet-700 to-indigo-700 text-white">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mb-6">
            <Building2 className="text-white" size={28} strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-bold mb-1">ClinicFlow</h1>
          <p className="text-violet-100 text-lg mb-12">Organization Portal</p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-green-300 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-base">Manage All Doctors</p>
                <p className="text-violet-100 text-sm">Add or remove doctors under your organization</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-green-300 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-base">Unified Dashboard</p>
                <p className="text-violet-100 text-sm">See today's appointments across all your doctors</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-green-300 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-base">Organization Tag</p>
                <p className="text-violet-100 text-sm">Your doctors display your organization name to patients</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex flex-col justify-center items-center p-6 md:p-12 bg-gray-50">
          <div className="w-full max-w-sm">
            <div className="md:hidden flex items-center gap-2 mb-8">
              <div className="w-10 h-10 bg-violet-600 rounded-lg flex items-center justify-center">
                <Building2 className="text-white" size={22} strokeWidth={2.5} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">ClinicFlow</h1>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">Organization Login</h2>
            <p className="text-gray-600 mb-8">Manage your clinic network</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="org@hospital.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-violet-600 hover:bg-violet-700 disabled:bg-gray-400 text-white py-2.5 rounded-lg font-bold transition-colors mt-6"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <div className="mt-6 space-y-2 text-center">
              <p className="text-gray-600 text-sm">
                New organization?{' '}
                <Link to="/register/organization" className="text-violet-600 hover:text-violet-700 font-medium">
                  Register here
                </Link>
              </p>
              <p className="text-gray-500 text-xs">
                <Link to="/login/patient" className="text-blue-600 hover:text-blue-700 font-medium">
                  Patient Login →
                </Link>
              </p>
              <p className="text-gray-500 text-xs">
                <Link to="/login/doctor" className="text-blue-600 hover:text-blue-700 font-medium">
                  Doctor Login →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
