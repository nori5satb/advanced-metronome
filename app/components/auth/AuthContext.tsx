import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  lastLoginAt?: number;
  createdAt: number;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, name: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const refreshAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json() as { authenticated: boolean; user?: User };
        if (data.authenticated && data.user) {
          setUser(data.user);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('認証状態確認エラー:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await response.json() as { success: boolean; user?: User; error?: string };

      if (response.ok && data.success) {
        setUser(data.user!);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'ログインに失敗しました' };
      }
    } catch (error) {
      console.error('ログインエラー:', error);
      return { success: false, error: 'ネットワークエラーが発生しました' };
    }
  }, []);

  const register = useCallback(async (email: string, name: string, password: string) => {
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('name', name);
      formData.append('password', password);

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await response.json() as { success: boolean; user?: User; error?: string };

      if (response.ok && data.success) {
        setUser(data.user!);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        return { success: false, error: data.error || 'ユーザー登録に失敗しました' };
      }
    } catch (error) {
      console.error('ユーザー登録エラー:', error);
      return { success: false, error: 'ネットワークエラーが発生しました' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('ログアウトエラー:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}