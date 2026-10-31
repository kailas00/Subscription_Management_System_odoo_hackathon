# Brightloop — Subscription Management System

One system to run plans, subscriptions and recurring billing: products and variants, plans, quotation templates, subscriptions with a full lifecycle, automatic invoicing with taxes and discounts, payments, a customer portal and revenue reports.

**Stack:** React 18 · Vite · Tailwind CSS · Node.js · Express · PostgreSQL · Prisma · JWT · node-cron · Nodemailer

## Run locally

Install once: [Node.js LTS](https://nodejs.org), [Git](https://git-scm.com), [PostgreSQL 16](https://www.postgresql.org/download/) (note the password you set; keep port 5432).

**Server** — terminal 1, from the project folder:
```bash
cd server
copy .env.example .env        # macOS/Linux: cp .env.example .env
# open server/.env and replace YOUR_PASSWORD with your PostgreSQL password
npm install
npx prisma db push            # creates the database tables
npm run db:seed               # demo data
npm run dev                   # http://localhost:4000/api/health
```

**Web app** — terminal 2:
```bash
cd client
copy .env.example .env
npm install
npm run dev                   # http://localhost:5173
```

Demo logins (password `Admin@1234`): `admin@brightloop.dev` (admin) · `staff@brightloop.dev` (internal staff) · `customer@brightloop.dev` (customer portal)

## Project structure

| Path | What |
|---|---|
| `server/prisma/schema.prisma` | Data model |
| `server/src/routes.js` | All API modules under `/api` |
| `server/src/modules/<name>/` | `*.routes.js` (URL, role, validation) and `*.controller.js` (logic) |
| `server/src/services/` | Pricing engine, billing engine, subscription lifecycle |
| `client/src/api/endpoints.js` | Every API call the web app makes |
| `client/src/App.jsx` | Page routes |
| `client/src/components/ui/` | Design system components |
| `docs/` | API contract, architecture, design rules |
