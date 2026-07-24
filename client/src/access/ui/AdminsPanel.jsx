import React, { useMemo } from 'react';
import { orgName } from '../lib/accessConstants.js';
import { EmptyState, SearchInput, StatusBadge } from './primitives.jsx';

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

export function AdminsPanel({ admins, organizations, query, onQueryChange, onAdd }) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return admins;
    return admins.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        orgName(a.organizationId, organizations).toLowerCase().includes(q)
    );
  }, [admins, organizations, query]);

  return (
    <div className="space-y-3">
      <div className="surface p-2.5">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <SearchInput value={query} onChange={onQueryChange} placeholder="Search admins by name, email, or organization" />
          {onAdd ? (
            <button type="button" className="btn-primary h-9 shrink-0 px-3 text-[12px]" onClick={onAdd}>
              Add admin
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
                  <th className="px-4 py-3">Admin</th>
                  <th className="px-4 py-3">Organization</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((admin) => (
                  <tr key={admin.id} className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50/60">
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-neutral-900">{admin.name}</div>
                      <div className="mt-0.5 text-[12px] text-neutral-500">{admin.email}</div>
                    </td>
                    <td className="px-4 py-3.5 text-neutral-700">{orgName(admin.organizationId, organizations)}</td>
                    <td className="px-4 py-3.5">
                      <span className="chip-outline">{admin.role}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={admin.status} />
                    </td>
                    <td className="px-4 py-3.5 text-neutral-600">{formatDate(admin.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No admins found" description="Try adjusting your search filters." />
        )}
      </div>
    </div>
  );
}
