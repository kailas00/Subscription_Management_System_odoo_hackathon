import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma.js';
import { asyncHandler, badRequest, conflict, notFound } from '../../lib/errors.js';
import { getPaging, paged, findPaged } from '../../lib/pagination.js';

const select = { id: true, name: true, email: true, role: true, isActive: true, createdAt: true };

// GET /users?search=&role=&page=
export const list = asyncHandler(async (req, res) => {
  const paging = getPaging(req.query);
  const where = {
    ...(req.query.role && { role: req.query.role }),
    ...(paging.search && { OR: [{ name: { contains: paging.search, mode: 'insensitive' } }, { email: { contains: paging.search, mode: 'insensitive' } }] }),
  };
  const { rows, total } = await findPaged(prisma.user, { where, select, paging });
  paged(res, rows, total, paging);
});

export const create = asyncHandler(async (req, res) => {
  if (await prisma.user.findUnique({ where: { email: req.body.email } })) throw conflict('Email already in use');
  const { password, ...rest } = req.body;
  const user = await prisma.user.create({ data: { ...rest, passwordHash: await bcrypt.hash(password, 10) }, select });
  res.status(201).json({ data: user });
});

export const update = asyncHandler(async (req, res) => {
  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) throw notFound('User');
  if (target.id === req.user.id && (req.body.isActive === false || (req.body.role && req.body.role !== 'ADMIN'))) {
    throw badRequest('You cannot deactivate or demote your own account');
  }
  if (target.role === 'CUSTOMER' && req.body.role) throw badRequest('Customer accounts cannot be promoted here');
  const user = await prisma.user.update({ where: { id: target.id }, data: req.body, select });
  res.json({ data: user });
});
