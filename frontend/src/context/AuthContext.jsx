// context/AuthContext.jsx
// -----------------------------------------------------------------------
// Global auth state using React Context.
// Wraps the entire app so any component can access the current user,
// login/logout functions, and loading state without prop drilling.
// -----------------------------------------------------------------------

import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';
import { saveTokens, clearTokens, saveUser, getUser, isAuthenticated } from '../utils/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getUser());
  const [loading, setLoading] = useState(true);

  // On mount, verify the stored token is still valid by fetching the profile
  useEffect(() => {
    if (isAuthenticated()) {
      authAPI.getProfile()
        .then((res) => {
          setUser(res.data);
          saveUser(res.data);
        })
        .catch(() => {
          // Token invalid or expired — clear everything
          clearTokens();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { access, refresh, user: userData } = res.data;
    saveTokens(access, refresh);
    saveUser(userData);
    setUser(userData);
    return userData;
  };

  const logout = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      await authAPI.logout({ refresh });
    } catch {
      // Logout best-effort — clear locally even if API call fails
    }
    clearTokens();
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    saveUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}