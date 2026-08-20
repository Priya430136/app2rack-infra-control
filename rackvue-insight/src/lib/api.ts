import axios from 'axios';
import { createIsomorphicFn } from '@tanstack/react-start';
import { getAuthToken, clearAuthToken, AUTH_COOKIE_NAME } from './auth-token';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Many pages call this file's functions through a TanStack Start
// `createServerFn`, which actually executes on the Node server (not in the
// browser) - localStorage doesn't exist there. On the server, pull the JWT
// out of the request cookie mirrored at login time instead (see auth-token.ts).
const getServerAuthToken = createIsomorphicFn()
  .server(async () => {
    const { getCookie } = await import('@tanstack/react-start/server');
    return getCookie(AUTH_COOKIE_NAME) || null;
  })
  .client(async () => null);

// Add a request interceptor to attach the JWT token
api.interceptors.request.use(
  async (config) => {
    if (typeof window !== 'undefined') {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } else {
      const token = await getServerAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        clearAuthToken();
        // window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
