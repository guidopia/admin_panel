import React, { useMemo } from 'react';

export function FiltersBar({
  query,
  onQueryChange,
  premium,
  onPremiumChange,
  role,
  onRoleChange,
  limit,
  onLimitChange,
  selectedCount,
  onBulkGrant,
  onBulkRemove,
  loading,
}) {
  const bulkDisabled = selectedCount === 0 || loading;

  const bulkLabel = useMemo(() => {
    if (!selectedCount) return 'No users selected';
    return `${selectedCount} selected`;
  }, [selectedCount]);

  return (
    <div className="rounded-2xl border bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center">
          <div className="flex-1">
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="flex gap-2">
            <select
              className="rounded-xl border px-3 py-2 text-sm"
              value={premium}
              onChange={(e) => onPremiumChange(e.target.value)}
            >
              <option value="all">All</option>
              <option value="true">Premium</option>
              <option value="false">Non-premium</option>
            </select>

            <select
              className="rounded-xl border px-3 py-2 text-sm"
              value={role}
              onChange={(e) => onRoleChange(e.target.value)}
            >
              <option value="all">All roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>

            <select
              className="rounded-xl border px-3 py-2 text-sm"
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 md:flex-row md:items-center">
          <div className="text-xs text-slate-500">{bulkLabel}</div>
          <div className="flex gap-2">
            <button
              disabled={bulkDisabled}
              onClick={onBulkGrant}
              className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              Grant Premium
            </button>
            <button
              disabled={bulkDisabled}
              onClick={onBulkRemove}
              className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Remove Premium
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

