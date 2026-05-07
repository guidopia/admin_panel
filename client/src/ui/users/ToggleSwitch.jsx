import React, { useId } from 'react';

export function ToggleSwitch({ checked, onChange, disabled, label }) {
  const id = useId();
  return (
    <div className="inline-flex items-center gap-2">
      {label ? (
        <label htmlFor={id} className="text-xs text-slate-600">
          {label}
        </label>
      ) : null}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        className={[
          'relative inline-flex h-6 w-11 items-center rounded-full transition',
          disabled ? 'opacity-60' : 'opacity-100',
          checked ? 'bg-emerald-600' : 'bg-slate-300',
        ].join(' ')}
      >
        <span
          className={[
            'inline-block h-5 w-5 transform rounded-full bg-white shadow transition',
            checked ? 'translate-x-5' : 'translate-x-1',
          ].join(' ')}
        />
      </button>
    </div>
  );
}

