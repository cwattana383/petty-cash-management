import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import type { ReactNode } from "react";

interface RoleGuardProps {
  allowedRoles: string[];
  children: ReactNode;
}

/**
 * Protects routes based on the user's actual roles (from backend profile).
 * If the user doesn't have any of the allowedRoles, redirects to /claims.
 */
export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user } = useAuth();
  const userRoles = user?.roles ?? [];

  const hasAccess = allowedRoles.some((role) => userRoles.includes(role));

  if (!hasAccess) {
    return <Navigate to="/claims" replace />;
  }

  return <>{children}</>;
}
