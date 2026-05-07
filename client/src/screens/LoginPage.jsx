import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { api, setApiAuthToken } from '../lib/api.js';
import { useAuth } from '../state/auth/AuthContext.jsx';

export function LoginPage() {
  const { token, setAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = useMemo(() => location.state?.from?.pathname || '/users', [location.state]);

  useEffect(() => {
    if (token) navigate(from, { replace: true });
  }, [token, from, navigate]);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email, password });
      setAuth(res.data);
      setApiAuthToken(res.data.token);
      toast.success('Signed in');
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Login failed';
      toast.error(msg);
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
            <div className="text-[15px] font-semibold text-neutral-900">Sign in to your workspace</div>
            <div className="mt-0.5 text-[12.5px] text-neutral-500">
              Use your admin credentials to continue.
            </div>
          </div>

          <form className="space-y-3.5" onSubmit={onSubmit}>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-neutral-700">
                Email
              </label>
              <input
                className="input h-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-[12px] font-medium text-neutral-700">
                Password
              </label>
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

        <div className="mt-4 text-center text-[11.5px] text-neutral-400">
          Protected admin area · MongoDB Atlas
        </div>
      </div>
    </div>
  );
}
