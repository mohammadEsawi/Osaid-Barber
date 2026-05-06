import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// --- Auth ---
export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: object) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// --- Services ---
export const servicesApi = {
  getAll: (activeOnly = false) => api.get(`/services${activeOnly ? '?active_only=true' : ''}`),
  getById: (id: number) => api.get(`/services/${id}`),
  create: (data: object) => api.post('/services', data),
  update: (id: number, data: object) => api.put(`/services/${id}`, data),
  delete: (id: number) => api.delete(`/services/${id}`),
};

// --- Barbers ---
export const barbersApi = {
  getAll: () => api.get('/barbers'),
  getById: (id: number) => api.get(`/barbers/${id}`),
  getAvailability: (id: number) => api.get(`/barbers/${id}/availability`),
  getUnavailableSlots: (id: number, date?: string) => api.get(`/barbers/${id}/unavailable-slots${date ? `?date=${date}` : ''}`),
  create: (data: object) => api.post('/barbers', data),
  update: (id: number, data: object) => api.put(`/barbers/${id}`, data),
  delete: (id: number) => api.delete(`/barbers/${id}`),
  uploadImage: (id: number, file: File) => {
    const fd = new FormData();
    fd.append('image', file);
    return api.post(`/barbers/${id}/image`, fd, { headers: { 'Content-Type': undefined } });
  },
  updateAvailability: (id: number, data: object) => api.put(`/barbers/${id}/availability`, data),
  addUnavailableSlot: (id: number, data: object) => api.post(`/barbers/${id}/unavailable-slots`, data),
  removeUnavailableSlot: (barberId: number, slotId: number) => api.delete(`/barbers/${barberId}/unavailable-slots/${slotId}`),
};

// --- Appointments ---
export const appointmentsApi = {
  getAll: (params?: object) => api.get('/appointments', { params }),
  getById: (id: number) => api.get(`/appointments/${id}`),
  getByPhone: (phone: string) => api.get(`/appointments/my?phone=${phone}`),
  create: (data: object) => api.post('/appointments', data),
  update: (id: number, data: object) => api.put(`/appointments/${id}`, data),
  updateStatus: (id: number, status: string, notes?: string) => api.put(`/appointments/${id}/status`, { status, notes }),
  delete: (id: number) => api.delete(`/appointments/${id}`),
  cancelByPhone: (id: number, phone: string) => api.put(`/appointments/${id}/cancel`, { phone }),
  checkAvailability: (barber_id: number, date: string, duration: number) =>
    api.get('/appointments/availability/check', { params: { barber_id, date, duration } }),
};

// --- Products ---
export const productsApi = {
  getAll: (params?: { search?: string; category?: string; active_only?: boolean }) => api.get('/products', { params }),
  getById: (id: number) => api.get(`/products/${id}`),
  create: (data: object) => api.post('/products', data),
  update: (id: number, data: object) => api.put(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
  uploadImage: (file: File) => {
    const fd = new FormData();
    fd.append('image', file);
    return api.post('/products/upload', fd, { headers: { 'Content-Type': undefined } });
  },
};

// --- Orders ---
export const ordersApi = {
  getAll: (params?: object) => api.get('/orders', { params }),
  getById: (id: number) => api.get(`/orders/${id}`),
  create: (data: object) => api.post('/orders', data),
  updateStatus: (id: number, status: string) => api.put(`/orders/${id}/status`, { status }),
};

// --- Settings ---
export const settingsApi = {
  getAll: () => api.get('/settings'),
  updateMany: (settings: Record<string, string>) => api.put('/settings', { settings }),
};

// --- Messages ---
export const messagesApi = {
  send: (data: object) => api.post('/messages', data),
  getAll: (params?: object) => api.get('/messages', { params }),
  markRead: (id: number) => api.put(`/messages/${id}/read`),
  delete: (id: number) => api.delete(`/messages/${id}`),
};

// --- Reports ---
export const reportsApi = {
  getDashboard: () => api.get('/reports/dashboard'),
  getBookings: (params?: object) => api.get('/reports/bookings', { params }),
  getIncome: (year?: number) => api.get('/reports/income', { params: { year } }),
  getProducts: () => api.get('/reports/products'),
  getBarbers: (params?: object) => api.get('/reports/barbers', { params }),
};

export default api;
