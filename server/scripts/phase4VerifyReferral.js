/**
 * Phase 4 verification — exercises Access Control referral flows against a running Admin API.
 *
 * Usage (from server/):
 *   node scripts/phase4VerifyReferral.js
 *
 * Requires: Admin API on PORT (default 5000), .env with INTERNAL_REGISTER_KEY + super-admin creds.
 */
import 'dotenv/config';

const BASE = `http://127.0.0.1:${process.env.PORT || 5000}`;
const KEY = (process.env.INTERNAL_REGISTER_KEY || '').trim();
const SUPER_EMAIL = (process.env.SUPER_ADMIN_EMAIL || 'guidopiacareer@gmail.com').toLowerCase();
const SUPER_PASS = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123';

const results = [];
function pass(name, detail = '') {
  results.push({ name, ok: true, detail });
  console.log(`✔ PASS  ${name}${detail ? ` — ${detail}` : ''}`);
}
function fail(name, detail = '') {
  results.push({ name, ok: false, detail });
  console.error(`✖ FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
}

async function waitForHealth(maxMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const res = await fetch(`${BASE}/health`);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Admin API not healthy at ${BASE}/health within ${maxMs}ms`);
}

async function api(method, path, { token, body, internal } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (internal && KEY) headers['x-internal-key'] = KEY;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { status: res.status, data };
}

function assertCodeFormat(code) {
  return typeof code === 'string' && /^[A-Z0-9]{6,8}$/.test(code);
}

async function main() {
  console.log(`\n=== Phase 4 Referral Verification ===\nTarget: ${BASE}\n`);
  await waitForHealth();
  pass('Admin /health reachable');

  // Login as super-admin
  const login = await api('POST', '/api/access/auth/login', {
    body: { email: SUPER_EMAIL, password: SUPER_PASS },
  });
  if (login.status !== 200 || !login.data?.token) {
    fail('Super-admin login', `${login.status} ${JSON.stringify(login.data)}`);
    printSummary();
    process.exit(1);
  }
  const token = login.data.token;
  pass('Super-admin login');

  // Ensure we have an org
  const orgs = await api('GET', '/api/access/organizations', { token });
  let orgId = orgs.data?.organizations?.[0]?.id;
  if (!orgId) {
    const created = await api('POST', '/api/access/organizations', {
      token,
      body: { name: `Phase4 Org ${Date.now()}`, branding: 'P4' },
    });
    orgId = created.data?.organization?.id;
  }
  if (!orgId) {
    fail('Resolve organization', JSON.stringify(orgs.data));
    printSummary();
    process.exit(1);
  }
  pass('Organization ready', orgId);

  const stamp = Date.now();

  // ── 1. Create counselor → code format ───────────────────────────────
  const c1 = await api('POST', '/api/access/counselors', {
    token,
    body: {
      organizationId: orgId,
      name: 'Rahul PhaseFour',
      email: `rahul.p4.${stamp}@test.guidopia.local`,
      phone: '+910000000001',
    },
  });
  const code1 = c1.data?.counselor?.referralCode;
  const counselorId1 = c1.data?.counselor?.id;
  if (c1.status === 201 && assertCodeFormat(code1)) {
    pass('Create counselor → code format 6–8 A-Z0-9', code1);
  } else {
    fail('Create counselor → code format', `${c1.status} ${JSON.stringify(c1.data)}`);
  }

  // ── 2. Prefix collision → unique codes ──────────────────────────────
  const c2 = await api('POST', '/api/access/counselors', {
    token,
    body: {
      organizationId: orgId,
      name: 'Rahul Twin',
      email: `rahul.twin.${stamp}@test.guidopia.local`,
      phone: '+910000000002',
    },
  });
  const code2 = c2.data?.counselor?.referralCode;
  const counselorId2 = c2.data?.counselor?.id;
  if (c2.status === 201 && assertCodeFormat(code2) && code2 !== code1) {
    pass('Prefix-collision names get unique codes', `${code1} vs ${code2}`);
  } else {
    fail('Prefix-collision unique codes', `${c2.status} ${code1} / ${code2}`);
  }

  // ── 3. Validate via S2S (simulates Vidhya ?ref= path) ───────────────
  const v1 = await api('GET', `/api/access/referral/validate?code=${encodeURIComponent(code1)}`, {
    internal: true,
  });
  if (v1.status === 200 && v1.data?.valid === true && v1.data?.counselorId === counselorId1) {
    pass('Validate active code (S2S / ?ref= path)', code1);
  } else {
    fail('Validate active code', `${v1.status} ${JSON.stringify(v1.data)}`);
  }

  // ── 4. Lowercase input still works ──────────────────────────────────
  const vLower = await api(
    'GET',
    `/api/access/referral/validate?code=${encodeURIComponent(String(code1).toLowerCase())}`,
    { internal: true }
  );
  if (vLower.status === 200 && vLower.data?.valid === true) {
    pass('Lowercase code validates', String(code1).toLowerCase());
  } else {
    fail('Lowercase code validates', JSON.stringify(vLower.data));
  }

  // ── 5. Empty ?ref= → not_provided (not hard-block for idle) ─────────
  const vEmpty = await api('GET', '/api/access/referral/validate?code=', { internal: true });
  if (
    vEmpty.status === 200 &&
    vEmpty.data?.valid === false &&
    (vEmpty.data?.reason === 'not_provided' || vEmpty.data?.reason === 'malformed')
  ) {
    // empty may normalize to not_provided; whitespace-only also
    pass('Empty code → not provided / non-valid', `reason=${vEmpty.data.reason}`);
  } else {
    fail('Empty code handling', JSON.stringify(vEmpty.data));
  }

  const vWs = await api('GET', '/api/access/referral/validate?code=%20%20', { internal: true });
  if (vWs.status === 200 && vWs.data?.valid === false && vWs.data?.reason === 'not_provided') {
    pass('Whitespace-only code → not_provided');
  } else {
    fail('Whitespace-only code', JSON.stringify(vWs.data));
  }

  // ── 6. Invalid code → hard-block register (no student) ──────────────
  const fakeEmail = `fake.p4.${stamp}@test.guidopia.local`;
  const badReg = await api('POST', '/api/access/students/register', {
    internal: true,
    body: {
      name: 'Fake Student',
      email: fakeEmail,
      referralCode: 'ZZZZZZ99',
    },
  });
  const lookupFake = await api(
    'GET',
    `/api/access/students/lookup?email=${encodeURIComponent(fakeEmail)}`,
    { internal: true }
  );
  if (
    badReg.status === 400 &&
    badReg.data?.reason &&
    lookupFake.data?.assignmentStatus === 'not-registered'
  ) {
    pass('Invalid code hard-blocks register (no student created)', `reason=${badReg.data.reason}`);
  } else {
    fail(
      'Invalid code hard-block',
      `reg=${badReg.status} ${JSON.stringify(badReg.data)} lookup=${JSON.stringify(lookupFake.data)}`
    );
  }

  // ── 7. No code → unassigned allowed ─────────────────────────────────
  const organicEmail = `organic.p4.${stamp}@test.guidopia.local`;
  const organic = await api('POST', '/api/access/students/register', {
    internal: true,
    body: { name: 'Organic Student', email: organicEmail },
  });
  if (
    organic.status === 201 &&
    !organic.data?.student?.assignedCounselorId &&
    organic.data?.student?.registrationType === 'skipped'
  ) {
    pass('No code → unassigned signup allowed', organic.data.student.id);
  } else {
    fail('No code unassigned', `${organic.status} ${JSON.stringify(organic.data)}`);
  }

  // ── 8. Valid register via ?ref= simulation + attribution fields ─────
  const refEmail = `referred.p4.${stamp}@test.guidopia.local`;
  const refReg = await api('POST', '/api/access/students/register', {
    internal: true,
    body: {
      name: 'Referred Student',
      email: refEmail,
      referralCode: code1,
    },
  });
  const st = refReg.data?.student;
  if (
    refReg.status === 201 &&
    st?.assignedCounselorId === counselorId1 &&
    st?.referredCounselorId === counselorId1 &&
    st?.referralCodeEntered === code1
  ) {
    pass('Valid code assigns + snapshots referredCounselorId', st.id);
  } else {
    fail('Valid code assign/attribution', `${refReg.status} ${JSON.stringify(refReg.data)}`);
  }

  // ── 9. Regenerate → old revoked, new works ──────────────────────────
  const regen = await api('POST', `/api/access/counselors/${counselorId1}/referral-code`, {
    token,
  });
  const newCode = regen.data?.counselor?.referralCode || regen.data?.referralCode;
  const oldVal = await api('GET', `/api/access/referral/validate?code=${encodeURIComponent(code1)}`, {
    internal: true,
  });
  const newVal = await api(
    'GET',
    `/api/access/referral/validate?code=${encodeURIComponent(newCode)}`,
    { internal: true }
  );
  const oldRegEmail = `oldcode.p4.${stamp}@test.guidopia.local`;
  const oldReg = await api('POST', '/api/access/students/register', {
    internal: true,
    body: { name: 'Old Code Student', email: oldRegEmail, referralCode: code1 },
  });
  const newRegEmail = `newcode.p4.${stamp}@test.guidopia.local`;
  const newReg = await api('POST', '/api/access/students/register', {
    internal: true,
    body: { name: 'New Code Student', email: newRegEmail, referralCode: newCode },
  });

  if (
    assertCodeFormat(newCode) &&
    newCode !== code1 &&
    oldVal.data?.valid === false &&
    oldVal.data?.reason === 'revoked' &&
    newVal.data?.valid === true &&
    oldReg.status === 400 &&
    newReg.status === 201 &&
    newReg.data?.student?.assignedCounselorId === counselorId1 &&
    // Attribution for student who used OLD code before regen still has old string
    st?.referralCodeEntered === code1
  ) {
    pass('Regenerate soft-revokes old; new works; prior attribution kept', `${code1} → ${newCode}`);
  } else {
    fail(
      'Regenerate soft-revoke',
      JSON.stringify({
        newCode,
        oldVal: oldVal.data,
        newVal: newVal.data,
        oldReg: { status: oldReg.status, data: oldReg.data },
        newReg: { status: newReg.status, assigned: newReg.data?.student?.assignedCounselorId },
        priorEntered: st?.referralCodeEntered,
      })
    );
  }

  // ── 10. Concurrent same-code submissions ────────────────────────────
  // Use counselor2's still-active code
  const emails = [
    `concurrent.a.${stamp}@test.guidopia.local`,
    `concurrent.b.${stamp}@test.guidopia.local`,
  ];
  const [a, b] = await Promise.all(
    emails.map((email, i) =>
      api('POST', '/api/access/students/register', {
        internal: true,
        body: {
          name: `Concurrent ${i}`,
          email,
          referralCode: code2,
        },
      })
    )
  );
  const bothOk =
    a.status === 201 &&
    b.status === 201 &&
    a.data?.student?.assignedCounselorId === counselorId2 &&
    b.data?.student?.assignedCounselorId === counselorId2 &&
    a.data?.student?.id !== b.data?.student?.id;

  const c2After = await api('GET', `/api/access/counselors/${counselorId2}`, { token });
  const count = c2After.data?.counselor?.studentCount;

  if (bothOk && typeof count === 'number' && count >= 2) {
    pass('Concurrent same-code → both assigned, studentCount ok', `studentCount=${count}`);
  } else {
    fail(
      'Concurrent same-code',
      JSON.stringify({
        a: { status: a.status, id: a.data?.student?.id, assigned: a.data?.student?.assignedCounselorId },
        b: { status: b.status, id: b.data?.student?.id, assigned: b.data?.student?.assignedCounselorId },
        studentCount: count,
      })
    );
  }

  // Cleanup: deactivate/delete test counselors (best-effort)
  for (const id of [counselorId1, counselorId2].filter(Boolean)) {
    await api('DELETE', `/api/access/counselors/${id}`, { token }).catch(() => {});
  }

  printSummary();
  const failed = results.filter((r) => !r.ok).length;
  process.exit(failed ? 1 : 0);
}

function printSummary() {
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n=== Summary: ${passed} passed, ${failed} failed (of ${results.length}) ===\n`);
}

main().catch((err) => {
  console.error('Phase 4 runner crashed:', err);
  process.exit(1);
});
