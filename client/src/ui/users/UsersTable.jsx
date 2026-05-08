import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { ToggleSwitch } from './ToggleSwitch.jsx';

function getInitials(name, email) {
  const source = (name && name.trim()) || (email ? email.split('@')[0] : '') || 'U';
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  const a = parts[0]?.[0] || source[0] || 'U';
  const b = parts[1]?.[0] || '';
  return (a + b).toUpperCase().slice(0, 2);
}

function formatAbsolute(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelative(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const diffMs = Date.now() - d.getTime();
  const sec = Math.round(diffMs / 1000);
  const min = Math.round(sec / 60);
  const hr = Math.round(min / 60);
  const day = Math.round(hr / 24);
  if (sec < 45) return 'just now';
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  if (day < 30) return `${day}d ago`;
  const months = Math.round(day / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.round(day / 365);
  return `${years}y ago`;
}

function Avatar({ name, email }) {
  const initials = useMemo(() => getInitials(name, email), [name, email]);
  return (
    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-neutral-200 bg-white text-[11px] font-semibold text-neutral-700">
      {initials}
    </div>
  );
}

function PremiumChip({ isPremium }) {
  return (
    <span className={isPremium ? 'chip-solid' : 'chip-muted'}>
      <span
        aria-hidden
        className={[
          'mr-1 inline-block h-1.5 w-1.5 rounded-full',
          isPremium ? 'bg-white' : 'bg-neutral-400',
        ].join(' ')}
      />
      {isPremium ? 'Premium' : 'Free'}
    </span>
  );
}

function Checkbox({ checked, indeterminate, onChange, ariaLabel, inputRef }) {
  const innerRef = useRef(null);
  const ref = inputRef || innerRef;
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = Boolean(indeterminate);
  }, [indeterminate, ref]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={ariaLabel}
      className="h-4 w-4 cursor-pointer rounded-[5px] border-neutral-300 text-neutral-900 accent-neutral-900 focus:ring-2 focus:ring-neutral-200"
    />
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-neutral-100 last:border-b-0">
      <td className="px-4 py-3.5 align-middle">
        <div className="skeleton h-4 w-4" />
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="skeleton h-8 w-8 rounded-full" />
          <div className="space-y-1.5">
            <div className="skeleton h-3 w-32" />
            <div className="skeleton h-2.5 w-44" />
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <div className="skeleton h-3 w-16" />
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5">
          <div className="skeleton h-5 w-14 rounded-full" />
          <div className="skeleton h-5 w-16 rounded-full" />
        </div>
      </td>
      <td className="px-4 py-3.5 text-right">
        <div className="ml-auto skeleton h-6 w-11 rounded-full" />
      </td>
    </tr>
  );
}

function EmptyIllustration() {
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="text-neutral-300"
    >
      <rect x="6" y="10" width="44" height="36" rx="4" />
      <line x1="6" y1="20" x2="50" y2="20" />
      <circle cx="14" cy="15" r="1" />
      <circle cx="18" cy="15" r="1" />
      <circle cx="22" cy="15" r="1" />
      <line x1="14" y1="28" x2="42" y2="28" />
      <line x1="14" y1="34" x2="34" y2="34" />
      <line x1="14" y1="40" x2="28" y2="40" />
    </svg>
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
  onClearFilters,
  hasActiveFilters,
}) {
  const headerCheckboxRef = useRef(null);

  const rows = useMemo(() => users || [], [users]);

  const handlePremiumChange = useCallback(
    (id, nextVal) => onTogglePremium(id, nextVal),
    [onTogglePremium]
  );

  const showSkeleton = loading && rows.length === 0;
  const showEmpty = !loading && rows.length === 0;

  return (
    <div className="surface overflow-hidden">
      <div className="scrollbar-thin overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50/60">
            <tr className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-500">
              <th scope="col" className="w-10 px-4 py-2.5">
                <Checkbox
                  inputRef={headerCheckboxRef}
                  checked={allSelectedOnPage}
                  indeterminate={someSelectedOnPage}
                  onChange={onToggleSelectAll}
                  ariaLabel="Select all on page"
                />
              </th>
              <th scope="col" className="px-4 py-2.5">User</th>
              <th scope="col" className="px-4 py-2.5">Joined</th>
              <th scope="col" className="px-4 py-2.5">Status</th>
              <th scope="col" className="px-4 py-2.5 text-right">Premium</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-neutral-100">
            {showSkeleton ? (
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
            ) : showEmpty ? (
              <tr>
                <td colSpan={5} className="px-4 py-16">
                  <div className="flex flex-col items-center justify-center gap-3 text-center">
                    <EmptyIllustration />
                    <div>
                      <div className="text-sm font-semibold text-neutral-900">
                        No users found
                      </div>
                      <div className="mt-0.5 text-[12px] text-neutral-500">
                        {hasActiveFilters
                          ? 'Try adjusting your search or filters.'
                          : 'Once users sign up, they will appear here.'}
                      </div>
                    </div>
                    {hasActiveFilters && onClearFilters ? (
                      <button
                        type="button"
                        className="btn-ghost mt-1 h-8 px-2.5 text-[12px]"
                        onClick={onClearFilters}
                      >
                        Clear filters
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((u) => {
                const isSelected = selectedIds.has(u.id);
                return (
                  <tr
                    key={u.id}
                    className={[
                      'group transition-colors',
                      isSelected ? 'bg-neutral-50' : 'hover:bg-neutral-50/70',
                    ].join(' ')}
                  >
                    <td className="px-4 py-3 align-middle">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => onToggleSelectOne(u.id)}
                        ariaLabel={`Select ${u.email || u.name || u.id}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={u.name} email={u.email} />
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-medium text-neutral-900">
                            {u.name || '—'}
                          </div>
                          <div
                            className="truncate font-mono text-[11.5px] text-neutral-500"
                            title={u.email || ''}
                          >
                            {u.email || '—'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td
                      className="px-4 py-3 text-[12.5px] text-neutral-600"
                      title={formatAbsolute(u.createdAtISO)}
                    >
                      {formatRelative(u.createdAtISO)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <PremiumChip isPremium={Boolean(u.isPremium)} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center justify-end">
                        <ToggleSwitch
                          checked={Boolean(u.isPremium)}
                          onChange={(nextVal) => handlePremiumChange(u.id, nextVal)}
                          label=""
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const UsersTable = memo(UsersTableImpl);
