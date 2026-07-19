import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAccessUser } from '../access/lib/accessSession.js';
import { useAuth } from '../state/auth/AuthContext.jsx';

export function RequireAccessAuth({ children }) {
  const { token, user } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login/access" state={{ from: location }} replace />;
  }
  if (!isAccessUser(user)) {
    return <Navigate to="/login/access" state={{ from: location }} replace />;
  }
  return children;
}
