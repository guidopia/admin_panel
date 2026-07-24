/**
 * Seeds a demo org + white-label admin + counselor for local testing.
 * Run after seed:super-admin.
 *
 * Usage:
 *   node scripts/seedAccessDemo.js
 *   node scripts/seedAccessDemo.js --reset
 */
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import { connectDB } from '../src/config/db.js';
import { ACCESS_ROLES, ENTITY_STATUS, REGISTRATION_TYPES } from '../src/constants/roles.js';
import { AccessUser } from '../src/models/AccessUser.js';
import { Counselor } from '../src/models/Counselor.js';
import { Organization } from '../src/models/Organization.js';
import { Student } from '../src/models/Student.js';
import { generateUniqueReferralCode } from '../src/services/accessHelpers.js';

dotenv.config();

async function main() {
  const reset = process.argv.includes('--reset');
  await connectDB(process.env.MONGODB_URI);

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

  let org = await Organization.findOne({ name: 'Bright Future Academy' });
  if (!org) {
    org = await Organization.create({
      name: 'Bright Future Academy',
      branding: 'BFA',
      primaryColor: '#171717',
      logoUrl: '',
      status: ENTITY_STATUS.ACTIVE,
    });
    console.log('Created organization:', org.name);
  }

  const adminEmail = 'meera@brightfuture.edu';
  let admin = await AccessUser.findOne({ email: adminEmail });
  if (!admin) {
    admin = await AccessUser.create({
      name: 'Meera Nair',
      email: adminEmail,
      password: await bcrypt.hash('Admin@12345', 12),
      accessRole: ACCESS_ROLES.WL_ADMIN,
      organizationId: org._id,
      status: ENTITY_STATUS.ACTIVE,
    });
    console.log('Created org admin:', adminEmail, '/ Admin@12345');
  }

  const counselorEmail = 'rahul.sharma@brightfuture.edu';
  let counselor = await Counselor.findOne({ email: counselorEmail });
  if (!counselor) {
    const referralCode = await generateUniqueReferralCode('Rahul Sharma');
    const accessUser = await AccessUser.create({
      name: 'Rahul Sharma',
      email: counselorEmail,
      password: await bcrypt.hash('Counselor@123', 12),
      accessRole: ACCESS_ROLES.COUNSELOR,
      organizationId: org._id,
      status: ENTITY_STATUS.ACTIVE,
    });
    counselor = await Counselor.create({
      organizationId: org._id,
      accessUserId: accessUser._id,
      name: 'Rahul Sharma',
      email: counselorEmail,
      phone: '+91 98765 43210',
      referralCode,
      status: ENTITY_STATUS.ACTIVE,
      studentCount: 0,
    });
    accessUser.counselorId = counselor._id;
    await accessUser.save();
    console.log('Created counselor:', counselorEmail, '/ Counselor@123', 'code:', referralCode);
  }

  const studentEmail = 'aarav.mehta@student.in';
  let student = await Student.findOne({ email: studentEmail });
  if (!student) {
    student = await Student.create({
      organizationId: org._id,
      assignedCounselorId: counselor._id,
      referralCodeEntered: counselor.referralCode,
      name: 'Aarav Mehta',
      email: studentEmail,
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
    });
    counselor.studentCount = await Student.countDocuments({ assignedCounselorId: counselor._id });
    await counselor.save();
    console.log('Created assigned student:', studentEmail);
  }

  const unassignedEmail = 'kabir.joshi@student.in';
  if (!(await Student.findOne({ email: unassignedEmail }))) {
    await Student.create({
      organizationId: org._id,
      assignedCounselorId: null,
      referralCodeEntered: null,
      name: 'Kabir Joshi',
      email: unassignedEmail,
      phone: '+91 90003 33333',
      registrationType: REGISTRATION_TYPES.SKIPPED,
      progress: 12,
      assessments: [],
      notes: [],
    });
    console.log('Created unassigned student:', unassignedEmail);
  }

  console.log('\nDemo ready. Organization id:', String(org._id));
  console.log('Accounts:');
  console.log('  Org Admin  meera@brightfuture.edu / Admin@12345');
  console.log('  Counselor  rahul.sharma@brightfuture.edu / Counselor@123');
  console.log('  Referral   ', counselor.referralCode);
  process.exit(0);
}

main().catch((err) => {
  console.error('seedAccessDemo failed:', err);
  process.exit(1);
});
