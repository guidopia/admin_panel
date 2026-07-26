import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { api, setApiAuthToken } from '../lib/api.js';
import { accessApi, accessApiError } from '../access/lib/accessApi.js';
import { useAuth } from '../state/auth/AuthContext.jsx';

export function LoginPage() {
  const { token, user, setAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = useMemo(() => location.state?.from?.pathname || '/', [location.state]);

  useEffect(() => {
    if (!token) return;
    if (user?.accessRole) navigate('/access', { replace: true });
    else navigate(from === '/access' ? '/users' : from, { replace: true });
  }, [token, user, from, navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      toast.error('Email and password are required');
      return;
    }

    setLoading(true);
    try {
      // 1) Access Control (Super Admin / Org Admin / Counselor) — preferred
      try {
        const data = await accessApi.login(cleanEmail, password);
        setAuth(data);
        setApiAuthToken(data.token);
        toast.success('Signed in as Access Control');
        navigate('/access', { replace: true });
        return;
      } catch (accessErr) {
        const status = accessErr?.response?.status;
        // Only fall through to Prodigy login on bad credentials
        if (status !== 401 && status !== 403) {
          throw accessErr;
        }
      }

      // 2) Prodigy Users admin (/api/auth/login)
      const res = await api.post('/api/auth/login', { email: cleanEmail, password });
      setAuth(res.data);
      setApiAuthToken(res.data.token);
      toast.success('Signed in');
      navigate(from === '/access' || from === '/' ? '/users' : from, { replace: true });
    } catch (err) {
      toast.error(accessApiError(err, 'Invalid email or password'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-full place-items-center bg-neutral-50 p-4">
      <div className="w-full max-w-[380px]">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-neutral-900 text-sm font-bold text-white">
            G
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-semibold text-neutral-900">Guidopia</div>
            <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">
              Admin
            </div>
          </div>
        </div>

        <div className="surface p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="mb-5">
            <div className="text-[15px] font-semibold text-neutral-900">Sign in</div>
            <div className="mt-0.5 text-[12.5px] text-neutral-500">
              Super Admin / org admins sign in here for Access Control (orgs, counselors, referral
              codes). Prodigy Users admins also work on this page.
            </div>
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
                placeholder="guidopiacareer@gmail.com"
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
              {loading ? 'Signing in…' : 'Continue'}
            </button>
          </form>
        </div>

        <div className="mt-4 space-y-2 text-center text-[11.5px] text-neutral-400">
          <div>
            Dedicated Access Control page:{' '}
            <Link to="/login/access" className="font-medium text-neutral-600 hover:text-neutral-900">
              /login/access
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
