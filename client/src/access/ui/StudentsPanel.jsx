import React, { useMemo } from 'react';
import { counselorName, orgName } from '../lib/accessConstants.js';
import {
  AssignmentBadge,
  EmptyState,
  ReferralCodeBadge,
  SearchInput,
} from './primitives.jsx';

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

export function StudentsPanel({
  students,
  counselors,
  organizations,
  query,
  onQueryChange,
  onSelectStudent,
  onAssignStudent,
  showOrgColumn = true,
  unassignedOnly = false,
  title = 'Students',
  showAssignActions = true,
}) {
  const filtered = useMemo(() => {
    let rows = students;
    if (unassignedOnly) {
      rows = rows.filter((s) => !s.assignedCounselorId);
    }
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.referralCodeEntered || '').toLowerCase().includes(q) ||
        orgName(s.organizationId, organizations).toLowerCase().includes(q) ||
        (counselorName(s.assignedCounselorId, counselors) || '').toLowerCase().includes(q)
    );
  }, [students, counselors, organizations, query, unassignedOnly]);

  return (
    <div className="space-y-3">
      <div className="surface p-2.5">
        <SearchInput
          value={query}
          onChange={onQueryChange}
          placeholder={
            unassignedOnly
              ? 'Search unassigned students by name or email'
              : 'Search students by name, email, counselor, or referral code'
          }
        />
      </div>

      <div className="surface overflow-hidden">
        {filtered.length ? (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="min-w-full text-left text-[13px]">
              <thead className="border-b border-neutral-100 bg-neutral-50/70 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  {showOrgColumn ? <th className="px-4 py-3">Organization</th> : null}
                  <th className="px-4 py-3">Assigned counselor</th>
                  <th className="px-4 py-3">Referral entered</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student) => {
                  const assignedName = counselorName(student.assignedCounselorId, counselors);
                  return (
                    <tr
                      key={student.id}
                      className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50/60"
                    >
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-neutral-900">{student.name}</div>
                        <div className="mt-0.5 text-[12px] text-neutral-500">{student.email}</div>
                      </td>
                      {showOrgColumn ? (
                        <td className="px-4 py-3.5 text-neutral-700">
                          {orgName(student.organizationId, organizations)}
                        </td>
                      ) : null}
                      <td className="px-4 py-3.5">
                        <AssignmentBadge assigned={Boolean(student.assignedCounselorId)} counselorName={assignedName} />
                      </td>
                      <td className="px-4 py-3.5">
                        <ReferralCodeBadge code={student.referralCodeEntered} />
                      </td>
                      <td className="px-4 py-3.5 text-neutral-600">{formatDate(student.createdAt)}</td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="inline-flex gap-1.5">
                          <button
                            type="button"
                            className="btn-ghost h-8 px-2.5 text-[12px]"
                            onClick={() => onSelectStudent(student)}
                          >
                            View
                          </button>
                          {showAssignActions && onAssignStudent ? (
                            <button
                              type="button"
                              className="btn-primary h-8 px-2.5 text-[12px]"
                              onClick={() => onAssignStudent(student)}
                            >
                              {student.assignedCounselorId ? 'Reassign' : 'Assign'}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={unassignedOnly ? 'No unassigned students' : `No ${title.toLowerCase()} found`}
            description={
              unassignedOnly
                ? 'All students in this scope are assigned to a counselor.'
                : 'Try adjusting your search filters.'
            }
          />
        )}
      </div>
    </div>
  );
}
