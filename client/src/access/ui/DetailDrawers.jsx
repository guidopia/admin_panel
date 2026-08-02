import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { counselorName } from '../lib/accessConstants.js';
import {
  AssignmentBadge,
  DrawerShell,
  FieldRow,
  ReferralCodeBadge,
  StatusBadge,
} from './primitives.jsx';

function formatDate(iso) {
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

const STUDENT_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'assessments', label: 'Assessments' },
  { id: 'progress', label: 'Progress' },
  { id: 'notes', label: 'Notes' },
  { id: 'reports', label: 'Reports' },
];

function StudentTabBar({ tabs, value, onChange }) {
  return (
    <div className="seg w-full" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          className={['seg-item flex-1 text-center', value === tab.id ? 'seg-item-active' : ''].join(' ')}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function NoteComposer({ onAdd }) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await onAdd(trimmed);
      setText('');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
      <textarea
        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-[13px] outline-none transition focus:border-neutral-400"
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a note about this student…"
        maxLength={2000}
      />
      <button
        type="button"
        className="btn-primary h-9 w-full justify-center text-[12px]"
        disabled={saving || !text.trim()}
        onClick={submit}
      >
        {saving ? 'Saving…' : 'Add note'}
      </button>
    </div>
  );
}

function RegistrationCaseCard({ student }) {
  const isReferral = student.registrationType === 'referral' || Boolean(student.referralCodeEntered);
  return (
    <div className="surface-flat p-3">
      <div className="text-[12px] font-semibold text-neutral-900">
        {isReferral ? 'Joined with referral code' : 'Joined without referral code'}
      </div>
      <p className="mt-1 text-[12px] leading-relaxed text-neutral-500">
        {isReferral
          ? `Used code ${student.referralCodeEntered || '—'} and was auto-assigned to a counselor.`
          : 'No referral code — waiting for an admin to assign a counselor.'}
      </p>
    </div>
  );
}

export function StudentDetailDrawer({
  open,
  onClose,
  student,
  counselors,
  organizationName,
  onAssign,
  onAddNote,
  viewerRole = 'admin',
  canAssign = true,
}) {
  const [tab, setTab] = useState('overview');

  if (!student) return null;

  const assignedName = counselorName(student.assignedCounselorId, counselors);
  const isCounselorView = viewerRole === 'counselor';
  const visibleTabs = isCounselorView ? STUDENT_TABS : STUDENT_TABS.filter((t) => t.id === 'overview');

  return (
    <DrawerShell
      open={open}
      title={student.name}
      subtitle={student.email}
      onClose={onClose}
      footer={
        canAssign ? (
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost h-9 px-3 text-[12px]" onClick={onClose}>
              Close
            </button>
            <button type="button" className="btn-primary h-9 px-3 text-[12px]" onClick={() => onAssign(student)}>
              {student.assignedCounselorId ? 'Reassign counselor' : 'Assign counselor'}
            </button>
          </div>
        ) : (
          <div className="flex justify-end">
            <button type="button" className="btn-ghost h-9 px-3 text-[12px]" onClick={onClose}>
              Close
            </button>
          </div>
        )
      }
    >
      <div className="space-y-4">
        {visibleTabs.length > 1 ? (
          <StudentTabBar tabs={visibleTabs} value={tab} onChange={setTab} />
        ) : null}

        {tab === 'overview' ? (
          <>
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                Assignment
              </div>
              <div className="surface-flat p-3">
                <AssignmentBadge assigned={Boolean(student.assignedCounselorId)} counselorName={assignedName} />
              </div>
            </div>

            <RegistrationCaseCard student={student} />

            <dl className="surface-flat px-3">
              <FieldRow label="Organization" value={organizationName} />
              <FieldRow label="Phone" value={student.phone} />
              <FieldRow label="Referral code entered" value={<ReferralCodeBadge code={student.referralCodeEntered} />} />
              <FieldRow label="Joined" value={formatDate(student.createdAt)} />
            </dl>

          </>
        ) : null}

        {tab === 'assessments' ? (
          <div className="space-y-2">
            {(student.assessments || []).length ? (
              student.assessments.map((a) => (
                <div key={a.id} className="surface-flat p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-neutral-900">{a.name}</div>
                    <span className={a.status === 'completed' ? 'chip-solid' : 'chip-muted'}>{a.status.replace('_', ' ')}</span>
                  </div>
                  <div className="mt-1 text-[12px] text-neutral-500">{a.score}</div>
                </div>
              ))
            ) : (
              <div className="surface-flat p-6 text-center text-[13px] text-neutral-500">No assessments yet</div>
            )}
          </div>
        ) : null}

        {tab === 'progress' ? (
          <div className="surface-flat p-4">
            <div className="mb-2 flex items-center justify-between text-[13px]">
              <span className="font-medium text-neutral-900">Overall progress</span>
              <span className="font-semibold tabular-nums">{student.progress ?? 0}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-neutral-900 transition-all"
                style={{ width: `${student.progress ?? 0}%` }}
              />
            </div>
            <p className="mt-3 text-[12px] text-neutral-500">Onboarding, assessments, and milestones combined.</p>
          </div>
        ) : null}

        {tab === 'reports' ? (
          <div className="space-y-3">
            <div className="surface-flat p-4">
              <div className="text-[13px] font-semibold text-neutral-900">Student report summary</div>
              <p className="mt-1 text-[12px] text-neutral-500">
                Counselors can view and export reports for assigned students only.
              </p>
              <dl className="mt-3 space-y-2 text-[12.5px]">
                <div className="flex justify-between border-b border-neutral-100 pb-2">
                  <dt className="text-neutral-500">Assessments completed</dt>
                  <dd className="font-medium">
                    {(student.assessments || []).filter((a) => a.status === 'completed').length}
                  </dd>
                </div>
                <div className="flex justify-between border-b border-neutral-100 pb-2">
                  <dt className="text-neutral-500">Overall progress</dt>
                  <dd className="font-medium">{student.progress ?? 0}%</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Notes on file</dt>
                  <dd className="font-medium">{(student.notes || []).length}</dd>
                </div>
              </dl>
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-ghost h-9 flex-1 justify-center text-[12px]" disabled title="Coming soon">
                Export PDF
              </button>
              <button type="button" className="btn-primary h-9 flex-1 justify-center text-[12px]" disabled title="Coming soon">
                Export CSV
              </button>
            </div>
          </div>
        ) : null}
        {tab === 'notes' ? (
          <div className="space-y-2">
            {(student.notes || []).length ? (
              student.notes.map((n) => (
                <div key={n.id} className="surface-flat p-3">
                  <div className="text-[12px] font-medium text-neutral-900">{n.author}</div>
                  <p className="mt-1 text-[13px] text-neutral-700">{n.text}</p>
                  <div className="mt-1 text-[11px] text-neutral-400">{formatDate(n.at)}</div>
                </div>
              ))
            ) : (
              <div className="surface-flat p-6 text-center text-[13px] text-neutral-500">No notes yet</div>
            )}
            {onAddNote ? <NoteComposer onAdd={(text) => onAddNote(student.id, text)} /> : null}
          </div>
        ) : null}
      </div>
    </DrawerShell>
  );
}

export function CounselorDetailDrawer({
  open,
  onClose,
  counselor,
  organizationName,
  assignedStudents = [],
  onEdit,
  onRegenerate,
  onDelete,
  canManage = true,
}) {
  if (!counselor) return null;

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(counselor.referralCode);
      toast.success('Referral code copied');
    } catch {
      toast.error('Could not copy code');
    }
  }

  return (
    <DrawerShell
      open={open}
      title={counselor.name}
      subtitle={counselor.email}
      onClose={onClose}
      footer={
        canManage ? (
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" className="btn-ghost h-9 px-3 text-[12px]" onClick={() => onRegenerate(counselor)}>
              Regenerate code
            </button>
            <button type="button" className="btn-ghost h-9 px-3 text-[12px]" onClick={() => onEdit(counselor)}>
              Edit
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center rounded-lg border border-red-200 bg-white px-3 text-[12px] font-medium text-red-700 hover:bg-red-50"
              onClick={() => onDelete(counselor)}
            >
              Delete
            </button>
          </div>
        ) : (
          <div className="flex justify-end">
            <button type="button" className="btn-ghost h-9 px-3 text-[12px]" onClick={onClose}>
              Close
            </button>
          </div>
        )
      }
    >
      <div className="space-y-5">
        <div className="surface-flat p-4 text-center">
          <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
            Referral code
          </div>
          <div className="mt-2 font-mono text-[28px] font-bold tracking-[0.18em] text-neutral-900">
            {counselor.referralCode}
          </div>
          <button type="button" className="btn-ghost mt-3 h-8 px-2.5 text-[12px]" onClick={copyCode}>
            Copy code
          </button>
          <p className="mt-2 text-[12px] text-neutral-500">Share with counselor for student onboarding</p>
        </div>

        <dl className="surface-flat px-3">
          <FieldRow label="Organization" value={organizationName} />
          <FieldRow label="Phone" value={counselor.phone} />
          <FieldRow label="Account status" value={<StatusBadge status={counselor.status} />} />
          <FieldRow label="Assigned students" value={counselor.studentCount} />
          <FieldRow label="Created" value={formatDate(counselor.createdAt)} />
        </dl>

        {assignedStudents.length ? (
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
              Assigned students
            </div>
            <div className="space-y-1.5">
              {assignedStudents.slice(0, 5).map((s) => (
                <div key={s.id} className="rounded-lg border border-neutral-200 px-3 py-2 text-[12.5px]">
                  <div className="font-medium text-neutral-900">{s.name}</div>
                  <div className="text-neutral-500">{s.email}</div>
                </div>
              ))}
              {assignedStudents.length > 5 ? (
                <div className="text-[12px] text-neutral-500">+{assignedStudents.length - 5} more</div>
              ) : null}
            </div>
          </div>
        ) : null}

      </div>
    </DrawerShell>
  );
}

export function OrganizationDetailDrawer({
  open,
  onClose,
  organization,
  onEdit,
  onToggleStatus,
  onDelete,
  canManage = true,
}) {
  if (!organization) return null;

  return (
    <DrawerShell open={open} title={organization.name} subtitle={`Branding · ${organization.branding}`} onClose={onClose}>
      <div className="space-y-5">
        <dl className="surface-flat px-3">
          <FieldRow label="Status" value={<StatusBadge status={organization.status} />} />
          <FieldRow label="Primary color" value={organization.primaryColor} mono />
          <FieldRow label="Logo URL" value={organization.logoUrl || '—'} />
          <FieldRow label="Admins" value={organization.adminCount} />
          <FieldRow label="Counselors" value={organization.counselorCount} />
          <FieldRow label="Students" value={organization.studentCount} />
          <FieldRow label="Created" value={formatDate(organization.createdAt)} />
        </dl>

        {canManage ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-ghost h-9 px-3 text-[12px]" onClick={() => onEdit(organization)}>
              Edit organization
            </button>
            <button type="button" className="btn-ghost h-9 px-3 text-[12px]" onClick={() => onToggleStatus(organization)}>
              {organization.status === 'active' ? 'Deactivate' : 'Activate'}
            </button>
            {onDelete ? (
              <button
                type="button"
                className="inline-flex h-9 items-center rounded-lg border border-red-200 bg-white px-3 text-[12px] font-medium text-red-700 hover:bg-red-50"
                onClick={() => onDelete(organization)}
              >
                Delete organization
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </DrawerShell>
  );
}
