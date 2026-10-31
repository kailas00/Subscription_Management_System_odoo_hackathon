// Implement payments.controller.js
import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize, STAFF } from '../../middleware/auth.js';
import { id, idParam, listQuery, money, optDate, email } from '../../lib/schemas.js';
import * as c from './payments.controller.js';

const r = Router();
r.use(authenticate, authorize(...STAFF));
r.get('/', validate({ query: listQuery.extend({ method: z.string().optional(), invoiceId: id.optional(), from: optDate, to: optDate }) }), c.list);
r.post('/', validate({ body: z.object({
  invoiceId: id, method: z.enum(['CASH', 'BANK_TRANSFER', 'CARD', 'UPI', 'CHEQUE', 'OTHER']),
  amount: money.refine((v) => v > 0, 'Amount must be greater than 0'), paymentDate: z.coerce.date().default(() => new Date()),
  note: z.string().max(500).optional().nullable(),
}) }), c.create);
export default r;
