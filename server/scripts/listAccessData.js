/**
 * Quick inventory of Access Control collections (read-only).
 * Usage: node scripts/listAccessData.js
 */
import dns from 'dns';
import dotenv from 'dotenv';
import { connectAdmin, getAdminUriFromEnv } from '../src/config/db.js';
import { AccessUser } from '../src/models/AccessUser.js';
import { Counselor } from '../src/models/Counselor.js';
import { Organization } from '../src/models/Organization.js';
import { ReferralCode } from '../src/models/ReferralCode.js';
import { Student } from '../src/models/Student.js';

dns.setDefaultResultOrder('ipv4first');
dotenv.config();

async function main() {
  const uri = getAdminUriFromEnv();
  if (!uri) {
    console.error('Missing MONGODB_ADMIN');
    process.exit(1);
  }
  await connectAdmin(uri);

  const orgs = await Organization.find({}).lean();
  const counselors = await Counselor.find({}).lean();
  const students = await Student.find({}).lean();
  const admins = await AccessUser.find({ accessRole: 'white-label-admin' }).lean();
  const supers = await AccessUser.find({ accessRole: 'super-admin' }).select('name email').lean();
  const unassigned = students.filter((s) => !s.assignedCounselorId);

  console.log('\n=== Super Admins ===');
  for (const s of supers) console.log(`- ${s.name} <${s.email}>`);

  console.log('\n=== Organizations ===');
  for (const o of orgs) {
    console.log(`- ${o.name} [${o.branding}] status=${o.status} id=${o._id}`);
  }

  console.log('\n=== Org Admins ===');
  for (const a of admins) {
    console.log(`- ${a.name} <${a.email}> org=${a.organizationId}`);
  }

  console.log('\n=== Counselors ===');
  for (const c of counselors) {
    console.log(
      `- ${c.name} <${c.email}> code=${c.referralCode} students=${c.studentCount} status=${c.status} org=${c.organizationId}`
    );
  }

  console.log('\n=== Students ===');
  console.log(`total=${students.length} unassigned=${unassigned.length}`);
  for (const s of students.slice(0, 40)) {
    console.log(
      `- ${s.name} <${s.email}> assigned=${s.assignedCounselorId || 'NONE'} code=${s.referralCodeEntered || '—'}`
    );
  }
  if (students.length > 40) console.log(`… +${students.length - 40} more`);

  const codes = await ReferralCode.countDocuments({});
  console.log(`\nReferral code rows: ${codes}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
