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
r.get('/overview', c.overview);
r.get('/subscriptions', validate({ query: listQuery.extend({ status: z.string().optional() }) }), c.listSubscriptions);
r.get('/subscriptions/:id', validate({ params: idParam }), c.getSubscription);
r.post('/subscriptions/:id/actions/:action', validate({ params: z.object({ id, action: z.enum(['confirm', 'pause', 'resume', 'close']) }) }), c.runAction);
r.get('/catalog', c.catalog);
r.post('/requests', validate({ body: z.object({
  productId: id, variantId: id.optional().nullable(), planId: id,
  quantity: z.coerce.number().int().min(1).max(500),
  note: z.string().trim().max(300).optional().nullable(),
}) }), c.requestSubscription);
r.get('/invoices', validate({ query: listQuery.extend({ status: z.string().optional() }) }), c.listInvoices);
r.get('/invoices/:id', validate({ params: idParam }), c.getInvoice);
r.post('/invoices/:id/pay', validate({ params: idParam, body: z.object({ method: z.enum(['CARD', 'UPI', 'BANK_TRANSFER']) }) }), c.pay);
export default r;
