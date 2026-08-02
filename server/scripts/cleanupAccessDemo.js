/**
 * Remove Access Control demo / test noise.
 *
 * Keeps:
 *  - Super Admins
 *  - Vidhyasaarthi organization + its real admins
 *  - Counselor "Hetu" (and any counselor not matching demo/test patterns)
 *  - Real assigned students (non-demo emails)
 *
 * Removes:
 *  - Demo orgs: Bright Future Academy, Horizon Career Hub
 *  - Demo/test counselors (seed + test@gmail.com + *@example.com patterns)
 *  - All unassigned students
 *  - Remaining demo/test students
 *  - Orphaned referral_codes for deleted counselors/orgs
 *
 * Usage:
 *   node scripts/cleanupAccessDemo.js          # dry-run
 *   node scripts/cleanupAccessDemo.js --apply  # actually delete
 */
import dns from 'dns';
import dotenv from 'dotenv';
import { connectAdmin, getAdminUriFromEnv } from '../src/config/db.js';
import { ACCESS_ROLES } from '../src/constants/roles.js';
import { AccessUser } from '../src/models/AccessUser.js';
import { Counselor } from '../src/models/Counselor.js';
import { Organization } from '../src/models/Organization.js';
import { ReferralCode } from '../src/models/ReferralCode.js';
import { Student } from '../src/models/Student.js';

dns.setDefaultResultOrder('ipv4first');
dotenv.config();

const DEMO_ORG_NAMES = new Set(['Bright Future Academy', 'Horizon Career Hub']);

const KEEP_COUNSELOR_EMAILS = new Set(['hetu@mail.com']);

function isDemoCounselor(c) {
  const email = String(c.email || '').toLowerCase();
  const name = String(c.name || '').toLowerCase();
  if (KEEP_COUNSELOR_EMAILS.has(email)) return false;
  if (email === 'test@gmail.com') return true;
  if (email.endsWith('@brightfuture.edu')) return true;
  if (email.endsWith('@horizonhub.edu')) return true;
  if (email === 'counselor@vidhyasaarthi.guidopia.com') return true;
  if (name.includes('vidhya counselor')) return true;
  if (name === 'ak b' && email === 'test@gmail.com') return true;
  return false;
}

function isDemoStudent(s) {
  const email = String(s.email || '').toLowerCase();
  if (email.endsWith('@student.in')) return true;
  if (email.endsWith('@example.com')) return true;
  if (email.endsWith('@test.guidopia.local')) return true;
  if (email.includes('.p4.')) return true;
  if (/^test[\s.]/i.test(s.name || '')) return true;
  if (/^(organic|referred|concurrent|reassign|new code)/i.test(s.name || '')) return true;
  return false;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const uri = getAdminUriFromEnv();
  if (!uri) {
    console.error('Missing MONGODB_ADMIN');
    process.exit(1);
  }

  await connectAdmin(uri);
  console.log(apply ? 'MODE: APPLY (deleting)' : 'MODE: DRY-RUN (no deletes)');

  const orgs = await Organization.find({}).lean();
  const demoOrgs = orgs.filter((o) => DEMO_ORG_NAMES.has(o.name));
  const demoOrgIds = demoOrgs.map((o) => o._id);

  const counselors = await Counselor.find({}).lean();
  const demoCounselors = counselors.filter(isDemoCounselor);
  const demoCounselorIds = demoCounselors.map((c) => c._id);

  const students = await Student.find({}).lean();
  const unassigned = students.filter((s) => !s.assignedCounselorId);
  const demoStudents = students.filter(
    (s) =>
      !s.assignedCounselorId ||
      isDemoStudent(s) ||
      demoOrgIds.some((id) => String(id) === String(s.organizationId)) ||
      demoCounselorIds.some((id) => String(id) === String(s.assignedCounselorId))
  );
  // Unique by id
  const studentIdsToDelete = [
    ...new Map(demoStudents.map((s) => [String(s._id), s])).values(),
  ];

  console.log('\nWill remove organizations:');
  for (const o of demoOrgs) console.log(`  - ${o.name} (${o._id})`);

  console.log('\nWill remove counselors:');
  for (const c of demoCounselors) console.log(`  - ${c.name} <${c.email}> code=${c.referralCode}`);

  console.log(`\nWill remove students: ${studentIdsToDelete.length}`);
  console.log(`  (unassigned total in DB: ${unassigned.length})`);
  for (const s of studentIdsToDelete.slice(0, 30)) {
    console.log(
      `  - ${s.name} <${s.email}> assigned=${s.assignedCounselorId || 'NONE'}`
    );
  }
  if (studentIdsToDelete.length > 30) {
    console.log(`  … +${studentIdsToDelete.length - 30} more`);
  }

  const keepCounselors = counselors.filter((c) => !isDemoCounselor(c));
  console.log('\nKeeping counselors:');
  for (const c of keepCounselors) console.log(`  - ${c.name} <${c.email}>`);

  if (!apply) {
    console.log('\nDry-run complete. Re-run with --apply to delete.');
    process.exit(0);
  }

  // 1) Students
  const studentDelete = await Student.deleteMany({
    _id: { $in: studentIdsToDelete.map((s) => s._id) },
  });

  // 2) Demo counselors + logins + referral codes
  for (const c of demoCounselors) {
    if (c.accessUserId) {
      await AccessUser.findByIdAndDelete(c.accessUserId);
    }
    await ReferralCode.deleteMany({ counselorId: c._id });
    await Counselor.findByIdAndDelete(c._id);
  }

  // 3) Demo orgs cascade leftovers
  if (demoOrgIds.length) {
    await Promise.all([
      Student.deleteMany({ organizationId: { $in: demoOrgIds } }),
      Counselor.deleteMany({ organizationId: { $in: demoOrgIds } }),
      AccessUser.deleteMany({
        organizationId: { $in: demoOrgIds },
        accessRole: { $ne: ACCESS_ROLES.SUPER_ADMIN },
      }),
      ReferralCode.deleteMany({ organizationId: { $in: demoOrgIds } }),
      Organization.deleteMany({ _id: { $in: demoOrgIds } }),
    ]);
  }

  // 4) Refresh remaining counselor student counts
  const remaining = await Counselor.find({}).lean();
  for (const c of remaining) {
    const count = await Student.countDocuments({ assignedCounselorId: c._id });
    await Counselor.updateOne({ _id: c._id }, { $set: { studentCount: count } });
  }

  console.log('\nDeleted:');
  console.log(`  students: ${studentDelete.deletedCount}`);
  console.log(`  counselors: ${demoCounselors.length}`);
  console.log(`  organizations: ${demoOrgs.length}`);
  console.log('Done.');
  process.exit(0);
}

main().catch((err) => {
  console.error('cleanupAccessDemo failed:', err);
  process.exit(1);
});
