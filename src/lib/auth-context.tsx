import { createContext, useContext } from 'react';

export interface AuthUser {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  roles: string[];
  branch: string;
  department: string;
  costCenter: string;
  position: string;
  telephone?: string;
  active: boolean;
  notifyOnSubmission: boolean;
  notifyOnDecision: boolean;
  notifyOnReminder: boolean;
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
  /** Mock login for demo — verifies against demoAccounts */
  login: (email: string, password: string) => boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
