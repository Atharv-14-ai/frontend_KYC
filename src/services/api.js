import axios from 'axios';

// Change this to your deployed backend URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://backend-kyc-5a9c.onrender.com';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(config => {
  const user = localStorage.getItem('user');
  
  if (user) {
    config.headers['X-User'] = user;
  }

  // Handle FormData for file uploads
  if (config.data instanceof FormData) {
    // Let the browser set the Content-Type with the boundary
    delete config.headers['Content-Type'];
  } else {
    config.headers['Content-Type'] = 'application/json';
  }

  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;