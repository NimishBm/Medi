import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';

import { Register } from './pages/Register';
import { PatientLogin } from './pages/PatientLogin';
import { DoctorLogin } from './pages/DoctorLogin';
import { DoctorRegister } from './pages/DoctorRegister';
import { ProtectedRoute } from './components/ProtectedRoute';
import { authAPI } from './services/api';
import { setUser, logout } from './store/slices/authSlice';
import { closeSocket } from './services/socket';

// Patient Pages
import { Landing } from './pages/patient/Landing';
import { Marketplace } from './pages/patient/Marketplace';
import { DoctorDetail } from './pages/patient/DoctorDetail';
import { BookingPage } from './pages/patient/BookingPage';
import { BookAppointment } from './pages/patient/BookAppointment';
import { Appointments } from './pages/patient/Appointments';
import { FamilyMembers } from './pages/patient/FamilyMembers';
import { LiveQueue } from './pages/patient/LiveQueue';
import { Prescriptions } from './pages/patient/Prescriptions';
import { History } from './pages/patient/History';
import { Payments } from './pages/patient/Payments';
import { PatientProfile } from './pages/patient/Profile';
import { CompleteProfile } from './pages/patient/CompleteProfile';
import { PatientBlog } from './pages/patient/Blog';
import { BookingConfirmed } from './pages/patient/BookingConfirmed';
import { PaymentFailed } from './pages/patient/PaymentFailed';
import { OrganizationDetail } from './pages/patient/OrganizationDetail';

// Doctor Pages
import { DoctorLanding } from './pages/doctor/Landing';
import { DoctorDashboard } from './pages/doctor/Dashboard';
import { DoctorProfile } from './pages/doctor/Profile';
import { DoctorQueue } from './pages/doctor/Queue';
import { DoctorAppointments } from './pages/doctor/Appointments';
import { DoctorPatients } from './pages/doctor/Patients';
import { DoctorSchedule } from './pages/doctor/Schedule';
import { DoctorBlog } from './pages/doctor/Blog';
import { SetupProfile } from './pages/doctor/SetupProfile';
import { DoctorPayments } from './pages/doctor/Payments';


// Admin Pages
import { AdminLogin } from './pages/admin/Login';
import { AdminDashboard } from './pages/admin/Dashboard';

// Organization Pages
import { OrganizationLogin } from './pages/organization/Login';
import { OrganizationDashboard } from './pages/organization/Dashboard';

// Display
import { WaitingRoomDisplay } from './pages/WaitingRoomDisplay';

function AppRoutes() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token, authInitialized } = useSelector((state) => state.auth);
  const restoringRef = useRef(false);

  useEffect(() => {
    if (token && !user && !restoringRef.current) {
      restoringRef.current = true;
      authAPI.getMe()
        .then((response) => {
          dispatch(setUser({ user: response.data, token }));
        })
        .catch(() => {
          dispatch(logout());
        });
    }
  }, [token, dispatch]);

  useEffect(() => {
    const handleUnauthorized = () => {
      closeSocket();
      dispatch(logout());
      navigate('/login', { replace: true });
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [dispatch, navigate]);

  const prevTokenRef = useRef(token);
  useEffect(() => {
    if (prevTokenRef.current && !token) {
      closeSocket();
    }
    prevTokenRef.current = token;
  }, [token]);

  if (!authInitialized) return null;

  return (
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Navigate to="/login/patient" replace />} />
          <Route path="/login/patient" element={<PatientLogin />} />
          <Route path="/login/doctor" element={<DoctorLogin />} />
          <Route path="/register/doctor" element={<DoctorRegister />} />
          <Route path="/register" element={<Register />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Organization Routes */}
          <Route path="/org/login" element={<OrganizationLogin />} />
          <Route path="/org/register" element={<OrganizationLogin />} />
          <Route
            path="/org/dashboard"
            element={
              <ProtectedRoute requiredRoles={['ORGANIZATION']}>
                <OrganizationDashboard />
              </ProtectedRoute>
            }
          />

          {/* Display Routes */}
          <Route path="/display" element={<WaitingRoomDisplay />} />

          {/* Landing - Public Page */}
          <Route path="/" element={<Landing />} />

          {/* Public Browse Routes - No Login Required */}
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/doctors/:doctorId" element={<DoctorDetail />} />
          <Route path="/organizations/:orgId" element={<OrganizationDetail />} />

          {/* Patient Routes */}
          <Route
            path="/patient"
            element={
              <ProtectedRoute requiredRoles={['PATIENT']}>
                <Landing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/marketplace"
            element={
              <ProtectedRoute requiredRoles={['PATIENT']}>
                <Marketplace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/doctors/:doctorId"
            element={
              <ProtectedRoute requiredRoles={['PATIENT']}>
                <DoctorDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/doctors/:doctorId/book"
            element={
              <ProtectedRoute requiredRoles={['PATIENT']}>
                <BookingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/book-appointment"
            element={
              <ProtectedRoute requiredRoles={['PATIENT']}>
                <BookAppointment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/appointments"
            element={
              <ProtectedRoute requiredRoles={['PATIENT']}>
                <Appointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/my-appointments"
            element={
              <ProtectedRoute requiredRoles={['PATIENT']}>
                <Appointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/family"
            element={
              <ProtectedRoute requiredRoles={['PATIENT']}>
                <FamilyMembers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/queue"
            element={
              <ProtectedRoute requiredRoles={['PATIENT']}>
                <LiveQueue />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/prescriptions"
            element={
              <ProtectedRoute requiredRoles={['PATIENT']}>
                <Prescriptions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/history"
            element={
              <ProtectedRoute requiredRoles={['PATIENT']}>
                <History />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/payments"
            element={
              <ProtectedRoute requiredRoles={['PATIENT']}>
                <Payments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/profile"
            element={
              <ProtectedRoute requiredRoles={['PATIENT']}>
                <PatientProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/complete-profile"
            element={
              <ProtectedRoute requiredRoles={['PATIENT']}>
                <CompleteProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/blogs"
            element={
              <ProtectedRoute requiredRoles={['PATIENT']}>
                <PatientBlog />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/booking-confirmed"
            element={
              <ProtectedRoute requiredRoles={['PATIENT']}>
                <BookingConfirmed />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/payment-failed"
            element={
              <ProtectedRoute requiredRoles={['PATIENT']}>
                <PaymentFailed />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/organizations/:orgId"
            element={
              <ProtectedRoute requiredRoles={['PATIENT']}>
                <OrganizationDetail />
              </ProtectedRoute>
            }
          />

          {/* Doctor Routes */}
          <Route
            path="/doctor-landing"
            element={<DoctorLanding />}
          />
          <Route
            path="/doctor/setup-profile"
            element={
              <ProtectedRoute requiredRoles={['DOCTOR']}>
                <SetupProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor"
            element={
              <ProtectedRoute requiredRoles={['DOCTOR']}>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/profile"
            element={
              <ProtectedRoute requiredRoles={['DOCTOR']}>
                <DoctorProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/queue"
            element={
              <ProtectedRoute requiredRoles={['DOCTOR']}>
                <DoctorQueue />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/appointments"
            element={
              <ProtectedRoute requiredRoles={['DOCTOR']}>
                <DoctorAppointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/patients"
            element={
              <ProtectedRoute requiredRoles={['DOCTOR']}>
                <DoctorPatients />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/schedule"
            element={
              <ProtectedRoute requiredRoles={['DOCTOR']}>
                <DoctorSchedule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/blog"
            element={
              <ProtectedRoute requiredRoles={['DOCTOR']}>
                <DoctorBlog />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/payments"
            element={
              <ProtectedRoute requiredRoles={['DOCTOR']}>
                <DoctorPayments />
              </ProtectedRoute>
            }
          />


          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
  );
}

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <BrowserRouter future={{ v7_relativeSplatPath: true }}>
        <AppRoutes />
      </BrowserRouter>
    </>
  );
}
