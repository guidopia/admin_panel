import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AccessLoginPage } from '../access/screens/AccessLoginPage.jsx';
import { LoginPage } from '../screens/LoginPage.jsx';
import { AdminLayout } from '../ui/layout/AdminLayout.jsx';
import { AccessControlPage } from '../access/screens/AccessControlPage.jsx';
import { UsersPage } from '../screens/UsersPage.jsx';
import { HomeRedirect } from './HomeRedirect.jsx';
import { RequireAccessAuth } from './RequireAccessAuth.jsx';
import { RequireAuth } from './RequireAuth.jsx';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/access" element={<AccessLoginPage />} />

      <Route
        path="/"
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<HomeRedirect />} />
        <Route path="users" element={<UsersPage />} />
        <Route
          path="access"
          element={
            <RequireAccessAuth>
              <AccessControlPage />
            </RequireAccessAuth>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

