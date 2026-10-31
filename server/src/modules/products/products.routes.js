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
  tagline: z.string().trim().max(140).optional().nullable(),
  features: z.array(z.string().trim().min(1).max(80)).max(6).optional(),
  artKey: z.enum(['care', 'creative', 'cloud', 'meet', 'vault', 'music', 'crm', 'erp', 'connector', 'support']).optional().nullable(),
  // A product photo: an https:// link, or an uploaded picture (PNG/JPEG/WebP only — never SVG) resized in the browser.
  imageUrl: z.union([
    z.string().trim().max(500).regex(/^https:\/\/\S+$/, 'Use an https:// image link'),
    z.string().max(900_000, 'Photo is too large — choose a smaller image').regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/, 'Upload a PNG, JPEG or WebP image'),
    z.literal('').transform(() => null),
  ]).optional().nullable(),
  inCatalog: z.boolean().optional(),
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
