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

export async function connectCareerBeacon(mongoUri) {
  if (!mongoUri?.trim()) return null;

  careerBeaconConnection = mongoose.createConnection(mongoUri.trim(), {
    autoIndex: false,
  });

  await careerBeaconConnection.asPromise();
  return careerBeaconConnection;
}

