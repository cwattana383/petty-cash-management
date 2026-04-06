import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { users, demoAccounts } from './mock-data';

interface AuthUser {
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

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
  /** Mock login for demo — verifies against demoAccounts */
  login: (email: string, password: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function userToAuthUser(u: typeof users[0]): AuthUser {
  return {
    ...u,
    active: true,
    notifyOnSubmission: true,
    notifyOnDecision: true,
    notifyOnReminder: true,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    // Restore session from localStorage
    const savedId = localStorage.getItem('mock_auth_user_id');
    if (savedId) {
      const found = users.find(u => u.id === savedId);
      if (found) return userToAuthUser(found);
    }
    return null;
  });
  const [loading] = useState(false);

  const login = useCallback((email: string, password: string): boolean => {
    const account = demoAccounts.find(a => a.email === email && a.password === password);
    if (!account) return false;
    const found = users.find(u => u.id === account.userId);
    if (!found) return false;
    const authUser = userToAuthUser(found);
    setUser(authUser);
    localStorage.setItem('mock_auth_user_id', found.id);
    localStorage.setItem('employee_roles', JSON.stringify(found.roles));
    localStorage.setItem('selected_role', JSON.stringify([found.roles[0]]));
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('mock_auth_user_id');
    localStorage.removeItem('employee_roles');
    localStorage.removeItem('selected_role');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        logout,
        login,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
