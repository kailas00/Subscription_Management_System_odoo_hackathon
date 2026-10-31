// Implement products.controller.js
import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize, STAFF } from '../../middleware/auth.js';
import { id, idParam, listQuery, money, optDate, email } from '../../lib/schemas.js';
import * as c from './products.controller.js';

const body = z.object({
  name: z.string().trim().min(2), type: z.enum(['SERVICE', 'SOFTWARE', 'ADDON', 'PHYSICAL']),
  salesPrice: money, costPrice: money.default(0), notes: z.string().optional().nullable(),
  taxId: id.optional().nullable(), isActive: z.boolean().optional(),
});
const variant = z.object({ attribute: z.string().trim().min(1), value: z.string().trim().min(1), extraPrice: money.default(0) });
const vParams = z.object({ id, variantId: id });

const r = Router();
r.use(authenticate, authorize(...STAFF));
r.get('/', validate({ query: listQuery.extend({ type: z.string().optional(), active: z.enum(['true', 'false']).optional() }) }), c.list);
r.get('/:id', validate({ params: idParam }), c.get);
r.post('/', authorize('ADMIN'), validate({ body }), c.create);
r.patch('/:id', authorize('ADMIN'), validate({ params: idParam, body: body.partial() }), c.update);
r.delete('/:id', authorize('ADMIN'), validate({ params: idParam }), c.archive);
r.post('/:id/variants', authorize('ADMIN'), validate({ params: idParam, body: variant }), c.addVariant);
r.patch('/:id/variants/:variantId', authorize('ADMIN'), validate({ params: vParams, body: variant.partial() }), c.updateVariant);
r.delete('/:id/variants/:variantId', authorize('ADMIN'), validate({ params: vParams }), c.removeVariant);
export default r;
