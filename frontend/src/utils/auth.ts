import { useState, useEffect } from 'react';

export const tokenManager = {
  getToken: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  },

  setToken: (token: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('authToken', token);
  },

  removeToken: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  isTokenValid: () => {
    const token = tokenManager.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  },

  getUserFromToken: () => {
    const token = tokenManager.getToken();
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        isActive: payload.isActive,
        companyId: payload.companyId,
      };
    } catch {
      return null;
    }
  },

  requireAuth: () => {
    if (!tokenManager.isTokenValid()) {
      tokenManager.removeToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/Login';
      }
      return false;
    }
    return true;
  },

  isAdmin: () => {
    const user = tokenManager.getUserFromToken();
    return user?.role === 'admin';
  },

  getAuthHeaders: (): Record<string, string> => {
    const token = tokenManager.getToken();
    if (token) {
      return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
    }
    return {
      'Content-Type': 'application/json',
    };
  },
};

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  type User = {
    userId: unknown;
    email: unknown;
    role: unknown;
    isActive: unknown;
  } | null;

  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const isValid = tokenManager.isTokenValid();
      setIsAuthenticated(isValid);

      if (isValid) {
        const userData = tokenManager.getUserFromToken();
        setUser(userData);
      } else {
        setUser(null);
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  const logout = () => {
    tokenManager.removeToken();
    setIsAuthenticated(false);
    setUser(null);
    window.location.href = '/Login';
  };

  return { isAuthenticated, user, loading, logout };
};
