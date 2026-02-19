// API configuration for different environments
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  endpoints: {
    auth: `${API_BASE_URL}/api/auth`,
    halls: `${API_BASE_URL}/api/halls`,
    bookings: `${API_BASE_URL}/api/bookings`,
    users: `${API_BASE_URL}/api/users`,
  }
};

export default API_CONFIG;