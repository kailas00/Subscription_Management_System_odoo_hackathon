import { prisma } from './prisma.js';

// Race-safe document numbers: SUB/2026/00001, INV/2026/00001, PAY/2026/00001
// Pass `tx` when called inside a $transaction so numbering rolls back with it.
export async function nextNumber(prefix, tx = prisma) {
  const year = new Date().getFullYear();
  const key = `${prefix}-${year}`;
  const seq = await tx.sequence.upsert({
    where: { key },
    create: { key, next: 2 },
    update: { next: { increment: 1 } },
  });
  const n = seq.next - 1;
  return `${prefix}/${year}/${String(n).padStart(5, '0')}`;
}
