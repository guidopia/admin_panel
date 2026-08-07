import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ModalShell } from './primitives.jsx';

export function AddCounselorModal({ open, onClose, organizations, onSubmit, hideOrganizationSelect = false }) {
  const [form, setForm] = useState({
    organizationId: '',
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      organizationId: organizations[0]?.id || '',
      name: '',
      email: '',
      phone: '',
    });
  }, [open, organizations]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const organizationId = form.organizationId || organizations[0]?.id || '';
    if (!organizationId) {
      toast.error(hideOrganizationSelect ? 'Organization is not available' : 'Select an organization');
      return;
    }
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    onSubmit({ ...form, organizationId });
    onClose();
  }

  return (
    <ModalShell
      open={open}
      title="Add counselor"
      description="Create a counselor account. A unique referral code is generated automatically."
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-ghost h-9 px-3 text-[12px]" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form="add-counselor-form" className="btn-primary h-9 px-3 text-[12px]">
            Create counselor
          </button>
        </>
      }
    >
      <form id="add-counselor-form" className="space-y-3.5" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-[12px] font-medium text-neutral-700">Organization</label>
          {hideOrganizationSelect ? (
            <div className="input h-9 flex items-center bg-neutral-50 text-[13px] text-neutral-700">
              {organizations[0]?.name || 'Your organization'}
            </div>
          ) : (
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
          )}
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-medium text-neutral-700">Name</label>
          <input
            className="input h-9"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Rahul Sharma"
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
            placeholder="rahul@organization.com"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-[12px] font-medium text-neutral-700">Phone</label>
          <input
            className="input h-9"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="+91 98765 43210"
          />
        </div>
        <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/80 px-3 py-2.5 text-[12px] text-neutral-600">
          A unique referral code will be shown after you create the counselor.
        </div>
      </form>
    </ModalShell>
  );
}
