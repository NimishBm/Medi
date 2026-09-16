import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ProtectedRoute } from './components/ProtectedRoute';
import { authAPI } from './services/api';
import { setUser } from './store/slices/authSlice';

// Patient Pages
import { PatientDashboard } from './pages/patient/Dashboard';
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
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Display Routes */}
          <Route path="/display" element={<WaitingRoomDisplay />} />

          {/* Patient Routes */}
          <Route
            path="/patient"
            element={
              <ProtectedRoute requiredRoles={['PATIENT']}>
                <PatientDashboard />
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

          {/* Default Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}
