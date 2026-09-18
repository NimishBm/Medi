import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import {
  Search, Heart, Eye, Smile, Activity, Thermometer, Layers, MapPin,
  ShieldCheck, Smartphone, CheckCircle, CalendarCheck, Clock, Shield,
  Calendar, User, FileText, Users, CreditCard, ChevronRight,
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

const QUICK_LINKS = [
  { label: 'My Appointments', icon: Calendar, route: '/patient/my-appointments', color: 'bg-blue-50 text-blue-600' },
  { label: 'Prescriptions', icon: FileText, route: '/patient/prescriptions', color: 'bg-green-50 text-green-600' },
  { label: 'Family Members', icon: Users, route: '/patient/family', color: 'bg-purple-50 text-purple-600' },
  { label: 'Payments', icon: CreditCard, route: '/patient/payments', color: 'bg-orange-50 text-orange-600' },
];

// ─── Logged-in Dashboard ──────────────────────────────────────────────────────
const LoggedInView = ({ user, dispatch, navigate, searchInput, setSearchInput, handleSearch, handleSpecialtyClick, selectedLocation, setSelectedLocation }) => (
  <div className="min-h-screen bg-gray-50">
    {/* Compact sticky header */}
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Heart className="text-white" size={16} strokeWidth={2.5} />
        </div>
        {/* Search bar takes remaining space */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search doctor, symptom..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleSearch}
            className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full flex-shrink-0">
          <User size={14} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700">{user?.name?.split(' ')[0]}</span>
        </div>
        <button
          onClick={() => dispatch(logout())}
          className="text-gray-500 hover:text-red-600 text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-red-50 transition flex-shrink-0"
        >
          Logout
        </button>
      </div>
    </header>

    <div className="max-w-4xl mx-auto px-4 py-5 space-y-6">
      {/* Greeting + location */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Hi, {user?.name?.split(' ')[0]} 👋</h2>
          <p className="text-sm text-gray-500">How are you feeling today?</p>
        </div>
        <div className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1.5 rounded-full shadow-sm">
          <MapPin size={13} className="text-blue-500" />
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="text-xs font-medium text-gray-700 bg-transparent focus:outline-none cursor-pointer"
          >
            {LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-4 gap-3">
        {QUICK_LINKS.map(({ label, icon: Icon, route, color }) => (
          <button
            key={route}
            onClick={() => navigate(route)}
            className="flex flex-col items-center gap-2 bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={20} />
            </div>
            <span className="text-xs font-medium text-gray-700 text-center leading-tight">{label}</span>
          </button>
        ))}
      </div>

      {/* Browse by Specialty */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-gray-900">Browse by Specialty</h3>
          <button
            onClick={() => navigate('/patient/marketplace')}
            className="text-sm text-blue-600 font-medium flex items-center gap-1"
          >
            See all <ChevronRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {SPECIALTIES.map((specialty) => {
            const IconComponent = specialty.icon;
            return (
              <button
                key={specialty.id}
                onClick={() => handleSpecialtyClick(specialty)}
                className="group bg-white border border-gray-100 hover:border-blue-300 rounded-xl p-3 text-center transition-all hover:shadow-md"
              >
                <div className={`w-10 h-10 mx-auto mb-2 bg-gradient-to-br ${specialty.color} rounded-lg flex items-center justify-center`}>
                  <IconComponent size={20} className="text-white" strokeWidth={2} />
                </div>
                <p className="text-xs font-medium text-gray-800 leading-tight">{specialty.name}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Browse All Button */}
      <button
        onClick={() => navigate('/patient/marketplace')}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
      >
        <Search size={16} />
        Browse All Doctors
      </button>
    </div>
  </div>
);

// ─── Marketing Landing (logged out) ──────────────────────────────────────────
const LoggedOutView = ({ navigate, searchInput, setSearchInput, handleSearch, handleSpecialtyClick, browseClick }) => (
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/login/patient')}
            className="text-gray-700 hover:text-blue-600 font-medium text-sm px-3 py-2 rounded-lg hover:bg-blue-50 transition"
          >
            Login
          </button>
          <button
            onClick={() => navigate('/login/doctor')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition"
          >
            For Doctors
          </button>
        </div>
      </div>
    </header>

    {/* Hero */}
    <section className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-24">
        <div className="max-w-3xl">
          <p className="text-xs sm:text-sm uppercase tracking-widest font-semibold text-blue-100 mb-3">
            Book • Skip the Wait • Consult
          </p>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-4">
            Find the Right Doctor,<br />Book in Minutes.
          </h1>
          <p className="text-base text-blue-100 mb-6">
            Search by symptom, doctor name, or specialty. Real-time queue tracking included.
          </p>
          <div className="relative mb-5">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by symptom or doctor name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleSearch}
              className="w-full pl-12 pr-5 py-3.5 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-blue-300 text-sm font-medium"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {[['Shield', 'Verified Doctors'], ['Clock', 'Real-time Queue'], ['Calendar', 'Instant Booking']].map(([, label]) => (
              <div key={label} className="flex items-center gap-2 bg-white bg-opacity-20 px-3 py-1.5 rounded-full text-xs font-medium">
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* Specialties */}
    <section className="max-w-7xl mx-auto px-4 py-12 md:py-20">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Browse by Specialty</h2>
      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-3 md:gap-4">
        {SPECIALTIES.map((specialty) => {
          const IconComponent = specialty.icon;
          return (
            <button
              key={specialty.id}
              onClick={() => handleSpecialtyClick(specialty)}
              className="group bg-white border border-gray-200 hover:border-blue-400 rounded-xl p-3 md:p-4 text-center transition-all hover:shadow-md"
            >
              <div className={`w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 bg-gradient-to-br ${specialty.color} rounded-lg flex items-center justify-center`}>
                <IconComponent size={20} className="text-white" strokeWidth={2} />
              </div>
              <h3 className="font-semibold text-gray-900 text-xs md:text-sm mb-0.5 leading-tight">{specialty.name}</h3>
              <p className="text-xs text-gray-500 hidden md:block">Book Now</p>
            </button>
          );
        })}
      </div>
    </section>

    {/* How It Works */}
    <section className="bg-gray-50 py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-10 text-center">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Search, title: 'Search a Doctor', desc: 'Enter your symptoms or browse by specialty.' },
            { icon: CalendarCheck, title: 'Book a Slot', desc: 'Pick your preferred date and time. Instant confirmation.' },
            { icon: CheckCircle, title: 'Visit & Consult', desc: 'Track your queue position live. Get updates on your turn.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="text-center">
              <div className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon size={24} strokeWidth={2} />
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-2">{title}</h3>
              <p className="text-gray-600 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Stats */}
    <section className="bg-blue-50 border-y border-blue-100 py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[['500+', 'Verified Doctors'], ['10,000+', 'Patients Served'], ['4.8', 'Average Rating'], ['10 min', 'Avg Wait Time']].map(([val, label]) => (
            <div key={label}>
              <p className="text-2xl md:text-4xl font-bold text-blue-600">{val}</p>
              <p className="text-xs md:text-sm text-gray-600 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Why ClinicFlow */}
    <section className="max-w-7xl mx-auto px-4 py-12 md:py-20">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">Why Choose ClinicFlow?</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {[
          { icon: ShieldCheck, title: 'Verified Doctors', desc: 'Every doctor is certified and background-verified.' },
          { icon: Activity, title: 'Live Queue Tracking', desc: 'Know your exact wait time before you leave home.' },
          { icon: Smartphone, title: 'Simple Booking', desc: 'Book an appointment in under 60 seconds.' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <Icon size={20} className="text-blue-600" strokeWidth={2} />
            </div>
            <h3 className="font-bold text-gray-900 text-sm mb-1">{title}</h3>
            <p className="text-gray-600 text-sm">{desc}</p>
          </div>
        ))}
      </div>
    </section>

    {/* CTA */}
    <section className="bg-gradient-to-r from-blue-700 to-blue-600 text-white py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-4xl font-bold mb-3">Ready to see a doctor today?</h2>
        <p className="text-blue-100 mb-6 text-sm md:text-lg">Browse our network of verified specialists near you.</p>
        <button
          onClick={browseClick}
          className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-full font-bold text-sm md:text-base transition-colors"
        >
          Browse Doctors
        </button>
      </div>
    </section>

    <footer className="border-t border-gray-200 py-5">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-gray-500 text-xs">© 2026 ClinicFlow. All rights reserved.</p>
      </div>
    </footer>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
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

  const sharedProps = { searchInput, setSearchInput, handleSearch, handleSpecialtyClick, selectedLocation, setSelectedLocation };

  if (user) {
    return <LoggedInView user={user} dispatch={dispatch} navigate={navigate} {...sharedProps} />;
  }

  return <LoggedOutView navigate={navigate} browseClick={browseClick} {...sharedProps} />;
};
