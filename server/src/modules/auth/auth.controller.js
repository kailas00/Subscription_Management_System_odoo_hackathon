import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';
import { env } from '../../config/env.js';
import { asyncHandler, badRequest, conflict, unauthorized } from '../../lib/errors.js';
import { sendMail, templates } from '../../lib/email.js';

const sign = (user) => jwt.sign({ sub: String(user.id), role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
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
  res.status(201).json({ data: { token: sign(user), user: publicUser(user) } });
});

export const login = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { email: req.body.email }, include: { customer: { select: { id: true } } } });
  const ok = user && (await bcrypt.compare(req.body.password, user.passwordHash));
  if (!ok) throw unauthorized('Invalid email or password');
  if (!user.isActive) throw unauthorized('This account has been deactivated');
  res.json({ data: { token: sign(user), user: publicUser(user) } });
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
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(req.body.newPassword, 10) } });
  res.json({ data: { message: 'Password changed' } });
});
