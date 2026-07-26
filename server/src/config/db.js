import mongoose from 'mongoose';

mongoose.set('strictQuery', true);

/** Prodigy AI platform users (`users` collection) — MONGODB_URI */
export async function connectDB(mongoUri) {
  if (!mongoUri) {
    const err = new Error('Missing MONGODB_URI (Prodigy database)');
    err.statusCode = 500;
    throw err;
  }

  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (mongoose.connection.readyState === 2) {
    await mongoose.connection.asPromise();
    return mongoose.connection;
  }

  await mongoose.connect(mongoUri, {
    autoIndex: false,
  });

  return mongoose.connection;
}

let adminConnection = null;
let careerBeaconConnection = null;
let vidhyasaarthiConnection = null;

/**
 * Access Control / admin-panel DB — organizations, access_users, counselors, referral codes.
 * Env: MONGODB_ADMIN (preferred) or MONGODB_URI_ADMIN.
 */
export function getAdminUriFromEnv() {
  return (
    (process.env.MONGODB_ADMIN || '').trim() ||
    (process.env.MONGODB_URI_ADMIN || '').trim()
  );
}

export async function connectAdmin(mongoUri) {
  const uri = (mongoUri || getAdminUriFromEnv() || '').trim();
  if (!uri) {
    const err = new Error('Missing MONGODB_ADMIN (Access Control / admin database)');
    err.statusCode = 500;
    throw err;
  }

  if (adminConnection) {
    if (adminConnection.readyState === 1) return adminConnection;
    await adminConnection.asPromise();
    return adminConnection;
  }

  adminConnection = mongoose.createConnection(uri, {
    autoIndex: false,
  });

  await adminConnection.asPromise();
  return adminConnection;
}

export function getAdminConnection() {
  return adminConnection;
}

export async function connectCareerBeacon(mongoUri) {
  if (!mongoUri?.trim()) return null;

  if (careerBeaconConnection) {
    if (careerBeaconConnection.readyState === 1) return careerBeaconConnection;
    await careerBeaconConnection.asPromise();
    return careerBeaconConnection;
  }

  careerBeaconConnection = mongoose.createConnection(mongoUri.trim(), {
    autoIndex: false,
  });

  await careerBeaconConnection.asPromise();
  return careerBeaconConnection;
}

export async function connectVidhyasaarthi(mongoUri) {
  if (!mongoUri?.trim()) return null;

  if (vidhyasaarthiConnection) {
    if (vidhyasaarthiConnection.readyState === 1) return vidhyasaarthiConnection;
    await vidhyasaarthiConnection.asPromise();
    return vidhyasaarthiConnection;
  }

  vidhyasaarthiConnection = mongoose.createConnection(mongoUri.trim(), {
    autoIndex: false,
  });

  await vidhyasaarthiConnection.asPromise();
  return vidhyasaarthiConnection;
}

/** Prefer MONGODB_URI_VIDHYASAARTHI; also accept MONGODB_URI_VIDHYASARTHI. */
export function getVidhyasaarthiUriFromEnv() {
  return (
    (process.env.MONGODB_URI_VIDHYASAARTHI || '').trim() ||
    (process.env.MONGODB_URI_VIDHYASARTHI || '').trim()
  );
}
