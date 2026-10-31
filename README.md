# Brightloop — Subscription Management System

Brightloop runs recurring billing from start to finish: products and plans, quotations, subscriptions, automatic invoices with taxes and discounts, payments, a customer portal and revenue reports.

Built for the Odoo Hackathon.

**Stack:** React 18 · Vite · Tailwind CSS · TanStack Query · Node.js · Express · Prisma · PostgreSQL · node-cron · Nodemailer

## Who uses it

| Role | What they do |
|---|---|
| **Admin** | Sets up products, plans, taxes, discounts and staff accounts. Runs billing. |
| **Billing staff** | Turns customer requests and templates into subscriptions, sends quotations, confirms invoices, records payments. |
| **Customer** | Approves offers, adds services from the catalog, pays bills, pauses or ends plans where allowed. |

## Features

- **Accounts:** sign-up with a strong password rule, unique email, and password reset by email. Sessions use an httpOnly cookie.
- **Catalog:** products with variants (e.g. Brand: Odoo +₹560), tax rules, photos, and plans billed daily, weekly, monthly or yearly with rules (minimum quantity, pause, close, renew, auto-close).
- **Quotation templates:** ready-made offers with a plan, product lines and validity.
- **Subscription lifecycle:** Draft → Quotation → Confirmed → Active → Closed (plus Paused / Cancelled), with a timeline of every change.
- **Billing engine:** invoices are created automatically on each billing date. A daily job catches up missed days, and a database rule makes double billing impossible.
- **Discounts:** fixed or percentage, per product or per subscription. Each discount can have a minimum, dates and a usage limit, and stops applying on its own.
- **Payments:** partial or full payments by any method. Overdue bills are flagged automatically.
- **Customer portal:** a one-line status ("₹X to pay by …"), offers to approve, a service catalog with pictures, and online payment.
- **Dashboard & reports:** a "today" to-do list, recurring revenue, collected vs invoiced, overdue, plan breakdown and CSV export.

## Run it (Windows)

1. Install [Node.js LTS](https://nodejs.org). That is the only requirement.
2. Double-click **`run.bat`**.

The first run installs everything, creates the database and loads demo data. After that, `run.bat` keeps your data and only applies updates. `run.bat reset` starts again with fresh demo data.

**Database, chosen automatically:** if PostgreSQL is running on port 5432 and accepts the address in `server/.env` (default user `postgres`, password `1234`), it is used. Otherwise Brightloop starts its own built-in PostgreSQL on port 5433, so there is no password or port to set. To use your own server with other settings, put its address in `DATABASE_URL` in `server/.env`.

Open http://localhost:5173 and sign in with password **`Admin@1234`**:

| Email | Role |
|---|---|
| `admin@brightloop.dev` | Admin |
| `staff@brightloop.dev` | Billing staff |
| `customer@brightloop.dev` | Customer |

<details>
<summary>Manual commands (macOS / Linux / any terminal)</summary>

```bash
# terminal 1 — API on http://localhost:4000
cd server
cp .env.example .env      # set DATABASE_URL to your PostgreSQL
npm install
npm run db:setup          # tables + demo data   (npm run db:update keeps data)
npm run dev

# terminal 2 — web app on http://localhost:5173
cd client
cp .env.example .env
npm install
npm run dev
```
</details>

## Project structure

```
server/
  prisma/schema.prisma        data model (17 tables)
  prisma/seed.js, catalog.js  demo data and the service catalog
  scripts/                    database setup used by run.bat
  src/server.js, app.js       Express app, security headers, error handling
  src/routes.js               every module under /api
  src/modules/<name>/         *.routes.js (URL, role, validation) + *.controller.js (logic)
  src/services/               pricing engine, billing engine, subscription state machine (+ tests)
  src/jobs/scheduler.js       daily billing run (02:00)
client/
  src/App.jsx                 page routes per role
  src/api/endpoints.js        every API call the web app makes
  src/pages/                  admin/, ops/ (staff), portal/ (customer), auth/
  src/components/             ui/ design system, layout/, brand/, ops/
docs/                         API.md, ARCHITECTURE.md, DESIGN.md
run.bat                       one-click setup and start
```

## Tests

```bash
cd server
npm test                          # pricing engine + subscription lifecycle (12 tests)
SEED_SCALE=5000 npm run db:seed   # adds 5,000 subscriptions to check page speed
```

More detail: [API](docs/API.md) · [Architecture and billing rules](docs/ARCHITECTURE.md) · [Design rules](docs/DESIGN.md)
