import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';

dotenv.config();

function getArg(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
}

async function main() {
  const email = getArg('--email')?.toLowerCase().trim();
  const password = getArg('--password');

  if (!email) {
    // eslint-disable-next-line no-console
    console.error('Usage: node scripts/makeAdmin.js --email someone@example.com [--password NewPassword123]');
    process.exit(1);
  }

  await connectDB(process.env.MONGODB_URI);

  const user = await User.findOne({ email });
  if (!user) {
    // eslint-disable-next-line no-console
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  user.role = 'admin';

  if (password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
  }

  await user.save();

  // eslint-disable-next-line no-console
  console.log(`Updated user ${email} -> role=admin${password ? ' (password updated)' : ''}`);
  process.exit(0);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('makeAdmin failed:', err);
  process.exit(1);
});

