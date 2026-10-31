import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize, STAFF } from '../../middleware/auth.js';
import { id, idParam, listQuery, money, optDate, email } from '../../lib/schemas.js';
import * as c from './customers.controller.js';

const body = z.object({
  name: z.string().trim().min(2), email, phone: z.string().optional().nullable(), company: z.string().optional().nullable(),
  address: z.string().optional().nullable(), city: z.string().optional().nullable(), country: z.string().optional().nullable(), gstin: z.string().optional().nullable(),
});
const r = Router();
r.use(authenticate, authorize(...STAFF));
r.get('/', validate({ query: listQuery }), c.list);
r.get('/:id', validate({ params: idParam }), c.get);
r.post('/', validate({ body }), c.create);
r.patch('/:id', validate({ params: idParam, body: body.partial() }), c.update);
export default r;
