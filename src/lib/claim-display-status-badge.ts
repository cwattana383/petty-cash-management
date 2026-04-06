import type { ClaimDisplayStatus } from "@/lib/types";

/** Same classes as My Claims table — use with `<Badge variant="outline" className={…} />`. */
export const CLAIM_DISPLAY_STATUS_BADGE_CLASS: Record<ClaimDisplayStatus, string> = {
  NOT_STARTED: "bg-slate-100 text-slate-700",
  PENDING_DOCUMENTS: "bg-slate-100 text-slate-700",
  READY_FOR_APPROVAL: "bg-yellow-100 text-yellow-800",
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
  AUTO_APPROVED: "bg-emerald-100 text-emerald-800",
  MANAGER_APPROVED: "bg-green-100 text-green-800",
  AUTO_REJECTED: "bg-red-100 text-red-800",
  MANAGER_REJECTED: "bg-red-100 text-red-800",
};

export function getClaimDisplayStatusBadgeClass(label: string): string {
  if (Object.hasOwn(CLAIM_DISPLAY_STATUS_BADGE_CLASS, label)) {
    return CLAIM_DISPLAY_STATUS_BADGE_CLASS[label as ClaimDisplayStatus];
  }
  if (label === "Pending Approval") {
    return "bg-amber-100 text-amber-900";
  }
  if (label === "Manager Rejected") {
    return "bg-red-100 text-red-800";
  }
  if (label === "REQUIRED_APPROVAL" || label === "PENDING_APPROVAL" || label === "READY_FOR_APPROVAL" || label === "MATCHED") {
    return "bg-yellow-100 text-yellow-800";
  }
  if (label === "AUTO_REJECTED" || label === "MANAGER_REJECTED" || label === "UNMATCHED") {
    return "bg-red-100 text-red-800";
  }
  if (label === "AUTO_APPROVED" || label === "MANAGER_APPROVED") {
    return "bg-emerald-100 text-emerald-800";
  }
  return "bg-slate-100 text-slate-700";
}
