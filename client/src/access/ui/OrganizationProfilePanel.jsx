import React from 'react';
import { StatusBadge } from './primitives.jsx';

export function OrganizationProfilePanel({ organization, onEdit, analytics }) {
  if (!organization) return null;

  return (
    <div className="space-y-4">
      <div className="surface p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div
              className="grid h-14 w-14 place-items-center rounded-2xl text-lg font-bold text-white"
              style={{ backgroundColor: organization.primaryColor || '#171717' }}
            >
              {organization.branding}
            </div>
            <div>
              <div className="text-[18px] font-semibold text-neutral-900">{organization.name}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <StatusBadge status={organization.status} />
                <span className="chip-muted">White-label tenant</span>
              </div>
              <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-neutral-500">
                Manage your organization profile, counselors, and students. You cannot access other
                organizations or Guidopia platform settings.
              </p>
            </div>
          </div>
          <button type="button" className="btn-primary h-9 shrink-0 px-3 text-[12px]" onClick={onEdit}>
            Edit profile
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="surface p-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">Counselors</div>
          <div className="mt-2 text-[24px] font-semibold tabular-nums">{organization.counselorCount}</div>
        </div>
        <div className="surface p-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">Students</div>
          <div className="mt-2 text-[24px] font-semibold tabular-nums">{organization.studentCount}</div>
        </div>
        <div className="surface p-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">Admins</div>
          <div className="mt-2 text-[24px] font-semibold tabular-nums">{organization.adminCount}</div>
        </div>
      </div>

      <div className="surface p-4">
        <div className="mb-3 text-[13px] font-semibold text-neutral-900">Branding</div>
        <dl className="grid gap-3 sm:grid-cols-2 text-[13px]">
          <div>
            <dt className="text-neutral-500">Branding code</dt>
            <dd className="mt-0.5 font-mono font-semibold">{organization.branding}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Primary color</dt>
            <dd className="mt-0.5 flex items-center gap-2">
              <span
                className="inline-block h-4 w-4 rounded border border-neutral-200"
                style={{ backgroundColor: organization.primaryColor }}
              />
              <span className="font-mono">{organization.primaryColor}</span>
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500">Logo URL</dt>
            <dd className="mt-0.5 break-all font-mono text-[12px] text-neutral-700">
              {organization.logoUrl || 'Not set — upload via backend'}
            </dd>
          </div>
        </dl>
      </div>

      {analytics ? <div>{analytics}</div> : null}
    </div>
  );
}

export function ReferralSystemPanel() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface p-5">
          <div className="mb-1 text-[14px] font-semibold text-neutral-900">Case 1 · Student enters referral code</div>
          <p className="mb-4 text-[12.5px] text-neutral-500">Example: student enters <span className="font-mono font-semibold">RAH582</span></p>
          <ol className="space-y-2 text-[12.5px] text-neutral-700">
            <li className="flex gap-2"><span className="font-semibold text-neutral-400">1.</span> System finds counselor with matching code</li>
            <li className="flex gap-2"><span className="font-semibold text-neutral-400">2.</span> Sets <span className="font-mono">assignedCounselorId</span></li>
            <li className="flex gap-2"><span className="font-semibold text-neutral-400">3.</span> Visible to white-label admin + assigned counselor</li>
            <li className="flex gap-2"><span className="font-semibold text-neutral-400">4.</span> Not visible to other counselors</li>
          </ol>
        </div>

        <div className="surface p-5">
          <div className="mb-1 text-[14px] font-semibold text-neutral-900">Case 2 · Student skips referral code</div>
          <p className="mb-4 text-[12.5px] text-neutral-500"><span className="font-mono">assignedCounselorId = NULL</span></p>
          <ol className="space-y-2 text-[12.5px] text-neutral-700">
            <li className="flex gap-2"><span className="font-semibold text-neutral-400">1.</span> Student registers without a code</li>
            <li className="flex gap-2"><span className="font-semibold text-neutral-400">2.</span> Visible only to white-label admin</li>
            <li className="flex gap-2"><span className="font-semibold text-neutral-400">3.</span> No counselor can see them yet</li>
            <li className="flex gap-2"><span className="font-semibold text-neutral-400">4.</span> Admin assigns counselor manually later</li>
          </ol>
        </div>
      </div>

      <div className="surface p-5">
        <div className="mb-3 text-[14px] font-semibold text-neutral-900">Manual assignment & reassignment</div>
        <div className="grid gap-3 md:grid-cols-2 text-[12.5px] text-neutral-700">
          <div className="rounded-xl border border-neutral-200 px-3 py-3">
            <div className="font-medium text-neutral-900">Manual assignment</div>
            <p className="mt-1 text-neutral-500">Admin opens student → Assign counselor → Select → Save. Student immediately appears in counselor dashboard.</p>
          </div>
          <div className="rounded-xl border border-neutral-200 px-3 py-3">
            <div className="font-medium text-neutral-900">Reassignment</div>
            <p className="mt-1 text-neutral-500">Admin changes counselor. Old counselor loses access; new counselor gains access immediately.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
