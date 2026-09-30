import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('documind_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor for clear, user-facing error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected network error occurred. Please check your connection.';
    if (error.response) {
      if (error.response.status === 401 || error.response.status === 403) {
        // Clear token on auth failure
        if (!window.location.pathname.includes('/auth')) {
          localStorage.removeItem('documind_token');
          localStorage.removeItem('documind_user');
          window.location.href = '/auth';
        }
      }
      message = error.response.data?.error || message;
    } else if (error.request) {
      message = 'Cannot connect to DocuMind API server. Ensure the backend server is running.';
    }
    return Promise.reject(new Error(message));
  }
);
