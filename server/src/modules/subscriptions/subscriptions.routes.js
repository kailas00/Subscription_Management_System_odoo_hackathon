import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize, STAFF } from '../../middleware/auth.js';
import { id, idParam, listQuery, money, optDate, email } from '../../lib/schemas.js';
import * as c from './subscriptions.controller.js';

const line = z.object({
  productId: id, variantId: id.optional().nullable(), quantity: z.coerce.number().int().min(1),
  unitPrice: money.optional(),          // omitted => product.salesPrice + variant.extraPrice
  taxId: id.optional().nullable(),      // omitted => product.taxId
  description: z.string().optional().nullable(),
});
const create = z.object({
  customerId: id, planId: id.optional(), templateId: id.optional(),   // templateId fills plan + lines + validity
  startDate: z.coerce.date(), expiryDate: optDate, paymentTermDays: z.coerce.number().int().min(0).max(120).default(15),
  quotationValidUntil: optDate, discountId: id.optional().nullable(), notes: z.string().optional().nullable(),
  lines: z.array(line).default([]),
}).refine((b) => b.planId || b.templateId, { message: 'Choose a plan or a quotation template', path: ['planId'] })
  .refine((b) => !b.expiryDate || b.expiryDate > b.startDate, { message: 'Expiry must be after start date', path: ['expiryDate'] });
const update = z.object({
  customerId: id, planId: id, startDate: z.coerce.date(), expiryDate: optDate, paymentTermDays: z.coerce.number().int().min(0).max(120),
  quotationValidUntil: optDate, discountId: id.optional().nullable(), notes: z.string().optional().nullable(), lines: z.array(line),
}).partial();
const action = z.object({ id, action: z.enum(['send', 'confirm', 'activate', 'pause', 'resume', 'close', 'cancel', 'renew']) });

const r = Router();
r.use(authenticate, authorize(...STAFF));
r.get('/', validate({ query: listQuery.extend({ status: z.string().optional(), customerId: id.optional(), planId: id.optional(), requested: z.enum(['true', 'false']).optional() }) }), c.list);
r.get('/:id', validate({ params: idParam }), c.get);
r.get('/:id/preview', validate({ params: idParam }), c.preview);
r.post('/', validate({ body: create }), c.create);
r.patch('/:id', validate({ params: idParam, body: update }), c.update);
r.post('/:id/actions/:action', validate({ params: action, body: z.object({ note: z.string().optional(), newExpiryDate: optDate }) }), c.runAction);
export default r;
