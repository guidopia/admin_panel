import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { counselorName } from '../lib/accessConstants.js';
import { ModalShell } from './primitives.jsx';

export function AssignCounselorModal({ open, onClose, student, counselors, onSubmit }) {
  const eligibleCounselors = useMemo(
    () => counselors.filter((c) => c.organizationId === student?.organizationId && c.status === 'active'),
    [counselors, student?.organizationId]
  );

  const [counselorId, setCounselorId] = useState('');

  useEffect(() => {
    if (!open) return;
    setCounselorId(student?.assignedCounselorId || eligibleCounselors[0]?.id || '');
  }, [open, student, eligibleCounselors]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!counselorId) {
      toast.error('Select a counselor');
      return;
    }
    onSubmit(student.id, counselorId);
    onClose();
  }

  if (!student) return null;

  const currentName = counselorName(student.assignedCounselorId, counselors);

  return (
    <ModalShell
      open={open}
      title={student.assignedCounselorId ? 'Reassign counselor' : 'Assign counselor'}
      description={`Update ownership for ${student.name}. The selected counselor will immediately gain access.`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-ghost h-9 px-3 text-[12px]" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="assign-counselor-form" className="btn-primary h-9 px-3 text-[12px]">
            Save assignment
          </button>
        </>
      }
    >
      <form id="assign-counselor-form" className="space-y-4" onSubmit={handleSubmit}>
        <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 px-3 py-2.5 text-[12px]">
          <div className="font-medium text-neutral-900">{student.name}</div>
          <div className="mt-0.5 text-neutral-500">{student.email}</div>
          {currentName ? (
            <div className="mt-2 text-neutral-600">
              Current counselor: <span className="font-medium text-neutral-800">{currentName}</span>
            </div>
          ) : (
            <div className="mt-2 text-amber-700">Currently unassigned.</div>
          )}
        </div>

        <div>
          <label className="mb-1 block text-[12px] font-medium text-neutral-700">Select counselor</label>
          <select className="input h-9" value={counselorId} onChange={(e) => setCounselorId(e.target.value)}>
            {eligibleCounselors.length ? (
              eligibleCounselors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.referralCode}
                </option>
              ))
            ) : (
              <option value="">No active counselors in this organization</option>
            )}
          </select>
        </div>
      </form>
    </ModalShell>
  );
}
