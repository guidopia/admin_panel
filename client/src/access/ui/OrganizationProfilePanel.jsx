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
              </div>
              <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-neutral-500">
                Manage your organization profile, counselors, and students.
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
              {organization.logoUrl || 'Not set'}
            </dd>
          </div>
        </dl>
      </div>

      {analytics ? <div>{analytics}</div> : null}
    </div>
  );
}

export { ReferralSystemPanel } from './ReferralSystemPanel.jsx';