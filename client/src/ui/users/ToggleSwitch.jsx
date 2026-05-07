import React, { useId } from 'react';

export function ToggleSwitch({ checked, onChange, disabled, label }) {
  const id = useId();
  return (
    <div className="inline-flex items-center gap-2">
      {label ? (
        <label htmlFor={id} className="text-[11px] font-medium text-neutral-600">
          {label}
        </label>
      ) : null}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        aria-label={checked ? 'Disable premium' : 'Enable premium'}
        className={[
          'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors duration-150 ease-out',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-200 focus-visible:ring-offset-1',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
          checked
            ? 'border-neutral-900 bg-neutral-900'
            : 'border-neutral-200 bg-neutral-100 hover:bg-neutral-200/70',
        ].join(' ')}
      >
        <span
          aria-hidden
          className={[
            'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.18)] transition-transform duration-150 ease-out',
            checked ? 'translate-x-[18px]' : 'translate-x-[2px]',
          ].join(' ')}
        />
      </button>
    </div>
  );
}
