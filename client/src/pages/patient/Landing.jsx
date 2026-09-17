import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { id: 'fever', name: 'Fever', icon: '🌡️', description: 'For high temperature' },
  { id: 'skin', name: 'Skin', icon: '💆', description: 'Skin concerns' },
  { id: 'heart', name: 'Heart', icon: '❤️', description: 'Heart checkup' },
  { id: 'eye', name: 'Eye', icon: '👁️', description: 'Vision issues' },
  { id: 'dental', name: 'Dental', icon: '🦷', description: 'Teeth problem' },
  { id: 'general', name: 'General', icon: '⚕️', description: 'General checkup' },
];

const LOCATIONS = ['Current Location', 'Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad'];

export const Landing = () => {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState('Current Location');

  const handleCategoryClick = (category) => {
    navigate('/patient/marketplace', { state: { category: category.name } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">🏥</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                ClinicFlow
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Location Selector - Small */}
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="hidden md:block px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
            >
              {LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>

            <button
              onClick={() => navigate('/patient/appointments')}
              className="text-gray-700 hover:text-blue-600 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
            >
              Appointments
            </button>
            <button
              onClick={() => dispatch(logout())}
              className="text-gray-700 hover:text-red-600 font-medium text-sm px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Hi {user?.name?.split(' ')[0]}! 👋
          </h2>
          <p className="text-lg text-gray-600">Find and book the best doctors near you</p>
        </div>

        {/* Hero Section with Search */}
        <div className="mb-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 md:p-10 text-white">
          <h3 className="text-2xl md:text-3xl font-bold mb-2">What brings you here?</h3>
          <p className="text-blue-100 mb-6 text-sm md:text-base">Search by symptom, doctor name, or specialty</p>
          <div className="relative">
            <input
              type="text"
              placeholder="Type symptoms or doctor name..."
              className="w-full px-5 py-3 rounded-full text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-blue-300 text-sm md:text-base"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  navigate('/patient/marketplace', { state: { search: e.target.value } });
                }
              }}
            />
            <button className="absolute right-1 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-1.5 rounded-full font-semibold text-sm transition">
              Search
            </button>
          </div>
        </div>

        {/* Categories Section */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Browse by Specialty</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat)}
                className="group bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl p-4 text-center transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                <div className="text-4xl mb-2">{cat.icon}</div>
                <h4 className="font-bold text-gray-900 text-sm mb-0.5">{cat.name}</h4>
                <p className="text-xs text-gray-600">{cat.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mb-12 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <h4 className="text-2xl md:text-3xl font-bold text-blue-600">500+</h4>
              <p className="text-gray-600 text-sm mt-1">Verified Doctors</p>
            </div>
            <div>
              <h4 className="text-2xl md:text-3xl font-bold text-green-600">24/7</h4>
              <p className="text-gray-600 text-sm mt-1">Available Service</p>
            </div>
            <div>
              <h4 className="text-2xl md:text-3xl font-bold text-purple-600">10min</h4>
              <p className="text-gray-600 text-sm mt-1">Avg Wait Time</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mb-12 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 rounded-xl p-6 md:p-10 text-white text-center">
          <h3 className="text-2xl font-bold mb-2">Ready to book an appointment?</h3>
          <p className="text-blue-100 mb-6 text-sm md:text-base">Pick a specialty above or search for a specific doctor</p>
          <button
            onClick={() => navigate('/patient/marketplace')}
            className="bg-white text-blue-600 hover:bg-gray-100 px-6 py-2.5 rounded-full font-bold text-sm md:text-base transition-all"
          >
            Explore All Doctors →
          </button>
        </div>

        {/* Features */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Why ClinicFlow?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-5 border border-gray-200">
              <div className="text-3xl mb-3">✅</div>
              <h4 className="font-bold text-gray-900 text-sm mb-1.5">Verified Doctors</h4>
              <p className="text-gray-600 text-sm">All doctors are certified and experienced</p>
            </div>
            <div className="bg-white rounded-lg p-5 border border-gray-200">
              <div className="text-3xl mb-3">⏱️</div>
              <h4 className="font-bold text-gray-900 text-sm mb-1.5">Real-time Queue</h4>
              <p className="text-gray-600 text-sm">See live queue status and estimated wait time</p>
            </div>
            <div className="bg-white rounded-lg p-5 border border-gray-200">
              <div className="text-3xl mb-3">💬</div>
              <h4 className="font-bold text-gray-900 text-sm mb-1.5">Easy Booking</h4>
              <p className="text-gray-600 text-sm">Book appointments in just 2 taps</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-600 pb-8 border-t pt-8">
          <p>© 2024 ClinicFlow. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};
