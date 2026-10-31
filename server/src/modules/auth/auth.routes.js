import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/auth.js';
import { email, password } from '../../lib/schemas.js';
import * as c from './auth.controller.js';

const r = Router();
r.post('/signup', validate({ body: z.object({ name: z.string().trim().min(2), email, password, company: z.string().optional(), phone: z.string().optional() }) }), c.signup);
r.post('/login', validate({ body: z.object({ email, password: z.string().min(1, 'Password is required') }) }), c.login);
r.post('/forgot-password', validate({ body: z.object({ email }) }), c.forgotPassword);
r.post('/reset-password', validate({ body: z.object({ token: z.string().min(10), password }) }), c.resetPassword);
r.get('/me', authenticate, c.me);
r.patch('/me', authenticate, validate({ body: z.object({ name: z.string().trim().min(2) }) }), c.updateMe);
r.post('/change-password', authenticate, validate({ body: z.object({ currentPassword: z.string(), newPassword: password }) }), c.changePassword);
export default r;
