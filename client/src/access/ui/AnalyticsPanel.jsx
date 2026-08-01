import React from 'react';

const cards = [
  { key: 'organizations', label: 'Organizations', hint: 'Active organizations' },
  { key: 'counselors', label: 'Counselors', hint: 'With referral codes' },
  { key: 'students', label: 'Students', hint: 'Across all organizations' },
  { key: 'unassigned', label: 'Unassigned', hint: 'Awaiting counselor assignment' },
];

export function StatCards({ stats }) {
  const values = {
    organizations: stats.totalOrganizations,
    counselors: stats.totalCounselors,
    students: stats.totalStudents,
    unassigned: stats.unassignedStudents,
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.key} className="surface p-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">
            {card.label}
          </div>
          <div className="mt-2 text-[28px] font-semibold tabular-nums tracking-tight text-neutral-900">
            {values[card.key]?.toLocaleString?.() ?? '—'}
          </div>
          <div className="mt-1 text-[12px] text-neutral-500">{card.hint}</div>
        </div>
      ))}
    </div>
  );
}

export function AnalyticsPanel({ stats }) {
  const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
  const max = Math.max(...stats.monthlySignups, 1);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="surface p-4">
          <div className="text-[12px] font-medium text-neutral-500">Referral conversion</div>
          <div className="mt-2 text-[24px] font-semibold tabular-nums text-neutral-900">
            {stats.referralConversionRate}%
          </div>
          <p className="mt-1 text-[12px] text-neutral-500">Students who entered a referral code</p>
        </div>
        <div className="surface p-4">
          <div className="text-[12px] font-medium text-neutral-500">Active organizations</div>
          <div className="mt-2 text-[24px] font-semibold tabular-nums text-neutral-900">
            {stats.activeOrganizations}
          </div>
          <p className="mt-1 text-[12px] text-neutral-500">Out of {stats.totalOrganizations} total</p>
        </div>
        <div className="surface p-4">
          <div className="text-[12px] font-medium text-neutral-500">Unassigned students</div>
          <div className="mt-2 text-[24px] font-semibold tabular-nums text-amber-700">
            {stats.unassignedStudents}
          </div>
          <p className="mt-1 text-[12px] text-neutral-500">Need counselor assignment</p>
        </div>
      </div>

      <div className="surface p-5">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <div className="text-[14px] font-semibold text-neutral-900">Monthly student signups</div>
            <p className="mt-0.5 text-[12px] text-neutral-500">Trend over recent months</p>
          </div>
          <span className="chip-muted">6 months</span>
        </div>
        <div className="flex h-40 items-end gap-2">
          {stats.monthlySignups.map((value, idx) => (
            <div key={months[idx]} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-md bg-neutral-900/90 transition-all"
                style={{ height: `${Math.max(12, (value / max) * 100)}%` }}
                title={`${value} signups`}
              />
              <span className="text-[11px] font-medium text-neutral-500">{months[idx]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
