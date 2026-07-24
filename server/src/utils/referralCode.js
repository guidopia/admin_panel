import crypto from 'crypto';

/**
 * Generate a platform-unique referral code: 6–8 uppercase alphanumeric chars.
 * Prefers a 3-letter name prefix + 3–5 random digits/letters.
 */
export function buildReferralCodeCandidate(name = '') {
  const prefix = String(name || 'USR')
    .replace(/[^a-zA-Z]/g, '')
    .slice(0, 3)
    .toUpperCase()
    .padEnd(3, 'X');

  const randomLen = 3 + Math.floor(Math.random() * 3); // 3–5 → total 6–8
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let suffix = '';
  const bytes = crypto.randomBytes(randomLen);
  for (let i = 0; i < randomLen; i += 1) {
    suffix += alphabet[bytes[i] % alphabet.length];
  }
  return `${prefix}${suffix}`;
}

export function normalizeReferralCode(code) {
  return String(code || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
}

export function isValidReferralCodeFormat(code) {
  return /^[A-Z0-9]{6,8}$/.test(normalizeReferralCode(code));
}
