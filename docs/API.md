# API contract

Base URL `http://localhost:4000/api` (the web app calls `/api`, which Vite proxies). Auth: the session is an httpOnly cookie (`bl_session`, 8 h) set by login/signup — the web app never sees the token.

**Success:** `{ data }` · **List:** `{ data: [...], meta: { page, pageSize, total, totalPages } }` · **Error:** `{ error: { code, message, details?: [{ field, message }] } }`
**List query (all list endpoints):** `page` (1), `pageSize` (20, max 100), `search`, `sort`, `order=asc|desc`
**Roles:** `A` admin · `I` internal staff · `C` customer · `—` public. Money fields come back as strings ("1200.00") — use `Number()` or `lib/format.money()`.
**Status codes:** 400 validation/business rule · 401 not logged in · 403 wrong role · 404 not found · 409 duplicate / in use

Frontend function names in brackets map to `client/src/api/endpoints.js`.

## Auth

| Method | Path | Role | Body → returns |
|---|---|---|---|
| POST | `/auth/signup` [authApi.signup] | — | `{ name, email, password, company?, phone? }` → `{ user }` + session cookie (role CUSTOMER, Customer record linked) |
| POST | `/auth/login` [login] | — | `{ email, password }` → `{ user: { id, email, name, role, customerId } }` + session cookie |
| POST | `/auth/forgot-password` | — | `{ email }` → always 200 (emails a 30-min link to `/reset-password?token=`) |
| POST | `/auth/reset-password` | — | `{ token, password }` |
| POST | `/auth/logout` | any | clears the session cookie |
| GET | `/auth/me` | any | → user |
| PATCH | `/auth/me` | any | `{ name }` |
| POST | `/auth/change-password` | any | `{ currentPassword, newPassword }` |

Password rule (server + client): more than 8 chars, uppercase, lowercase, special character. Email unique.

## Users (admin only)

| GET `/users` ?role | POST `/users` `{ name, email, password, role: ADMIN\|INTERNAL }` | PATCH `/users/:id` `{ name?, role?, isActive? }` |
|---|---|---|

Returns `{ id, name, email, role, isActive, createdAt }`. Admin can't disable/demote themselves.

## Customers (A, I)

| Method | Path | Notes / returns |
|---|---|---|
| GET | `/customers` | rows + `_count.subscriptions` |
| GET | `/customers/:id` | customer + `subscriptions[]`, `invoices[]`, `stats: { outstanding, overdueCount }` |
| POST | `/customers` | `{ name, email, phone?, company?, address?, city?, country?, gstin? }` |
| PATCH | `/customers/:id` | partial |

## Catalog

| Method | Path | Role | Body / returns |
|---|---|---|---|
| GET | `/taxes` | A,I | `{ id, name, type: PERCENT\|FIXED, rate, isActive }` |
| POST/PATCH/DELETE | `/taxes[/:id]` | A | `{ name, type, rate }` · DELETE = archive |
| GET | `/products` ?type&active | A,I | product + `tax`, `variants[]`, `_count.subscriptionLines` |
| GET | `/products/:id` | A,I | product + `tax`, `variants[]` |
| POST/PATCH/DELETE | `/products[/:id]` | A | `{ name, type: SOFTWARE\|ADDON\|SERVICE\|PHYSICAL, salesPrice, costPrice, notes?, taxId? }` |
| POST | `/products/:id/variants` | A | `{ attribute, value, extraPrice }` e.g. Brand / Odoo / 560 |
| PATCH/DELETE | `/products/:id/variants/:variantId` | A | |
| GET | `/plans` ?active | A,I | plan + `_count.subscriptions` (active) |
| GET | `/plans/:id` | A,I | |
| POST/PATCH/DELETE | `/plans[/:id]` | A | `{ name, price, billingPeriod: DAILY\|WEEKLY\|MONTHLY\|YEARLY, intervalCount, minQuantity, startDate?, endDate?, autoClose, closable, pausable, renewable }` |
| GET | `/discounts` ?scope&valid=true | A,I | discount + `products[]` + computed `status: ACTIVE\|SCHEDULED\|EXPIRED\|EXHAUSTED\|INACTIVE` |
| POST/PATCH/DELETE | `/discounts[/:id]` | **A only** | `{ name, code?, type, value, scope: PRODUCT\|SUBSCRIPTION, minPurchase?, minQuantity?, startDate?, endDate?, usageLimit?, productIds[] }` |
| GET | `/templates`, `/templates/:id` | A,I | template + `plan`, `lines[{ product, variant, quantity }]` |
| POST / PUT / DELETE | `/templates[/:id]` | A,I | `{ name, validityDays, planId, notes?, lines: [{ productId, variantId?, quantity }] }` (PUT replaces lines) |

## Subscriptions (A, I)

| Method | Path | Body / returns |
|---|---|---|
| GET | `/subscriptions` ?status=ACTIVE,PAUSED&customerId&planId&search | light rows: `id, number, status, startDate, expiryDate, nextInvoiceDate, customer{id,name}, plan{id,name,billingPeriod}` |
| GET | `/subscriptions/:id` | full record + `lines[{product,variant,tax}]`, `events[]`, `invoices[]`, **`actions: string[]`**, **`totals: { lines, subtotal, discountTotal, taxTotal, total }`** |
| GET | `/subscriptions/:id/preview` | `totals` only |
| POST | `/subscriptions` | `{ customerId, planId? \| templateId?, startDate, expiryDate?, paymentTermDays=15, quotationValidUntil?, discountId?, notes?, lines: [{ productId, variantId?, quantity, unitPrice?, taxId?, description? }] }` → 201 full record (status DRAFT, number `SUB/2026/00001`) |
| PATCH | `/subscriptions/:id` | same fields, partial; only in DRAFT/QUOTATION |
| POST | `/subscriptions/:id/actions/:action` | action ∈ `send confirm activate pause resume close cancel renew`; body `{ note?, newExpiryDate? }` (renew needs `newExpiryDate`) → full record. `activate` creates the first invoice. |

State machine (`server/src/services/subscriptionFlow.js`):
`DRAFT →send→ QUOTATION →confirm→ CONFIRMED →activate→ ACTIVE ⇄ PAUSED (pause/resume, plan.pausable) → CLOSED (close, plan.closable; or auto at expiry if plan.autoClose)`; `cancel` from DRAFT/QUOTATION/CONFIRMED; `renew` (plan.renewable) extends expiry. Expired quotations can't be confirmed.

## Invoices, payments, billing (A, I)

| Method | Path | Body / returns |
|---|---|---|
| GET | `/invoices` ?status&overdue=true&customerId&subscriptionId&from&to | rows + `customer{name}`, `subscription{number}`, computed `outstanding`, `isOverdue` |
| GET | `/invoices/:id` | + `lines[]`, `payments[]`, `customer`, `subscription{number, plan{name}}`, `outstanding`, `isOverdue` |
| POST | `/invoices/generate` | `{ subscriptionId }` → 201 new invoice, or 200 + `meta.duplicate` if this period was already billed |
| POST | `/invoices/bulk-confirm` | `{ ids[] }` → `{ confirmed: n }` |
| POST | `/invoices/:id/confirm` · `/cancel` `{ reason? }` · `/send` | DRAFT→CONFIRMED · cancel if unpaid · email + `sentAt` |
| GET | `/payments` ?method&invoiceId&from&to | + `invoice{number, customer{name}}`, `recordedBy{name}` |
| POST | `/payments` | `{ invoiceId, method: CASH\|BANK_TRANSFER\|CARD\|UPI\|CHEQUE\|OTHER, amount, paymentDate, note? }` → `{ payment, invoice }`; amount ≤ outstanding; invoice becomes PAID when fully paid |
| POST | `/billing/run` | **A** · `{ asOf? }` → `{ invoicesCreated, skippedDuplicates, autoClosed, errors[] }` ✅ built |

Invoice status: `DRAFT → CONFIRMED → PAID` (or `CANCELLED`). **Overdue** = CONFIRMED and `dueDate` < today (derived, not stored). Number format `INV/2026/00001`, `PAY/2026/00001`.

## Reports (A, I)

| GET | Returns |
|---|---|
| `/reports/summary` ?from&to | `{ activeSubscriptions, mrr, revenue, invoiced, outstanding, overdueCount, overdueAmount, newSubscriptions, churned }` |
| `/reports/revenue-trend` ?months=12 | `[{ month: '2026-05', invoiced, collected }]` |
| `/reports/subscriptions-by-status` | `[{ status, count }]` |
| `/reports/plan-breakdown` | `[{ planId, name, billingPeriod, activeCount, mrr }]` |
| `/reports/overdue` | paged invoices + `customer{name,email}`, `daysOverdue` |

## Customer portal (C only; always scoped to the logged-in customer)

| Method | Path | Notes |
|---|---|---|
| GET | `/portal/summary` | `{ activeSubscriptions, pendingQuotations, outstanding, nextInvoiceDate, overdueCount }` |
| GET | `/portal/overview` | profile, next bill, 12-month spend, recent payments, account manager, public offers |
| GET | `/portal/catalog` | services customers can add (picture, description, features, variants) + active plans |
| POST | `/portal/requests` | `{ productId, variantId?, planId, quantity, note? }` → a DRAFT flagged `requestedByCustomer` for staff to price and send |
| GET | `/portal/subscriptions`, `/portal/subscriptions/:id` | staff drafts hidden (the customer's own requests shown); detail includes `actions` limited to `confirm pause resume close` |
| POST | `/portal/subscriptions/:id/actions/:action` | customer accepts a quotation (`confirm`) or pauses/resumes/closes if the plan allows |
| GET | `/portal/invoices`, `/portal/invoices/:id` | no DRAFT/CANCELLED |
| POST | `/portal/invoices/:id/pay` | `{ method: CARD\|UPI\|BANK_TRANSFER }` → demo payment of the full balance |
