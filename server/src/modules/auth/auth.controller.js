import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { asyncHandler, badRequest, conflict, unauthorized } from '../../lib/errors.js';
import { sendMail, templates } from '../../lib/email.js';

import { passwordFingerprint } from '../../middleware/auth.js';

const sign = (user) => jwt.sign({ sub: String(user.id), pv: passwordFingerprint(user.passwordHash) }, env.jwtSecret,
  { algorithm: 'HS256', expiresIn: env.jwtExpiresIn, jwtid: crypto.randomUUID() });

// Session lives in an httpOnly cookie: page scripts can never read it (XSS can't steal it); SameSite=Strict blocks CSRF.
const cookieOpts = { httpOnly: true, sameSite: 'strict', secure: env.isProd, path: '/api', maxAge: 8 * 60 * 60 * 1000 };
const startSession = (res, user) => res.cookie(env.cookieName, sign(user), cookieOpts);
// Compared against when the email is unknown, so response time doesn't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser-not-a-password', 10);
const publicUser = (u) => ({ id: u.id, email: u.email, name: u.name, role: u.role, customerId: u.customer?.id ?? u.customerId ?? null });
const hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');

// POST /auth/signup — public signup always creates a CUSTOMER (+ linked Customer record).
export const signup = asyncHandler(async (req, res) => {
  const { name, email, password, company, phone } = req.body;
  if (await prisma.user.findUnique({ where: { email } })) throw conflict('An account with this email already exists');
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({ data: { name, email, passwordHash, role: 'CUSTOMER' } });
    // Staff may already have created a Customer with this email → link it instead of duplicating.
    const existing = await tx.customer.findUnique({ where: { email } });
    const customer = existing
      ? await tx.customer.update({ where: { id: existing.id }, data: { userId: u.id } })
      : await tx.customer.create({ data: { name, email, company, phone, userId: u.id } });
    return { ...u, customerId: customer.id };
  });
  startSession(res, user);
  res.status(201).json({ data: { user: publicUser(user) } });
});

export const login = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.body.email }, include: { customer: { select: { id: true } } } });
  const ok = await bcrypt.compare(req.body.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) throw unauthorized('Invalid email or password');
  if (!user.isActive) throw unauthorized('This account has been deactivated');
  startSession(res, user);
  res.json({ data: { user: publicUser(user) } });
});

export const logout = asyncHandler(async (_req, res) => {
  res.clearCookie(env.cookieName, { ...cookieOpts, maxAge: undefined });
  res.json({ data: { ok: true } });
});

// Always 200 — never reveal whether an email is registered.
export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.body.email } });
  if (user && user.isActive) {
    const token = crypto.randomBytes(32).toString('hex');
    await prisma.user.update({
      where: { id: user.id },
      data: { resetTokenHash: hashToken(token), resetTokenExpiry: new Date(Date.now() + 30 * 60 * 1000) },
    });
    const link = `${env.clientUrl}/reset-password?token=${token}`;
    await sendMail({ to: user.email, ...templates.resetPassword(user.name, link) });
  }
  res.json({ data: { message: 'If that email is registered, a reset link has been sent.' } });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const user = await prisma.user.findFirst({
    where: { resetTokenHash: hashToken(req.body.token), resetTokenExpiry: { gt: new Date() } },
  });
  if (!user) throw badRequest('This reset link is invalid or has expired');
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(req.body.password, 10), resetTokenHash: null, resetTokenExpiry: null },
  });
  res.json({ data: { message: 'Password updated. You can now log in.' } });
});

export const me = asyncHandler(async (req, res) => res.json({ data: req.user }));

export const updateMe = asyncHandler(async (req, res) => {
  await prisma.user.update({ where: { id: req.user.id }, data: { name: req.body.name } });
  res.json({ data: { ...req.user, name: req.body.name } });
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!(await bcrypt.compare(req.body.currentPassword, user.passwordHash))) throw badRequest('Current password is incorrect');
  const updated = await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(req.body.newPassword, 10) } });
  startSession(res, updated); // other devices are signed out; this one stays in
  res.json({ data: { message: 'Password changed. Other sessions were signed out.' } });
});
