import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import {
  Search,
  Heart,
  Eye,
  Smile,
  Activity,
  Thermometer,
  Layers,
  MapPin,
  ShieldCheck,
  Smartphone,
  CheckCircle,
  CalendarCheck,
  Clock,
  Shield,
  Calendar,
} from 'lucide-react';

const SPECIALTIES = [
  { id: 'general', name: 'General Physician', icon: Activity, color: 'from-blue-400 to-blue-600' },
  { id: 'cardio', name: 'Cardiology', icon: Heart, color: 'from-red-400 to-red-600' },
  { id: 'derma', name: 'Dermatology', icon: Layers, color: 'from-purple-400 to-purple-600' },
  { id: 'eye', name: 'Ophthalmology', icon: Eye, color: 'from-green-400 to-green-600' },
  { id: 'dental', name: 'Dental', icon: Smile, color: 'from-yellow-400 to-yellow-600' },
  { id: 'pediatrics', name: 'Pediatrics', icon: Thermometer, color: 'from-pink-400 to-pink-600' },
];

const LOCATIONS = ['Current Location', 'Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad'];

export const Landing = () => {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState('Current Location');
  const [searchInput, setSearchInput] = useState('');

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchInput.trim()) {
      const targetRoute = user ? '/patient/marketplace' : '/marketplace';
      navigate(targetRoute, { state: { search: searchInput } });
    }
  };

  const handleSpecialtyClick = (specialty) => {
    const targetRoute = user ? '/patient/marketplace' : '/marketplace';
    navigate(targetRoute, { state: { category: specialty.name } });
  };

  const browseClick = () => {
    const targetRoute = user ? '/patient/marketplace' : '/marketplace';
    navigate(targetRoute);
  };

  useEffect(() => {
    if (user && user.role !== 'PATIENT') {
      navigate(user.role === 'DOCTOR' ? '/doctor' : '/receptionist', { replace: true });
    }
  }, [user, navigate]);

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
                  {LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/patient/my-appointments')}
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
              Book • Skip the Wait • Consult
            </p>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4">
              Find the Right Doctor,<br />Book in Minutes.
            </h1>

            {/* Subtext */}
            <p className="text-lg text-blue-100 mb-8">
              Search by symptom, doctor name, or specialty. Real-time queue tracking included.
            </p>

            {/* Search Bar */}
            <div className="relative mb-6">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by symptom or doctor name..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleSearch}
                className="w-full pl-12 pr-5 py-3.5 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-blue-300 text-base font-medium"
              />
            </div>

            {/* Trust Pills */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-white bg-opacity-20 px-4 py-2 rounded-full text-sm font-medium">
                <Shield size={16} />
                <span>Verified Doctors</span>
              </div>
              <div className="flex items-center gap-2 bg-white bg-opacity-20 px-4 py-2 rounded-full text-sm font-medium">
                <Clock size={16} />
                <span>Real-time Queue</span>
              </div>
              <div className="flex items-center gap-2 bg-white bg-opacity-20 px-4 py-2 rounded-full text-sm font-medium">
                <Calendar size={16} />
                <span>Instant Booking</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Browse by Specialty */}
      <section className="max-w-7xl mx-auto px-4 py-16 md:py-20">
        <h2 className="text-3xl font-bold text-gray-900 mb-10">Browse by Specialty</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {SPECIALTIES.map((specialty) => {
            const IconComponent = specialty.icon;
            return (
              <button
                key={specialty.id}
                onClick={() => handleSpecialtyClick(specialty)}
                className="group bg-white border border-gray-200 hover:border-blue-400 rounded-xl p-4 text-center transition-all duration-300 hover:shadow-md"
              >
                <div className={`w-12 h-12 mx-auto mb-3 bg-gradient-to-br ${specialty.color} rounded-lg flex items-center justify-center`}>
                  <IconComponent size={24} className="text-white" strokeWidth={2} />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{specialty.name}</h3>
                <p className="text-xs text-gray-500">Book Now</p>
              </button>
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
                <Search size={28} strokeWidth={2} />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Search a Doctor</h3>
              <p className="text-gray-600 text-sm">Enter your symptoms or browse by specialty to find the right doctor for your needs.</p>
            </div>

            {/* Arrow (hidden on mobile) */}
            <div className="hidden md:flex items-center justify-center">
              <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarCheck size={28} strokeWidth={2} />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Book a Slot</h3>
              <p className="text-gray-600 text-sm">Pick your preferred date and time. Instant confirmation of your appointment with no waiting on calls.</p>
            </div>

            {/* Arrow (hidden on mobile) */}
            <div className="hidden md:flex items-center justify-center">
              <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} strokeWidth={2} />
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Visit & Consult</h3>
              <p className="text-gray-600 text-sm">Arrive at the clinic and track your queue position live. Get instant updates on your turn.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-blue-50 border-y border-blue-100 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl md:text-4xl font-bold text-blue-600">500+</p>
              <p className="text-sm text-gray-600 mt-2">Verified Doctors</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-blue-600">10,000+</p>
              <p className="text-sm text-gray-600 mt-2">Patients Served</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-blue-600">4.8</p>
              <p className="text-sm text-gray-600 mt-2">Average Rating</p>
            </div>
            <div>
              <p className="text-3xl md:text-4xl font-bold text-blue-600">10 min</p>
              <p className="text-sm text-gray-600 mt-2">Avg Wait Time</p>
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
              <ShieldCheck size={24} className="text-blue-600" strokeWidth={2} />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-2">Verified Doctors</h3>
            <p className="text-gray-600 text-sm">Every doctor on our platform is certified and background-verified to ensure your safety and care quality.</p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Activity size={24} className="text-blue-600" strokeWidth={2} />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-2">Live Queue Tracking</h3>
            <p className="text-gray-600 text-sm">Know your exact wait time before you leave home. Track your position in real-time using our live queue system.</p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Smartphone size={24} className="text-blue-600" strokeWidth={2} />
            </div>
            <h3 className="font-bold text-gray-900 text-base mb-2">Simple Booking</h3>
            <p className="text-gray-600 text-sm">Book an appointment in under 60 seconds without making any calls. Quick, easy, and hassle-free.</p>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-gradient-to-r from-blue-700 to-blue-600 text-white py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to see a doctor today?</h2>
          <p className="text-blue-100 text-lg mb-8">Browse our network of verified specialists near you.</p>
          <button
            onClick={browseClick}
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3.5 rounded-full font-bold text-base transition-colors"
          >
            Browse Doctors
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
