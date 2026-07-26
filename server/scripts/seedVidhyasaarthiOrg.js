/**
 * Seeds the Vidhyasaarthi organization + a starter counselor (referral code)
 * into the Access Control admin database (MONGODB_ADMIN).
 *
 * Usage:
 *   node scripts/seedVidhyasaarthiOrg.js
 */
import dns from 'dns';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectAdmin, getAdminUriFromEnv } from '../src/config/db.js';
import { ACCESS_ROLES, ENTITY_STATUS } from '../src/constants/roles.js';
import { AccessUser } from '../src/models/AccessUser.js';
import { Counselor } from '../src/models/Counselor.js';
import { Organization } from '../src/models/Organization.js';
import { generateUniqueReferralCode } from '../src/services/accessHelpers.js';

dns.setDefaultResultOrder('ipv4first');
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const adminUri = getAdminUriFromEnv();
  if (!adminUri) {
    console.error('Missing MONGODB_ADMIN (Access Control database)');
    process.exit(1);
  }

  await connectAdmin(adminUri);
  await Promise.all([
    Organization.syncIndexes(),
    AccessUser.syncIndexes(),
    Counselor.syncIndexes(),
  ]);

  const orgName = 'Vidhyasaarthi';
  let org = await Organization.findOne({ name: orgName });
  if (!org) {
    org = await Organization.create({
      name: orgName,
      branding: 'VS',
      primaryColor: '#0f766e',
      logoUrl: 'https://vidhyasaarthi.guidopia.com',
      status: ENTITY_STATUS.ACTIVE,
    });
    console.log('Created organization:', orgName);
  } else {
    org.status = ENTITY_STATUS.ACTIVE;
    org.logoUrl = org.logoUrl || 'https://vidhyasaarthi.guidopia.com';
    await org.save();
    console.log('Organization already exists:', orgName);
  }

  const orgId = String(org._id);

  // Optional org admin for Vidhyasaarthi
  const adminEmail = 'admin@vidhyasaarthi.guidopia.com';
  let admin = await AccessUser.findOne({ email: adminEmail });
  if (!admin) {
    admin = await AccessUser.create({
      name: 'Vidhyasaarthi Admin',
      email: adminEmail,
      password: await bcrypt.hash('Admin@12345', 10),
      accessRole: ACCESS_ROLES.WL_ADMIN,
      organizationId: org._id,
      status: ENTITY_STATUS.ACTIVE,
    });
    console.log('Created org admin:', adminEmail, '/ Admin@12345');
  }

  // Starter counselor with referral code for https://vidhyasaarthi.guidopia.com/onboarding
  const counselorEmail = 'counselor@vidhyasaarthi.guidopia.com';
  let counselor = await Counselor.findOne({ email: counselorEmail });
  if (!counselor) {
    const referralCode = await generateUniqueReferralCode('Vidhya Counselor');
    const accessUser = await AccessUser.create({
      name: 'Vidhya Counselor',
      email: counselorEmail,
      password: await bcrypt.hash('Counselor@123', 10),
      accessRole: ACCESS_ROLES.COUNSELOR,
      organizationId: org._id,
      status: ENTITY_STATUS.ACTIVE,
    });
    counselor = await Counselor.create({
      organizationId: org._id,
      accessUserId: accessUser._id,
      name: 'Vidhya Counselor',
      email: counselorEmail,
      phone: '',
      referralCode,
      status: ENTITY_STATUS.ACTIVE,
      studentCount: 0,
    });
    accessUser.counselorId = counselor._id;
    await accessUser.save();
    console.log('Created counselor + referral code:', counselor.referralCode);
  } else {
    console.log('Counselor already exists, code:', counselor.referralCode);
  }

  // Persist DEFAULT_ORGANIZATION_ID into .env for local admin server
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    let envText = fs.readFileSync(envPath, 'utf8');
    if (/^DEFAULT_ORGANIZATION_ID=/m.test(envText)) {
      envText = envText.replace(
        /^DEFAULT_ORGANIZATION_ID=.*$/m,
        `DEFAULT_ORGANIZATION_ID=${orgId}`
      );
    } else {
      envText += `\nDEFAULT_ORGANIZATION_ID=${orgId}\n`;
    }
    fs.writeFileSync(envPath, envText);
    console.log('Updated server/.env DEFAULT_ORGANIZATION_ID');
  }

  console.log('\n========== VIDHYASAARTHI LINKED ==========');
  console.log('Admin DB cluster: cluster0.ktzw3zu.mongodb.net');
  console.log('Organization:    Vidhyasaarthi');
  console.log('Organization ID: ', orgId);
  console.log('Onboarding URL:  https://vidhyasaarthi.guidopia.com/onboarding');
  console.log('');
  console.log('Accounts (Access Control login /login/access):');
  console.log('  Org Admin   admin@vidhyasaarthi.guidopia.com / Admin@12345');
  console.log('  Counselor   counselor@vidhyasaarthi.guidopia.com / Counselor@123');
  console.log('  Referral    ', counselor.referralCode);
  console.log('');
  console.log('Put these on Vidhyasaarthi PRODUCTION backend env:');
  console.log('  ADMIN_API_URL=<your-deployed-admin-api-url>');
  console.log('  DEFAULT_ORGANIZATION_ID=' + orgId);
  console.log('  INTERNAL_REGISTER_KEY=guidopia-vidhya-internal-2026');
  console.log('=========================================');
  process.exit(0);
}

main().catch((err) => {
  console.error('seedVidhyasaarthiOrg failed:', err);
  process.exit(1);
});
