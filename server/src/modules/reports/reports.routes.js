import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize, STAFF } from '../../middleware/auth.js';
import { id, idParam, listQuery, money, optDate, email } from '../../lib/schemas.js';
import * as c from './reports.controller.js';

const range = listQuery.extend({ from: optDate, to: optDate, planId: id.optional() });
const r = Router();
r.use(authenticate, authorize(...STAFF));
r.get('/summary', validate({ query: range }), c.summary);
r.get('/revenue-trend', validate({ query: range.extend({ months: z.coerce.number().int().min(1).max(24).default(12) }) }), c.revenueTrend);
r.get('/subscriptions-by-status', validate({ query: range }), c.subscriptionsByStatus);
r.get('/plan-breakdown', validate({ query: range }), c.planBreakdown);
r.get('/overdue', validate({ query: range }), c.overdue);
export default r;
