import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../state/auth/AuthContext.jsx';

export function RequireAuth({ children }) {
  const { token } = useAuth();
  const location = useLocation();

  if (!token) {
    const wantsAccess =
      location.pathname === '/access' || location.pathname.startsWith('/access/');
    return (
      <Navigate
        to={wantsAccess ? '/login/access' : '/login'}
        state={{ from: location }}
        replace
      />
    );
  }
  return children;
}
