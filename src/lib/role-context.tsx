import { createContext, useContext, useState, ReactNode } from "react";

interface RoleContextType {
  roles: string[];
  setRoles: (roles: string[]) => void;
}

const RoleContext = createContext<RoleContextType>({ roles: [], setRoles: () => {} });

export function RoleProvider({ children }: { children: ReactNode }) {
  const [roles, setRolesState] = useState<string[]>(() => {
    const saved = localStorage.getItem("employee_roles");
    return saved ? JSON.parse(saved) : ["Cardholder"];
  });

  const setRoles = (newRoles: string[]) => {
    setRolesState(newRoles);
    localStorage.setItem("employee_roles", JSON.stringify(newRoles));
  };

  return (
    <RoleContext.Provider value={{ roles, setRoles }}>
      {children}
    </RoleContext.Provider>
  );
}

export const useRoles = () => useContext(RoleContext);
