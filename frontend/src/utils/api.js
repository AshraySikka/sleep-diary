// utils/api.js
// -----------------------------------------------------------------------
// Axios instance configured for the Django DRF backend.
// Handles base URL, auth headers, and token refresh automatically.
// All API calls in the app go through this instance.
// -----------------------------------------------------------------------

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---- Request interceptor ----
// Attaches the JWT access token to every request automatically.
// Reads from localStorage so it persists across page refreshes.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---- Response interceptor ----
// If a request fails with 401 (token expired), automatically
// tries to refresh the access token using the stored refresh token.
// If refresh also fails, logs the user out.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        // No refresh token — clear everything and redirect to login
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          `${BASE_URL}/api/auth/token/refresh/`,
          { refresh: refreshToken }
        );

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch {
        // Refresh failed — session expired, log out
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// ---- Auth endpoints ----
export const authAPI = {
  register: (data) => api.post('/api/auth/register/', data),
  verifyOTP: (data) => api.post('/api/auth/verify-otp/', data),
  resendOTP: (data) => api.post('/api/auth/resend-otp/', data),
  login: (data) => api.post('/api/auth/login/', data),
  logout: (data) => api.post('/api/auth/logout/', data),
  getProfile: () => api.get('/api/auth/profile/'),
  updateProfile: (data) => api.patch('/api/auth/profile/', data),
  savePushSubscription: (data) => api.post('/api/auth/push-subscription/', data),
};

// ---- Diary endpoints ----
export const diaryAPI = {
  getEntries: (params) => api.get('/api/diary/entries/', { params }),
  getEntry: (date) => api.get(`/api/diary/entries/${date}/`),
  createEntry: (data) => api.post('/api/diary/entries/', data),
  updateEntry: (date, data) => api.patch(`/api/diary/entries/${date}/`, data),
  deleteEntry: (date) => api.delete(`/api/diary/entries/${date}/`),
  getCalendar: (month) => api.get('/api/diary/calendar/', { params: { month } }),
  getDashboard: (days) => api.get('/api/diary/dashboard/', { params: { days } }),
  getFormulas: () => api.get('/api/diary/formulas/'),
};

// ---- Reports endpoints ----
export const reportsAPI = {
  generateReport: (data) => api.post('/api/reports/generate/', data, {
    responseType: 'blob', // Important — tells axios to handle PDF bytes
  }),
  emailReport: (data) => api.post('/api/reports/email/', data),
};

export default api;