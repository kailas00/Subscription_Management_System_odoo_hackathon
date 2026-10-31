import { env } from './config/env.js';
import { app } from './app.js';
import { startScheduler } from './jobs/scheduler.js';

app.listen(env.port, () => {
  console.log(`✅ Brightloop API on http://localhost:${env.port}/api`);
  startScheduler();
});
