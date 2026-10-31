// CUSTOMER role only; every query MUST filter by req.user.customerId.
import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize, STAFF } from '../../middleware/auth.js';
import { id, idParam, listQuery, money, optDate, email } from '../../lib/schemas.js';
import * as c from './portal.controller.js';

const r = Router();
r.use(authenticate, authorize('CUSTOMER'));
r.get('/summary', c.summary);
r.get('/subscriptions', validate({ query: listQuery.extend({ status: z.string().optional() }) }), c.listSubscriptions);
r.get('/subscriptions/:id', validate({ params: idParam }), c.getSubscription);
r.post('/subscriptions/:id/actions/:action', validate({ params: z.object({ id, action: z.enum(['confirm', 'pause', 'resume', 'close']) }) }), c.runAction);
r.get('/invoices', validate({ query: listQuery.extend({ status: z.string().optional() }) }), c.listInvoices);
r.get('/invoices/:id', validate({ params: idParam }), c.getInvoice);
r.post('/invoices/:id/pay', validate({ params: idParam, body: z.object({ method: z.enum(['CARD', 'UPI', 'BANK_TRANSFER']) }) }), c.pay);
export default r;
