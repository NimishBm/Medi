import { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { doctorAPI, queueAPI } from '../../services/api';
import { logout } from '../../store/slices/authSlice';
import toast from 'react-hot-toast';
import { ChevronLeft, Search, Heart, Activity, Star, SearchX } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', name: 'All', icon: '⭐' },
  { id: 'general', name: 'General', icon: '⚕️', specialization: 'General Physician' },
  { id: 'cardio', name: 'Cardio', icon: '❤️', specialization: 'Cardiologist' },
  { id: 'skin', name: 'Skin', icon: '💆', specialization: 'Dermatologist' },
];

const SORT_OPTIONS = [
  { id: 'relevant', label: 'Most Relevant' },
  { id: 'fee_low', label: 'Price: Low to High' },
  { id: 'fee_high', label: 'Price: High to Low' },
  { id: 'wait', label: 'Shortest Wait Time' },
  { id: 'experience', label: 'Most Experienced' },
];

const SYMPTOM_MAP = {
  fever: 'General Physician',
  'skin issues': 'Dermatologist',
  'heart pain': 'Cardiologist',
  'eye problem': 'General Physician',
  'bone pain': 'General Physician',
  cough: 'General Physician',
  cold: 'General Physician',
};

export const Marketplace = () => {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [doctorQueueStats, setDoctorQueueStats] = useState({});
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('relevant');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const doctorsRes = await doctorAPI.getDoctors();
        setDoctors(doctorsRes.data);

        const queueStatsMap = {};
        for (const doctor of doctorsRes.data) {
          try {
            const queueRes = await queueAPI.getQueueByDoctorId(doctor._id);
            queueStatsMap[doctor._id] = queueRes.data;
          } catch (error) {
            queueStatsMap[doctor._id] = { waiting: 0, called: 0, consulting: 0, total: 0 };
          }
        }
        setDoctorQueueStats(queueStatsMap);
      } catch (error) {
        toast.error('Failed to load doctors');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredAndSortedDoctors = useMemo(() => {
    let result = doctors;

    // Filter by category
    if (selectedCategory !== 'all') {
      const cat = CATEGORIES.find((c) => c.id === selectedCategory);
      if (cat?.specialization) {
        result = result.filter((d) => d.specialization === cat.specialization);
      }
    }

    // Filter by search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(searchLower) ||
          d.specialization.toLowerCase().includes(searchLower)
      );

      if (result.length === 0) {
        const symptomMatch = SYMPTOM_MAP[searchLower.trim()];
        if (symptomMatch) {
          result = doctors.filter((d) => d.specialization === symptomMatch);
        }
      }
    }

    // Sort
    const sorted = [...result].sort((a, b) => {
      const waitA = (doctorQueueStats[a._id]?.waiting || 0) * (a.averageConsultationTime || 10);
      const waitB = (doctorQueueStats[b._id]?.waiting || 0) * (b.averageConsultationTime || 10);

      switch (sortBy) {
        case 'fee_low':
          return a.consultationFee - b.consultationFee;
        case 'fee_high':
          return b.consultationFee - a.consultationFee;
        case 'wait':
          return waitA - waitB;
        case 'experience':
          return b.experience - a.experience;
        default:
          return 0;
      }
    });

    return sorted;
  }, [doctors, search, selectedCategory, sortBy, doctorQueueStats]);

  const getEstimatedWait = (doctorId) => {
    const stats = doctorQueueStats[doctorId] || { waiting: 0 };
    const avgTime = doctors.find((d) => d._id === doctorId)?.averageConsultationTime || 10;
    return stats.waiting * avgTime;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-3"></div>
          <p className="text-gray-700 font-medium">Loading doctors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/patient')} className="text-gray-600 hover:text-gray-900 p-1">
              <ChevronLeft size={22} />
            </button>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Heart className="text-white" size={18} strokeWidth={2.5} />
            </div>
            <h1 className="text-base font-bold text-gray-900">ClinicFlow</h1>
          </div>
          <h2 className="text-base font-bold text-gray-900">Browse Doctors</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/patient/my-appointments')}
              className="text-gray-700 hover:text-blue-600 font-medium text-xs px-3 py-1.5 rounded-lg hover:bg-blue-50 transition hidden sm:block"
            >
              My Appointments
            </button>
            <div className="hidden sm:flex items-center bg-gray-100 px-3 py-1.5 rounded-full">
              <span className="text-xs font-medium text-gray-700">{user?.name?.split(' ')[0]}</span>
            </div>
            <button
              onClick={() => dispatch(logout())}
              className="text-gray-700 hover:text-red-600 font-medium text-xs px-3 py-1.5"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="bg-white border-b border-gray-200 sticky z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search doctors, symptoms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {/* Filters Section */}
        <div className="py-4 border-b border-gray-200 flex items-center justify-between gap-4 overflow-x-auto">
          {/* Categories */}
          <div className="flex gap-2 min-w-max">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full font-medium text-sm transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white whitespace-nowrap"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Results Info */}
        <div className="py-4">
          <p className="text-sm text-gray-600">
            {filteredAndSortedDoctors.length} doctor{filteredAndSortedDoctors.length !== 1 ? 's' : ''} available
          </p>
        </div>

        {/* Doctor Cards */}
        {filteredAndSortedDoctors.length === 0 ? (
          <div className="text-center py-16">
            <SearchX size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 font-medium">No doctors found</p>
            <p className="text-gray-500 text-sm">Try different filters or search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
            {filteredAndSortedDoctors.map((doctor) => {
              const stats = doctorQueueStats[doctor._id] || { waiting: 0 };
              const waitTime = getEstimatedWait(doctor._id);

              return (
                <Link
                  key={doctor._id}
                  to={`/patient/doctors/${doctor._id}`}
                  className="bg-white rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all duration-200 overflow-hidden group"
                >
                  {/* Card Header with Avatar */}
                  <div className="h-20 bg-gradient-to-br from-blue-500 to-blue-700 flex items-end px-4 pb-3">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl font-bold text-blue-600 shadow-md">
                      {doctor.name.charAt(0)}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 -mt-4 relative">
                    {/* Doctor Info */}
                    <div className="mb-3">
                      <h3 className="text-sm font-bold text-gray-900 line-clamp-1">
                        {doctor.name.replace(/^Dr\.?\s+/, 'Dr. ')}
                      </h3>
                      <p className="text-xs text-blue-600 font-semibold mt-0.5">{doctor.specialization}</p>
                    </div>

                    {/* Rating & Info */}
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500">Experience</p>
                        <p className="font-bold text-gray-900 text-sm">{doctor.experience}y</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Fees</p>
                        <p className="font-bold text-gray-900 text-sm">₹{doctor.consultationFee}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Rating</p>
                        <div className="flex items-center gap-1">
                          <Star size={14} className="text-yellow-400 fill-yellow-400" />
                          <p className="font-bold text-gray-900 text-sm">4.5</p>
                        </div>
                      </div>
                    </div>

                    {/* Queue Status - Redesigned */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-600">Queue Status</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            stats.waiting > 5 ? 'bg-red-100 text-red-700' : stats.waiting > 2 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {stats.waiting || 0} waiting
                          </span>
                        </div>
                      </div>
                      <div className="text-center bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg py-2 border border-green-200">
                        <p className="text-xs text-gray-600">Est. Wait Time</p>
                        <p className="text-lg font-bold text-green-600">{waitTime || 0}m</p>
                      </div>
                    </div>

                    {/* Book Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigate(`/patient/doctors/${doctor._id}/book`);
                      }}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-2.5 rounded-lg font-semibold text-xs transition-all shadow-sm hover:shadow-md"
                    >
                      Book Appointment
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
