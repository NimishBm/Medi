import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';

import { Register } from './pages/Register';
import { PatientLogin } from './pages/PatientLogin';
import { DoctorLogin } from './pages/DoctorLogin';
import { ReceptionistLogin } from './pages/ReceptionistLogin';
import { OrganizationLogin } from './pages/OrganizationLogin';
import { OrgRegister } from './pages/OrgRegister';
import { OrgDashboard } from './pages/org/OrgDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';
import { authAPI } from './services/api';
import { setUser } from './store/slices/authSlice';

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

// Doctor Pages
import { DoctorDashboard } from './pages/doctor/Dashboard';
import { DoctorProfile } from './pages/doctor/Profile';
import { DoctorQueue } from './pages/doctor/Queue';
import { DoctorAppointments } from './pages/doctor/Appointments';

// Receptionist Pages
import { ReceptionistDashboard } from './pages/receptionist/Dashboard';
import { ReceptionistAppointments } from './pages/receptionist/Appointments';
import { ReceptionistQueue } from './pages/receptionist/Queue';

// Display
import { WaitingRoomDisplay } from './pages/WaitingRoomDisplay';

export default function App() {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token && !user) {
      const fetchUser = async () => {
        try {
          const response = await authAPI.getMe();
          dispatch(setUser({
            user: response.data,
            token,
          }));
        } catch (error) {
          console.error('Failed to fetch user', error);
        }
      };
      fetchUser();
    }
  }, [token, user, dispatch]);

  return (
    <>
      <Toaster position="top-right" />
      <BrowserRouter future={{ v7_relativeSplatPath: true }}>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Navigate to="/login/patient" replace />} />
          <Route path="/login/patient" element={<PatientLogin />} />
          <Route path="/login/doctor" element={<DoctorLogin />} />
          <Route path="/login/receptionist" element={<ReceptionistLogin />} />
          <Route path="/login/organization" element={<OrganizationLogin />} />
          <Route path="/register/organization" element={<OrgRegister />} />
          <Route path="/register" element={<Register />} />

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

          {/* Doctor Routes */}
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

          {/* Receptionist Routes */}
          <Route
            path="/receptionist"
            element={
              <ProtectedRoute requiredRoles={['RECEPTIONIST']}>
                <ReceptionistDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receptionist/appointments"
            element={
              <ProtectedRoute requiredRoles={['RECEPTIONIST']}>
                <ReceptionistAppointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receptionist/queue"
            element={
              <ProtectedRoute requiredRoles={['RECEPTIONIST']}>
                <ReceptionistQueue />
              </ProtectedRoute>
            }
          />

          {/* Organization Routes */}
          <Route
            path="/org"
            element={
              <ProtectedRoute requiredRoles={['ORGANIZATION']}>
                <OrgDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/org/*"
            element={
              <ProtectedRoute requiredRoles={['ORGANIZATION']}>
                <OrgDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}
