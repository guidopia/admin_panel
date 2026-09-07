import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import {
  connectAdmin,
  connectCareerBeacon,
  connectClickToCollege,
  connectDB,
  connectVidhyasaarthi,
  getAdminUriFromEnv,
  getClickToCollegeUriFromEnv,
  getVidhyasaarthiUriFromEnv,
} from './config/db.js';
import {
  initCareerBeaconModels,
  initClickToCollegeModels,
  initVidhyasaarthiModels,
} from './db/platformModels.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import accessRoutes from './routes/accessRoutes.js';
import { AccessUser } from './models/AccessUser.js';
import { Counselor } from './models/Counselor.js';
import { Organization } from './models/Organization.js';
import { ReferralCode } from './models/ReferralCode.js';
import { Student } from './models/Student.js';

const app = express();

app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

const corsOrigin = (process.env.CORS_ORIGIN || '').trim();
const allowAny = !corsOrigin || corsOrigin === '*';
const allowedOrigins = allowAny
  ? []
  : corsOrigin
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      // allow server-to-server, curl, etc.
      if (!origin) return cb(null, true);
      if (allowAny) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);

      // Dev convenience: allow any localhost / 127.0.0.1 port (Vite often uses 127.0.0.1).
      if (
        process.env.NODE_ENV !== 'production' &&
        /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
      ) {
        return cb(null, true);
      }

      // Vercel preview / production frontends when CORS_ORIGIN lists them.
      return cb(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) app.use(morgan('dev'));

let initPromise = null;

async function initPlatform() {
  // Connect the two required databases in parallel — they are independent.
  const adminUri = getAdminUriFromEnv();
  if (!adminUri) {
    throw new Error('Missing MONGODB_ADMIN — Access Control database is required');
  }

  await Promise.all([
    connectDB(process.env.MONGODB_URI).then(() => {
      // eslint-disable-next-line no-console
      console.log('Prodigy database connected (MONGODB_URI)');
    }),
    connectAdmin(adminUri).then(() => {
      // eslint-disable-next-line no-console
      console.log('Admin Access Control database connected (MONGODB_ADMIN)');
    }),
  ]);

  // syncIndexes is slow against Atlas — only run in local/dev, not every serverless cold start.
  if (!process.env.VERCEL) {
    await Promise.all([
      Organization.syncIndexes(),
      AccessUser.syncIndexes(),
      Counselor.syncIndexes(),
      ReferralCode.syncIndexes(),
      Student.syncIndexes(),
    ]);
  }

  // Connect optional platform databases in parallel — all three are independent,
  // so there is no reason to wait for each one before starting the next.
  const careerBeaconUri = (process.env.MONGODB_URI_CAREER_BEACON || '').trim();
  const vidhyasaarthiUri = getVidhyasaarthiUriFromEnv();
  const clickToCollegeUri = getClickToCollegeUriFromEnv();

  await Promise.allSettled([
    // Career Beacon
    careerBeaconUri
      ? connectCareerBeacon(careerBeaconUri)
          .then((conn) => {
            initCareerBeaconModels(conn);
            // eslint-disable-next-line no-console
            console.log('Career Beacon database connected');
          })
          .catch((err) => {
            // eslint-disable-next-line no-console
            console.warn('Career Beacon database failed to connect (tab disabled):', err?.message || err);
          })
      : // eslint-disable-next-line no-console
        Promise.resolve(console.warn('MONGODB_URI_CAREER_BEACON not set — Career Beacon tab disabled')),

    // Vidhyasaarthi
    vidhyasaarthiUri
      ? connectVidhyasaarthi(vidhyasaarthiUri)
          .then((conn) => {
            initVidhyasaarthiModels(conn);
            // eslint-disable-next-line no-console
            console.log('Vidhyasaarthi database connected');
          })
          .catch((err) => {
            // eslint-disable-next-line no-console
            console.warn('Vidhyasaarthi database failed to connect (tab disabled):', err?.message || err);
          })
      : // eslint-disable-next-line no-console
        Promise.resolve(console.warn('MONGODB_URI_VIDHYASAARTHI not set — Vidhyasaarthi tab disabled')),

    // Click To College
    clickToCollegeUri
      ? connectClickToCollege(clickToCollegeUri)
          .then((conn) => {
            initClickToCollegeModels(conn);
            // eslint-disable-next-line no-console
            console.log('Click To College database connected');
          })
          .catch((err) => {
            // eslint-disable-next-line no-console
            console.warn('Click To College database failed to connect (tab disabled):', err?.message || err);
          })
      : // eslint-disable-next-line no-console
        Promise.resolve(console.warn('MONGODB_URI_CLICKTOCOLLEGE not set — Click To College tab disabled')),
  ]);
}


function ensureReady() {
  if (!initPromise) {
    initPromise = initPlatform().catch((err) => {
      initPromise = null; // allow retry on next request after Atlas/network fix
      throw err;
    });
  }
  return initPromise;
}

// Health check does not need DB (useful on Vercel while fixing Atlas whitelist).
app.get('/health', (_req, res) => res.json({ ok: true }));

// Ensure DB is ready before handling API traffic (needed on Vercel cold starts).
app.use('/api', async (req, res, next) => {
  try {
    await ensureReady();
    next();
  } catch (err) {
    next(err);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/access', accessRoutes);

app.use(notFound);
app.use(errorHandler);

// Required for Vercel (@vercel/node): export the Express app as the serverless handler.
export default app;

const isServerless = Boolean(process.env.VERCEL) || process.env.NODE_ENV === 'test';

async function start() {
  await ensureReady();

  const port = Number(process.env.PORT || 5000);
  const server = http.createServer(app);
  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on http://localhost:${port}`);
  });
}

if (!isServerless) {
  start().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Fatal server startup error:', err);
    process.exit(1);
  });
}
