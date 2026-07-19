import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ModalShell } from './primitives.jsx';

export function OrganizationFormModal({ open, onClose, mode = 'create', organization, onSubmit }) {
  const [form, setForm] = useState({
    name: '',
    branding: '',
    primaryColor: '#171717',
    logoUrl: '',
    status: 'active',
  });

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && organization) {
      setForm({
        name: organization.name || '',
        branding: organization.branding || '',
        primaryColor: organization.primaryColor || '#171717',
        logoUrl: organization.logoUrl || '',
        status: organization.status || 'active',
      });
    } else {
      setForm({ name: '', branding: '', primaryColor: '#171717', logoUrl: '', status: 'active' });
    }
  }, [open, mode, organization]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.branding.trim()) {
      toast.error('Name and branding are required');
      return;
    }
    onSubmit(form);
    onClose();
  }

  return (
    <ModalShell
      open={open}
      title={mode === 'edit' ? 'Edit organization' : 'Add organization'}
      description="Super Admin only. Creates an isolated white-label tenant."
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-ghost h-9 px-3 text-[12px]" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="org-form" className="btn-primary h-9 px-3 text-[12px]">
            {mode === 'edit' ? 'Save changes' : 'Create organization'}
          </button>
        </>
      }
    >
      <form id="org-form" className="space-y-3.5" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-[12px] font-medium text-neutral-700">Organization name</label>
          <input className="input h-9" value={form.name} onChange={(e) => update('name', e.target.value)} required />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-medium text-neutral-700">Branding code</label>
          <input
            className="input h-9 font-mono uppercase"
            value={form.branding}
            onChange={(e) => update('branding', e.target.value.toUpperCase())}
            placeholder="BFA"
            maxLength={6}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-medium text-neutral-700">Primary color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              className="h-9 w-12 cursor-pointer rounded-lg border border-neutral-200 bg-white p-1"
              value={form.primaryColor}
              onChange={(e) => update('primaryColor', e.target.value)}
            />
            <input className="input h-9 font-mono" value={form.primaryColor} onChange={(e) => update('primaryColor', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-medium text-neutral-700">Logo URL</label>
          <input
            className="input h-9"
            value={form.logoUrl}
            onChange={(e) => update('logoUrl', e.target.value)}
            placeholder="https://cdn.example.com/logo.png"
          />
        </div>
        {mode === 'edit' ? (
          <div>
            <label className="mb-1 block text-[12px] font-medium text-neutral-700">Status</label>
            <select className="input h-9" value={form.status} onChange={(e) => update('status', e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        ) : null}
      </form>
    </ModalShell>
  );
}

export function EditCounselorModal({ open, onClose, counselor, onSubmit }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', status: 'active' });

  useEffect(() => {
    if (!open || !counselor) return;
    setForm({
      name: counselor.name || '',
      email: counselor.email || '',
      phone: counselor.phone || '',
      status: counselor.status || 'active',
    });
  }, [open, counselor]);

  if (!counselor) return null;

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(counselor.id, form);
    onClose();
  }

  return (
    <ModalShell
      open={open}
      title="Edit counselor"
      description="Update counselor profile. Referral code is managed separately."
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-ghost h-9 px-3 text-[12px]" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="edit-counselor-form" className="btn-primary h-9 px-3 text-[12px]">
            Save changes
          </button>
        </>
      }
    >
      <form id="edit-counselor-form" className="space-y-3.5" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-[12px] font-medium text-neutral-700">Name</label>
          <input className="input h-9" value={form.name} onChange={(e) => update('name', e.target.value)} required />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-medium text-neutral-700">Email</label>
          <input className="input h-9" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-medium text-neutral-700">Phone</label>
          <input className="input h-9" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-medium text-neutral-700">Status</label>
          <select className="input h-9" value={form.status} onChange={(e) => update('status', e.target.value)}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </form>
    </ModalShell>
  );
}

export function DeleteCounselorModal({ open, onClose, counselor, assignedStudentCount, onConfirm }) {
  if (!counselor) return null;

  return (
    <ModalShell
      open={open}
      title="Delete counselor"
      description={`Remove ${counselor.name} from the organization?`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-ghost h-9 px-3 text-[12px]" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center rounded-lg bg-red-600 px-3 text-[12px] font-medium text-white hover:bg-red-700"
            onClick={() => onConfirm(counselor)}
          >
            Delete counselor
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="rounded-xl border border-red-200 bg-red-50/70 px-3 py-2.5 text-[12px] text-red-900">
          {assignedStudentCount > 0 ? (
            <>
              <strong>{assignedStudentCount}</strong> assigned student{assignedStudentCount === 1 ? '' : 's'} will
              become <strong>unassigned</strong> and visible only to the white-label admin until reassigned.
            </>
          ) : (
            <>This counselor has no assigned students.</>
          )}
        </div>
        <dl className="surface-flat px-3 text-[13px]">
          <div className="flex justify-between border-b border-neutral-100 py-2.5">
            <dt className="text-neutral-500">Referral code</dt>
            <dd className="font-mono font-semibold">{counselor.referralCode}</dd>
          </div>
          <div className="flex justify-between py-2.5">
            <dt className="text-neutral-500">Email</dt>
            <dd>{counselor.email}</dd>
          </div>
        </dl>
      </div>
    </ModalShell>
  );
}

export function DeactivateOrganizationModal({ open, onClose, organization, onConfirm }) {
  if (!organization) return null;
  const isActive = organization.status === 'active';

  return (
    <ModalShell
      open={open}
      title={isActive ? 'Deactivate organization' : 'Activate organization'}
      description={`${isActive ? 'Deactivate' : 'Activate'} ${organization.name}?`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-ghost h-9 px-3 text-[12px]" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary h-9 px-3 text-[12px]" onClick={() => onConfirm(organization)}>
            {isActive ? 'Deactivate' : 'Activate'}
          </button>
        </>
      }
    >
      <p className="text-[13px] leading-relaxed text-neutral-600">
        {isActive
          ? 'Counselors and admins in this organization will lose access. Data is retained but the tenant becomes inactive.'
          : 'Organization will become active again and admins can manage counselors and students.'}
      </p>
    </ModalShell>
  );
}
