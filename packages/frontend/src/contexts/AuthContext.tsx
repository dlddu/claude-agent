/**
 * Authentication Context
 * @spec UI-004
 */

'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import {
  User,
  LoginCredentials,
  ApiKeyCredentials,
  login as authLogin,
  loginWithApiKey as authLoginWithApiKey,
  logout as authLogout,
  getCurrentUser,
} from '@/lib/auth';
import { getAuthToken } from '@/lib/api';

/**
 * Auth Context interface
 */
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithApiKey: (credentials: ApiKeyCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth Provider Props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth Provider Component
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  /**
   * Fetch current user
   */
  const refreshUser = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setUser(null);
        return;
      }

      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    }
  }, []);

  /**
   * Login with email/password
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await authLogin(credentials);
    setUser(response.user);
  }, []);

  /**
   * Login with API key
   */
  const loginWithApiKey = useCallback(async (credentials: ApiKeyCredentials) => {
    const response = await authLoginWithApiKey(credentials);
    setUser(response.user);
  }, []);

  /**
   * Logout
   */
  const logout = useCallback(async () => {
    await authLogout();
    setUser(null);
  }, []);

  /**
   * Initial auth check
   */
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      await refreshUser();
      setIsLoading(false);
    };

    checkAuth();
  }, [refreshUser]);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    loginWithApiKey,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth hook
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
