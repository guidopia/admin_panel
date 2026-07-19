import React from 'react';

export function OrganizationAnalyticsPanel({ organization, students, counselors }) {
  if (!organization) return null;

  const orgStudents = students.filter((s) => s.organizationId === organization.id);
  const orgCounselors = counselors.filter((c) => c.organizationId === organization.id);
  const unassigned = orgStudents.filter((s) => !s.assignedCounselorId).length;
  const withReferral = orgStudents.filter((s) => s.referralCodeEntered).length;
  const conversion = orgStudents.length ? Math.round((withReferral / orgStudents.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="surface p-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">Counselors</div>
          <div className="mt-2 text-[24px] font-semibold tabular-nums">{orgCounselors.length}</div>
        </div>
        <div className="surface p-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">Students</div>
          <div className="mt-2 text-[24px] font-semibold tabular-nums">{orgStudents.length}</div>
        </div>
        <div className="surface p-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">Unassigned</div>
          <div className="mt-2 text-[24px] font-semibold tabular-nums text-amber-700">{unassigned}</div>
        </div>
        <div className="surface p-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400">Referral rate</div>
          <div className="mt-2 text-[24px] font-semibold tabular-nums">{conversion}%</div>
        </div>
      </div>

      <div className="surface p-5">
        <div className="mb-3 text-[14px] font-semibold text-neutral-900">Counselor breakdown</div>
        {orgCounselors.length ? (
          <div className="space-y-2">
            {orgCounselors.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-xl border border-neutral-200 px-3 py-2.5 text-[13px]">
                <div>
                  <div className="font-medium text-neutral-900">{c.name}</div>
                  <div className="mt-0.5 font-mono text-[11px] text-neutral-500">{c.referralCode}</div>
                </div>
                <span className="chip-outline tabular-nums">{c.studentCount} students</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-neutral-500">No counselors in this organization yet.</p>
        )}
      </div>
    </div>
  );
}
