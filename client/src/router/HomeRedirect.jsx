import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAccessUser } from '../access/lib/accessSession.js';
import { useAuth } from '../state/auth/AuthContext.jsx';

export function HomeRedirect() {
  const { user } = useAuth();
  if (isAccessUser(user)) return <Navigate to="/access" replace />;
  return <Navigate to="/users" replace />;
}
