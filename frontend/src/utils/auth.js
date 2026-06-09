// utils/auth.js
// -----------------------------------------------------------------------
// Helper functions for managing auth state in localStorage.
// Keeps token management in one place so nothing is scattered.
// -----------------------------------------------------------------------

export function saveTokens(access, refresh) {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
}

export function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
}

export function saveUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

export function getUser() {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return !!localStorage.getItem('access_token');
}

export function getAccessToken() {
  return localStorage.getItem('access_token');
}