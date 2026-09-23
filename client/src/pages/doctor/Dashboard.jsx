import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Navigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { doctorProfileAPI, queueAPI } from '../../services/api';
import { setUser } from '../../store/slices/authSlice';
import { NotificationBell } from '../../components/NotificationBell';
import { useDoctorNotifications } from '../../hooks/useDoctorNotifications';
import {
  Users,
  Calendar,
  Clock,
  BarChart3,
  TrendingUp,
  Award,
  ShieldCheck,
  Activity,
  Smartphone,
  Heart,
  Shield,
  MapPin,
  Stethoscope,
  Zap,
  ArrowUpRight,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Trash2,
  Edit2,
  Sparkles,
  PenSquare,
  CreditCard,
} from 'lucide-react';

const FEATURES = [
  { id: 'appointments', name: 'Appointments', icon: Users, color: 'from-teal-400 to-teal-600', path: '/doctor/appointments', desc: 'View all patient appointments' },
  { id: 'schedule', name: 'Smart Scheduling', icon: Calendar, color: 'from-emerald-400 to-emerald-600', path: '/doctor/schedule', desc: 'Manage your availability & slots' },
  { id: 'queue', name: 'Live Queue', icon: Clock, color: 'from-orange-400 to-orange-500', path: '/doctor/queue', desc: 'Real-time patient queue' },
  { id: 'patients', name: 'Patient Care', icon: Users, color: 'from-green-400 to-green-600', path: '/doctor/patients', desc: 'View all registered patients' },
  { id: 'payments', name: 'Payment History', icon: CreditCard, color: 'from-blue-500 to-cyan-600', path: '/doctor/payments', desc: 'View all payments done by patients' },
  { id: 'blog', name: 'My Blog', icon: PenSquare, color: 'from-purple-400 to-purple-600', path: '/doctor/blog', desc: 'Write & manage health blog posts' },
];

const LOCATIONS = ['Current Location', 'Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad'];

export const DoctorDashboard = () => {
  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  useDoctorNotifications(user?._id);
  const [isAnimated, setIsAnimated] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const [patientsSeen, setPatientsSeen] = useState(0);

  // If not logged in as DOCTOR, redirect them
  if (!user || user.role !== 'DOCTOR') {
    return <Navigate to="/login/doctor" replace />;
  }

  useEffect(() => {
    setIsAnimated(true);
  }, []);

  useEffect(() => {
    // Fetch today's queue to get the live patients-seen count
    const fetchPatientsSeen = async () => {
      try {
        const res = await queueAPI.getQueueByDoctorId(user._id);
        setPatientsSeen(res.data.stats?.completed || 0);
      } catch {
        // Silently fail — not critical
      }
    };

    fetchPatientsSeen();
    // Refresh every 30 seconds while the doctor is on the dashboard
    const interval = setInterval(fetchPatientsSeen, 30000);
    return () => clearInterval(interval);
  }, [user._id]);

  const getWorkingDays = () => {
    if (!user?.availability) return 0;
    return Object.values(user.availability).filter(day => day?.start && day?.end).length;
  };

  const handleDeletePhoto = async () => {
    if (!window.confirm('Are you sure you want to delete your profile photo?')) return;

    setIsDeletingPhoto(true);
    try {
      const response = await doctorProfileAPI.updateMe({ profilePhoto: null });
      dispatch(
        setUser({
          user: response.data,
          token,
        })
      );
      toast.success('Profile photo deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete photo');
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color, trend, subtext, delay = 0 }) => (
    <div
      className={`bg-white rounded-lg border border-teal-200 p-4 hover:shadow-md hover:scale-102 transition-all duration-300 transform ${
        isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 bg-${color}-100 rounded-lg flex items-center justify-center`}>
          <Icon className={`text-${color}-600`} size={20} />
        </div>
        {trend && <div className="flex items-center gap-1 text-green-600 text-xs font-semibold animate-pulse">
          <ArrowUpRight size={14} /> {trend}%
        </div>}
      </div>
      <p className="text-gray-600 text-xs mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#1E3A5F] border-b border-[#2D4F7C] shadow-lg animate-fade-in">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 sm:w-10 h-9 sm:h-10 bg-[#0D9488] rounded-lg flex items-center justify-center hover:shadow-lg transition-shadow">
              <Heart className="text-white" size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white">ClinicFlow</h1>
              <p className="text-xs text-teal-300 hidden sm:block">Doctor Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => navigate('/doctor/appointments')}
              className="text-slate-200 hover:text-teal-300 font-medium text-xs sm:text-sm px-2 sm:px-4 py-2 rounded-lg hover:bg-white/10 transition hidden lg:block"
            >
              Appointments
            </button>
            <button
              onClick={() => navigate('/doctor/schedule')}
              className="text-slate-200 hover:text-teal-300 font-medium text-xs sm:text-sm px-2 sm:px-4 py-2 rounded-lg hover:bg-white/10 transition hidden lg:block"
            >
              Schedule
            </button>
            <button
              onClick={() => navigate('/doctor/payments')}
              className="text-slate-200 hover:text-teal-300 font-medium text-xs sm:text-sm px-2 sm:px-4 py-2 rounded-lg hover:bg-white/10 transition hidden lg:block"
            >
              Payments
            </button>
            <button
              onClick={() => navigate('/doctor/profile')}
              className="text-slate-200 hover:text-teal-300 font-medium text-xs sm:text-sm px-2 sm:px-4 py-2 rounded-lg hover:bg-white/10 transition hidden lg:block"
            >
              Profile
            </button>
            <div className="hidden lg:block h-6 border-l border-white/20"></div>
            <div className="flex items-center gap-2 bg-white/10 px-2 sm:px-4 py-2 rounded-full hover:bg-white/20 transition">
              <div className="w-7 sm:w-8 h-7 sm:h-8 bg-[#0D9488] rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs sm:text-sm font-medium text-white hidden sm:inline">{user?.name?.split(' ')[0]}</span>
            </div>
            <NotificationBell />
            <button
              onClick={() => dispatch(logout())}
              className="text-slate-300 hover:text-red-400 font-medium text-xs sm:text-sm px-2 sm:px-4 py-2 rounded-lg hover:bg-white/10 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Welcome Section */}
      <section className="relative text-white pt-6 sm:pt-8 pb-16 sm:pb-24 overflow-hidden" style={{ minHeight: '280px', background: 'linear-gradient(145deg,#1E3A5F,#0F2944,#0D9488)' }}>
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-5 w-20 h-20 bg-white rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-emerald-200 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-teal-200 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Wave SVG Animation */}
        <svg className="absolute bottom-0 left-0 w-full h-auto" viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ height: '120px' }}>
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(13, 148, 136, 0.3)" />
              <stop offset="100%" stopColor="rgba(16, 185, 129, 0.2)" />
            </linearGradient>
          </defs>
          <path
            d="M0,40 Q300,80 600,40 T1200,40 L1200,120 L0,120 Z"
            fill="url(#waveGradient)"
            className="animate-bounce"
            style={{ animationDuration: '3s' }}
          />
          <path
            d="M0,60 Q300,100 600,60 T1200,60 L1200,120 L0,120 Z"
            fill="rgba(16, 185, 129, 0.1)"
            className="animate-bounce"
            style={{ animationDuration: '4s', animationDelay: '0.5s' }}
          />
        </svg>

        <div className="max-w-7xl mx-auto px-3 sm:px-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/30">
                  <Sparkles size={16} className="text-yellow-300 animate-spin" style={{ animationDuration: '3s' }} />
                  <span className="text-xs sm:text-sm font-semibold text-white">Welcome Back!</span>
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 break-words leading-tight">
                Welcome, <span className="bg-gradient-to-r from-yellow-200 to-white bg-clip-text text-transparent">{user?.name}</span>
              </h2>
              <div className="flex items-center gap-2 text-teal-50 text-sm sm:text-base">
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <p>Here's an overview of your practice</p>
              </div>
            </div>

            {/* Floating Icons */}
            <div className="hidden md:flex flex-col items-end gap-2">
              <div className="text-right">
                <p className="text-teal-100 text-xs font-semibold opacity-75">Last updated</p>
                <p className="text-white text-sm font-semibold">Today at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div className="flex gap-2 mt-3">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-110 cursor-pointer">
                  <Calendar size={20} className="text-teal-100" />
                </div>
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-110 cursor-pointer">
                  <Users size={20} className="text-teal-100" />
                </div>
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-110 cursor-pointer">
                  <Activity size={20} className="text-teal-100" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats Section */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            icon={Calendar}
            label="Working Days"
            value={getWorkingDays()}
            color="teal"
            subtext="Per week"
            delay={0}
          />
          <StatCard
            icon={DollarSign}
            label="Consultation Fee"
            value={`₹${user?.consultationFee || 500}`}
            color="green"
            subtext="Standard rate"
            delay={100}
          />
          <StatCard
            icon={Users}
            label="Patients Seen"
            value={patientsSeen}
            color="emerald"
            subtext="Today"
            delay={200}
          />
          <StatCard
            icon={Clock}
            label="Avg Wait Time"
            value={`${user?.waitingTime || 30}m`}
            color="orange"
            subtext="Minutes"
            delay={300}
          />
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            {/* Profile Card */}
            <div className="bg-white rounded-lg border border-teal-200 p-4 sm:p-4 mb-4 sticky top-24 hover:shadow-lg transition-all duration-300 animate-fade-in" style={{ animationDelay: '300ms' }}>
              <div className="text-center mb-4">
                <div className="relative inline-block mb-4">
                  {user?.profilePhoto ? (
                    <img
                      src={user.profilePhoto.startsWith('http') ? user.profilePhoto : user.profilePhoto}
                      alt={user.name}
                      className="w-20 h-20 rounded-full mx-auto object-cover border-4 border-teal-100 hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full mx-auto bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-2xl font-bold hover:scale-110 transition-transform duration-300">
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {user?.profilePhoto && (
                    <button
                      onClick={handleDeletePhoto}
                      disabled={isDeletingPhoto}
                      className="absolute bottom-0 right-0 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition disabled:opacity-50"
                      title="Delete photo"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900">{user?.name}</h3>
                <p className="text-sm text-gray-600">{user?.specialization || 'Specialist'}</p>
              </div>

              <div className="space-y-3 border-t border-teal-200 pt-4">
                {user?.experience && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Experience</p>
                    <p className="text-sm text-gray-900">{user.experience} Years</p>
                  </div>
                )}

                {user?.qualifications && user.qualifications.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Education</p>
                    <div className="flex flex-wrap gap-1">
                      {user.qualifications.map((qual, idx) => (
                        <span key={idx} className="inline-block bg-teal-100 text-teal-700 text-xs font-semibold px-2 py-1 rounded-md">
                          {qual}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {user?.hospital && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Organization</p>
                    <p className="text-sm text-gray-900">{user.hospital}</p>
                  </div>
                )}

                {user?.registrationNumber && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Registration</p>
                    <p className="text-sm text-gray-900">{user.registrationNumber}</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => navigate('/doctor/profile')}
                className="w-full mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Edit2 size={16} />
                Edit Profile
              </button>
            </div>

          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-2">
            {/* Features Grid */}
            <div className="mb-8 animate-fade-in" style={{ animationDelay: '500ms' }}>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Practice Tools</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {FEATURES.map((feature, idx) => {
                  const IconComponent = feature.icon;
                  return (
                    <button
                      key={feature.id}
                      onClick={() => navigate(feature.path)}
                      className="group bg-white border-2 border-teal-200 hover:border-teal-400 rounded-lg p-4 sm:p-6 transition-all duration-300 hover:shadow-lg hover:scale-105 hover:-translate-y-1 text-left transform"
                      style={{
                        animation: isAnimated ? `slideUp 0.5s ease-out ${300 + idx * 100}ms both` : 'none'
                      }}
                    >
                      <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform duration-300`}>
                        <IconComponent size={24} className="text-white" strokeWidth={2} />
                      </div>
                      <h4 className="font-bold text-gray-900 mb-1">{feature.name}</h4>
                      <p className="text-xs text-gray-600">{feature.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* Services Section */}
      <section className="bg-white border-t border-teal-200 py-4 sm:py-6 animate-fade-in" style={{ animationDelay: '700ms' }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Consultation Services</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-teal-50 rounded-lg p-4 border border-teal-200 hover:shadow-md hover:scale-105 transition-all duration-300 transform">
              <div className="flex items-center gap-3 mb-2">
                <Smartphone className="text-teal-600" size={20} />
                <h4 className="font-semibold text-sm sm:text-base text-gray-900">Online Consultation</h4>
              </div>
              <p className="text-sm text-gray-600">
                {user?.onlineConsultation ? '✓ Available' : '✕ Not Available'}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200 hover:shadow-md hover:scale-105 transition-all duration-300 transform">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="text-green-600" size={20} />
                <h4 className="font-semibold text-sm sm:text-base text-gray-900">Emergency Consultation</h4>
              </div>
              <p className="text-sm text-gray-600">
                {user?.emergencyConsultation ? '✓ Available' : '✕ Not Available'}
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200 hover:shadow-md hover:scale-105 transition-all duration-300 transform">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="text-orange-500" size={20} />
                <h4 className="font-semibold text-sm sm:text-base text-gray-900">Duration per Session</h4>
              </div>
              <p className="text-sm text-gray-600">{user?.consultationDuration || 30} minutes</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-4 sm:py-6 border-t border-gray-700 animate-fade-in" style={{ animationDelay: '800ms' }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 mb-6 sm:mb-8">
            <div className="text-center sm:text-left">
              <div className="flex items-center gap-2 mb-4 justify-center sm:justify-start hover:text-white transition">
                <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center hover:shadow-lg transition-shadow">
                  <Heart className="text-white" size={18} strokeWidth={2.5} />
                </div>
                <span className="font-bold text-white">ClinicFlow</span>
              </div>
              <p className="text-sm">Managing healthcare efficiently.</p>
            </div>
            <div className="text-center">
              <h4 className="font-semibold text-white mb-3">Quick Links</h4>
              <ul className="text-sm space-y-2">
                <li><button onClick={() => navigate('/doctor/appointments')} className="hover:text-white hover:translate-x-1 transition-all duration-200">Appointments</button></li>
                <li><button onClick={() => navigate('/doctor/schedule')} className="hover:text-white hover:translate-x-1 transition-all duration-200">Schedule</button></li>
                <li><button onClick={() => navigate('/doctor/profile')} className="hover:text-white hover:translate-x-1 transition-all duration-200">Profile</button></li>
              </ul>
            </div>
            <div className="text-center sm:text-right">
              <h4 className="font-semibold text-white mb-3">Support</h4>
              <ul className="text-sm space-y-2">
                <li><a href="#" className="hover:text-white hover:translate-x-1 transition-all duration-200">Help Center</a></li>
                <li><a href="#" className="hover:text-white hover:translate-x-1 transition-all duration-200">Contact Us</a></li>
                <li><a href="#" className="hover:text-white hover:translate-x-1 transition-all duration-200">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-6 sm:pt-8 text-center text-sm">
            <p>© 2026 ClinicFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideIn {
          from {
            transform: translateX(20px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.6s ease-out;
        }

        .animate-slide-up {
          animation: slideUp 0.6s ease-out;
        }

        .animate-slide-in {
          animation: slideIn 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};
