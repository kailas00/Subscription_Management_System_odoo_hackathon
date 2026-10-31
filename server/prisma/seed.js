// Demo + performance seed.
//   npm run db:seed                  → realistic demo data (~40 subscriptions with invoice history)
//   SEED_SCALE=5000 npm run db:seed  → also adds 5,000 bulk subscriptions to prove < 2s pages
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { runBillingCycle, syncInvoicePayments } from '../src/services/billing.service.js';
import { nextNumber } from '../src/lib/sequence.js';
import { addDays, addPeriod, startOfDay } from '../src/lib/dates.js';
import { ensureCatalog } from './catalog.js';

const prisma = new PrismaClient();
const PASSWORD = 'Admin@1234'; // meets policy: >8 chars, upper, lower, special
const pick = (arr, i) => arr[i % arr.length];

async function main() {
  console.log('🌱 Resetting data…');
  // order matters (FKs)
  for (const m of ['payment', 'invoiceLine', 'invoice', 'subscriptionEvent', 'subscriptionLine', 'subscription', 'templateLine',
    'quotationTemplate', 'productVariant', 'discount', 'product', 'plan', 'tax', 'customer', 'user', 'sequence']) {
    await prisma[m].deleteMany();
  }

  const hash = await bcrypt.hash(PASSWORD, 10);
  const admin = await prisma.user.create({ data: { name: 'Aisha Admin', email: 'admin@brightloop.dev', passwordHash: hash, role: 'ADMIN' } });
  const staff = await prisma.user.create({ data: { name: 'Ravi Sales', email: 'staff@brightloop.dev', passwordHash: hash, role: 'INTERNAL' } });
  const custUser = await prisma.user.create({ data: { name: 'Meera Shah', email: 'customer@brightloop.dev', passwordHash: hash, role: 'CUSTOMER' } });

  const gst18 = await prisma.tax.create({ data: { name: 'GST 18%', type: 'PERCENT', rate: 18 } });
  const gst12 = await prisma.tax.create({ data: { name: 'GST 12%', type: 'PERCENT', rate: 12 } });
  await prisma.tax.create({ data: { name: 'Exempt', type: 'PERCENT', rate: 0 } });

  // Catalog: our own Loop apps + partner services sold under proxy brands (see prisma/catalog.js).
  const products = await ensureCatalog(prisma);
  const odoo = await prisma.productVariant.findFirst({ where: { productId: products.connector.id, value: 'Odoo' } });
  void gst12;

  const monthly = await prisma.plan.create({ data: { name: 'Monthly Standard', billingPeriod: 'MONTHLY', minQuantity: 1, pausable: true, closable: true, renewable: true } });
  const yearly = await prisma.plan.create({ data: { name: 'Annual Enterprise', price: 5000, billingPeriod: 'YEARLY', minQuantity: 5, autoClose: true, closable: false, renewable: true } });
  const weekly = await prisma.plan.create({ data: { name: 'Weekly Trial', billingPeriod: 'WEEKLY', minQuantity: 1, autoClose: true, renewable: false } });

  const bulk = await prisma.discount.create({ data: { name: '10% off 10+ seats', type: 'PERCENT', value: 10, scope: 'PRODUCT', minQuantity: 10, usageLimit: 500, products: { connect: [{ id: products.crm.id }] } } });
  const welcome = await prisma.discount.create({ data: { name: 'Welcome ₹500', code: 'WELCOME500', type: 'FIXED', value: 500, scope: 'SUBSCRIPTION', minPurchase: 2000, usageLimit: 3 } });
  await prisma.discount.create({ data: { name: 'Diwali 15%', code: 'DIWALI15', type: 'PERCENT', value: 15, scope: 'SUBSCRIPTION', startDate: new Date('2026-10-15'), endDate: new Date('2026-11-15') } });

  await prisma.quotationTemplate.create({ data: { name: 'Enterprise starter pack', validityDays: 30, planId: yearly.id, notes: 'ERP + 10 CRM seats + support',
    lines: { create: [{ productId: products.erp.id, quantity: 1 }, { productId: products.crm.id, quantity: 10 }, { productId: products.support.id, quantity: 1 }] } } });
  await prisma.quotationTemplate.create({ data: { name: 'Small business monthly', validityDays: 14, planId: monthly.id,
    lines: { create: [{ productId: products.crm.id, quantity: 3 }, { productId: products.storage.id, quantity: 3 }, { productId: products.vault.id, quantity: 3 }] } } });
  await prisma.quotationTemplate.create({ data: { name: 'Creative studio monthly', validityDays: 14, planId: monthly.id, notes: 'Design apps, storage and device cover',
    lines: { create: [{ productId: products.creative.id, quantity: 4 }, { productId: products.storage.id, quantity: 4 }, { productId: products.care.id, quantity: 4 }] } } });

  const companies = ['Meera Designs', 'Northwind Traders', 'Kaveri Foods', 'Pixel Forge', 'Sahyadri Logistics', 'Bluefin Retail', 'Orchid Clinics',
    'Tandem Labs', 'Granite Works', 'Saffron Hotels', 'Monsoon Media', 'Indus Textiles', 'Cobalt Fintech', 'Lotus Schools', 'Everest Auto'];
  const customers = [];
  for (let i = 0; i < companies.length; i++) {
    customers.push(await prisma.customer.create({ data: {
      name: companies[i], company: companies[i], email: i === 0 ? custUser.email : `billing@${companies[i].toLowerCase().replace(/\s+/g, '')}.in`,
      phone: `+91 98${String(10000000 + i * 734521).slice(0, 8)}`, city: pick(['Mumbai', 'Bengaluru', 'Pune', 'Chennai', 'Delhi'], i), country: 'India',
      userId: i === 0 ? custUser.id : undefined, createdAt: addDays(startOfDay(), -(420 - i * 18)) } }));
  }

  console.log('🧾 Creating subscriptions…');
  const today = startOfDay();
  const statuses = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'QUOTATION', 'DRAFT', 'CONFIRMED', 'PAUSED', 'CLOSED', 'ACTIVE'];
  for (let i = 0; i < 40; i++) {
    const status = pick(statuses, i);
    const plan = i % 7 === 0 ? yearly : i % 11 === 0 ? weekly : monthly;
    const startDate = addDays(today, -(15 + ((i * 17) % 150)));
    const seats = plan === yearly ? 10 + (i % 6) : 1 + (i % 12);
    const lines = [{ productId: products.crm.id, quantity: seats, unitPrice: 1200, taxId: gst18.id }];
    if (i % 3 === 0) lines.push({ productId: products.storage.id, quantity: seats, unitPrice: 249, taxId: gst18.id });
    if (i % 5 === 0 || i % 6 === 0) lines.push({ productId: products.creative.id, quantity: 1 + (i % 4), unitPrice: 1999, taxId: gst18.id });
    if (i % 6 === 0 || i % 7 === 3) lines.push({ productId: products.care.id, quantity: 2 + (i % 5), unitPrice: 799, taxId: gst18.id });
    if (i % 4 === 2) lines.push({ productId: products.meet.id, quantity: 1 + (i % 3), unitPrice: 650, taxId: gst18.id });
    if (i % 8 === 5) lines.push({ productId: products.vault.id, quantity: seats, unitPrice: 180, taxId: gst18.id });
    if (i % 9 === 4) lines.push({ productId: products.music.id, quantity: 1 + (i % 2), unitPrice: 499, taxId: gst12.id });
    if (i % 4 === 0) lines.push({ productId: products.connector.id, variantId: odoo.id, quantity: 1, unitPrice: 2060, taxId: gst18.id });
    if (plan === yearly) lines.push({ productId: products.erp.id, quantity: 1, unitPrice: 8500, taxId: gst18.id });

    const sub = await prisma.subscription.create({ data: {
      number: await nextNumber('SUB', prisma), customerId: (i % 6 === 0 ? customers[0] : pick(customers, i)).id, planId: plan.id, salespersonId: staff.id,
      status: ['ACTIVE', 'PAUSED', 'CLOSED'].includes(status) ? 'ACTIVE' : status,
      startDate, expiryDate: plan === weekly ? addDays(startDate, 28) : addPeriod(startDate, 'YEARLY', 1),
      nextInvoiceDate: ['ACTIVE', 'PAUSED', 'CLOSED'].includes(status) ? startDate : null,
      paymentTermDays: pick([7, 15, 30], i), discountId: i % 9 === 0 ? welcome.id : null,
      quotationValidUntil: status === 'QUOTATION' ? addDays(today, 10) : null,
      createdAt: addDays(startDate, -3),
      lines: { create: lines },
      events: { create: [{ toStatus: 'DRAFT', userId: staff.id, createdAt: addDays(startDate, -3) }] },
    } });
    if (['ACTIVE', 'PAUSED', 'CLOSED', 'CONFIRMED', 'QUOTATION'].includes(status)) {
      await prisma.subscriptionEvent.create({ data: { subscriptionId: sub.id, fromStatus: 'DRAFT', toStatus: 'QUOTATION', userId: staff.id, createdAt: addDays(startDate, -2) } });
    }
    if (['ACTIVE', 'PAUSED', 'CLOSED', 'CONFIRMED'].includes(status)) {
      await prisma.subscriptionEvent.create({ data: { subscriptionId: sub.id, fromStatus: 'QUOTATION', toStatus: 'CONFIRMED', userId: staff.id, createdAt: addDays(startDate, -1) } });
    }
    if (['ACTIVE', 'PAUSED', 'CLOSED'].includes(status)) {
      await prisma.subscriptionEvent.create({ data: { subscriptionId: sub.id, fromStatus: 'CONFIRMED', toStatus: 'ACTIVE', userId: staff.id, createdAt: startDate } });
    }
  }

  // A request the demo customer made from the portal catalog — staff turn it into an offer
  await prisma.subscription.create({ data: {
    number: await nextNumber('SUB', prisma), customerId: customers[0].id, planId: monthly.id, salespersonId: staff.id, status: 'DRAFT',
    requestedByCustomer: true, startDate: addDays(today, 3), paymentTermDays: 15, notes: 'Requested from the customer portal: “For our two new designers.”',
    lines: { create: [{ productId: products.meet.id, quantity: 2, unitPrice: 650, taxId: gst18.id }] },
    events: { create: [{ toStatus: 'DRAFT', userId: custUser.id, note: 'Requested by customer via portal' }] },
  } });

  // Bill all history up to today (catch-up), then confirm & pay most, leaving some overdue.
  const run = await runBillingCycle({ asOf: today });
  console.log('   billing run:', run.invoicesCreated, 'invoices');
  const invoices = await prisma.invoice.findMany({ orderBy: { id: 'asc' } });
  let n = 0;
  for (const inv of invoices) {
    n++;
    const isRecent = inv.invoiceDate > addDays(today, -5);
    if (isRecent && n % 2) continue; // leave a few drafts for the "billing day" demo
    await prisma.invoice.update({ where: { id: inv.id }, data: { status: 'CONFIRMED', sentAt: inv.invoiceDate } });
    if (n % 6 === 0 || inv.dueDate >= today) continue; // unpaid → overdue or not yet due
    await prisma.$transaction(async (tx) => {
      const amount = n % 10 === 0 ? Math.round(Number(inv.total) * 50) / 100 : Number(inv.total); // a few partial payments
      await tx.payment.create({ data: { number: await nextNumber('PAY', tx), invoiceId: inv.id, amount, recordedById: staff.id,
        method: pick(['BANK_TRANSFER', 'UPI', 'CARD', 'CASH', 'CHEQUE'], n), paymentDate: addDays(inv.invoiceDate, 3 + (n % 9)), note: n % 10 === 0 ? 'Partial — balance promised next week' : null } });
      await syncInvoicePayments(tx, inv.id);
    });
  }

  // Apply final statuses for paused / closed demo rows
  const subs = await prisma.subscription.findMany({ orderBy: { id: 'asc' } });
  for (let i = 0; i < subs.length; i++) {
    const status = pick(statuses, i);
    if (status === 'PAUSED' || status === 'CLOSED') {
      await prisma.subscription.update({ where: { id: subs[i].id }, data: { status, ...(status === 'CLOSED' && { closedAt: addDays(today, -(i % 40)), closeReason: 'Customer moved to another vendor' }) } });
      await prisma.subscriptionEvent.create({ data: { subscriptionId: subs[i].id, fromStatus: 'ACTIVE', toStatus: status, userId: staff.id } });
    }
  }

  const scale = Number(process.env.SEED_SCALE || 0);
  if (scale > 0) {
    console.log(`⚡ Bulk-inserting ${scale} subscriptions for performance testing…`);
    const rows = Array.from({ length: scale }, (_, i) => ({
      number: `SUB/BULK/${String(i + 1).padStart(6, '0')}`, customerId: pick(customers, i).id, planId: pick([monthly.id, yearly.id], i),
      status: pick(['ACTIVE', 'ACTIVE', 'ACTIVE', 'CLOSED', 'QUOTATION'], i), startDate: addDays(today, -(i % 300)), nextInvoiceDate: addDays(today, 1 + (i % 28)),
    }));
    for (let i = 0; i < rows.length; i += 1000) await prisma.subscription.createMany({ data: rows.slice(i, i + 1000) });
    const ids = await prisma.subscription.findMany({ where: { number: { startsWith: 'SUB/BULK' } }, select: { id: true } });
    for (let i = 0; i < ids.length; i += 1000) {
      await prisma.subscriptionLine.createMany({ data: ids.slice(i, i + 1000).map((s, j) => ({ subscriptionId: s.id, productId: products.crm.id, quantity: 1 + (j % 20), unitPrice: 1200, taxId: gst18.id })) });
    }
  }

  console.log(`\n✅ Seed complete. Log in with password "${PASSWORD}":`);
  console.log('   admin@brightloop.dev (Admin) · staff@brightloop.dev (Internal) · customer@brightloop.dev (Customer portal)');
  void admin; void bulk;
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
