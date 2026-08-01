import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ModalShell } from './primitives.jsx';

export function AddAdminModal({ open, onClose, organizations, onSubmit }) {
  const [form, setForm] = useState({ organizationId: '', name: '', email: '', password: '' });

  useEffect(() => {
    if (!open) return;
    setForm({ organizationId: organizations[0]?.id || '', name: '', email: '', password: '' });
  }, [open, organizations]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.organizationId) {
      toast.error('Select an organization');
      return;
    }
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    onSubmit({
      organizationId: form.organizationId,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password.trim() || undefined,
    });
    onClose();
  }

  return (
    <ModalShell
      open={open}
      title="Add organization admin"
      description="Create an organization admin. Leave the password blank to generate a temporary one."
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-ghost h-9 px-3 text-[12px]" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="add-admin-form" className="btn-primary h-9 px-3 text-[12px]">
            Create admin
          </button>
        </>
      }
    >
      <form id="add-admin-form" className="space-y-3.5" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-[12px] font-medium text-neutral-700">Organization</label>
          <select
            className="input h-9"
            value={form.organizationId}
            onChange={(e) => update('organizationId', e.target.value)}
          >
            {organizations.length ? (
              organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))
            ) : (
              <option value="">No organizations — create one first</option>
            )}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-medium text-neutral-700">Name</label>
          <input
            className="input h-9"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Meera Nair"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-medium text-neutral-700">Email</label>
          <input
            className="input h-9"
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder="admin@organization.com"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-medium text-neutral-700">
            Password <span className="text-neutral-400">(optional)</span>
          </label>
          <input
            className="input h-9"
            type="text"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            placeholder="Auto-generated if left blank"
            minLength={8}
          />
        </div>
      </form>
    </ModalShell>
  );
}

export function EditAdminModal({ open, onClose, admin, organizations = [], onSubmit }) {
  const [form, setForm] = useState({
    organizationId: '',
    name: '',
    email: '',
    status: 'active',
    password: '',
  });

  useEffect(() => {
    if (!open || !admin) return;
    setForm({
      organizationId: admin.organizationId || organizations[0]?.id || '',
      name: admin.name || '',
      email: admin.email || '',
      status: admin.status || 'active',
      password: '',
    });
  }, [open, admin, organizations]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    if (!form.organizationId) {
      toast.error('Select an organization');
      return;
    }
    onSubmit(admin.id, {
      organizationId: form.organizationId,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      status: form.status,
      password: form.password.trim() || undefined,
    });
    onClose();
  }

  return (
    <ModalShell
      open={open}
      title="Edit organization admin"
      description="Update profile, organization assignment, status, or reset password."
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-ghost h-9 px-3 text-[12px]" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="edit-admin-form" className="btn-primary h-9 px-3 text-[12px]">
            Save changes
          </button>
        </>
      }
    >
      <form id="edit-admin-form" className="space-y-3.5" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-[12px] font-medium text-neutral-700">Organization</label>
          <select
            className="input h-9"
            value={form.organizationId}
            onChange={(e) => update('organizationId', e.target.value)}
          >
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-medium text-neutral-700">Name</label>
          <input
            className="input h-9"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-medium text-neutral-700">Email</label>
          <input
            className="input h-9"
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-medium text-neutral-700">Status</label>
          <select className="input h-9" value={form.status} onChange={(e) => update('status', e.target.value)}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-medium text-neutral-700">
            New password <span className="text-neutral-400">(optional)</span>
          </label>
          <input
            className="input h-9"
            type="text"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            placeholder="Leave blank to keep current password"
            minLength={8}
          />
        </div>
      </form>
    </ModalShell>
  );
}

export function DeleteAdminModal({ open, onClose, admin, onConfirm }) {
  if (!admin) return null;

  return (
    <ModalShell
      open={open}
      title="Delete organization admin"
      description={`Permanently remove ${admin.name} (${admin.email}). They will lose Access Control login immediately. Counselors and students in the organization are not deleted.`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-ghost h-9 px-3 text-[12px]" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center rounded-lg bg-red-600 px-3 text-[12px] font-medium text-white hover:bg-red-700"
            onClick={() => onConfirm(admin)}
          >
            Delete admin
          </button>
        </>
      }
    >
      <div className="rounded-xl border border-red-200 bg-red-50/80 px-3 py-2.5 text-[12px] text-red-900">
        This cannot be undone. Create a new admin account if you need to restore access later.
      </div>
    </ModalShell>
  );
}

export function CredentialsModal({ open, onClose, title, credential }) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!open) setRevealed(false);
  }, [open]);

  if (!credential) return null;

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(credential.temporaryPassword || '');
      toast.success('Password copied');
    } catch {
      toast.error('Could not copy password');
    }
  }

  const hasTemp = Boolean(credential.temporaryPassword);

  return (
    <ModalShell
      open={open}
      title={title || 'Account created'}
      description="Share these details securely. The temporary password is shown only once."
      onClose={onClose}
      footer={
        <button type="button" className="btn-primary h-9 px-3 text-[12px]" onClick={onClose}>
          Done
        </button>
      }
    >
      <div className="space-y-3">
        <dl className="surface-flat px-3 text-[13px]">
          <div className="flex justify-between border-b border-neutral-100 py-2.5">
            <dt className="text-neutral-500">Name</dt>
            <dd className="font-medium text-neutral-900">{credential.name}</dd>
          </div>
          <div className="flex justify-between border-b border-neutral-100 py-2.5">
            <dt className="text-neutral-500">Email</dt>
            <dd className="text-neutral-800">{credential.email}</dd>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <dt className="text-neutral-500">Temporary password</dt>
            <dd className="font-mono font-semibold text-neutral-900">
              {hasTemp
                ? revealed
                  ? credential.temporaryPassword
                  : '••••••••••••'
                : 'Set by you'}
            </dd>
          </div>
        </dl>
        {hasTemp ? (
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-ghost h-9 flex-1 justify-center text-[12px]"
              onClick={() => setRevealed((v) => !v)}
            >
              {revealed ? 'Hide password' : 'Reveal password'}
            </button>
            <button
              type="button"
              className="btn-ghost h-9 flex-1 justify-center text-[12px]"
              onClick={copyPassword}
            >
              Copy password
            </button>
          </div>
        ) : null}
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2.5 text-[12px] text-amber-900">
          Ask them to change this password after first sign-in.
        </div>
      </div>
    </ModalShell>
  );
}
