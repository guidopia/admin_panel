import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { useAuth } from '../../state/auth/AuthContext.jsx';
import { ACCESS_PORTALS, ROLES } from '../mockData.js';

const PORTAL_COPY = {
  [ROLES.SUPER_ADMIN]: {
    title: 'Super Admin',
    description: 'View all organizations, counselors, and students across the platform.',
  },
  [ROLES.WL_ADMIN]: {
    title: 'Organization Admin',
    description: 'Manage your white-label organization, create counselors, and view your students.',
  },
  [ROLES.COUNSELOR]: {
    title: 'Counselor',
    description: 'View students who onboarded using your referral code.',
  },
};

export function AccessLoginPage() {
  const { token, user, setAuth } = useAuth();
  const navigate = useNavigate();
  const [portal, setPortal] = useState(ROLES.WL_ADMIN);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const portalMeta = useMemo(() => PORTAL_COPY[portal], [portal]);

  useEffect(() => {
    if (token && user?.accessRole) {
      navigate('/access', { replace: true });
    }
  }, [token, user, navigate]);

  useEffect(() => {
    const match = ACCESS_PORTALS.find((p) => p.accessRole === portal);
    if (match) setEmail(match.demoEmail);
  }, [portal]);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const match = ACCESS_PORTALS.find(
        (p) => p.accessRole === portal && p.demoEmail.toLowerCase() === email.trim().toLowerCase()
      );
      if (!match) {
        toast.error('Use the demo email shown for this portal (UI skeleton login).');
        return;
      }
      if (!password.trim()) {
        toast.error('Password is required');
        return;
      }

      setAuth({
        token: `access-ui-${match.accessRole}`,
        user: {
          id: match.id,
          name: match.name,
          email: match.demoEmail,
          accessRole: match.accessRole,
          organizationId: match.organizationId || null,
          counselorId: match.counselorId || null,
        },
      });
      toast.success(`Signed in as ${PORTAL_COPY[portal].title}`);
      navigate('/access', { replace: true });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-full place-items-center bg-neutral-50 p-4">
      <div className="w-full max-w-[440px]">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-neutral-900 text-sm font-bold text-white">
            G
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-semibold text-neutral-900">Guidopia</div>
            <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">
              Access Control
            </div>
          </div>
        </div>

        <div className="surface p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="mb-4">
            <div className="text-[15px] font-semibold text-neutral-900">Choose your portal</div>
            <p className="mt-0.5 text-[12.5px] text-neutral-500">
              Each role has a separate login. Super Admin, Organization Admin, and Counselor use different accounts.
            </p>
          </div>

          <div className="seg mb-4 w-full" role="tablist" aria-label="Access portal">
            {Object.entries(PORTAL_COPY).map(([key, meta]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={portal === key}
                className={['seg-item flex-1 text-center text-[11px]', portal === key ? 'seg-item-active' : ''].join(' ')}
                onClick={() => setPortal(key)}
              >
                {meta.title}
              </button>
            ))}
          </div>

          <div className="mb-4 rounded-xl border border-neutral-200 bg-neutral-50/80 px-3 py-2.5 text-[12px] text-neutral-600">
            <span className="font-medium text-neutral-900">{portalMeta.title}.</span> {portalMeta.description}
          </div>

          <form className="space-y-3.5" onSubmit={onSubmit}>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-neutral-700">Email</label>
              <input
                className="input h-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-neutral-700">Password</label>
              <input
                className="input h-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
                placeholder="Any password for UI demo"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary mt-1 h-9 w-full justify-center text-[13px]">
              {loading ? 'Signing in…' : `Sign in as ${portalMeta.title}`}
            </button>
          </form>
        </div>

        <div className="mt-4 text-center text-[11.5px] text-neutral-400">
          Prodigy / Users admin?{' '}
          <Link to="/login" className="font-medium text-neutral-600 hover:text-neutral-900">
            Use the main admin login
          </Link>
        </div>
      </div>
    </div>
  );
}
