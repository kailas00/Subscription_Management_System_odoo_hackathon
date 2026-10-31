// Daily billing run (auto-close expired + generate due invoices).
import cron from 'node-cron';
import { env } from '../config/env.js';
import { runBillingCycle } from '../services/billing.service.js';

export function startScheduler() {
  if (!env.billingCron || env.billingCron === 'false') return console.log('⏸  Billing cron disabled');
  cron.schedule(env.billingCron, async () => {
    const summary = await runBillingCycle().catch((e) => ({ error: e.message }));
    console.log('🧾 Billing run', JSON.stringify(summary));
  });
  console.log(`⏰ Billing cron scheduled: "${env.billingCron}"`);
}
