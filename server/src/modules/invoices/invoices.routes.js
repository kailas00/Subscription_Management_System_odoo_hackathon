import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize, STAFF } from '../../middleware/auth.js';
import { id, idParam, listQuery, money, optDate, email } from '../../lib/schemas.js';
import * as c from './invoices.controller.js';

const r = Router();
r.use(authenticate, authorize(...STAFF));
r.get('/', validate({ query: listQuery.extend({
  status: z.enum(['DRAFT', 'CONFIRMED', 'PAID', 'CANCELLED']).optional(), overdue: z.enum(['true']).optional(),
  customerId: id.optional(), subscriptionId: id.optional(), from: optDate, to: optDate,
}) }), c.list);
r.get('/:id', validate({ params: idParam }), c.get);
r.post('/generate', validate({ body: z.object({ subscriptionId: id }) }), c.generate);
r.post('/bulk-confirm', validate({ body: z.object({ ids: z.array(id).min(1).max(500) }) }), c.bulkConfirm);
r.post('/:id/confirm', validate({ params: idParam }), c.confirm);
r.post('/:id/cancel', validate({ params: idParam, body: z.object({ reason: z.string().optional() }) }), c.cancel);
r.post('/:id/send', validate({ params: idParam }), c.send);
export default r;
