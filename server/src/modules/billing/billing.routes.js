import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { authenticate, authorize, STAFF } from '../../middleware/auth.js';
import { id, idParam, listQuery, money, optDate, email } from '../../lib/schemas.js';
import { asyncHandler } from '../../lib/errors.js';
import { runBillingCycle } from '../../services/billing.service.js';

const r = Router();
r.post('/run', authenticate, authorize('ADMIN'), validate({ body: z.object({ asOf: optDate }) }),
  asyncHandler(async (req, res) => res.json({ data: await runBillingCycle({ asOf: req.body.asOf || new Date() }) })));
export default r;
