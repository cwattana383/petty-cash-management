import { addMonths } from "date-fns";
import type { ClaimHeader, ClaimStatus, ClaimDisplayStatus } from "@/lib/types";
import { toDocumentContractStatus, type PortalDocumentStatus } from "@/lib/corp-document-status";
import type { CorpCardTxnStatus } from "@/hooks/use-corp-card-transactions";

export type StatusTab = "pending_invoice" | "rejected" | "approved" | "all";

/** Internal bucket for filtering — UI labels come from `approvalStatusDisplayText`. */
export type PortalApprovalStatus =
  | "REQUIRED_APPROVAL"
  | "READY_FOR_APPROVAL"
  | "PENDING_APPROVAL"
  | "AUTO_APPROVED"
  | "AUTO_REJECTED"
  | "MANAGER_REJECTED"
  | "MANAGER_APPROVED"
  | "ACCOUNTING_REVIEW"
  | "RETURNED_FOR_INFO";

/** Labels shown in Approval Status column (portal screenshots). */
export type ApprovalStatusUiText =
  | "Required Approval"
  | "Pending Approval"
  | "Ready For Approval"
  | "Accounting Review"
  | "Reject"
  | "Manager Rejected"
  | "Auto Reject"
  | "Final Reject"
  | "Auto Approved"
  | "Manager Approved"
  | "Returned for Info"
  | "Returned by Finance";

export const TAB_STATUS_FILTER: Record<StatusTab, string[]> = {
  pending_invoice: [
    "AUTO_APPROVED",
    "REQUIRED_APPROVAL",
    "READY_FOR_APPROVAL",
    "PENDING_APPROVAL",
    "ACCOUNTING_REVIEW",
    "SENT_TO_ERP",
    "ERP_FAILED",
  ],
  rejected: ["AUTO_REJECTED", "MANAGER_REJECTED", "FINAL_REJECTED"],
  /** Manager / auto outcome; accounting pipeline (ACCOUNTING_REVIEW…) lives under Pending Document tab. */
  approved: ["MANAGER_APPROVED", "REIMBURSED", "AUTO_APPROVED"],
  all: [
    "AUTO_REJECTED",
    "AUTO_APPROVED",
    "REQUIRED_APPROVAL",
    "READY_FOR_APPROVAL",
    "PENDING_APPROVAL",
    "MANAGER_APPROVED",
    "MANAGER_REJECTED",
    "FINAL_REJECTED",
    "ACCOUNTING_REVIEW",
    "SENT_TO_ERP",
    "REIMBURSED",
    "ERP_FAILED",
  ],
};

const THAI_MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function getDeductionPeriod(txnDate: string): string {
  const d = addMonths(new Date(txnDate), 1);
  const beYear = d.getFullYear() + 543;
  const period = d.getMonth() + 1;
  return `Period ${period} / ${THAI_MONTHS_SHORT[d.getMonth()]} ${beYear}`;
}

export function formatMyClaimsNumber(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("en-US");
}

export function formatMyClaimsCurrency(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "0.00";
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function rowRouteId(txn: { id: string; bankTransactionId: string | null }): string {
  return txn.bankTransactionId || txn.id;
}

export function toDisplayStatus(
  claimStatus: ClaimStatus,
  hasAttachment: boolean,
  statusDisplay?: ClaimDisplayStatus
): ClaimDisplayStatus {
  if (statusDisplay) return statusDisplay;
  // `ClaimStatus` from API (`ClaimHeader.status`), not the My Claims "Approval Status" badge copy.
  if (claimStatus === "Pending Invoice") return hasAttachment ? "PENDING_DOCUMENTS" : "NOT_STARTED";
  if (claimStatus === "Pending Documents") return "PENDING_DOCUMENTS";
  if (claimStatus === "Pending Approval" || claimStatus === "Pending Salary Deduction") {
    return "PENDING_APPROVAL";
  }
  if (claimStatus === "Returned For Info") return "PENDING_APPROVAL";
  if (claimStatus === "Auto Approved") return "AUTO_APPROVED";
  if (claimStatus === "Manager Approved" || claimStatus === "Reimbursed") return "MANAGER_APPROVED";
  if (claimStatus === "Auto Reject") return "AUTO_REJECTED";
  if (claimStatus === "Reject" || claimStatus === "Final Rejected") return "MANAGER_REJECTED";
  return "PENDING_DOCUMENTS";
}

/**
 * Prefer corp txn list `document_status`; merge with cardholder overlay when overlay is ahead (e.g. after Save Draft).
 */
export function effectiveCorpDocumentStatus(txn: { documentStatus?: string }, claim?: ClaimHeader): string {
  const fromTxn = txn.documentStatus?.trim();
  const fromClaim = claim?.corpTxnDocumentStatus?.trim() ?? "";
  if (fromClaim && fromTxn) {
    const claimBucket = toDocumentContractStatus(fromClaim);
    const txnBucket = toDocumentContractStatus(fromTxn);
    if (claimBucket === "VALIDATED" && txnBucket === "PENDING_DOCUMENTS") return fromClaim;
  }
  if (fromTxn) return fromTxn;
  return fromClaim;
}

export function documentStatusBadgeClass(status: string): string {
  if (status === "VALIDATED") return "bg-emerald-100 text-emerald-800";
  if (status === "NOT_REQUIRED") return "bg-slate-100 text-slate-700";
  if (status === "PENDING_DOCUMENTS") return "bg-amber-100 text-amber-800";
  if (status === "SUBMITTED") return "bg-blue-100 text-blue-800";
  return "bg-slate-100 text-slate-700";
}

export function toPortalApprovalStatus(
  txnStatus: CorpCardTxnStatus,
  rawDocStatus: string | undefined,
  claim?: ClaimHeader,
  displayFromClaim?: ClaimDisplayStatus | null
): PortalApprovalStatus | null {
  const isInternalMatchingStatus =
    txnStatus === "MATCHED" ||
    txnStatus === "UNMATCHED" ||
    txnStatus === "UNMATCHED_INACTIVE_CARD" ||
    txnStatus === "AMBIGUOUS_MATCH" ||
    txnStatus === "MATCH_ERROR";

  if (isInternalMatchingStatus) return null;

  if (txnStatus === "AUTO_REJECTED") return "AUTO_REJECTED";

  const docStatus = toDocumentContractStatus(rawDocStatus);

  /** Manager-approved / reimbursed — always bucket as MANAGER (same claim often has accounting READY_FOR_ERP). */
  if (displayFromClaim === "MANAGER_APPROVED" || claim?.status === "Manager Approved" || claim?.status === "Reimbursed") {
    return "MANAGER_APPROVED";
  }
  if (txnStatus === "MANAGER_APPROVED" || txnStatus === "REIMBURSED") {
    return "MANAGER_APPROVED";
  }

  /** Corp txn already in accounting lane */
  if (txnStatus === "ACCOUNTING_REVIEW" || txnStatus === "SENT_TO_ERP" || txnStatus === "ERP_FAILED") {
    return "ACCOUNTING_REVIEW";
  }

  /**
   * Policy auto-approved claim after submit: handoff to accounting while corp row may still be AUTO_APPROVED.
   * Do not use for manager-approved rows (they share READY_FOR_ERP on the claim).
   */
  if (
    (claim?.accountingStatus === "Interfaced" || claim?.accountingStatus === "Ready for ERP") &&
    (claim?.status === "Auto Approved" || displayFromClaim === "AUTO_APPROVED")
  ) {
    return "ACCOUNTING_REVIEW";
  }

  if (txnStatus === "AUTO_APPROVED") return "AUTO_APPROVED";
  if (displayFromClaim === "AUTO_REJECTED") return "AUTO_REJECTED";
  if (displayFromClaim === "MANAGER_REJECTED") return "MANAGER_REJECTED";
  if (claim?.status === "Final Rejected") return "MANAGER_REJECTED";
  if (claim?.status === "Reject") return "MANAGER_REJECTED";
  if (claim?.status === "Returned For Info") return "RETURNED_FOR_INFO";
  if (displayFromClaim === "PENDING_APPROVAL" || claim?.status === "Pending Approval") return "PENDING_APPROVAL";
  if (displayFromClaim === "AUTO_APPROVED") return "AUTO_APPROVED";

  // Txn row status (post–corp-card enum migration — API sends REQUIRED_APPROVAL, not REQUIRES_APPROVAL)
  if (txnStatus === "PENDING_APPROVAL") return "PENDING_APPROVAL";
  if (txnStatus === "READY_FOR_APPROVAL") return "READY_FOR_APPROVAL";
  if (txnStatus === "MANAGER_REJECTED" || txnStatus === "FINAL_REJECTED") return "MANAGER_REJECTED";

  const needsApprovalLike =
    txnStatus === "REQUIRES_APPROVAL" || txnStatus === "REQUIRED_APPROVAL" || txnStatus === "PENDING_DOCUMENTS";
  if (needsApprovalLike && docStatus === "VALIDATED") return "READY_FOR_APPROVAL";
  if (needsApprovalLike) return "REQUIRED_APPROVAL";
  return null;
}

export function isPortalStatusInTab(
  status: PortalApprovalStatus,
  tab: StatusTab,
  documentStatus: PortalDocumentStatus,
  claim?: ClaimHeader
): boolean {
  if (tab === "pending_invoice") {
    if (status === "RETURNED_FOR_INFO") return true;
    if (documentStatus === "PENDING_DOCUMENTS") return true;
    if (status === "ACCOUNTING_REVIEW") return true;
    if (
      status === "REQUIRED_APPROVAL" ||
      status === "READY_FOR_APPROVAL" ||
      status === "PENDING_APPROVAL" ||
      status === "AUTO_APPROVED"
    ) {
      return true;
    }
    // Manager reject with resubmit still shown under Pending (matches portal screenshots).
    if (status === "MANAGER_REJECTED" && claim?.status === "Reject") return true;
    return false;
  }
  if (tab === "rejected") {
    return status === "AUTO_REJECTED" || status === "MANAGER_REJECTED";
  }
  if (tab === "approved") {
    return status === "MANAGER_APPROVED" || status === "AUTO_APPROVED";
  }
  return true;
}

export function approvalStatusDisplayText(
  portalStatus: PortalApprovalStatus,
  txnStatus: CorpCardTxnStatus,
  claim: ClaimHeader | undefined,
  displayFromClaim: ClaimDisplayStatus | null
): ApprovalStatusUiText {
  // Display text must reflect row status, not active tab.
  if (txnStatus === "AUTO_REJECTED" || displayFromClaim === "AUTO_REJECTED" || claim?.status === "Auto Reject") {
    return "Auto Reject";
  }
  if (claim?.status === "Returned By Finance") return "Returned by Finance";
  if (claim?.status === "Accounting Review") return "Accounting Review";
  if (claim?.status === "Final Rejected") return "Final Reject";
  if (txnStatus === "FINAL_REJECTED") return "Final Reject";
  if (
    txnStatus === "MANAGER_REJECTED" ||
    portalStatus === "MANAGER_REJECTED" ||
    displayFromClaim === "MANAGER_REJECTED"
  ) {
    return "Manager Rejected";
  }
  if (claim?.status === "Reject") return "Manager Rejected";
  if (claim?.status === "Returned For Info" || portalStatus === "RETURNED_FOR_INFO") return "Returned for Info";
  /** Manager path also sets accounting READY_FOR_ERP — show manager outcome first. */
  if (
    claim?.status === "Manager Approved" ||
    claim?.status === "Reimbursed" ||
    displayFromClaim === "MANAGER_APPROVED" ||
    portalStatus === "MANAGER_APPROVED"
  ) {
    return "Manager Approved";
  }
  if (
    portalStatus === "ACCOUNTING_REVIEW" ||
    txnStatus === "ACCOUNTING_REVIEW" ||
    txnStatus === "SENT_TO_ERP" ||
    txnStatus === "ERP_FAILED" ||
    (claim?.status === "Auto Approved" &&
      (claim?.accountingStatus === "Ready for ERP" || claim?.accountingStatus === "Interfaced")) ||
    (claim?.accountingStatus === "Interfaced" && (claim?.status as string) !== "Manager Approved")
  ) {
    return "Accounting Review";
  }
  if (txnStatus === "AUTO_APPROVED" || displayFromClaim === "AUTO_APPROVED" || portalStatus === "AUTO_APPROVED") {
    return "Auto Approved";
  }
  if (
    txnStatus === "READY_FOR_APPROVAL" ||
    portalStatus === "READY_FOR_APPROVAL" ||
    displayFromClaim === "READY_FOR_APPROVAL"
  ) {
    return "Ready For Approval";
  }
  if (portalStatus === "REQUIRED_APPROVAL" || txnStatus === "REQUIRED_APPROVAL" || txnStatus === "REQUIRES_APPROVAL") {
    return "Required Approval";
  }
  if (
    txnStatus === "PENDING_APPROVAL" ||
    portalStatus === "PENDING_APPROVAL" ||
    displayFromClaim === "PENDING_APPROVAL" ||
    claim?.status === "Pending Approval"
  ) {
    return "Pending Approval";
  }
  return "Required Approval";
}

export function approvalStatusBadgeClassForDisplay(text: ApprovalStatusUiText): string {
  if (text === "Accounting Review") return "bg-sky-100 text-sky-900";
  if (text === "Returned by Finance") return "bg-purple-50 text-purple-700";
  if (text === "Auto Approved" || text === "Manager Approved") return "bg-emerald-100 text-emerald-800";
  if (text === "Auto Reject" || text === "Reject" || text === "Final Reject" || text === "Manager Rejected") {
    return "bg-red-100 text-red-800";
  }
  if (text === "Returned for Info") return "bg-indigo-100 text-indigo-800";
  if (text === "Required Approval" || text === "Pending Approval" || text === "Ready For Approval") {
    return "bg-amber-100 text-amber-900";
  }
  return "bg-slate-100 text-slate-700";
}

export function documentStatusLabel(status: PortalDocumentStatus): string {
  if (status === "NOT_REQUIRED") return "Not Required";
  if (status === "VALIDATED") return "Validated";
  if (status === "SUBMITTED") return "Submitted";
  return "Pending Documents";
}
