import dns from 'dns';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dns.setDefaultResultOrder('ipv4first');
dotenv.config();

const uri = (process.env.MONGODB_ADMIN || process.env.MONGODB_URI_ADMIN || '').trim();
if (!uri) {
  console.error('Missing MONGODB_ADMIN');
  process.exit(1);
}

console.log('Connecting...', uri.replace(/\/\/[^@]+@/, '//***@').slice(0, 100));

const conn = await mongoose.createConnection(uri, {
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 15000,
}).asPromise();

console.log('Connected');

const codes = conn.db.collection('referral_codes');
const counselors = conn.db.collection('counselors');

const code = 'HETGFSH';
const row = await codes.findOne({ code });
console.log('referral_codes HETGFSH:', row);

const c = await counselors.findOne({ referralCode: code });
console.log('counselors.referralCode HETGFSH:', c && {
  id: String(c._id),
  name: c.name,
  status: c.status,
  referralCode: c.referralCode,
});

const het = await counselors.find({ referralCode: { $regex: /^HET/i } }).toArray();
console.log(
  'counselors HET*:',
  het.map((x) => ({ name: x.name, code: x.referralCode, status: x.status }))
);

const active = await codes.find({ status: 'active' }).project({ code: 1, status: 1 }).toArray();
console.log(
  'active referral_codes:',
  active.map((x) => x.code)
);

const allC = await counselors
  .find({})
  .project({ name: 1, referralCode: 1, status: 1 })
  .toArray();
console.log(
  'all counselor codes:',
  allC.map((x) => ({ name: x.name, code: x.referralCode, status: x.status }))
);

await conn.close();
process.exit(0);
