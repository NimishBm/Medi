import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only force-redirect on 401 for protected routes, not login/register calls
    const url = error.config?.url || '';
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/register');
    if (error.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login/patient';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  registerDoctor: (data) => api.post('/auth/register/doctor', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const userAPI = {
  getMe: () => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
};

export const doctorAPI = {
  getDoctors: () => api.get('/doctors'),
  getDoctorById: (id) => api.get(`/doctors/${id}`),
};

export const appointmentAPI = {
  createAppointment: (data) => api.post('/appointments', data),
  getAppointments: () => api.get('/appointments'),
  getTodayAppointments: () => api.get('/appointments/today'),
  getAppointmentById: (id) => api.get(`/appointments/${id}`),
  updateAppointment: (id, data) => api.put(`/appointments/${id}`, data),
  cancelAppointment: (id) => api.post(`/appointments/${id}/cancel`),
  checkInPatient: (id) => api.post(`/appointments/${id}/check-in`),
};

export const queueAPI = {
  getQueueByDoctorId: (doctorId) => api.get(`/queue/doctor/${doctorId}`),
  callNextPatient: (data) => api.post('/queue/call-next', data),
  skipPatient: (data) => api.post('/queue/skip', data),
  recallPatient: (data) => api.post('/queue/recall', data),
  startConsultation: (data) => api.post('/queue/start-consultation', data),
  completeConsultation: (data) => api.post('/queue/complete-consultation', data),
  markNoShow: (data) => api.post('/queue/no-show', data),
};

export const consultationAPI = {
  createConsultation: (data) => api.post('/consultations', data),
  getConsultationsByPatient: (patientId) => api.get(`/consultations/patient/${patientId}`),
  getConsultationsByDoctor: (doctorId) => api.get(`/consultations/doctor/${doctorId}`),
  getConsultationById: (id) => api.get(`/consultations/${id}`),
  updateConsultation: (id, data) => api.put(`/consultations/${id}`, data),
};

export const doctorProfileAPI = {
  updateMe: (data) => api.put('/doctors/me', data),
};

export const prescriptionAPI = {
  createPrescription: (data) => api.post('/prescriptions', data),
  getPrescriptionsByPatient: (patientId) => api.get(`/prescriptions/patient/${patientId}`),
  getPrescriptionById: (id) => api.get(`/prescriptions/${id}`),
};

export const paymentAPI = {
  createPayment: (data) => api.post('/payments', data),
  getPaymentsByPatient: (patientId) => api.get(`/payments/patient/${patientId}`),
  getPaymentById: (id) => api.get(`/payments/${id}`),
  refundPayment: (id, data) => api.post(`/payments/${id}/refund`, data),
};

export const organizationAPI = {
  register: (data) => api.post('/organization/register', data),
  login: (data) => api.post('/organization/login', data),
  getMe: () => api.get('/organization/me'),
  // approved doctors
  getDoctors: () => api.get('/org/doctors'),
  addDoctor: (doctorId) => api.post(`/org/doctors/${doctorId}`),
  removeDoctor: (doctorId) => api.delete(`/org/doctors/${doctorId}`),
  // join requests
  getRequests: () => api.get('/org/requests'),
  approveRequest: (doctorId) => api.post(`/org/requests/${doctorId}/approve`),
  rejectRequest: (doctorId) => api.post(`/org/requests/${doctorId}/reject`),
  // data
  getTodayAppointments: () => api.get('/org/appointments/today'),
  getAnalytics: () => api.get('/org/analytics'),
};

export const doctorOrgAPI = {
  requestJoin: (orgId) => api.post('/doctors/me/request-join', { orgId }),
  cancelRequest: () => api.delete('/doctors/me/request-join'),
};

export const analyticsAPI = {
  getTodayAnalytics: () => api.get('/analytics/today'),
  getDoctorAnalytics: (doctorId) => api.get(`/analytics/doctor/${doctorId}`),
  getClinicAnalytics: () => api.get('/analytics/clinic/overview'),
};

export default api;
