import React, { memo } from 'react';

function PlatformTabsImpl({ platforms, value, onChange, disabled }) {
  return (
    <div className="seg" role="tablist" aria-label="Choose database">
      {platforms.map((platform) => {
        const active = value === platform.id;
        const isDisabled = disabled || platform.configured === false;
        return (
          <button
            key={platform.id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={isDisabled}
            className={active ? 'seg-item seg-item-active' : 'seg-item'}
            onClick={() => onChange(platform.id)}
            title={
              platform.configured === false
                ? platform.id === 'vidhyasaarthi'
                  ? `${platform.label} is not configured — add MONGODB_URI_VIDHYASAARTHI to server .env`
                  : platform.id === 'career-beacon'
                    ? `${platform.label} is not configured — add MONGODB_URI_CAREER_BEACON to server .env`
                    : `${platform.label} is not configured`
                : `View ${platform.label} users`
            }
          >
            {platform.label}
          </button>
        );
      })}
    </div>
  );
}

export const PlatformTabs = memo(PlatformTabsImpl);
