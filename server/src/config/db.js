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

  try {
    await mongoose.connect(mongoUri, {
      autoIndex: false,
      serverSelectionTimeoutMS: 12000,
    });
  } catch (err) {
    const e = new Error(atlasWhitelistHint(err));
    e.statusCode = 503;
    throw e;
  }

  return mongoose.connection;
}

let adminConnection = null;
let careerBeaconConnection = null;
let vidhyasaarthiConnection = null;
let clickToCollegeConnection = null;

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

function atlasWhitelistHint(err) {
  const msg = String(err?.message || err || '');
  if (
    err?.name === 'MongooseServerSelectionError' ||
    msg.includes('whitelist') ||
    msg.includes('ServerSelectionError') ||
    msg.includes('Could not connect to any servers')
  ) {
    return (
      `${msg} — On MongoDB Atlas → Network Access, add IP 0.0.0.0/0 ` +
      `(allow from anywhere) so Vercel can connect. Do this for BOTH ` +
      `Prodigy (MONGODB_URI) and Admin (MONGODB_ADMIN) clusters.`
    );
  }
  return msg;
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
    try {
      await adminConnection.asPromise();
      return adminConnection;
    } catch (err) {
      adminConnection = null;
      const e = new Error(atlasWhitelistHint(err));
      e.statusCode = 503;
      throw e;
    }
  }

  try {
    adminConnection = mongoose.createConnection(uri, {
      autoIndex: false,
      serverSelectionTimeoutMS: 12000,
    });
    await adminConnection.asPromise();
    return adminConnection;
  } catch (err) {
    adminConnection = null;
    const e = new Error(atlasWhitelistHint(err));
    e.statusCode = 503;
    throw e;
  }
}

export function getAdminConnection() {
  return adminConnection;
}

export async function connectCareerBeacon(mongoUri) {
  if (!mongoUri?.trim()) return null;

  if (careerBeaconConnection) {
    if (careerBeaconConnection.readyState === 1) return careerBeaconConnection;
    try {
      await careerBeaconConnection.asPromise();
      return careerBeaconConnection;
    } catch (err) {
      careerBeaconConnection = null;
      const e = new Error(atlasWhitelistHint(err));
      e.statusCode = 503;
      throw e;
    }
  }

  try {
    careerBeaconConnection = mongoose.createConnection(mongoUri.trim(), {
      autoIndex: false,
      serverSelectionTimeoutMS: 12000,
    });
    await careerBeaconConnection.asPromise();
    return careerBeaconConnection;
  } catch (err) {
    careerBeaconConnection = null;
    const e = new Error(atlasWhitelistHint(err));
    e.statusCode = 503;
    throw e;
  }
}

export async function connectVidhyasaarthi(mongoUri) {
  if (!mongoUri?.trim()) return null;

  if (vidhyasaarthiConnection) {
    if (vidhyasaarthiConnection.readyState === 1) return vidhyasaarthiConnection;
    try {
      await vidhyasaarthiConnection.asPromise();
      return vidhyasaarthiConnection;
    } catch (err) {
      vidhyasaarthiConnection = null;
      const e = new Error(atlasWhitelistHint(err));
      e.statusCode = 503;
      throw e;
    }
  }

  try {
    vidhyasaarthiConnection = mongoose.createConnection(mongoUri.trim(), {
      autoIndex: false,
      serverSelectionTimeoutMS: 12000,
    });
    await vidhyasaarthiConnection.asPromise();
    return vidhyasaarthiConnection;
  } catch (err) {
    vidhyasaarthiConnection = null;
    const e = new Error(atlasWhitelistHint(err));
    e.statusCode = 503;
    throw e;
  }
}

/** Prefer MONGODB_URI_VIDHYASAARTHI; also accept MONGODB_URI_VIDHYASARTHI. */
export function getVidhyasaarthiUriFromEnv() {
  return (
    (process.env.MONGODB_URI_VIDHYASAARTHI || '').trim() ||
    (process.env.MONGODB_URI_VIDHYASARTHI || '').trim()
  );
}

export async function connectClickToCollege(mongoUri) {
  if (!mongoUri?.trim()) return null;

  if (clickToCollegeConnection) {
    if (clickToCollegeConnection.readyState === 1) return clickToCollegeConnection;
    try {
      await clickToCollegeConnection.asPromise();
      return clickToCollegeConnection;
    } catch (err) {
      clickToCollegeConnection = null;
      const e = new Error(atlasWhitelistHint(err));
      e.statusCode = 503;
      throw e;
    }
  }

  try {
    clickToCollegeConnection = mongoose.createConnection(mongoUri.trim(), {
      autoIndex: false,
      serverSelectionTimeoutMS: 12000,
    });
    await clickToCollegeConnection.asPromise();
    return clickToCollegeConnection;
  } catch (err) {
    clickToCollegeConnection = null;
    const e = new Error(atlasWhitelistHint(err));
    e.statusCode = 503;
    throw e;
  }
}

/** Prefer MONGODB_URI_CLICKTOCOLLEGE; also accept MONGODB_URI_CLICK_TO_COLLEGE. */
export function getClickToCollegeUriFromEnv() {
  return (
    (process.env.MONGODB_URI_CLICKTOCOLLEGE || '').trim() ||
    (process.env.MONGODB_URI_CLICK_TO_COLLEGE || '').trim()
  );
}

