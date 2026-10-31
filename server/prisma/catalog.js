// The service catalog (one source of truth). Used by the demo seed, and by 2-START to add the catalog
// to an existing database without touching anyone's data:  node prisma/catalog.js
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'node:url';

export const CATALOG = {
    crm: ({ name: 'Loop CRM — seat', artKey: 'crm', type: 'SOFTWARE', salesPrice: 1200, costPrice: 300, notes: 'Per user per period',
      tagline: 'Track every lead and deal in one shared pipeline.',
      features: ['Drag-and-drop deal pipeline', 'Email and call log per contact', 'Sales forecast each month', 'Mobile app included'] }),
    erp: ({ name: 'Loop ERP Suite', artKey: 'erp', type: 'SOFTWARE', salesPrice: 8500, costPrice: 2200,
      tagline: 'Accounts, stock and purchasing for the whole company.',
      features: ['GST-ready accounting', 'Inventory across warehouses', 'Purchase approvals', 'Unlimited users for viewing'] }),
    care: ({ name: 'Pineapple Care+', artKey: 'care', type: 'SERVICE', salesPrice: 799, costPrice: 350, notes: 'Per device per period',
      tagline: 'Protection for your team’s phones and laptops.',
      features: ['Accidental damage cover', 'Battery replacement', 'Replacement device in 48 hours', '24×7 expert support'] }),
    creative: ({ name: 'Prism Creative Suite', artKey: 'creative', type: 'SOFTWARE', salesPrice: 1999, costPrice: 900, notes: 'Per seat per period',
      tagline: 'Design, photo and video apps for your creative team.',
      features: ['20+ design, photo and video apps', '1 TB cloud library', 'Fonts and stock images', 'Shared team libraries'] }),
    storage: ({ name: 'Nimbus Drive 2 TB', artKey: 'cloud', type: 'ADDON', salesPrice: 249, costPrice: 60, notes: 'Per user per period',
      tagline: 'Safe cloud storage that syncs across every device.',
      features: ['2 TB per user', 'Restore any file for 180 days', 'Share links that expire', 'Ransomware recovery'] }),
    meet: ({ name: 'Huddle Meet Pro', artKey: 'meet', type: 'SOFTWARE', salesPrice: 650, costPrice: 200, notes: 'Per host per period',
      tagline: 'Video meetings that just work, inside or outside the office.',
      features: ['Meetings up to 300 people', 'Recording and transcripts', 'Webinars and live polls', 'Background noise removal'] }),
    vault: ({ name: 'Vaultkey Teams', artKey: 'vault', type: 'SOFTWARE', salesPrice: 180, costPrice: 40, notes: 'Per user per period',
      tagline: 'One secure place for every company password.',
      features: ['Shared password vaults', 'Two-step sign-in for everyone', 'Alerts for leaked passwords', 'Admin activity log'] }),
    music: ({ name: 'Tunely for Business', artKey: 'music', type: 'SERVICE', salesPrice: 499, costPrice: 150, tax: 'GST 12%', notes: 'Per location per period',
      tagline: 'Licensed background music for shops, cafés and offices.',
      features: ['Fully licensed for public play', 'Playlists that change by time of day', 'No ads, ever', 'Separate music for each zone'] }),
    support: ({ name: 'Priority support', artKey: 'support', type: 'SERVICE', salesPrice: 2500, costPrice: 1200, tax: 'GST 12%',
      tagline: 'A named expert who answers within one hour.',
      features: ['1-hour response, 7 days a week', 'Named support manager', 'Quarterly health check', 'Phone, chat and email'] }),
    connector: ({ name: 'ERP Connector', artKey: 'connector', type: 'ADDON', salesPrice: 1500, costPrice: 400,
      tagline: 'Sync customers and invoices with the ERP you already use.',
      features: ['Two-way sync every 15 minutes', 'Choose Odoo or SAP', 'Error alerts by email', 'Set up by our team'] }),
};

const VARIANTS = { connector: [['Brand', 'Odoo', 560], ['Brand', 'SAP', 900]], storage: [['Size', '5 TB', 300]] };

/**
 * Creates any missing catalog product and fills in catalog details (picture, description, features) on existing ones.
 * Never deletes or reprices anything. Returns { key: product }.
 */
export async function ensureCatalog(prisma) {
  const taxes = await prisma.tax.findMany();
  const taxId = (name) => (taxes.find((t) => t.name === name) ?? taxes.find((t) => Number(t.rate) === 18) ?? taxes[0])?.id ?? null;
  const out = {};
  for (const [key, { tax = 'GST 18%', ...def }] of Object.entries(CATALOG)) {
    const existing = await prisma.product.findFirst({ where: { name: def.name }, orderBy: { id: 'asc' } });
    out[key] = existing
      ? await prisma.product.update({ where: { id: existing.id }, data: {
        tagline: existing.tagline ?? def.tagline, features: existing.features?.length ? existing.features : def.features,
        artKey: existing.artKey ?? def.artKey, notes: existing.notes ?? def.notes ?? null, inCatalog: existing.artKey ? existing.inCatalog : true } })
      : await prisma.product.create({ data: { ...def, inCatalog: true, taxId: taxId(tax) } });
    for (const [attribute, value, extraPrice] of VARIANTS[key] ?? []) {
      const has = await prisma.productVariant.findFirst({ where: { productId: out[key].id, attribute, value } });
      if (!has) await prisma.productVariant.create({ data: { productId: out[key].id, attribute, value, extraPrice } });
    }
  }
  return out;
}

// Run directly: node prisma/catalog.js
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const prisma = new PrismaClient();
  ensureCatalog(prisma)
    .then((p) => console.log(`Service catalog ready (${Object.keys(p).length} services).`))
    .catch((e) => { console.error(e); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
}
