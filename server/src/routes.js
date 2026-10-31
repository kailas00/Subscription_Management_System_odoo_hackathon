// ─────────────────────────────────────────────────────────────────────────────
// API route registry
// Full contract: docs/API.md   |   Frontend mirror: client/src/api/endpoints.js
// ─────────────────────────────────────────────────────────────────────────────
import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/users.routes.js';
import customerRoutes from './modules/customers/customers.routes.js';
import productRoutes from './modules/products/products.routes.js';
import taxRoutes from './modules/taxes/taxes.routes.js';
import planRoutes from './modules/plans/plans.routes.js';
import discountRoutes from './modules/discounts/discounts.routes.js';
import templateRoutes from './modules/templates/templates.routes.js';
import subscriptionRoutes from './modules/subscriptions/subscriptions.routes.js';
import invoiceRoutes from './modules/invoices/invoices.routes.js';
import paymentRoutes from './modules/payments/payments.routes.js';
import billingRoutes from './modules/billing/billing.routes.js';
import reportRoutes from './modules/reports/reports.routes.js';
import portalRoutes from './modules/portal/portal.routes.js';

export const apiRouter = Router();
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/customers', customerRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/taxes', taxRoutes);
apiRouter.use('/plans', planRoutes);
apiRouter.use('/discounts', discountRoutes);
apiRouter.use('/templates', templateRoutes);
apiRouter.use('/subscriptions', subscriptionRoutes);
apiRouter.use('/invoices', invoiceRoutes);
apiRouter.use('/payments', paymentRoutes);
apiRouter.use('/billing', billingRoutes);
apiRouter.use('/reports', reportRoutes);
apiRouter.use('/portal', portalRoutes);