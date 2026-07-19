import React, { memo } from 'react';

function AccessTabsImpl({ tabs, value, onChange }) {
  return (
    <div className="seg" role="tablist" aria-label="Access control sections">
      {tabs.map((tab) => {
        const active = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={active ? 'seg-item seg-item-active' : 'seg-item'}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
            {typeof tab.count === 'number' ? (
              <span className="ml-1 tabular-nums opacity-80">({tab.count})</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export const AccessTabs = memo(AccessTabsImpl);
