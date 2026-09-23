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


// Admin Pages
import { AdminLogin } from './pages/admin/Login';
import { AdminDashboard } from './pages/admin/Dashboard';

// Display
import { WaitingRoomDisplay } from './pages/WaitingRoomDisplay';

// Inner component so it can use useNavigate (which requires BrowserRouter context)
function AppRoutes() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token, authInitialized } = useSelector((state) => state.auth);
  const restoringRef = useRef(false);

  // Restore user session when a token exists but user is not yet in the store.
  // This runs ONCE per token value. On completion (success OR failure) we mark
  // authInitialized=true so ProtectedRoute knows it can now make a routing decision.
  useEffect(() => {
    if (token && !user && !restoringRef.current) {
      restoringRef.current = true;
      authAPI.getMe()
        .then((response) => {
          dispatch(setUser({ user: response.data, token }));
        })
        .catch(() => {
          // getMe() failed (network error, invalid token, etc.).
          // Clear the stale token so ProtectedRoute can redirect cleanly.
          dispatch(logout());
        });
      // Note: restoringRef is NOT reset — we only want one getMe() call per mount.
    }
  }, [token, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle 401 responses from the API interceptor without a hard page reload.
  useEffect(() => {
    const handleUnauthorized = () => {
      closeSocket();
      dispatch(logout());
      navigate('/login', { replace: true });
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [dispatch, navigate]);

  // Close the socket singleton when the user logs out so a fresh connection
  // is established on the next login (avoids stale socket with old user context).
  const prevTokenRef = useRef(token);
  useEffect(() => {
    if (prevTokenRef.current && !token) {
      closeSocket();
    }
    prevTokenRef.current = token;
  }, [token]);

  // While session is being restored from a stored token, render nothing.
  // This prevents ProtectedRoute from redirecting to /login prematurely.
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

          {/* Display Routes */}
          <Route path="/display" element={<WaitingRoomDisplay />} />

          {/* Landing - Public Page */}
          <Route path="/" element={<Landing />} />

          {/* Public Browse Routes - No Login Required */}
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/doctors/:doctorId" element={<DoctorDetail />} />

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
            path="/patient/blog"
            element={
              <ProtectedRoute requiredRoles={['PATIENT']}>
                <PatientBlog />
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
