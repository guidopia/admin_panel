/**
 * Seeds mock orgs + admins + counselors + students for testing.
 * Run after seed:super-admin.
 *
 * Usage:
 *   node scripts/seedAccessDemo.js
 *   node scripts/seedAccessDemo.js --reset
 */
import dns from 'dns';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import { connectAdmin, getAdminUriFromEnv } from '../src/config/db.js';
import { ACCESS_ROLES, ENTITY_STATUS, REGISTRATION_TYPES } from '../src/constants/roles.js';
import { AccessUser } from '../src/models/AccessUser.js';
import { Counselor } from '../src/models/Counselor.js';
import { Organization } from '../src/models/Organization.js';
import { Student } from '../src/models/Student.js';
import { generateUniqueReferralCode } from '../src/services/accessHelpers.js';

dns.setDefaultResultOrder('ipv4first');
dotenv.config();

async function upsertOrg({ name, branding, primaryColor }) {
  let org = await Organization.findOne({ name });
  if (!org) {
    org = await Organization.create({
      name,
      branding,
      primaryColor,
      logoUrl: '',
      status: ENTITY_STATUS.ACTIVE,
    });
    console.log('Created organization:', org.name);
  }
  return org;
}

async function upsertAdmin({ name, email, password, organizationId }) {
  let admin = await AccessUser.findOne({ email });
  if (!admin) {
    admin = await AccessUser.create({
      name,
      email,
      password: await bcrypt.hash(password, 12),
      accessRole: ACCESS_ROLES.WL_ADMIN,
      organizationId,
      status: ENTITY_STATUS.ACTIVE,
    });
    console.log('Created org admin:', email, '/', password);
  }
  return admin;
}

async function upsertCounselor({ name, email, phone, password, organizationId }) {
  let counselor = await Counselor.findOne({ email });
  if (counselor) return counselor;

  const referralCode = await generateUniqueReferralCode(name);
  const accessUser = await AccessUser.create({
    name,
    email,
    password: await bcrypt.hash(password, 12),
    accessRole: ACCESS_ROLES.COUNSELOR,
    organizationId,
    status: ENTITY_STATUS.ACTIVE,
  });
  counselor = await Counselor.create({
    organizationId,
    accessUserId: accessUser._id,
    name,
    email,
    phone: phone || '',
    referralCode,
    status: ENTITY_STATUS.ACTIVE,
    studentCount: 0,
  });
  accessUser.counselorId = counselor._id;
  await accessUser.save();
  console.log('Created counselor:', email, '/', password, 'code:', referralCode);
  return counselor;
}

async function upsertStudent(payload) {
  const existing = await Student.findOne({ email: payload.email });
  if (existing) return existing;
  const student = await Student.create(payload);
  console.log('Created student:', payload.email);
  return student;
}

async function main() {
  const reset = process.argv.includes('--reset');
  const adminUri = getAdminUriFromEnv();
  if (!adminUri) {
    console.error('Missing MONGODB_ADMIN');
    process.exit(1);
  }
  await connectAdmin(adminUri);

  await Promise.all([
    Organization.syncIndexes(),
    AccessUser.syncIndexes(),
    Counselor.syncIndexes(),
    Student.syncIndexes(),
  ]);

  if (reset) {
    await Student.deleteMany({});
    await Counselor.deleteMany({});
    await AccessUser.deleteMany({ accessRole: { $ne: ACCESS_ROLES.SUPER_ADMIN } });
    await Organization.deleteMany({});
    console.log('Cleared access demo data (kept Super Admins)');
  }

  const org1 = await upsertOrg({
    name: 'Bright Future Academy',
    branding: 'BFA',
    primaryColor: '#171717',
  });
  const org2 = await upsertOrg({
    name: 'Horizon Career Hub',
    branding: 'HCH',
    primaryColor: '#0f766e',
  });

  await upsertAdmin({
    name: 'Meera Nair',
    email: 'meera@brightfuture.edu',
    password: 'Admin@12345',
    organizationId: org1._id,
  });
  await upsertAdmin({
    name: 'Arjun Patel',
    email: 'arjun@horizonhub.edu',
    password: 'Admin@12345',
    organizationId: org2._id,
  });

  const c1 = await upsertCounselor({
    name: 'Rahul Sharma',
    email: 'rahul.sharma@brightfuture.edu',
    phone: '+91 98765 43210',
    password: 'Counselor@123',
    organizationId: org1._id,
  });
  const c2 = await upsertCounselor({
    name: 'Priya Desai',
    email: 'priya.desai@brightfuture.edu',
    phone: '+91 98765 43211',
    password: 'Counselor@123',
    organizationId: org1._id,
  });
  const c3 = await upsertCounselor({
    name: 'Vikram Singh',
    email: 'vikram.singh@horizonhub.edu',
    phone: '+91 98765 55555',
    password: 'Counselor@123',
    organizationId: org2._id,
  });

  const students = [
    {
      organizationId: org1._id,
      assignedCounselorId: c1._id,
      referralCodeEntered: c1.referralCode,
      name: 'Aarav Mehta',
      email: 'aarav.mehta@student.in',
      phone: '+91 90001 11111',
      registrationType: REGISTRATION_TYPES.REFERRAL,
      progress: 72,
      assessments: [
        {
          id: 'as_1',
          name: 'Career Interest Inventory',
          status: 'completed',
          score: 'High alignment · STEM',
        },
      ],
      notes: [
        {
          id: 'n_1',
          author: 'Rahul Sharma',
          text: 'Interested in computer science programs.',
          at: new Date(),
        },
      ],
    },
    {
      organizationId: org1._id,
      assignedCounselorId: c1._id,
      referralCodeEntered: c1.referralCode,
      name: 'Ananya Rao',
      email: 'ananya.rao@student.in',
      phone: '+91 90001 22222',
      registrationType: REGISTRATION_TYPES.REFERRAL,
      progress: 45,
      assessments: [],
      notes: [],
    },
    {
      organizationId: org1._id,
      assignedCounselorId: c2._id,
      referralCodeEntered: c2.referralCode,
      name: 'Ishaan Kapoor',
      email: 'ishaan.kapoor@student.in',
      phone: '+91 90001 33333',
      registrationType: REGISTRATION_TYPES.REFERRAL,
      progress: 88,
      assessments: [
        {
          id: 'as_2',
          name: 'Personality Snapshot',
          status: 'completed',
          score: 'Explorer · Creative',
        },
      ],
      notes: [],
    },
    {
      organizationId: org1._id,
      assignedCounselorId: null,
      referralCodeEntered: null,
      name: 'Kabir Joshi',
      email: 'kabir.joshi@student.in',
      phone: '+91 90003 33333',
      registrationType: REGISTRATION_TYPES.SKIPPED,
      progress: 12,
      assessments: [],
      notes: [],
    },
    {
      organizationId: org2._id,
      assignedCounselorId: c3._id,
      referralCodeEntered: c3.referralCode,
      name: 'Diya Shah',
      email: 'diya.shah@student.in',
      phone: '+91 90004 44444',
      registrationType: REGISTRATION_TYPES.REFERRAL,
      progress: 60,
      assessments: [],
      notes: [],
    },
    {
      organizationId: org2._id,
      assignedCounselorId: null,
      referralCodeEntered: null,
      name: 'Rohan Verma',
      email: 'rohan.verma@student.in',
      phone: '+91 90005 55555',
      registrationType: REGISTRATION_TYPES.SKIPPED,
      progress: 5,
      assessments: [],
      notes: [],
    },
  ];

  for (const s of students) {
    await upsertStudent(s);
  }

  for (const c of [c1, c2, c3]) {
    c.studentCount = await Student.countDocuments({ assignedCounselorId: c._id });
    await c.save();
  }

  console.log('\n========== MOCK USERS READY ==========');
  console.log('Super Admin (your account): guidopiacareer@gmail.com');
  console.log('');
  console.log('Org Admins:');
  console.log('  meera@brightfuture.edu / Admin@12345   (Bright Future Academy)');
  console.log('  arjun@horizonhub.edu / Admin@12345     (Horizon Career Hub)');
  console.log('');
  console.log('Counselors (referral codes auto-created):');
  console.log(`  rahul.sharma@brightfuture.edu / Counselor@123  code=${c1.referralCode}`);
  console.log(`  priya.desai@brightfuture.edu / Counselor@123   code=${c2.referralCode}`);
  console.log(`  vikram.singh@horizonhub.edu / Counselor@123    code=${c3.referralCode}`);
  console.log('');
  console.log('Students: aarav, ananya, ishaan, kabir, diya, rohan (@student.in)');
  console.log('======================================');
  process.exit(0);
}

main().catch((err) => {
  console.error('seedAccessDemo failed:', err);
  process.exit(1);
});
