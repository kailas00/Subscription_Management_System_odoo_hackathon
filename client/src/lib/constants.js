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

// Plain-language statuses for customers (the portal never shows internal workflow words)
export const CUSTOMER_STATUS = {
  DRAFT: { label: 'Requested', tone: 'neutral' },
  QUOTATION: { label: 'Awaiting your approval', tone: 'info' },
  CONFIRMED: { label: 'Starting soon', tone: 'accent' },
  ACTIVE: { label: 'Active', tone: 'ok' },
  PAUSED: { label: 'Paused', tone: 'warn' },
  CLOSED: { label: 'Ended', tone: 'neutral' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
  PAID: { label: 'Paid', tone: 'ok' },
  OVERDUE: { label: 'Overdue', tone: 'bad' },
  INVOICE_OPEN: { label: 'To pay', tone: 'info' },
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
export const ROLES = { ADMIN: 'Admin', INTERNAL: 'Billing staff', CUSTOMER: 'Customer' };
// One line per role: why you are here. Shown on Today.
export const ROLE_GOAL = {
  ADMIN: 'You set up what we sell and who can sign in, and you run billing.',
  INTERNAL: 'Your job: turn customer requests into subscriptions, and get every bill paid.',
};

// Mirrors the server password policy (lib/schemas.js) for instant feedback.
export const PASSWORD_RULES = [
  { test: (p) => p.length > 8, label: 'More than 8 characters' },
  { test: (p) => /[A-Z]/.test(p), label: 'An uppercase letter' },
  { test: (p) => /[a-z]/.test(p), label: 'A lowercase letter' },
  { test: (p) => /[^A-Za-z0-9]/.test(p), label: 'A special character' },
];
