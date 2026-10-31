// Only ADMIN can create/modify staff (spec: "Only the admin can add a new member of staff").
import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize } from '../../middleware/auth.js';
import { email, password, idParam, listQuery } from '../../lib/schemas.js';
import * as c from './users.controller.js';

const r = Router();
r.use(authenticate, authorize('ADMIN'));
r.get('/', validate({ query: listQuery.extend({ role: z.enum(['ADMIN', 'INTERNAL', 'CUSTOMER']).optional() }) }), c.list);
r.post('/', validate({ body: z.object({ name: z.string().trim().min(2), email, password, role: z.enum(['ADMIN', 'INTERNAL']) }) }), c.create);
r.patch('/:id', validate({ params: idParam, body: z.object({ name: z.string().trim().min(2).optional(), role: z.enum(['ADMIN', 'INTERNAL']).optional(), isActive: z.boolean().optional() }) }), c.update);
export default r;
