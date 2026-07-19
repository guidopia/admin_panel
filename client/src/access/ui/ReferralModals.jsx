import React from 'react';
import toast from 'react-hot-toast';
import { REFERRAL_CODE_RULES } from '../mockData.js';
import { ModalShell, ReferralCodeBadge } from './primitives.jsx';

function FlowStep({ step, title, detail, last }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="grid h-6 w-6 place-items-center rounded-full bg-neutral-900 text-[11px] font-semibold text-white">
          {step}
        </div>
        {!last ? <div className="my-1 w-px flex-1 bg-neutral-200" /> : null}
      </div>
      <div className={last ? 'pb-0' : 'pb-4'}>
        <div className="text-[13px] font-medium text-neutral-900">{title}</div>
        <div className="mt-0.5 text-[12px] text-neutral-500">{detail}</div>
      </div>
    </div>
  );
}

export function ReferralCodeSuccessModal({ open, onClose, counselor }) {
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
    <ModalShell
      open={open}
      title="Counselor created"
      description="Account is active. Share the referral code below so students can auto-assign on registration."
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-ghost h-9 px-3 text-[12px]" onClick={onClose}>
            Done
          </button>
          <button type="button" className="btn-primary h-9 px-3 text-[12px]" onClick={copyCode}>
            Copy referral code
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4 text-center">
          <div className="text-[12px] font-medium text-neutral-500">{counselor.name}</div>
          <div className="mt-3 flex items-center justify-center gap-2">
            <ReferralCodeBadge code={counselor.referralCode} />
          </div>
          <div className="mt-2 font-mono text-[22px] font-bold tracking-[0.2em] text-neutral-900">
            {counselor.referralCode}
          </div>
          <p className="mt-2 text-[12px] text-neutral-500">{counselor.email} · Account active</p>
        </div>

        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
            Generation flow
          </div>
          <FlowStep step="1" title="Admin creates counselor" detail="Name, email, and phone submitted" />
          <FlowStep step="2" title="System generates unique code" detail="6–8 uppercase characters (e.g. RAH582)" />
          <FlowStep step="3" title="Stored & displayed to admin" detail="Code shown here for sharing" last />
        </div>

        <ul className="space-y-1.5 rounded-xl border border-dashed border-neutral-200 px-3 py-2.5 text-[12px] text-neutral-600">
          {REFERRAL_CODE_RULES.map((rule) => (
            <li key={rule} className="flex gap-2">
              <span className="text-neutral-400">•</span>
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </div>
    </ModalShell>
  );
}

export function RegenerateReferralModal({ open, onClose, counselor, onConfirm }) {
  if (!counselor) return null;

  return (
    <ModalShell
      open={open}
      title="Regenerate referral code"
      description={`Generate a new code for ${counselor.name}. The current code (${counselor.referralCode}) will stop working for new student registrations.`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-ghost h-9 px-3 text-[12px]" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-primary h-9 px-3 text-[12px]" onClick={() => onConfirm(counselor)}>
            Regenerate code
          </button>
        </>
      }
    >
      <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2.5 text-[12px] text-amber-900">
        Referral codes are immutable by default. Only regenerate if the code was compromised or the counselor
        requests a new one.
      </div>
    </ModalShell>
  );
}
