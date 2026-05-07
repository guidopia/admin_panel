import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { ToggleSwitch } from './ToggleSwitch.jsx';

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

function RolePill({ role }) {
  const isAdmin = role === 'admin';
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
        isAdmin ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-700',
      ].join(' ')}
    >
      {isAdmin ? 'Admin' : 'User'}
    </span>
  );
}

function PremiumPill({ isPremium }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
        isPremium ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700',
      ].join(' ')}
    >
      {isPremium ? 'Premium' : 'Free'}
    </span>
  );
}

function UsersTableImpl({
  users,
  loading,
  selectedIds,
  allSelectedOnPage,
  someSelectedOnPage,
  onToggleSelectAll,
  onToggleSelectOne,
  onTogglePremium,
}) {
  const headerCheckboxRef = useRef(null);

  useEffect(() => {
    if (!headerCheckboxRef.current) return;
    headerCheckboxRef.current.indeterminate = someSelectedOnPage;
  }, [someSelectedOnPage]);

  const rows = useMemo(() => users || [], [users]);

  const handlePremiumChange = useCallback(
    (id, nextVal) => {
      onTogglePremium(id, nextVal);
    },
    [onTogglePremium]
  );

  return (
    <div className="rounded-2xl border bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-50">
            <tr className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              <th className="w-10 px-4 py-3">
                <input
                  ref={headerCheckboxRef}
                  type="checkbox"
                  checked={allSelectedOnPage}
                  onChange={onToggleSelectAll}
                  aria-label="Select all on page"
                />
              </th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Signup Date</th>
              <th className="px-4 py-3">Premium</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-10 text-center text-slate-600" colSpan={7}>
                  Loading users…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-slate-600" colSpan={7}>
                  No users found.
                </td>
              </tr>
            ) : (
              rows.map((u) => (
                <tr key={u.id} className="border-b last:border-b-0 hover:bg-slate-50/40">
                  <td className="px-4 py-3 align-middle">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(u.id)}
                      onChange={() => onToggleSelectOne(u.id)}
                      aria-label={`Select ${u.email}`}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{u.name || '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{u.email || '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDate(u.createdAtISO)}</td>
                  <td className="px-4 py-3">
                    <PremiumPill isPremium={Boolean(u.isPremium)} />
                  </td>
                  <td className="px-4 py-3">
                    <RolePill role={u.role || 'user'} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ToggleSwitch
                      checked={Boolean(u.isPremium)}
                      onChange={(nextVal) => handlePremiumChange(u.id, nextVal)}
                      label=""
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const UsersTable = memo(UsersTableImpl);

