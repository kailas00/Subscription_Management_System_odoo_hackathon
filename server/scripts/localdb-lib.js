// Built-in PostgreSQL for local running: no separate install needed.
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import EmbeddedPostgres from 'embedded-postgres';

const here = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = path.resolve(here, '../.localdb');
export const PORT = 5433;
export const OWN_URL = 'postgresql://postgres:1234@localhost:5432/brightloop?schema=public';
export const BUILTIN_URL = `postgresql://postgres:brightloop@localhost:${PORT}/brightloop?schema=public`;
const ENV_FILE = path.resolve(here, '../.env');

/** Point the app (server/.env) at a database URL */
export function setEnvUrl(url) {
  const s = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, 'utf8') : '';
  const line = `DATABASE_URL="${url}"`;
  fs.writeFileSync(ENV_FILE, /^DATABASE_URL=.*$/m.test(s) ? s.replace(/^DATABASE_URL=.*$/m, line) : `${line}\n${s}`);
  process.env.DATABASE_URL = url;
}
export const currentEnvUrl = () => (fs.readFileSync(ENV_FILE, 'utf8').match(/^DATABASE_URL="?([^"\n]+)"?/m) || [])[1] || '';

export const portInUse = (port) => new Promise((resolve) => {
  const s = net.connect(port, '127.0.0.1');
  s.once('connect', () => { s.destroy(); resolve(true); });
  s.once('error', () => resolve(false));
});

export async function startLocalDb() {
  if (await portInUse(PORT)) {
    console.log('Local database is already running.');
    return { stop: async () => {} };
  }
  const pg = new EmbeddedPostgres({
    databaseDir: DATA_DIR, user: 'postgres', password: 'brightloop', port: PORT, persistent: true,
    onLog: () => {}, onError: (e) => console.error(String(e)),
  });
  const ready = fs.existsSync(path.join(DATA_DIR, 'PG_VERSION'));
  if (!ready) {
    fs.rmSync(DATA_DIR, { recursive: true, force: true });
    console.log('Creating the local database (first time only)...');
    await pg.initialise();
  }
  const pid = path.join(DATA_DIR, 'postmaster.pid');
  if (fs.existsSync(pid)) fs.rmSync(pid, { force: true }); // left over from a closed window
  await pg.start();
  try { await pg.createDatabase('brightloop'); } catch { /* already exists */ }
  return pg;
}
