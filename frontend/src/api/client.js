import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cs_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // If unauthorized and not on login/register page, clear credentials
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register') && window.location.pathname !== '/') {
        localStorage.removeItem('cs_token');
        localStorage.removeItem('cs_user');
        window.location.href = '/login?session_expired=1';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

export const ticketAPI = {
  previewTriage: (data) => api.post('/tickets/preview-triage', data),
  create: (data) => api.post('/tickets', data),
  list: (params) => api.get('/tickets', { params }),
  getById: (id) => api.get(`/tickets/${id}`),
  updateStatus: (id, status) => api.patch(`/tickets/${id}/status`, { status }),
  assign: (id, agentId) => api.patch(`/tickets/${id}/assign`, { agentId }),
  addComment: (id, commentData) => api.post(`/tickets/${id}/comments`, commentData),
  getAnalytics: () => api.get('/tickets/analytics'),
};

export const agentAPI = {
  list: () => api.get('/agents'),
};

export default api;
