import { useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRolesOverview } from "@/hooks/use-roles";
import { CARD_TYPE_OPTIONS } from "@/components/admin/CardManagementList";

const MENU_KEY = "card_management";
const STORAGE_KEY = "role_data_scope";

/** Card type label (as used in the Card Type filter) → scope key. */
export const cardTypeKey = (label: string) =>
  (/credit/i.test(label) ? "Credit Card" : label).toLowerCase().replace(/[^a-z0-9]+/g, "_");
/** Card master row kind → scope key. */
export const kindKey = (kind: string) => (kind === "fleet" ? "fleet_card" : "credit_card");

const FALLBACK_ROLE_IDS: Record<string, string> = {
  SYSTEM_ADMIN: "r-admin", FLEET_ADMIN: "r-fleet", CREDIT_CARD_ADMIN: "r-credit", APPROVER: "r-approver",
};
const toKey = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]+/g, "_");

/** Effective card-type scope for the logged-in user on Card Management. */
export function useCardTypeScope() {
  const { user } = useAuth();
  const { data } = useRolesOverview();

  return useMemo(() => {
    const allKeys = CARD_TYPE_OPTIONS.map(cardTypeKey);
    const userRoles: string[] = user?.roles ?? [];
    let rows: { role_id: string; menu_key: string; scope_value: string }[] = [];
    try { rows = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { rows = []; }

    const roleScope = (role: string): string[] => {
      if (role === "Admin") return allKeys;
      const k = toKey(role);
      const match = (data ?? []).find((r: any) => (r.key ?? toKey(r.name)) === k);
      const id = match?.id ?? FALLBACK_ROLE_IDS[k];
      const vals = rows.filter((r) => r.role_id === id && r.menu_key === MENU_KEY).map((r) => r.scope_value);
      return vals.length ? allKeys.filter((a) => vals.includes(a)) : allKeys;
    };
    const roleCanEdit = (role: string) => {
      if (role === "Admin") return true;
      const match: any = (data ?? []).find((r: any) => (r.key ?? toKey(r.name)) === toKey(role));
      return !!match?.permissions?.some((p: string) => /card/i.test(p) && /(edit|manage|update)/i.test(p));
    };

    const allowed = new Set<string>();
    userRoles.forEach((r) => roleScope(r).forEach((k) => allowed.add(k)));
    const allowedKeys = allKeys.filter((k) => allowed.has(k));
    const allowedLabels = CARD_TYPE_OPTIONS.filter((l) => allowed.has(cardTypeKey(l)));

    return {
      allowedKeys,
      allowedLabels,
      isRestricted: allowedKeys.length < allKeys.length,
      inScope: (key: string) => allowed.has(key),
      /** Edit allowed only if one single role grants Edit AND has this type in its scope. */
      canEdit: (key: string) => userRoles.some((r) => roleCanEdit(r) && roleScope(r).includes(key)),
    };
  }, [user, data]);
}
