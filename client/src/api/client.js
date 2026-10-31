// (shared). Axios instance — every request goes through here.
import axios from 'axios';

export const TOKEN_KEY = 'brightloop.token';

export const http = axios.create({ baseURL: '/api', timeout: 15000 });

http.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch { /* storage blocked */ }
  return config;
});

http.interceptors.response.use(
  (res) => res.data, // => { data, meta? }
  (err) => {
    const status = err.response?.status;
    const body = err.response?.data?.error;
    if (status === 401 && !err.config.url.startsWith('/auth/')) {
      window.dispatchEvent(new Event('brightloop:unauthorized'));
    }
    const error = new Error(body?.message || (err.code === 'ECONNABORTED' ? 'The server took too long to respond' : 'Cannot reach the server'));
    error.status = status;
    error.code = body?.code;
    error.details = body?.details; // [{ field, message }] for form errors
    return Promise.reject(error);
  },
);

/** Map API validation details to { fieldName: message } for forms */
export const fieldErrors = (error) =>
  Object.fromEntries((error?.details || []).map((d) => [d.field, d.message]));
