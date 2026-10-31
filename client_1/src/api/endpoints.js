// ─────────────────────────────────────────────────────────────────────────────
// THE frontend ↔ backend contract. Mirrors server/src/routes.js + docs/API.md.
// Pages import from here ONLY — never call http.get('/...') inside a page.
// Every function resolves to { data, meta? } (see api/client.js).
// ─────────────────────────────────────────────────────────────────────────────
import { http } from './client.js';

const crud = (base) => ({
  list: (params) => http.get(base, { params }),
  get: (id) => http.get(`${base}/${id}`),
  create: (body) => http.post(base, body),
  update: (id, body) => http.patch(`${base}/${id}`, body),
  archive: (id) => http.delete(`${base}/${id}`),
});

export const authApi = {
  signup: (body) => http.post('/auth/signup', body),          // { name, email, password, company?, phone? } → { token, user }
  login: (body) => http.post('/auth/login', body),            // { email, password } → { token, user }
  forgotPassword: (email) => http.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => http.post('/auth/reset-password', { token, password }),
  me: () => http.get('/auth/me'),
  updateMe: (body) => http.patch('/auth/me', body),
  changePassword: (body) => http.post('/auth/change-password', body), // { currentPassword, newPassword }
};

export const usersApi = {                                     // ADMIN only
  list: (params) => http.get('/users', { params }),           // ?search&role&page
  create: (body) => http.post('/users', body),                // { name, email, password, role: ADMIN|INTERNAL }
  update: (id, body) => http.patch(`/users/${id}`, body),     // { name?, role?, isActive? }
};

export const customersApi = {
  list: (params) => http.get('/customers', { params }),
  get: (id) => http.get(`/customers/${id}`),
  create: (body) => http.post('/customers', body),
  update: (id, body) => http.patch(`/customers/${id}`, body),
};

export const productsApi = {
  ...crud('/products'),                                       // list ?search&type&active
  addVariant: (id, body) => http.post(`/products/${id}/variants`, body),          // { attribute, value, extraPrice }
  updateVariant: (id, variantId, body) => http.patch(`/products/${id}/variants/${variantId}`, body),
  removeVariant: (id, variantId) => http.delete(`/products/${id}/variants/${variantId}`),
};

export const taxesApi = crud('/taxes');
export const plansApi = crud('/plans');
export const discountsApi = crud('/discounts');                // list ?scope&valid=true
export const templatesApi = { ...crud('/templates'), update: (id, body) => http.put(`/templates/${id}`, body) };

export const subscriptionsApi = {
  list: (params) => http.get('/subscriptions', { params }),   // ?status=ACTIVE,PAUSED&customerId&planId&search&page
  get: (id) => http.get(`/subscriptions/${id}`),              // includes lines, events, invoices, actions[], totals
  preview: (id) => http.get(`/subscriptions/${id}/preview`),
  create: (body) => http.post('/subscriptions', body),        // { customerId, planId|templateId, startDate, lines[] ... }
  update: (id, body) => http.patch(`/subscriptions/${id}`, body),
  action: (id, action, body = {}) => http.post(`/subscriptions/${id}/actions/${action}`, body), // send|confirm|activate|pause|resume|close|cancel|renew
};

export const invoicesApi = {
  list: (params) => http.get('/invoices', { params }),        // ?status&overdue=true&customerId&subscriptionId&from&to&search
  get: (id) => http.get(`/invoices/${id}`),
  generate: (subscriptionId) => http.post('/invoices/generate', { subscriptionId }),
  bulkConfirm: (ids) => http.post('/invoices/bulk-confirm', { ids }),
  confirm: (id) => http.post(`/invoices/${id}/confirm`),
  cancel: (id, reason) => http.post(`/invoices/${id}/cancel`, { reason }),
  send: (id) => http.post(`/invoices/${id}/send`),
};

export const paymentsApi = {
  list: (params) => http.get('/payments', { params }),        // ?method&invoiceId&from&to
  create: (body) => http.post('/payments', body),             // { invoiceId, method, amount, paymentDate, note }
};

export const billingApi = {
  run: (asOf) => http.post('/billing/run', { asOf }),         // ADMIN → { invoicesCreated, skippedDuplicates, autoClosed, errors }
};

export const reportsApi = {
  summary: (params) => http.get('/reports/summary', { params }),
  revenueTrend: (params) => http.get('/reports/revenue-trend', { params }),   // ?months=12
  subscriptionsByStatus: () => http.get('/reports/subscriptions-by-status'),
  planBreakdown: () => http.get('/reports/plan-breakdown'),
  overdue: (params) => http.get('/reports/overdue', { params }),
};

export const portalApi = {                                    // CUSTOMER role
  summary: () => http.get('/portal/summary'),
  subscriptions: (params) => http.get('/portal/subscriptions', { params }),
  subscription: (id) => http.get(`/portal/subscriptions/${id}`),
  subscriptionAction: (id, action) => http.post(`/portal/subscriptions/${id}/actions/${action}`), // confirm|pause|resume|close
  invoices: (params) => http.get('/portal/invoices', { params }),
  invoice: (id) => http.get(`/portal/invoices/${id}`),
  pay: (id, method) => http.post(`/portal/invoices/${id}/pay`, { method }),
};
