# Architecture

```
 Browser (React SPA, Vite)                     Express API (Node)                         PostgreSQL
 ─────────────────────────                     ───────────────────                        ──────────
 pages/* ──► api/endpoints.js ──/api──►  routes.js ─► module.routes.js                    Prisma schema
                (axios + JWT)                   │   authenticate → authorize(role)         (indexes on every
 AuthContext (token, role)                      │   validate(zod)                           list filter)
 TanStack Query (cache, paging)                 ▼
                                           module.controller.js ──► services/
                                                                     ├ pricing.service   (pure maths, unit-tested)
                                                                     ├ billing.service   (invoice generation, idempotent)
                                                                     └ subscriptionFlow  (state machine)
                                           jobs/scheduler.js (node-cron daily 02:00 → billing run)
                                           lib/email.js (Nodemailer, console fallback)
```

**Why this stack:** one language (JS) across the team, Prisma gives typed queries + migrations in minutes, PostgreSQL handles money (`DECIMAL(12,2)`), aggregates and unique constraints that make "never bill twice" a database guarantee rather than a hope.

## Data model (17 tables)

`User` (login, role) ─1:1─ `Customer` (billing contact; can exist without a login)
`Product` ─< `ProductVariant` (attribute/value/extraPrice) · `Product` → default `Tax`
`Plan` (price, period, interval, min qty, availability, autoClose/closable/pausable/renewable)
`Discount` (PERCENT|FIXED, PRODUCT|SUBSCRIPTION scope, min purchase/qty, dates, usageLimit/usedCount) >─< `Product`
`QuotationTemplate` → `Plan`, ─< `TemplateLine`
`Subscription` → Customer, Plan, Template?, Discount?, Salesperson ─< `SubscriptionLine` (price snapshot) ─< `SubscriptionEvent` (timeline)
`Invoice` → Subscription?, Customer ─< `InvoiceLine` (discount + tax snapshot) ─< `Payment`
`Sequence` (atomic document numbers)

## Billing rules (the part that must be right)

1. **Line price** = product sales price + variant extra price, *snapshotted* on the subscription line. Later price changes never rewrite existing contracts.
2. **Plan price** (if > 0) is billed as its own line every period.
3. **Product discounts** apply automatically to matching lines that meet min quantity / min purchase; the best one wins.
4. **Subscription discounts** are attached by staff and spread across lines pro-rata, so **tax is charged on the discounted amount**.
5. A discount is used once per invoice it lands on. It stops automatically when expired, inactive or `usedCount = usageLimit`.
6. **Tax** per line from the product's tax rule: percent of net, or fixed per unit. Invoice lines store the computed tax, so changing a tax rate never changes past invoices.
7. **Period**: `[nextInvoiceDate, nextInvoiceDate + period − 1 day]`. Month maths clamps (31 Jan → 28 Feb).
8. **Due date** = invoice date + subscription payment terms (days).
9. **Never twice:** `@@unique([subscriptionId, periodStart])` + catch on duplicate → returns the existing invoice.
10. **Never skipped:** the billing run loops each subscription until `nextInvoiceDate > today`, so a missed day (server off) catches up on the next run.
11. **Expiry:** no billing for periods starting on/after `expiryDate`; plans with `autoClose` close the subscription automatically.
12. **Paid** when the sum of payments ≥ total; partial payments keep it CONFIRMED with a remaining balance. **Overdue** = CONFIRMED and past due — derived on read, never stale.

## Problems we expect, and what the design does about them

| Risk (from the brief and from real billing teams) | Handling |
|---|---|
| Two people click "generate" or the cron overlaps a manual run | DB unique key + idempotent catch; whole invoice in one transaction |
| Server was down on billing day | Catch-up loop bills every missed period |
| Duplicate document numbers under load | `Sequence` row incremented inside the same transaction |
| Price/tax edited after contracts signed | Snapshots on subscription lines and invoice lines |
| Discount silently keeps applying forever | Validity checked at every invoice; usage counter; status badge in UI |
| Quotation accepted months later at an old price | `quotationValidUntil`; confirm is blocked when expired |
| Customer sees another customer's invoice | Portal routes are CUSTOMER-only and every query is filtered by `req.user.customerId`; foreign IDs return 404 |
| Internal staff creating discounts or staff accounts | Route-level `authorize('ADMIN')`, plus UI hides the controls |
| Leaking whether an email exists | Forgot-password always returns 200; login error is generic |
| Reset link reused or stolen from the DB | Only a SHA-256 hash is stored; 30-minute expiry; cleared on use |
| Deleting a product that old invoices reference | Soft delete (`isActive=false`) everywhere in the catalog |
| Thousands of subscriptions, pages must answer < 2 s | Server-side pagination (max 100), list endpoints select only needed columns, indexes on `status`, `customerId`, `(status,nextInvoiceDate)`, `(status,dueDate)`, `invoiceDate`, `paymentDate`; reports use SQL aggregates; gzip; `SEED_SCALE=5000` to prove it |
| Floating-point money errors | `DECIMAL(12,2)` in DB, `round2` in one place, unit tests |
| Email provider down | `sendMail` never throws; falls back to console in dev |

## Roles

| Capability | Admin | Internal | Customer |
|---|---|---|---|
| Staff accounts | ✔ | | |
| Products, plans, taxes (write) | ✔ | read | |
| Discounts (write) | ✔ | read | |
| Templates, customers, subscriptions, invoices, payments | ✔ | ✔ | |
| Reports & dashboard | ✔ | ✔ | |
| Run billing manually | ✔ | | |
| Own subscriptions & invoices (portal), accept quote, pay | | | ✔ |
