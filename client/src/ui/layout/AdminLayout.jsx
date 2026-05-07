import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../state/auth/AuthContext.jsx';
import { setApiAuthToken } from '../../lib/api.js';

const navLinkClass = ({ isActive }) =>
  [
    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
    isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100',
  ].join(' ');

export function AdminLayout() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setApiAuthToken(token);
  }, [token]);

  return (
    <div className="min-h-full">
      <div className="flex min-h-full">
        <aside className="hidden w-64 border-r bg-white p-4 md:block">
          <div className="mb-6">
            <div className="text-lg font-semibold">Guidopia Admin</div>
            <div className="text-xs text-slate-500">Users & Premium Control</div>
          </div>
          <nav className="space-y-1">
            <NavLink to="/users" className={navLinkClass}>
              Users Management
            </NavLink>
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b bg-white">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="md:hidden text-base font-semibold">Guidopia Admin</div>
                <div className="hidden md:block text-sm text-slate-600">
                  Signed in as <span className="font-medium">{user?.email || 'admin'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
                  onClick={() => {
                    logout();
                    navigate('/login', { replace: true });
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

