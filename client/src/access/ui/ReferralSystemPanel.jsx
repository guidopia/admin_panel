import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import { orgName } from '../lib/accessConstants.js';
import { EmptyState, ReferralCodeBadge, SearchInput, StatusBadge } from './primitives.jsx';

/** Super Admin referral codes dashboard. */
export function ReferralSystemPanel({
  counselors = [],
  students = [],
  organizations = [],
  onAddCounselor,
  onRegenerate,
  canManage = true,
}) {
  const [query, setQuery] = useState('');
  const [testCode, setTestCode] = useState('');
  const [testResult, setTestResult] = useState(null);

  const referralStudents = useMemo(
    () => students.filter((s) => s.registrationType === 'referral' || s.referralCodeEntered),
    [students]
  );

  const activeCodes = useMemo(
    () => counselors.filter((c) => c.status === 'active' && c.referralCode),
    [counselors]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return counselors;
    return counselors.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.referralCode.toLowerCase().includes(q) ||
        orgName(c.organizationId, organizations).toLowerCase().includes(q)
    );
  }, [counselors, organizations, query]);

  function runLocalValidate() {
    const code = testCode.trim().toUpperCase().replace(/\s+/g, '');
    if (!code) {
      setTestResult({ valid: false, message: 'Enter a code to test' });
      return;
    }
    if (!/^[A-Z0-9]{6,8}$/.test(code)) {
      setTestResult({ valid: false, message: 'Code must be 6–8 letters/numbers' });
      return;
    }
    const counselor = counselors.find(
      (c) => c.referralCode === code && c.status === 'active'
    );
    if (!counselor) {
      setTestResult({ valid: false, message: 'Invalid referral code — no active counselor' });
      return;
    }
    const org = organizations.find((o) => o.id === counselor.organizationId);
    if (org && org.status !== 'active') {
      setTestResult({
        valid: false,
        message: `Organization "${org.name}" is inactive — this code will be rejected`,
      });
      return;
    }
    setTestResult({
      valid: true,
      message: `Valid · ${counselor.name} · ${orgName(counselor.organizationId, organizations)}`,
    });
  }

  async function copyCode(code) {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Copied ${code}`);
    } catch {
      toast.error('Could not copy');
    }
  }

  return (
    <div className="space-y-4">
      <div className="surface p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[15px] font-semibold text-neutral-900">Referral codes</h2>
              <span className="chip-outline">Student portal</span>
            </div>
            <p className="mt-1 max-w-2xl text-[12.5px] leading-relaxed text-neutral-500">
              Each counselor gets a unique code. Students enter it during onboarding and are
              auto-assigned to that counselor.
            </p>
          </div>
          {canManage ? (
            <button type="button" className="btn-primary h-9 shrink-0 px-3 text-[12px]" onClick={onAddCounselor}>
              Create counselor + code
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-neutral-200 px-3 py-3">
            <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">
              Active codes
            </div>
            <div className="mt-1 text-[22px] font-semibold tabular-nums">{activeCodes.length}</div>
          </div>
          <div className="rounded-xl border border-neutral-200 px-3 py-3">
            <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">
              Referral students
            </div>
            <div className="mt-1 text-[22px] font-semibold tabular-nums">{referralStudents.length}</div>
          </div>
          <div className="rounded-xl border border-neutral-200 px-3 py-3">
            <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">
              Unassigned students
            </div>
            <div className="mt-1 text-[22px] font-semibold tabular-nums">
              {students.filter((s) => !s.assignedCounselorId).length}
            </div>
          </div>
        </div>
      </div>

      <div className="surface p-4">
        <div className="mb-2 text-[13px] font-semibold text-neutral-900">Test a referral code</div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="input h-9 font-mono uppercase"
            value={testCode}
            onChange={(e) => {
              setTestCode(e.target.value.toUpperCase());
              setTestResult(null);
            }}
            placeholder="e.g. RAHAVA"
            maxLength={8}
          />
          <button type="button" className="btn-primary h-9 px-3 text-[12px]" onClick={runLocalValidate}>
            Validate
          </button>
        </div>
        {testResult ? (
          <div
            className={`mt-2 text-[12.5px] ${
              testResult.valid ? 'text-emerald-700' : 'text-red-600'
            }`}
          >
            {testResult.message}
          </div>
        ) : null}
      </div>

      <div className="surface p-2.5">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search counselors / referral codes"
        />
      </div>

      <div className="surface overflow-hidden">
        {filtered.length ? (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="min-w-full text-left text-[13px]">
              <thead className="border-b border-neutral-100 bg-neutral-50/70 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Counselor</th>
                  <th className="px-4 py-3">Organization</th>
                  <th className="px-4 py-3">Referral code</th>
                  <th className="px-4 py-3">Students</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-neutral-50 last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium text-neutral-900">{c.name}</div>
                      <div className="text-[12px] text-neutral-500">{c.email}</div>
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      {orgName(c.organizationId, organizations)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5"
                        onClick={() => copyCode(c.referralCode)}
                        title="Copy code"
                      >
                        <ReferralCodeBadge code={c.referralCode} />
                      </button>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{c.studentCount ?? 0}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canManage ? (
                        <button
                          type="button"
                          className="btn-ghost h-8 px-2.5 text-[12px]"
                          onClick={() => onRegenerate?.(c)}
                        >
                          Regenerate
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No referral codes yet"
            description="Create a counselor to generate a referral code."
            action={
              canManage ? (
                <button type="button" className="btn-primary h-9 px-3 text-[12px]" onClick={onAddCounselor}>
                  Create counselor + code
                </button>
              ) : null
            }
          />
        )}
      </div>

      <div className="surface overflow-hidden">
        <div className="border-b border-neutral-100 px-4 py-3 text-[13px] font-semibold text-neutral-900">
          Recent students who used a code
        </div>
        {referralStudents.length ? (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="min-w-full text-left text-[13px]">
              <thead className="border-b border-neutral-100 bg-neutral-50/70 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Code entered</th>
                  <th className="px-4 py-3">Organization</th>
                </tr>
              </thead>
              <tbody>
                {referralStudents.slice(0, 25).map((s) => (
                  <tr key={s.id} className="border-b border-neutral-50 last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium text-neutral-900">{s.name}</div>
                      <div className="text-[12px] text-neutral-500">{s.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <ReferralCodeBadge code={s.referralCodeEntered || '—'} />
                    </td>
                    <td className="px-4 py-3 text-neutral-700">
                      {orgName(s.organizationId, organizations)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-[12.5px] text-neutral-500">
            No referral signups yet. Share a counselor code with students during onboarding.
          </div>
        )}
      </div>
    </div>
  );
}
