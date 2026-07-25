import dotenv from 'dotenv';

import { connectDB } from '../src/config/db.js';
import { ENTITY_STATUS } from '../src/constants/roles.js';
import { Organization } from '../src/models/Organization.js';

dotenv.config();

function getArg(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
}

/**
 * Creates (or reuses) the organization that direct student-website signups
 * without a referral code land in. Students registered here are "unassigned"
 * and visible to that organization's white-label admin (and the super admin).
 *
 * Copy the printed id into the student website env as DEFAULT_ORGANIZATION_ID.
 */
async function main() {
  const name = getArg('--name') || process.env.DEFAULT_ORG_NAME || 'Direct Signups';

  if (!process.env.MONGODB_URI) {
    console.error('Missing MONGODB_URI');
    process.exit(1);
  }

  await connectDB(process.env.MONGODB_URI);
  await Organization.syncIndexes();

  let org = await Organization.findOne({ name });
  if (org) {
    console.log(`Reusing existing organization "${name}"`);
  } else {
    org = await Organization.create({
      name,
      branding: '',
      status: ENTITY_STATUS.ACTIVE,
    });
    console.log(`Created organization "${name}"`);
  }

  console.log('');
  console.log('Set this in the student website backend .env:');
  console.log(`  DEFAULT_ORGANIZATION_ID=${org._id}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('seedDefaultOrg failed:', err);
  process.exit(1);
});
