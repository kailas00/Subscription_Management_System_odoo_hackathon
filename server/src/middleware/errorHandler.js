import { Prisma } from '@prisma/client';

export function notFoundRoute(req, res) {
  res.status(404).json({ error: { code: 'ROUTE_NOT_FOUND', message: `${req.method} ${req.originalUrl} does not exist` } });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const field = [].concat(err.meta?.target || []).join(', ');
      return res.status(409).json({ error: { code: 'CONFLICT', message: `A record with this ${field} already exists` } });
    }
    if (err.code === 'P2025') return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Record not found' } });
    if (err.code === 'P2003') return res.status(409).json({ error: { code: 'IN_USE', message: 'Record is referenced by other data and cannot be removed' } });
  }
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    error: { code: err.code || 'INTERNAL', message: status >= 500 ? 'Something went wrong' : err.message, details: err.details },
  });
}
