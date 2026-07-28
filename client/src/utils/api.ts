import axios from 'axios';

// Use VITE_API_URL env variable for deployed backend (Railway),
// fall back to /api which is proxied to localhost:8000 in local dev
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api',
});

// Automatically inject JWT token into all requests
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

// Intercept responses to handle auth errors and server issues
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const contentType = error.response.headers['content-type'] || '';
      
      // If the response is HTML instead of JSON, it means the API requests are being
      // rewritten to index.html (common routing configuration issue in production)
      if (contentType.includes('text/html') || error.response.status === 405) {
        error.response.data = {
          detail: "API configuration mismatch: The frontend is hitting Vercel's static router instead of a running FastAPI backend. Please ensure the backend is deployed (e.g., on Railway) and the VITE_API_URL environment variable is configured in Vercel settings."
        };
      }
      
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Dispatch custom event to let components react
        window.dispatchEvent(new Event('auth-expired'));
      }
    } else if (error.request) {
      // Network error (no response received)
      error.message = "Cannot connect to server. Please verify that the FastAPI backend server is running.";
    }
    return Promise.reject(error);
  }
);

export default api;
