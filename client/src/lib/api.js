import axios from 'axios';

export const AUTH_STORAGE_KEY = 'guidopia_admin_auth';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 20000,
});

function readStoredToken() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw)?.token || '' : '';
  } catch {
    return '';
  }
}

// Always attach the current token from storage. This avoids a race on hard
// refresh where a page could fire its first request before any effect had a
// chance to set the default Authorization header.
api.interceptors.request.use((config) => {
  const token = readStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function setApiAuthToken(token) {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
}

