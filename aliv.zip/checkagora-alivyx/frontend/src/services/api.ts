import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==================== AUTH SERVICE ====================
export const authService = {
  loginPatient: async (cpf: string, password: string) => {
    const response = await api.post('/auth/patient/login', { cpf, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  registerPatient: async (data: {
    cpf: string;
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => {
    const response = await api.post('/auth/patient/register', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  updatePatientProfile: async (data: {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
  }) => {
    const response = await api.put('/auth/patient/profile', data);
    return response.data;
  },

  loginDoctor: async (crm: string, password: string) => {
    const response = await api.post('/auth/doctor/login', { crm, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  registerDoctor: async (data: {
    crm: string;
    name: string;
    email: string;
    phone: string;
    specialty: string;
    password: string;
    registrationCode?: string;
    ubsId?: number;
  }) => {
    const response = await api.post('/auth/doctor/register', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  updateDoctorProfile: async (data: {
    name?: string;
    email?: string;
    phone?: string;
    specialty?: string;
    password?: string;
  }) => {
    const response = await api.put('/auth/doctor/profile', data);
    return response.data;
  },
};

// ==================== APPOINTMENT SERVICE ====================
export const appointmentService = {
  create: async (data: {
    district: string;
    specialty: string;
    appointment_date: string;
    appointment_time: string;
    ubs_name: string;
  }) => {
    // Primeiro, buscar o ubsId pelo nome da UBS e distrito
    const ubsListResponse = await api.get(`/appointments/ubs/district/${data.district}`);
    const ubsList = ubsListResponse.data.ubs;
    const ubs = ubsList.find((u: any) => u.name === data.ubs_name);
    
    if (!ubs) {
      throw new Error('UBS não encontrada');
    }
    
    // Enviar com os nomes corretos dos campos
    const response = await api.post('/appointments', {
      ubsId: ubs.id,
      specialty: data.specialty,
      appointmentDate: data.appointment_date,
      appointmentTime: data.appointment_time,
      appointmentType: 'exam'
    });
    return response.data;
  },

  getAll: async () => {
    const response = await api.get('/appointments');
    return response.data.appointments;
  },

  getById: async (id: number) => {
    const response = await api.get(`/appointments/${id}`);
    return response.data.appointment;
  },

  cancel: async (id: number) => {
    const response = await api.delete(`/appointments/${id}`);
    return response.data;
  },

  getUBSByDistrict: async (district: string) => {
    const response = await api.get(`/appointments/ubs/district/${district}`);
    return response.data.ubs;
  },

  getDoctorsByUbs: async (ubsId: number) => {
    const response = await api.get(`/appointments/ubs/${ubsId}/doctors`);
    return response.data.doctors;
  },

  getDoctorAppointments: async () => {
    const response = await api.get('/appointments/doctor/list');
    return response.data.appointments;
  },

  updateStatus: async (id: number, status: string) => {
    const response = await api.put(`/appointments/${id}/status`, { status });
    return response.data;
  },
};

// ==================== DOCTOR SERVICE ====================
export const doctorService = {
  getAvailability: async (doctorId: number) => {
    const response = await api.get(`/doctors/${doctorId}/availability`);
    return response.data.availability;
  },

  setAvailability: async (data: {
    day_of_week: number;
    start_time: string;
    end_time: string;
  }) => {
    const response = await api.post('/doctors/availability', data);
    return response.data;
  },

  deleteAvailability: async (id: number) => {
    const response = await api.delete(`/doctors/availability/${id}`);
    return response.data;
  },
};

// ==================== NOTIFICATION SERVICE ====================
export const notificationService = {
  getPatientNotifications: async () => {
    const response = await api.get('/notifications/patient');
    return response.data.notifications;
  },

  getDoctorNotifications: async () => {
    const response = await api.get('/notifications/doctor');
    return response.data.notifications;
  },

  markAsRead: async (id: number) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },
};

export default api;
