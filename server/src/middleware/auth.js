import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { unauthorized, forbidden } from '../lib/errors.js';

// Verifies "Authorization: Bearer <jwt>" and loads req.user = { id, email, name, role, customerId }
export async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw unauthorized();
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: Number(payload.sub) },
      select: { id: true, email: true, name: true, role: true, isActive: true, customer: { select: { id: true } } },
    });
    if (!user || !user.isActive) throw unauthorized('Account disabled or not found');
    req.user = { id: user.id, email: user.email, name: user.name, role: user.role, customerId: user.customer?.id ?? null };
    next();
  } catch (err) {
    next(err.status ? err : unauthorized('Session expired, please log in again'));
  }
}

// Usage: authorize('ADMIN') or authorize('ADMIN', 'INTERNAL')
export const authorize = (...roles) => (req, _res, next) =>
  roles.includes(req.user?.role) ? next() : next(forbidden());

export const STAFF = ['ADMIN', 'INTERNAL'];
