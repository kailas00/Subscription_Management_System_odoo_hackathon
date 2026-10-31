// ADMIN ONLY for writes (spec). Implement discounts.controller.js
import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize, STAFF } from '../../middleware/auth.js';
import { id, idParam, listQuery, money, optDate, email } from '../../lib/schemas.js';
import * as c from './discounts.controller.js';

const base = z.object({
  name: z.string().trim().min(2), code: z.string().trim().toUpperCase().optional().nullable(),
  type: z.enum(['PERCENT', 'FIXED']), value: money.refine((v) => v > 0, 'Value must be greater than 0'),
  scope: z.enum(['PRODUCT', 'SUBSCRIPTION']), minPurchase: money.optional().nullable(), minQuantity: z.coerce.number().int().min(1).optional().nullable(),
  startDate: optDate, endDate: optDate, usageLimit: z.coerce.number().int().min(1).optional().nullable(),
  productIds: z.array(id).default([]), isActive: z.boolean().optional(),
});
const rules = (b) => (b.type !== 'PERCENT' || !b.value || b.value <= 100) && (!b.startDate || !b.endDate || b.endDate >= b.startDate)
  && (b.scope !== 'PRODUCT' || (b.productIds && b.productIds.length > 0));
const msg = { message: 'Check: percent ≤ 100, end ≥ start, product discounts need at least one product' };
const r = Router();
r.use(authenticate, authorize(...STAFF));
r.get('/', validate({ query: listQuery.extend({ scope: z.string().optional(), valid: z.enum(['true']).optional() }) }), c.list);
r.get('/:id', validate({ params: idParam }), c.get);
r.post('/', authorize('ADMIN'), validate({ body: base.refine(rules, msg) }), c.create);
r.patch('/:id', authorize('ADMIN'), validate({ params: idParam, body: base.partial() }), c.update);
r.delete('/:id', authorize('ADMIN'), validate({ params: idParam }), c.archive);
export default r;
