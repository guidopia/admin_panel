import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildReferralCodeCandidate,
  isReferralCodeProvided,
  isValidReferralCodeFormat,
  normalizeReferralCode,
} from './referralCode.js';

describe('normalizeReferralCode', () => {
  it('uppercases and strips spaces', () => {
    assert.equal(normalizeReferralCode(' rah 7k2 '), 'RAH7K2');
  });

  it('treats empty / whitespace / nullish as not provided', () => {
    assert.equal(normalizeReferralCode(''), '');
    assert.equal(normalizeReferralCode('   '), '');
    assert.equal(normalizeReferralCode(null), '');
    assert.equal(normalizeReferralCode(undefined), '');
  });
});

describe('isReferralCodeProvided', () => {
  it('is false for empty query-param style values', () => {
    assert.equal(isReferralCodeProvided(''), false);
    assert.equal(isReferralCodeProvided('  '), false);
    assert.equal(isReferralCodeProvided(null), false);
  });

  it('is true for any non-empty normalized code', () => {
    assert.equal(isReferralCodeProvided('abc'), true);
    assert.equal(isReferralCodeProvided('RAH7K2'), true);
  });
});

describe('isValidReferralCodeFormat', () => {
  it('accepts 6–8 uppercase alphanumeric', () => {
    assert.equal(isValidReferralCodeFormat('RAH7K2'), true);
    assert.equal(isValidReferralCodeFormat('ABCDEFGH'), true);
    assert.equal(isValidReferralCodeFormat('abc123'), true);
  });

  it('rejects too short, too long, or non-alphanumeric', () => {
    assert.equal(isValidReferralCodeFormat('ABC12'), false);
    assert.equal(isValidReferralCodeFormat('ABCDEFGHI'), false);
    assert.equal(isValidReferralCodeFormat('RAH-7K'), false);
    assert.equal(isValidReferralCodeFormat(''), false);
  });
});

describe('buildReferralCodeCandidate', () => {
  it('uses first 3 alpha letters of name as prefix', () => {
    const code = buildReferralCodeCandidate('Rahul Sharma');
    assert.match(code, /^RAH[A-Z0-9]{3,5}$/);
    assert.ok(code.length >= 6 && code.length <= 8);
  });

  it('pads non-alpha names with X', () => {
    const code = buildReferralCodeCandidate('123');
    assert.match(code, /^XXX[A-Z0-9]{3,5}$/);
  });

  it('pads short names', () => {
    const code = buildReferralCodeCandidate('Jo');
    assert.match(code, /^JOX[A-Z0-9]{3,5}$/);
  });

  it('produces unique-ish codes across many draws', () => {
    const set = new Set();
    for (let i = 0; i < 50; i += 1) {
      set.add(buildReferralCodeCandidate('Rahul'));
    }
    assert.ok(set.size > 40, `expected collision-resistant draws, got ${set.size} unique`);
  });
});
