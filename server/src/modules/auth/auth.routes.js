import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { email, password } from '../../lib/schemas.js';
import * as c from './auth.controller.js';
import { rateLimit, byIpAndEmail } from '../../lib/rateLimit.js';

const FIFTEEN_MIN = 15 * 60 * 1000;
const loginLimit = rateLimit({ windowMs: FIFTEEN_MIN, max: 10, key: byIpAndEmail });
const signupLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 10 });
const resetLimit = rateLimit({ windowMs: FIFTEEN_MIN, max: 5, key: byIpAndEmail });

const r = Router();
r.post('/signup', signupLimit, validate({ body: z.object({ name: z.string().trim().min(2), email, password, company: z.string().optional(), phone: z.string().optional() }) }), c.signup);
r.post('/login', loginLimit, validate({ body: z.object({ email, password: z.string().min(1, 'Password is required') }) }), c.login);
r.post('/forgot-password', resetLimit, validate({ body: z.object({ email }) }), c.forgotPassword);
r.post('/reset-password', resetLimit, validate({ body: z.object({ token: z.string().min(10), password }) }), c.resetPassword);
r.post('/logout', c.logout);
r.get('/me', authenticate, c.me);
r.patch('/me', authenticate, validate({ body: z.object({ name: z.string().trim().min(2) }) }), c.updateMe);
r.post('/change-password', authenticate, rateLimit({ windowMs: FIFTEEN_MIN, max: 10, key: (req) => String(req.user.id) }), validate({ body: z.object({ currentPassword: z.string(), newPassword: password }) }), c.changePassword);
export default r;
