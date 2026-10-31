import { startLocalDb, portInUse, currentEnvUrl, PORT } from './localdb-lib.js';

if (currentEnvUrl().includes(`:${PORT}/`)) {
  const pg = await startLocalDb();
  console.log(`\n  Built-in database running on port ${PORT}. Keep this window open.\n`);
  const stop = async () => { try { await pg.stop(); } finally { process.exit(0); } };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
} else if (await portInUse(5432)) {
  console.log('\n  Using your PostgreSQL on port 5432. You can close this window.\n');
} else {
  console.log('\n  Your PostgreSQL on port 5432 is NOT running.');
  console.log('  Fix: Windows key -> "Services" -> postgresql-x64-... -> right-click -> Start,');
  console.log('  or run 1-SETUP.bat again to switch to the built-in database.\n');
}
setInterval(() => {}, 1 << 30);
