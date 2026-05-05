import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  isAdmin: boolean;
  isBarber: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await authApi.me();
          setUser(res.data.data);
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await authApi.login({ email, password });
    const { token: newToken, user: newUser } = res.data.data;
    localStorage.setItem('token', newToken);
    setToken(newToken);
    // Fetch full profile so barber users get their barber.id immediately
    try {
      const meRes = await authApi.me();
      setUser(meRes.data.data);
      return meRes.data.data;
    } catch {
      setUser(newUser);
      return newUser;
    }
  };

  const logout = () => {
    authApi.logout().catch(() => {});
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user, token, isLoading, login, logout,
      isAdmin: user?.role === 'admin',
      isBarber: user?.role === 'barber',
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
