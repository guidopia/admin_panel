import React, { useMemo } from 'react';
import { orgName } from '../lib/accessConstants.js';
import { EmptyState, ReferralCodeBadge, SearchInput, StatusBadge } from './primitives.jsx';

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

export function CounselorsPanel({
  counselors,
  organizations,
  query,
  onQueryChange,
  onAddCounselor,
  onViewCounselor,
  onEditCounselor,
  onDeleteCounselor,
  onRegenerateCode,
  showOrgColumn = true,
  canManage = true,
}) {
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

  return (
    <div className="space-y-3">
      <div className="surface p-2.5">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <SearchInput
            value={query}
            onChange={onQueryChange}
            placeholder="Search counselors by name, email, or referral code"
          />
          {canManage ? (
            <button type="button" className="btn-primary h-9 shrink-0 px-3 text-[12px]" onClick={onAddCounselor}>
              Add counselor
            </button>
          ) : null}
        </div>
      </div>

      <div className="surface overflow-hidden">
        {filtered.length ? (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="min-w-full text-left text-[13px]">
              <thead className="border-b border-neutral-100 bg-neutral-50/70 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Counselor</th>
                  {showOrgColumn ? <th className="px-4 py-3">Organization</th> : null}
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Referral code</th>
                  <th className="px-4 py-3">Students</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((counselor) => (
                  <tr
                    key={counselor.id}
                    className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50/60"
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-neutral-900">{counselor.name}</div>
                      <div className="mt-0.5 text-[12px] text-neutral-500">{counselor.email}</div>
                    </td>
                    {showOrgColumn ? (
                      <td className="px-4 py-3.5 text-neutral-700">
                        {orgName(counselor.organizationId, organizations)}
                      </td>
                    ) : null}
                    <td className="px-4 py-3.5 text-neutral-600">{counselor.phone || '—'}</td>
                    <td className="px-4 py-3.5">
                      <ReferralCodeBadge code={counselor.referralCode} />
                    </td>
                    <td className="px-4 py-3.5 tabular-nums text-neutral-700">{counselor.studentCount}</td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={counselor.status} />
                    </td>
                    <td className="px-4 py-3.5 text-neutral-600">{formatDate(counselor.createdAt)}</td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex gap-1.5">
                        <button
                          type="button"
                          className="btn-ghost h-8 px-2.5 text-[12px]"
                          onClick={() => onViewCounselor(counselor)}
                        >
                          View
                        </button>
                        {canManage ? (
                          <>
                            <button
                              type="button"
                              className="btn-ghost h-8 px-2.5 text-[12px]"
                              onClick={() => onEditCounselor(counselor)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn-ghost h-8 px-2.5 text-[12px]"
                              onClick={() => onRegenerateCode(counselor)}
                            >
                              Regenerate
                            </button>
                            <button
                              type="button"
                              className="inline-flex h-8 items-center rounded-lg border border-red-200 px-2.5 text-[12px] font-medium text-red-700 hover:bg-red-50"
                              onClick={() => onDeleteCounselor(counselor)}
                            >
                              Delete
                            </button>
                          </>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No counselors found" description="Try adjusting your search or add a new counselor." />
        )}
      </div>
    </div>
  );
}
