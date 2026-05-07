import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../state/auth/AuthContext.jsx';
import { setApiAuthToken } from '../../lib/api.js';

const COLLAPSED_KEY = 'guidopia_sidebar_collapsed';

function getInitials(source) {
  const s = (source || '').trim();
  if (!s) return 'A';
  const base = s.includes('@') ? s.split('@')[0] : s;
  const parts = base.split(/[\s._-]+/).filter(Boolean);
  const first = parts[0]?.[0] || base[0] || 'A';
  const second = parts[1]?.[0] || '';
  return (first + second).toUpperCase().slice(0, 2);
}

function NavItem({ to, label, icon, collapsed, onNavigate }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        [
          'group relative flex items-center rounded-lg text-sm font-medium transition',
          collapsed ? 'h-9 w-9 justify-center' : 'gap-2.5 px-2.5 py-2',
          isActive
            ? 'bg-neutral-100 text-neutral-900'
            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <span
            aria-hidden
            className={[
              'absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r-full bg-neutral-900 transition-opacity',
              isActive ? 'opacity-100' : 'opacity-0',
            ].join(' ')}
          />
          <span className="flex h-4 w-4 shrink-0 items-center justify-center text-neutral-500">
            {icon}
          </span>
          {!collapsed ? <span className="truncate">{label}</span> : null}
        </>
      )}
    </NavLink>
  );
}

function UsersIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ChevronDoubleLeftIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="11 17 6 12 11 7" />
      <polyline points="18 17 13 12 18 7" />
    </svg>
  );
}

function ChevronDoubleRightIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="13 17 18 12 13 7" />
      <polyline points="6 17 11 12 6 7" />
    </svg>
  );
}

function BrandMark({ collapsed }) {
  if (collapsed) {
    return (
      <div
        className="grid h-8 w-8 place-items-center rounded-lg bg-neutral-900 text-[12px] font-bold tracking-tight text-white"
        title="Guidopia Admin"
      >
        G
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-neutral-900 text-[12px] font-bold tracking-tight text-white">
        G
      </div>
      <div className="leading-tight">
        <div className="text-[13px] font-semibold text-neutral-900">Guidopia</div>
        <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-400">
          Admin
        </div>
      </div>
    </div>
  );
}

function SidebarContent({
  user,
  onLogout,
  onNavigate,
  collapsed,
  onToggleCollapsed,
  showCollapseToggle,
}) {
  const initials = useMemo(
    () => getInitials(user?.name || user?.email || 'Admin'),
    [user?.name, user?.email]
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div
        className={[
          'flex h-14 shrink-0 items-center border-b border-neutral-200/70',
          collapsed ? 'justify-center px-2' : 'justify-between px-3',
        ].join(' ')}
      >
        <BrandMark collapsed={collapsed} />
        {showCollapseToggle && !collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="rounded-md p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <ChevronDoubleLeftIcon />
          </button>
        ) : null}
      </div>

      {showCollapseToggle && collapsed ? (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="rounded-md p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <ChevronDoubleRightIcon />
          </button>
        </div>
      ) : null}

      <div className={['min-h-0 flex-1 overflow-y-auto', collapsed ? 'px-2 pt-2' : 'px-3 pt-3'].join(' ')}>
        {!collapsed ? (
          <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
            Manage
          </div>
        ) : null}
        <nav className={['space-y-0.5', collapsed ? 'flex flex-col items-center' : ''].join(' ')}>
          <NavItem
            to="/users"
            label="Users"
            icon={<UsersIcon />}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        </nav>
      </div>

      <div className="shrink-0 border-t border-neutral-200 p-2">
        {collapsed ? (
          <div className="flex flex-col items-center gap-1.5 py-1">
            <div
              className="grid h-8 w-8 place-items-center rounded-full bg-neutral-900 text-[11px] font-semibold text-white"
              title={user?.email || 'Admin'}
            >
              {initials}
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg p-1.5 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogoutIcon />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 rounded-xl px-2 py-1.5">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-neutral-900 text-[11px] font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12px] font-medium text-neutral-900">
                {user?.name || 'Admin'}
              </div>
              <div className="truncate text-[11px] text-neutral-500">
                {user?.email || '—'}
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              title="Sign out"
              className="shrink-0 rounded-lg p-1.5 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
              aria-label="Sign out"
            >
              <LogoutIcon />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const SECTION_TITLES = {
  '/users': 'Users',
};

export function AdminLayout() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    setApiAuthToken(token);
  }, [token]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const sectionTitle = useMemo(() => {
    const match = Object.keys(SECTION_TITLES).find((p) => location.pathname.startsWith(p));
    return match ? SECTION_TITLES[match] : '';
  }, [location.pathname]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="flex">
        <aside
          className={[
            'sticky top-0 z-30 hidden h-screen shrink-0 border-r border-neutral-200 bg-white transition-[width] duration-200 ease-out md:block',
            collapsed ? 'w-[68px]' : 'w-60',
          ].join(' ')}
          aria-label="Primary navigation"
        >
          <SidebarContent
            user={user}
            onLogout={handleLogout}
            collapsed={collapsed}
            onToggleCollapsed={toggleCollapsed}
            showCollapseToggle
          />
        </aside>

        {mobileOpen ? (
          <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
            <div
              className="absolute inset-0 bg-neutral-900/20 backdrop-blur-[1px]"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] border-r border-neutral-200 bg-white shadow-xl">
              <SidebarContent
                user={user}
                onLogout={handleLogout}
                collapsed={false}
                onNavigate={() => setMobileOpen(false)}
                showCollapseToggle={false}
              />
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/85 backdrop-blur">
            <div className="flex h-14 items-center justify-between px-4">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  className="-ml-1 rounded-lg p-1.5 text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 md:hidden"
                  onClick={() => setMobileOpen((v) => !v)}
                  aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                >
                  {mobileOpen ? <CloseIcon /> : <MenuIcon />}
                </button>
                <div className="md:hidden">
                  <BrandMark />
                </div>
                <div className="hidden items-center gap-2 md:flex">
                  <span className="text-[12px] font-medium text-neutral-400">Dashboard</span>
                  <span className="text-neutral-300">/</span>
                  <span className="text-[12px] font-semibold text-neutral-900">
                    {sectionTitle || '—'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden text-[12px] text-neutral-500 md:block">
                  {user?.email || ''}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn-ghost h-8 px-2.5 py-1 text-[12px]"
                >
                  <LogoutIcon />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-6xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
