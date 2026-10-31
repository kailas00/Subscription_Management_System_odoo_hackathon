import { execSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Security: replace the example JWT secret with a random 256-bit value (only once).
const envFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env');
const envText = fs.readFileSync(envFile, 'utf8');
if (/^JWT_SECRET=(change-me.*|)$/m.test(envText)) {
  fs.writeFileSync(envFile, envText.replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${crypto.randomBytes(32).toString('hex')}`));
  console.log('Generated a new random JWT secret.');
}
import { startLocalDb, portInUse, setEnvUrl, currentEnvUrl, OWN_URL, BUILTIN_URL } from './localdb-lib.js';

// --update: bring the tables up to date and keep all data (used by run.bat). Without it: wipe and load demo data.
const UPDATE_ONLY = process.argv.includes('--update');

let pg = { stop: async () => {} };
if (await portInUse(5432)) {
  // Keep a 5432 address you set yourself in server/.env; otherwise use the default (user postgres, password 1234).
  if (!currentEnvUrl().includes(':5432/')) setEnvUrl(OWN_URL);
  else process.env.DATABASE_URL = currentEnvUrl();
  console.log('Using your PostgreSQL on port 5432.');
} else {
  console.log('Your PostgreSQL on port 5432 is not running - using the built-in database instead.');
  setEnvUrl(BUILTIN_URL);
  pg = await startLocalDb();
}
try {
  if (UPDATE_ONLY) {
    console.log('Updating tables (your data is kept)...');
    execSync('npx prisma db push', { stdio: 'inherit', env: process.env });
    execSync('node prisma/catalog.js', { stdio: 'inherit', env: process.env }); // adds new services, keeps all data
  } else {
    console.log('Creating tables...');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', env: process.env });
    console.log('Adding demo data...');
    execSync('node prisma/seed.js', { stdio: 'inherit', env: process.env });
  }
} catch (e) {
  console.error('\nDatabase step failed. If it says "Authentication failed", set your PostgreSQL password in DATABASE_URL inside server/.env and run again.');
  process.exitCode = 1;
} finally {
  await pg.stop();
}
