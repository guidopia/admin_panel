import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { useAuth } from '../../state/auth/AuthContext.jsx';
import { setApiAuthToken } from '../../lib/api.js';
import { accessApi, accessApiError } from '../lib/accessApi.js';

export function AccessLoginPage() {
  const { token, user, setAuth } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && user?.accessRole) {
      navigate('/access', { replace: true });
    }
  }, [token, user, navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      toast.error('Email and password are required');
      return;
    }
    setLoading(true);
    try {
      const data = await accessApi.login(cleanEmail, password);
      setAuth(data);
      setApiAuthToken(data.token);
      toast.success('Signed in');
      navigate('/access', { replace: true });
    } catch (err) {
      const msg = accessApiError(err, 'Invalid email or password');
      const network =
        !err?.response && (err?.message === 'Network Error' || err?.code === 'ERR_NETWORK');
      toast.error(
        network
          ? 'Cannot reach API at localhost:5000 — start the admin server (npm run dev in server/)'
          : msg
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-full place-items-center bg-neutral-50 p-4">
      <div className="w-full max-w-[420px]">
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
            <div className="text-[15px] font-semibold text-neutral-900">Sign in</div>
            <p className="mt-0.5 text-[12.5px] text-neutral-500">
              Super Admin, Organization Admin, and Counselor login. After sign-in you get orgs,
              counselors, referral codes, and students.
            </p>
            <p className="mt-2 rounded-lg bg-neutral-50 px-2.5 py-2 font-mono text-[11px] text-neutral-600">
              Super Admin: guidopiacareer@gmail.com
            </p>
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
                placeholder="you@organization.com"
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
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary mt-1 h-9 w-full justify-center text-[13px]"
            >
              {loading ? 'Signing in…' : 'Sign in'}
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
