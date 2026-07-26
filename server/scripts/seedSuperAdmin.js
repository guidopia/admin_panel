import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import dns from 'dns';
import { connectAdmin, getAdminUriFromEnv } from '../src/config/db.js';
import { ACCESS_ROLES, ENTITY_STATUS } from '../src/constants/roles.js';
import { AccessUser } from '../src/models/AccessUser.js';

dns.setDefaultResultOrder('ipv4first');
dotenv.config();

function getArg(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
}

async function main() {
  const email = (getArg('--email') || process.env.SUPER_ADMIN_EMAIL || 'superadmin@guidopia.com')
    .toLowerCase()
    .trim();
  const password = getArg('--password') || process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123';
  const name = getArg('--name') || process.env.SUPER_ADMIN_NAME || 'Guidopia Super Admin';

  const adminUri = getAdminUriFromEnv();
  if (!adminUri) {
    console.error('Missing MONGODB_ADMIN (Access Control database)');
    process.exit(1);
  }

  await connectAdmin(adminUri);

  // Ensure indexes for access collections
  await AccessUser.syncIndexes();

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await AccessUser.findOne({ email });

  if (existing) {
    existing.name = name;
    existing.accessRole = ACCESS_ROLES.SUPER_ADMIN;
    existing.organizationId = null;
    existing.counselorId = null;
    existing.status = ENTITY_STATUS.ACTIVE;
    existing.password = passwordHash;
    await existing.save();
    console.log(`Updated Super Admin: ${email}`);
  } else {
    await AccessUser.create({
      name,
      email,
      password: passwordHash,
      accessRole: ACCESS_ROLES.SUPER_ADMIN,
      organizationId: null,
      counselorId: null,
      status: ENTITY_STATUS.ACTIVE,
    });
    console.log(`Created Super Admin: ${email}`);
  }

  console.log('Login with:');
  console.log(`  POST /api/access/auth/login`);
  console.log(`  email: ${email}`);
  console.log(`  password: ${password}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('seedSuperAdmin failed:', err);
  process.exit(1);
});
