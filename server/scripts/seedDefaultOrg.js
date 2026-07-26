import dns from 'dns';
import dotenv from 'dotenv';

import { connectAdmin, getAdminUriFromEnv } from '../src/config/db.js';
import { ENTITY_STATUS } from '../src/constants/roles.js';
import { Organization } from '../src/models/Organization.js';

dns.setDefaultResultOrder('ipv4first');
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

  const adminUri = getAdminUriFromEnv();
  if (!adminUri) {
    console.error('Missing MONGODB_ADMIN');
    process.exit(1);
  }

  await connectAdmin(adminUri);
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
