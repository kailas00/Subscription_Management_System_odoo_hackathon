import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize, STAFF } from '../../middleware/auth.js';
import { id, idParam, listQuery, money, optDate, email } from '../../lib/schemas.js';
import * as c from './plans.controller.js';

const base = z.object({
  name: z.string().trim().min(2), price: money.default(0),
  billingPeriod: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']), intervalCount: z.coerce.number().int().min(1).max(36).default(1),
  minQuantity: z.coerce.number().int().min(1).default(1), startDate: optDate, endDate: optDate,
  autoClose: z.boolean().default(false), closable: z.boolean().default(true), pausable: z.boolean().default(false),
  renewable: z.boolean().default(true), isActive: z.boolean().optional(),
});
const datesOk = (b) => !b.startDate || !b.endDate || b.endDate > b.startDate;
const r = Router();
r.use(authenticate, authorize(...STAFF));
r.get('/', validate({ query: listQuery.extend({ active: z.enum(['true', 'false']).optional() }) }), c.list);
r.get('/:id', validate({ params: idParam }), c.get);
r.post('/', authorize('ADMIN'), validate({ body: base.refine(datesOk, { message: 'End date must be after start date', path: ['endDate'] }) }), c.create);
r.patch('/:id', authorize('ADMIN'), validate({ params: idParam, body: base.partial().refine(datesOk, { message: 'End date must be after start date', path: ['endDate'] }) }), c.update);
r.delete('/:id', authorize('ADMIN'), validate({ params: idParam }), c.archive);
export default r;
