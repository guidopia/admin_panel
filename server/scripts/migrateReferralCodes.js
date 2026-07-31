/**
 * Migrate counselor.referralCode → referral_codes collection (soft-revoke history).
 *
 * - Creates referral_codes indexes (global unique on `code`)
 * - Backfills one `active` row per counselor that still has a code string
 * - Drops the old unique index on counselors.referralCode (field kept as denormalized cache)
 * - Backfills students.referredCounselorId from assignedCounselorId when registration was referral
 *
 * Usage:
 *   node scripts/migrateReferralCodes.js
 */
import dns from 'dns';
import dotenv from 'dotenv';

import { connectAdmin, getAdminUriFromEnv } from '../src/config/db.js';
import { REFERRAL_CODE_STATUS, REGISTRATION_TYPES } from '../src/constants/roles.js';
import { Counselor } from '../src/models/Counselor.js';
import { ReferralCode } from '../src/models/ReferralCode.js';
import { Student } from '../src/models/Student.js';
import { normalizeReferralCode } from '../src/utils/referralCode.js';

dns.setDefaultResultOrder('ipv4first');
dotenv.config();

async function dropCounselorReferralUniqueIndex() {
  const collection = Counselor.collection;
  const indexes = await collection.indexes();
  for (const idx of indexes) {
    const keys = Object.keys(idx.key || {});
    const isReferralOnly =
      keys.length === 1 && keys[0] === 'referralCode' && idx.unique === true;
    if (isReferralOnly || idx.name === 'referralCode_1') {
      try {
        await collection.dropIndex(idx.name);
        console.log('Dropped counselors index:', idx.name);
      } catch (err) {
        if (err.code !== 27 && err.codeName !== 'IndexNotFound') throw err;
        console.log('Index already absent:', idx.name);
      }
    }
  }
}

async function main() {
  const adminUri = getAdminUriFromEnv();
  if (!adminUri) {
    console.error('Missing MONGODB_ADMIN');
    process.exit(1);
  }

  await connectAdmin(adminUri);

  await ReferralCode.syncIndexes();
  console.log('Synced referral_codes indexes (global unique on code; counselorId+status)');

  await dropCounselorReferralUniqueIndex();
  await Counselor.syncIndexes();
  await Student.syncIndexes();

  const counselors = await Counselor.find({
    referralCode: { $exists: true, $nin: [null, ''] },
  }).lean();

  let inserted = 0;
  let skipped = 0;

  for (const c of counselors) {
    const code = normalizeReferralCode(c.referralCode);
    if (!code) {
      skipped += 1;
      continue;
    }

    const existing = await ReferralCode.findOne({ code }).lean();
    if (existing) {
      skipped += 1;
      continue;
    }

    // Prefer an already-active row for this counselor; otherwise create active from cache.
    const activeForCounselor = await ReferralCode.findOne({
      counselorId: c._id,
      status: REFERRAL_CODE_STATUS.ACTIVE,
    }).lean();

    if (activeForCounselor) {
      skipped += 1;
      continue;
    }

    await ReferralCode.create({
      code,
      counselorId: c._id,
      organizationId: c.organizationId,
      status: REFERRAL_CODE_STATUS.ACTIVE,
    });
    inserted += 1;
  }

  console.log(`Backfilled referral_codes: inserted=${inserted}, skipped=${skipped}`);

  const referralStudents = await Student.updateMany(
    {
      registrationType: REGISTRATION_TYPES.REFERRAL,
      assignedCounselorId: { $ne: null },
      $or: [{ referredCounselorId: null }, { referredCounselorId: { $exists: false } }],
    },
    [
      {
        $set: {
          referredCounselorId: '$assignedCounselorId',
        },
      },
    ]
  );

  console.log(
    `Backfilled students.referredCounselorId: matched=${referralStudents.matchedCount}, modified=${referralStudents.modifiedCount}`
  );

  console.log('migrateReferralCodes complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('migrateReferralCodes failed:', err);
  process.exit(1);
});
