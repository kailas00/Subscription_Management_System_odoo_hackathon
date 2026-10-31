// Display metadata for enums — single source for labels & colours.
export const SUBSCRIPTION_FLOW = ['DRAFT', 'QUOTATION', 'CONFIRMED', 'ACTIVE', 'CLOSED'];

export const STATUS = {
  // subscriptions
  DRAFT: { label: 'Draft', tone: 'neutral' },
  QUOTATION: { label: 'Quotation', tone: 'info' },
  CONFIRMED: { label: 'Confirmed', tone: 'accent' },
  ACTIVE: { label: 'Active', tone: 'ok' },
  PAUSED: { label: 'Paused', tone: 'warn' },
  CLOSED: { label: 'Closed', tone: 'neutral' },
  CANCELLED: { label: 'Cancelled', tone: 'bad' },
  // invoices
  PAID: { label: 'Paid', tone: 'ok' },
  OVERDUE: { label: 'Overdue', tone: 'bad' },
};

export const ACTION_LABEL = {
  send: 'Send quotation', confirm: 'Confirm', activate: 'Activate', pause: 'Pause',
  resume: 'Resume', close: 'Close', cancel: 'Cancel', renew: 'Renew',
};
export const DESTRUCTIVE_ACTIONS = ['close', 'cancel'];

export const BILLING_PERIODS = [
  { value: 'DAILY', label: 'Daily', unit: 'day' },
  { value: 'WEEKLY', label: 'Weekly', unit: 'week' },
  { value: 'MONTHLY', label: 'Monthly', unit: 'month' },
  { value: 'YEARLY', label: 'Yearly', unit: 'year' },
];
export const PRODUCT_TYPES = [
  { value: 'SOFTWARE', label: 'Software' }, { value: 'ADDON', label: 'Add-on' },
  { value: 'SERVICE', label: 'Service' }, { value: 'PHYSICAL', label: 'Physical' },
];
export const PAYMENT_METHODS = [
  { value: 'BANK_TRANSFER', label: 'Bank transfer' }, { value: 'UPI', label: 'UPI' }, { value: 'CARD', label: 'Card' },
  { value: 'CASH', label: 'Cash' }, { value: 'CHEQUE', label: 'Cheque' }, { value: 'OTHER', label: 'Other' },
];
export const ROLES = { ADMIN: 'Admin', INTERNAL: 'Internal staff', CUSTOMER: 'Customer' };

// Mirrors the server password policy (lib/schemas.js) for instant feedback.
export const PASSWORD_RULES = [
  { test: (p) => p.length > 8, label: 'More than 8 characters' },
  { test: (p) => /[A-Z]/.test(p), label: 'An uppercase letter' },
  { test: (p) => /[a-z]/.test(p), label: 'A lowercase letter' },
  { test: (p) => /[^A-Za-z0-9]/.test(p), label: 'A special character' },
];
