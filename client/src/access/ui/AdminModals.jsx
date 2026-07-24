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
      description="Creates a white-label admin account for the selected organization. Leave the password blank to auto-generate a temporary one."
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

export function CredentialsModal({ open, onClose, title, credential }) {
  if (!credential) return null;

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(credential.temporaryPassword || '');
      toast.success('Password copied');
    } catch {
      toast.error('Could not copy password');
    }
  }

  return (
    <ModalShell
      open={open}
      title={title || 'Account created'}
      description="Share these credentials securely. The temporary password is shown only once."
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
              {credential.temporaryPassword || 'Set by admin'}
            </dd>
          </div>
        </dl>
        {credential.temporaryPassword ? (
          <button type="button" className="btn-ghost h-9 w-full justify-center text-[12px]" onClick={copyPassword}>
            Copy password
          </button>
        ) : null}
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2.5 text-[12px] text-amber-900">
          Ask the user to sign in and change their password. This temporary password will not be shown again.
        </div>
      </div>
    </ModalShell>
  );
}
