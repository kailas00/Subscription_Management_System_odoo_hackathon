import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { unauthorized, forbidden } from '../lib/errors.js';

/** Short fingerprint of the password hash: changing or resetting the password invalidates every older session. */
export const passwordFingerprint = (passwordHash) => crypto.createHash('sha256').update(passwordHash).digest('base64url').slice(0, 16);

export function readCookie(req, name) {
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i > -1 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
}

// Verifies the httpOnly session cookie and loads req.user = { id, email, name, role, customerId }
export async function authenticate(req, _res, next) {
  try {
    const token = readCookie(req, env.cookieName);
    if (!token) throw unauthorized();
    const payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
    const user = await prisma.user.findUnique({
      where: { id: Number(payload.sub) },
      select: { id: true, email: true, name: true, role: true, isActive: true, passwordHash: true, customer: { select: { id: true } } },
    });
    if (!user || !user.isActive) throw unauthorized('Account disabled or not found');
    if (payload.pv !== passwordFingerprint(user.passwordHash)) throw unauthorized('Your password was changed. Please log in again.');
    req.user = { id: user.id, email: user.email, name: user.name, role: user.role, customerId: user.customer?.id ?? null };
    next();
  } catch (err) {
    next(err.status ? err : unauthorized('Session expired, please log in again'));
  }
}

export const authorize = (...roles) => (req, _res, next) =>
  roles.includes(req.user?.role) ? next() : next(forbidden());

export const STAFF = ['ADMIN', 'INTERNAL'];
