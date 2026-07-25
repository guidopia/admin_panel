import mongoose from 'mongoose';

mongoose.set('strictQuery', true);

export async function connectDB(mongoUri) {
  if (!mongoUri) {
    const err = new Error('Missing MONGODB_URI');
    err.statusCode = 500;
    throw err;
  }

  await mongoose.connect(mongoUri, {
    autoIndex: false,
  });

  return mongoose.connection;
}

let careerBeaconConnection = null;
let vidhyasaarthiConnection = null;

export async function connectCareerBeacon(mongoUri) {
  if (!mongoUri?.trim()) return null;

  careerBeaconConnection = mongoose.createConnection(mongoUri.trim(), {
    autoIndex: false,
  });

  await careerBeaconConnection.asPromise();
  return careerBeaconConnection;
}

export async function connectVidhyasaarthi(mongoUri) {
  if (!mongoUri?.trim()) return null;

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

