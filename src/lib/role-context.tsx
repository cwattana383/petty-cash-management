import { createContext, useContext, useState, ReactNode } from "react";

interface RoleContextType {
  roles: string[];
  allRoles: string[];
  setRoles: (roles: string[]) => void;
}

const RoleContext = createContext<RoleContextType>({ roles: [], allRoles: [], setRoles: () => {} });

export function RoleProvider({ children }: { children: ReactNode }) {
  // allRoles = every role the user has (from backend via auth)
  const [allRoles] = useState<string[]>(() => {
    const saved = localStorage.getItem("employee_roles");
    return saved ? JSON.parse(saved) : [];
  });

  // active selected role = single role the user is currently viewing as
  const [roles, setRolesState] = useState<string[]>(() => {
    const saved = localStorage.getItem("selected_role");
    if (saved) return JSON.parse(saved);
    // Default to the first role
    const all = localStorage.getItem("employee_roles");
    const parsed = all ? JSON.parse(all) : [];
    return parsed.length > 0 ? [parsed[0]] : [];
  });

  const setRoles = (newRoles: string[]) => {
    setRolesState(newRoles);
    localStorage.setItem("selected_role", JSON.stringify(newRoles));
  };

  return (
    <RoleContext.Provider value={{ roles, allRoles, setRoles }}>
      {children}
    </RoleContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useRoles = () => useContext(RoleContext);
