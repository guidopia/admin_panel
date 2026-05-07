import React from 'react';

function SearchIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function Segmented({ value, onChange, options, ariaLabel }) {
  return (
    <div className="seg" role="group" aria-label={ariaLabel}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={['seg-item', active ? 'seg-item-active' : ''].join(' ')}
            aria-pressed={active}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

const PREMIUM_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'true', label: 'Premium' },
  { value: 'false', label: 'Free' },
];

const ROLE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'User' },
];

const LIMIT_OPTIONS = [10, 20, 50, 100];

export function UsersToolbar({
  query,
  onQueryChange,
  premium,
  onPremiumChange,
  role,
  onRoleChange,
  limit,
  onLimitChange,
  loading,
}) {
  return (
    <div className="surface p-2.5">
      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:gap-3">
        <div className="relative flex-1 min-w-0">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            <SearchIcon />
          </span>
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search users by name or email"
            className="input h-9 pl-8 pr-14"
            aria-label="Search users"
          />
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex">
            <span className="kbd">/</span>
          </span>
          {loading ? (
            <span
              aria-hidden
              className="absolute right-9 top-1/2 hidden h-2 w-2 -translate-y-1/2 animate-pulse rounded-full bg-neutral-300 sm:block"
            />
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden items-center gap-1.5 sm:flex">
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">
              Plan
            </span>
            <Segmented
              ariaLabel="Filter by premium"
              value={premium}
              onChange={onPremiumChange}
              options={PREMIUM_OPTIONS}
            />
          </div>

          <div className="hidden items-center gap-1.5 sm:flex">
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">
              Role
            </span>
            <Segmented
              ariaLabel="Filter by role"
              value={role}
              onChange={onRoleChange}
              options={ROLE_OPTIONS}
            />
          </div>

          <div className="sm:hidden">
            <Segmented
              ariaLabel="Filter by premium"
              value={premium}
              onChange={onPremiumChange}
              options={PREMIUM_OPTIONS}
            />
          </div>
          <div className="sm:hidden">
            <Segmented
              ariaLabel="Filter by role"
              value={role}
              onChange={onRoleChange}
              options={ROLE_OPTIONS}
            />
          </div>

          <div className="relative">
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="input h-8 appearance-none pr-7 text-[12px]"
              aria-label="Rows per page"
            >
              {LIMIT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400">
              <ChevronDownIcon />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
