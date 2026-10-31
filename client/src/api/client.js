// Axios instance — every request goes through here.
// The session lives in an httpOnly cookie set by the server: no token is ever stored in or readable by page scripts.
import axios from 'axios';

export const http = axios.create({ baseURL: '/api', timeout: 15000, withCredentials: true });

http.interceptors.response.use(
  (res) => res.data, // => { data, meta? }
  (err) => {
    const status = err.response?.status;
    const body = err.response?.data?.error;
    if (status === 401 && !err.config.url.startsWith('/auth/')) {
      window.dispatchEvent(new Event('brightloop:unauthorized'));
    }
    const error = new Error(body?.message || (err.code === 'ECONNABORTED' ? 'The server took too long to respond' : 'Cannot reach the server. Check that it is running.'));
    error.status = status;
    error.code = body?.code;
    error.details = body?.details; // [{ field, message }] for form errors
    return Promise.reject(error);
  },
);

/** Map API validation details to { fieldName: message } for forms */
export const fieldErrors = (error) =>
  Object.fromEntries((error?.details || []).map((d) => [d.field, d.message]));
