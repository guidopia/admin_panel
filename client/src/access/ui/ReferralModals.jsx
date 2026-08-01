import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ModalShell, ReferralCodeBadge } from './primitives.jsx';

export function ReferralCodeSuccessModal({ open, onClose, counselor }) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!open) setRevealed(false);
  }, [open]);

  if (!counselor) return null;

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(counselor.referralCode);
      toast.success('Referral code copied');
    } catch {
      toast.error('Could not copy code');
    }
  }

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(counselor.temporaryPassword || '');
      toast.success('Password copied');
    } catch {
      toast.error('Could not copy password');
    }
  }

  return (
    <ModalShell
      open={open}
      title="Counselor created"
      description="Share the referral code so students can connect during onboarding."
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
        </div>

        {counselor.temporaryPassword ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2.5 text-[12px] text-amber-900">
            <div className="flex items-center justify-between gap-2">
              <span>Temporary password</span>
              <span className="font-mono font-semibold">
                {revealed ? counselor.temporaryPassword : '••••••••••••'}
              </span>
            </div>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                className="btn-ghost h-8 flex-1 justify-center text-[11px]"
                onClick={() => setRevealed((v) => !v)}
              >
                {revealed ? 'Hide' : 'Reveal'}
              </button>
              <button
                type="button"
                className="btn-ghost h-8 flex-1 justify-center text-[11px]"
                onClick={copyPassword}
              >
                Copy
              </button>
            </div>
            <p className="mt-1 text-[11px] text-amber-800">
              Share securely. Shown only once — they should change it after signing in.
            </p>
          </div>
        ) : null}
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
      description={`Create a new code for ${counselor.name}. The current code (${counselor.referralCode}) will stop working for new students.`}
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
        Only regenerate if the code was shared publicly by mistake or the counselor needs a fresh one.
        Students who already used the old code stay assigned.
      </div>
    </ModalShell>
  );
}
