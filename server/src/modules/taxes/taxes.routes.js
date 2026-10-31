import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize, STAFF } from '../../middleware/auth.js';
import { id, idParam, listQuery, money, optDate, email } from '../../lib/schemas.js';
import * as c from './taxes.controller.js';

const body = z.object({ name: z.string().trim().min(2), type: z.enum(['PERCENT', 'FIXED']), rate: money, isActive: z.boolean().optional() })
  .refine((b) => b.type !== 'PERCENT' || b.rate <= 100, { message: 'Percentage tax cannot exceed 100', path: ['rate'] });
const r = Router();
r.use(authenticate, authorize(...STAFF));
r.get('/', validate({ query: listQuery }), c.list);
r.post('/', authorize('ADMIN'), validate({ body }), c.create);
r.patch('/:id', authorize('ADMIN'), validate({ params: idParam, body: body.innerType().partial() }), c.update);
r.delete('/:id', authorize('ADMIN'), validate({ params: idParam }), c.archive);
export default r;
