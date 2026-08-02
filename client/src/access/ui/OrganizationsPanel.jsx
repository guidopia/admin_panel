import React, { useMemo } from 'react';
import { EmptyState, SearchInput, StatusBadge } from './primitives.jsx';

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

export function OrganizationsPanel({
  organizations,
  query,
  onQueryChange,
  onSelect,
  onAdd,
  onEdit,
  onToggleStatus,
  onDelete,
  canManage = true,
}) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return organizations;
    return organizations.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.branding.toLowerCase().includes(q) ||
        o.status.toLowerCase().includes(q)
    );
  }, [organizations, query]);

  return (
    <div className="space-y-3">
      <div className="surface p-2.5">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <SearchInput
            value={query}
            onChange={onQueryChange}
            placeholder="Search organizations by name or branding"
          />
          {canManage ? (
            <button type="button" className="btn-primary h-9 shrink-0 px-3 text-[12px]" onClick={onAdd}>
              Add organization
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
                  <th className="px-4 py-3">Organization</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Admins</th>
                  <th className="px-4 py-3">Counselors</th>
                  <th className="px-4 py-3">Students</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((org) => (
                  <tr key={org.id} className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50/60">
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-neutral-900">{org.name}</div>
                      <div className="mt-0.5 font-mono text-[11px] text-neutral-500">{org.branding}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={org.status} />
                    </td>
                    <td className="px-4 py-3.5 tabular-nums text-neutral-700">{org.adminCount}</td>
                    <td className="px-4 py-3.5 tabular-nums text-neutral-700">{org.counselorCount}</td>
                    <td className="px-4 py-3.5 tabular-nums text-neutral-700">{org.studentCount}</td>
                    <td className="px-4 py-3.5 text-neutral-600">{formatDate(org.createdAt)}</td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex gap-1.5">
                        <button type="button" className="btn-ghost h-8 px-2.5 text-[12px]" onClick={() => onSelect(org)}>
                          View
                        </button>
                        {canManage ? (
                          <>
                            <button type="button" className="btn-ghost h-8 px-2.5 text-[12px]" onClick={() => onEdit(org)}>
                              Edit
                            </button>
                            <button type="button" className="btn-ghost h-8 px-2.5 text-[12px]" onClick={() => onToggleStatus(org)}>
                              {org.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                            {onDelete ? (
                              <button
                                type="button"
                                className="inline-flex h-8 items-center rounded-lg border border-red-200 px-2.5 text-[12px] font-medium text-red-700 hover:bg-red-50"
                                onClick={() => onDelete(org)}
                              >
                                Delete
                              </button>
                            ) : null}
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
          <EmptyState title="No organizations found" description="Try adjusting your search filters." />
        )}
      </div>
    </div>
  );
}
