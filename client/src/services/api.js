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
    if (error.response?.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
      if (!isAuthEndpoint) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
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

export const analyticsAPI = {
  getTodayAnalytics: () => api.get('/analytics/today'),
  getDoctorAnalytics: (doctorId) => api.get(`/analytics/doctor/${doctorId}`),
  getClinicAnalytics: () => api.get('/analytics/clinic/overview'),
};

export const searchAPI = {
  search: (q) => api.get('/search', { params: { q } }),
  suggestions: (q) => api.get('/search/suggestions', { params: { q } }),
};

export default api;
