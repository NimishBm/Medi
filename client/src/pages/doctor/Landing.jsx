import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Navigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import {
  Briefcase,
  Heart,
  TrendingUp,
  Users,
  Calendar,
  Clock,
  Shield,
  CheckCircle,
  BarChart3,
  Smartphone,
  Award,
  MapPin,
} from 'lucide-react';

const FEATURES = [
  { id: 'patients', name: 'Manage Patients', icon: Users, color: 'from-blue-400 to-blue-600' },
  { id: 'schedule', name: 'Smart Scheduling', icon: Calendar, color: 'from-purple-400 to-purple-600' },
  { id: 'analytics', name: 'Analytics', icon: BarChart3, color: 'from-green-400 to-green-600' },
  { id: 'queue', name: 'Queue Management', icon: Clock, color: 'from-orange-400 to-orange-600' },
  { id: 'profiles', name: 'Patient Profiles', icon: Briefcase, color: 'from-pink-400 to-pink-600' },
  { id: 'earnings', name: 'Earnings', icon: TrendingUp, color: 'from-red-400 to-red-600' },
];

export const DoctorLanding = () => {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState('Current Location');

  const handleGetStarted = () => {
    navigate('/doctor');
  };

  // If logged in as PATIENT or RECEPTIONIST, redirect them
  if (user && user.role !== 'DOCTOR') {
    return <Navigate to={user.role === 'PATIENT' ? '/patient' : '/receptionist'} replace />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Heart className="text-white" size={24} strokeWidth={2.5} />
            </div>
            <h1 className="text-xl font-bold text-gray-900">ClinicFlow</h1>
          </div>

          {user ? (
            <>
              <div className="hidden md:flex items-center gap-2">
                <MapPin size={16} className="text-gray-500" />
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
                >
                  <option value="Current Location">Current Location</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Bangalore">Bangalore</option>
                  <option value="Pune">Pune</option>
                  <option value="Hyderabad">Hyderabad</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/doctor/appointments')}
                  className="text-gray-700 hover:text-blue-600 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-blue-50 transition hidden sm:block"
                >
                  My Appointments
                </button>
                <div className="hidden sm:block h-6 border-l border-gray-300"></div>
                <div className="hidden sm:flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
                  <span className="text-sm font-medium text-gray-700">{user?.name?.split(' ')[0]}</span>
                </div>
                <button
                  onClick={() => dispatch(logout())}
                  className="text-gray-700 hover:text-red-600 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/login/patient')}
                className="text-gray-700 hover:text-blue-600 font-medium text-sm px-4 py-2 rounded-lg hover:bg-blue-50 transition"
              >
                Login as Patient
              </button>
              <button
                onClick={() => navigate('/login/doctor')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition"
              >
                Login as Doctor
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl">
            {/* Eyebrow */}
            <p className="text-sm uppercase tracking-widest font-semibold text-blue-100 mb-4">
              Manage • Grow • Excel
            </p>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4">
              Streamline Your Practice,<br />Focus on Care.
            </h1>

            {/* Subtext */}
            <p className="text-lg text-blue-100 mb-8">
              Efficient appointment management, real-time queue tracking, and comprehensive analytics for modern doctors.
            </p>

            {/* CTA Button */}
            <button
              onClick={handleGetStarted}
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3.5 rounded-full font-bold text-base transition-colors inline-block"
            >
              {user ? 'Go to Dashboard' : 'Login as Doctor'}
            </button>

            {/* Trust Pills */}
            <div className="flex flex-wrap gap-3 mt-8">
              <div className="flex items-center gap-2 bg-white bg-opacity-20 px-4 py-2 rounded-full text-sm font-medium">
                <Shield size={16} />
                <span>Secure Platform</span>
              </div>
              <div className="flex items-center gap-2 bg-white bg-opacity-20 px-4 py-2 rounded-full text-sm font-medium">
                <Clock size={16} />
                <span>Real-time Updates</span>
              </div>
              <div className="flex items-center gap-2 bg-white bg-opacity-20 px-4 py-2 rounded-full text-sm font-medium">
                <BarChart3 size={16} />
                <span>Live Analytics</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Browse Features */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-20">
        <h2 className="text-3xl font-bold text-gray-900 mb-10">Powerful Features</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {FEATURES.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={feature.id}
                className="group bg-white border border-gray-200 hover:border-blue-400 rounded-xl p-4 text-center transition-all duration-300 hover:shadow-md"
              >
                <div className={`w-12 h-12 mx-auto mb-3 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center`}>
                  <IconComponent size={24} className="text-white" strokeWidth={2} />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{feature.name}</h3>
                <p className="text-xs text-gray-500">Explore</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase size={28} strokeWidth={2} />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Set Your Schedule</h3>
              <p className="text-gray-600 text-sm">Create and manage your availability. Patients can book slots that work for you.</p>
            </div>

            {/* Arrow (hidden on mobile) */}
            <div className="hidden md:flex items-center justify-center">
              <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={28} strokeWidth={2} />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Manage Patients</h3>
              <p className="text-gray-600 text-sm">Track patient details, medical history, and consultation notes all in one place.</p>
            </div>

            {/* Arrow (hidden on mobile) */}
            <div className="hidden md:flex items-center justify-center">
              <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 size={28} strokeWidth={2} />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Track Analytics</h3>
              <p className="text-gray-600 text-sm">Monitor your earnings, patient satisfaction, and consultation metrics in real-time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-blue-50 border-y border-blue-100 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl md:text-4xl font-bold text-blue-600">2000+</p>
              <p className="text-sm text-gray-600 mt-2">Active Doctors</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-blue-600">50,000+</p>
              <p className="text-sm text-gray-600 mt-2">Appointments</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-blue-600">4.9</p>
              <p className="text-sm text-gray-600 mt-2">Doctor Rating</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-blue-600">99%</p>
              <p className="text-sm text-gray-600 mt-2">Uptime</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why ClinicFlow */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-20">
        <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Why Choose ClinicFlow?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Award size={24} className="text-blue-600" strokeWidth={2} />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-2">Professional Management</h3>
            <p className="text-gray-600 text-sm">Complete practice management tools designed by healthcare professionals for healthcare professionals.</p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp size={24} className="text-blue-600" strokeWidth={2} />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-2">Grow Your Practice</h3>
            <p className="text-gray-600 text-sm">Reach more patients, reduce no-shows, and increase your revenue with our powerful platform.</p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Smartphone size={24} className="text-blue-600" strokeWidth={2} />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-2">Always in Control</h3>
            <p className="text-gray-600 text-sm">Manage your practice from anywhere. Access real-time updates on desktop, tablet, or mobile.</p>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-gradient-to-r from-blue-700 to-blue-600 text-white py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to transform your practice?</h2>
          <p className="text-blue-100 text-lg mb-8">Join thousands of doctors already using ClinicFlow.</p>
          <button
            onClick={handleGetStarted}
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3.5 rounded-full font-bold text-base transition-colors"
          >
            {user ? 'Go to Dashboard' : 'Get Started Today'}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-600 text-sm">© 2026 ClinicFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
