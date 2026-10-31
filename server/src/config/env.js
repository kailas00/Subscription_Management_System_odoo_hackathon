import 'dotenv/config';

const required = ['DATABASE_URL', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing env var ${key} — copy server/.env.example to server/.env`);
}

const WEAK_SECRETS = ['change-me-to-a-long-random-string', 'secret', 'changeme'];
const weakSecret = !process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || WEAK_SECRETS.includes(process.env.JWT_SECRET);
if (weakSecret) {
  if (process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET must be a random value of at least 32 characters');
  console.warn('⚠️  JWT_SECRET is weak or a placeholder. Run 1-SETUP.bat (or set a 64-char random value) before sharing this app.');
}

export const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  cookieName: 'bl_session',
  isProd: process.env.NODE_ENV === 'production',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  currency: process.env.CURRENCY || 'INR',
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM || 'Brightloop <no-reply@brightloop.dev>',
  },
  billingCron: process.env.BILLING_CRON ?? '0 2 * * *',
};
