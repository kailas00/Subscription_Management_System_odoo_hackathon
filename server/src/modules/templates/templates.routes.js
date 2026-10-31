import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize, STAFF } from '../../middleware/auth.js';
import { id, idParam, listQuery, money, optDate, email } from '../../lib/schemas.js';
import * as c from './templates.controller.js';

const line = z.object({ productId: id, variantId: id.optional().nullable(), quantity: z.coerce.number().int().min(1).default(1) });
const body = z.object({
  name: z.string().trim().min(2), validityDays: z.coerce.number().int().min(1).max(365).default(30),
  planId: id, notes: z.string().optional().nullable(), lines: z.array(line).min(1, 'Add at least one product line'),
});
const r = Router();
r.use(authenticate, authorize(...STAFF));
r.get('/', validate({ query: listQuery }), c.list);
r.get('/:id', validate({ params: idParam }), c.get);
r.post('/', validate({ body }), c.create);
r.put('/:id', validate({ params: idParam, body }), c.update);   // replaces lines
r.delete('/:id', validate({ params: idParam }), c.archive);
export default r;
