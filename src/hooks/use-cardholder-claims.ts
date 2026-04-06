import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  ApprovalStep,
  AccountingStatus,
  ClaimDisplayStatus,
  ClaimHeader,
  ClaimLine,
  ClaimLinkedBankTransaction,
  ClaimStatus,
  Comment,
} from "@/lib/types";

type ClaimsQueryParams = {
  requesterId?: string;
  statusTab?: string;
  page?: number;
  limit?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
};

type ClaimsListResponse = {
  data?: unknown[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
};

function isTooManyRequestsError(e: unknown): boolean {
  const m = e instanceof Error ? e.message : String(e);
  return /\b429\b|Too Many Requests|ThrottlerException/i.test(m);
}

function toStringSafe(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return fallback;
}

function toClaimStatusFromBackendStatusCode(v: unknown): ClaimStatus {
  const s = toStringSafe(v);
  const map: Record<string, ClaimStatus> = {
    PENDING_DOCUMENTS: "Pending Documents",
    PENDING_APPROVAL: "Pending Approval",
    RETURNED_FOR_INFO: "Returned For Info",
    PENDING_SALARY_DEDUCTION: "Pending Salary Deduction",
    FINAL_REJECTED: "Final Rejected",
    AUTO_REJECT: "Auto Reject",
    REJECT: "Reject",
    FINAL_REJECT: "Final Reject",
    AUTO_APPROVED: "Auto Approved",
    MANAGER_APPROVED: "Manager Approved",
    REIMBURSED: "Reimbursed",
  };
  return map[s] ?? "Pending Invoice";
}

function toClaimDisplayStatusFromBackendStatusDisplay(v: unknown): ClaimDisplayStatus | undefined {
  const s = toStringSafe(v);
  const map: Record<string, ClaimDisplayStatus> = {
    NOT_STARTED: "NOT_STARTED",
    PENDING_DOCUMENTS: "PENDING_DOCUMENTS",
    READY_FOR_APPROVAL: "READY_FOR_APPROVAL",
    PENDING_APPROVAL: "PENDING_APPROVAL",
    AUTO_APPROVED: "AUTO_APPROVED",
    MANAGER_APPROVED: "MANAGER_APPROVED",
    AUTO_REJECTED: "AUTO_REJECTED",
    MANAGER_REJECTED: "MANAGER_REJECTED",

    // Backward compatible keys (if backend still sends legacy labels)
    INCOMPLETE: "PENDING_DOCUMENTS",
    "Pending Approval": "PENDING_APPROVAL",
    "Auto Approved": "AUTO_APPROVED",
    "Manager Approved": "MANAGER_APPROVED",
    "Auto Reject": "AUTO_REJECTED",
    "Reject": "MANAGER_REJECTED",
    "Final Reject": "MANAGER_REJECTED",
    "Final Rejected": "MANAGER_REJECTED",
    "Action Required": "PENDING_APPROVAL",
    "Pending Salary Deduction": "PENDING_APPROVAL",
  };
  return map[s];
}

function toPaymentMethodFromBackend(v: unknown): ClaimHeader["paymentMethod"] {
  const s = toStringSafe(v);
  const map: Record<string, ClaimHeader["paymentMethod"]> = {
    CASH: "Cash",
    CORPORATE_CARD: "Corporate Card",
    PERSONAL_CARD: "Personal Card",
    BANK_TRANSFER: "Bank Transfer",
  };
  return map[s] ?? "Corporate Card";
}

function toExpenseTypeFromBackend(v: unknown): ClaimLine["expenseType"] {
  const s = toStringSafe(v);
  const map: Record<string, ClaimLine["expenseType"]> = {
    TRAVEL: "Travel",
    MEALS: "Meals",
    OFFICE_SUPPLIES: "Office Supplies",
    TRANSPORTATION: "Transportation",
    TRAINING: "Training",
    ENTERTAINMENT: "Entertainment",
    COMMUNICATION: "Communication",
    OTHER: "Other",
  };
  return map[s] ?? "Other";
}

function toApprovalActionFromBackend(v: unknown): ApprovalStep["action"] {
  const s = toStringSafe(v);
  const map: Record<string, ApprovalStep["action"]> = {
    PENDING: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    REQUEST_INFO: "Request Info",
    DELEGATED: "Delegated",
  };
  return map[s] ?? "Pending";
}

function mapAccountingStatusFromBackend(v: unknown): AccountingStatus | undefined {
  const s = toStringSafe(v).toUpperCase().replace(/\s+/g, "_");
  const map: Record<string, AccountingStatus> = {
    PENDING_REVIEW: "Pending Review",
    EXCEPTION: "Exception",
    READY_FOR_ERP: "Ready for ERP",
    INTERFACED: "Interfaced",
  };
  return map[s];
}

function mapBankTransactionNested(bankTxn: Record<string, unknown> | null, fallbackBankTxnId: string): ClaimLinkedBankTransaction | undefined {
  if (!bankTxn) return undefined;
  const transactionId = toStringSafe(bankTxn.transactionId);
  const transactionDate = toStringSafe(bankTxn.transactionDate);
  const merchantName = toStringSafe(bankTxn.merchantName);
  const billingCurrency = toStringSafe(bankTxn.billingCurrency, "THB");
  const mccRaw = toStringSafe(bankTxn.mccDescription || bankTxn.category, "");
  const mccDescription = mccRaw || merchantName;
  const billingAmount = Number(bankTxn.billingAmount ?? 0);
  return {
    transactionId: transactionId || fallbackBankTxnId,
    transactionDate,
    merchantName,
    billingAmount: Number.isFinite(billingAmount) ? billingAmount : 0,
    billingCurrency: billingCurrency || "THB",
    mccDescription: mccDescription || "—",
  };
}

function mapClaimListItem(raw: Record<string, unknown>): ClaimHeader {
  const bankTxn = (raw.bankTransaction as Record<string, unknown> | null) ?? null;
  const corpCardTxn = (raw.corpCardTransaction as Record<string, unknown> | null) ?? null;
  const statusCode = raw.claimStatus;
  const statusDisplay = toClaimDisplayStatusFromBackendStatusDisplay(raw.statusDisplay);
  const bankTransactionId = toStringSafe(raw.bankTransactionId) || undefined;
  const linkedBankTransaction = mapBankTransactionNested(bankTxn, bankTransactionId ?? "");

  const billingAmount = bankTxn?.billingAmount ?? 0;

  return {
    id: toStringSafe(raw.bankTransactionId),
    bankTransactionId,
    linkedBankTransaction,
    claimNo: toStringSafe(raw.claimNo),
    requesterId: toStringSafe(bankTxn?.cardholderEmployeeId),
    requesterName: toStringSafe(bankTxn?.cardholderName),
    company: "",
    branch: "",
    department: "",
    costCenter: "",
    purpose: toStringSafe(bankTxn?.mccDescription || bankTxn?.category, ""),
    merchantName: toStringSafe(bankTxn?.merchantName) || undefined,
    currency: toStringSafe(bankTxn?.billingCurrency, "THB"),
    paymentMethod: "Corporate Card",
    totalAmount: Number(billingAmount),
    totalVat: 0,
    status: toClaimStatusFromBackendStatusCode(statusCode),
    statusCode: toStringSafe(statusCode) || undefined,
    statusDisplay,
    statusColor: (toStringSafe(raw.statusColor) as ClaimHeader["statusColor"]) || undefined,
    statusMeta: undefined,
    readOnly: undefined,
    accountingStatus: mapAccountingStatusFromBackend(raw.accountingStatus) ?? "Pending Review",
    accountCode: undefined,
    createdDate: toStringSafe(raw.createdDate),
    submittedDate: (raw.submittedDate as string | null) ?? null,
    lines: [],
    approvalHistory: [],
    comments: [],
    corpTxnStatus: toStringSafe(corpCardTxn?.status) || undefined,
    corpTxnDocumentStatus: toStringSafe(corpCardTxn?.documentStatus) || undefined,
  };
}

function mapClaimDetailResponse(raw: Record<string, unknown>): ClaimHeader {
  const claim = (raw.claim as Record<string, unknown> | null) ?? {};
  const statusCode = raw.statusCode ?? claim.status;
  const statusDisplay = toClaimDisplayStatusFromBackendStatusDisplay(raw.statusDisplay);

  const statusMetaRaw = (raw.statusMeta as Record<string, unknown> | null) ?? null;
  const autoApprovalRule = statusMetaRaw?.autoApprovalRule as string | undefined;
  const salaryDeductionPeriod = statusMetaRaw?.salaryDeductionPeriod as string | undefined;

  const shouldIncludeStatusMeta = !!autoApprovalRule || !!salaryDeductionPeriod;

  const statusMeta = shouldIncludeStatusMeta
    ? ({
        autoApprovalRule,
        deductionPayPeriod: statusMetaRaw?.salaryDeductionPeriod as string | undefined,
        deductionInstallment: statusMetaRaw?.salaryDeductionInstallment
          ? Number(statusMetaRaw.salaryDeductionInstallment)
          : undefined,
        deductionFallbackMessage: statusMetaRaw?.salaryDeductionFallback as string | undefined,
      } as ClaimHeader["statusMeta"])
    : undefined;

  const lines = Array.isArray(claim.lines)
    ? (claim.lines as Record<string, unknown>[]).map(
        (l): ClaimLine => ({
          id: toStringSafe(l.id, `line-${Date.now()}`), // backend line id may not exist in response
          expenseType: toExpenseTypeFromBackend(l.expenseType),
          description: toStringSafe(l.description),
          amount: Number(l.amount ?? 0),
          vat: Number(l.vat ?? 0),
          taxInvoiceNo: toStringSafe(l.taxInvoiceNo),
          invoiceDate: toStringSafe(l.invoiceDate),
          vendor: toStringSafe(l.vendor),
          paymentMethod: toPaymentMethodFromBackend(l.paymentMethod),
          projectId: toStringSafe(l.projectId),
          memo: toStringSafe(l.memo),
          attachmentUrl: (l.attachmentUrl as string | undefined) ?? undefined,
        })
      )
    : [];

  const approvalHistory = Array.isArray(claim.approvalSteps)
    ? (claim.approvalSteps as Record<string, unknown>[]).map(
        (s): ApprovalStep => ({
          stepNo: Number(s.stepNo ?? 0),
          approverId: toStringSafe(s.approverId),
          approverName: toStringSafe(s.approverName),
          action: toApprovalActionFromBackend(s.action),
          comment: toStringSafe(s.comment),
          actionDate: (s.actionDate as string | null) ?? null,
        })
      )
    : [];

  const comments = Array.isArray(claim.comments)
    ? (claim.comments as Record<string, unknown>[]).map(
        (c): Comment => ({
          id: toStringSafe(c.id, `cm-${Date.now()}-${Math.random()}`),
          userId: toStringSafe(c.userId),
          userName: toStringSafe(c.userName),
          text: toStringSafe(c.text),
          date: toStringSafe(c.date),
        })
      )
    : [];

  const detailBankTxnId =
    toStringSafe(raw.bankTransactionId || claim.bankTransactionId || claim.id) || undefined;
  const bankTxnNested =
    ((raw.bankTransaction as Record<string, unknown> | null) ??
      (claim.bankTransaction as Record<string, unknown> | null)) ??
    null;
  const linkedBankTransaction = mapBankTransactionNested(bankTxnNested, detailBankTxnId ?? "");
  const corpCardTxn = (raw.corpCardTransaction as Record<string, unknown> | null) ?? null;

  return {
    id: toStringSafe(claim.id),
    bankTransactionId: detailBankTxnId,
    linkedBankTransaction,
    corpTxnStatus: toStringSafe(corpCardTxn?.status) || undefined,
    corpTxnDocumentStatus: toStringSafe(corpCardTxn?.documentStatus) || undefined,
    claimNo: toStringSafe(claim.claimNo),
    requesterId: toStringSafe(claim.requesterId),
    requesterName: toStringSafe(claim.requesterName),
    company: toStringSafe(claim.company),
    branch: toStringSafe(claim.branch),
    department: toStringSafe(claim.department),
    costCenter: toStringSafe(claim.costCenter),
    purpose: toStringSafe(claim.purpose),
    expenseTypeId: toStringSafe(claim.expenseTypeId) || undefined,
    subExpenseTypeId: toStringSafe(claim.subExpenseTypeId) || undefined,
    vatTypeId: toStringSafe(claim.vatTypeId) || undefined,
    glAccountId: toStringSafe(claim.glAccountId) || undefined,
    merchantName: (toStringSafe(claim.merchantName) || undefined) as string | undefined,
    currency: toStringSafe(claim.currency, "THB"),
    paymentMethod: toPaymentMethodFromBackend(claim.paymentMethod),
    totalAmount: Number(claim.totalAmount ?? 0),
    totalVat: Number(claim.totalVat ?? 0),
    status: toClaimStatusFromBackendStatusCode(statusCode),
    statusCode: toStringSafe(statusCode) || undefined,
    statusDisplay,
    statusColor: (toStringSafe(raw.statusColor) as ClaimHeader["statusColor"]) || undefined,
    statusMeta,
    readOnly: typeof raw.readOnly === "boolean" ? raw.readOnly : undefined,
    accountingStatus: toStringSafe(claim.accountingStatus, "Pending Review") as ClaimHeader["accountingStatus"],
    accountCode: (claim.accountCode as string | undefined) ?? undefined,
    createdDate: toStringSafe(claim.createdDate),
    submittedDate: ((claim.submittedDate as string | null) ?? null) as string | null,
    lines,
    approvalHistory,
    comments,
  };
}

function buildQueryString(params: ClaimsQueryParams): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  });
  return qs.toString();
}

async function fetchCardholderClaimDetailById(claimId: string): Promise<ClaimHeader> {
  const res = (await apiClient.get(`/claims/cardholder/claims/${claimId}`)) as Record<string, unknown>;
  return mapClaimDetailResponse(res);
}

function cardholderClaimDetailRetry(failureCount: number, error: unknown): boolean {
  if (isTooManyRequestsError(error)) return failureCount < 4;
  return failureCount < 1;
}

function cardholderClaimDetailRetryDelay(failureCount: number, error: unknown): number {
  if (isTooManyRequestsError(error)) {
    return Math.min(400 * 2 ** failureCount, 10_000);
  }
  return Math.min(1000 * 2 ** failureCount, 30_000);
}

const CORP_OVERLAY_PAGE_SIZE = 200;
const CORP_OVERLAY_MAX_PAGES = 80;

export type CardholderClaimsCorpOverlayParams = {
  dateFrom: string;
  dateTo: string;
  search?: string;
};

/**
 * One (or a few) list requests for the date range — builds the bankTransactionId → claim map for My Claims
 * without N parallel GET /claims/cardholder/claims/:id calls (avoids API throttling).
 */
export function useCardholderClaimsCorpOverlay(params: CardholderClaimsCorpOverlayParams) {
  const { dateFrom, dateTo, search } = params;
  return useQuery<ClaimHeader[]>({
    queryKey: ["cardholder-claims", "corp-overlay", { dateFrom, dateTo, search: search ?? "" }] as const,
    queryFn: async () => {
      const aggregated: ClaimHeader[] = [];
      let page = 1;
      let totalPages = 1;

      for (;;) {
        const qs = buildQueryString({
          dateFrom,
          dateTo,
          search,
          page,
          limit: CORP_OVERLAY_PAGE_SIZE,
        });
        const path = qs ? `/claims/cardholder/claims?${qs}` : "/claims/cardholder/claims";
        const res = (await apiClient.getRaw(path)) as ClaimsListResponse;
        const arr = Array.isArray(res.data) ? res.data : [];
        aggregated.push(...arr.map((x) => mapClaimListItem(x as Record<string, unknown>)));

        const tp = res.meta?.totalPages;
        if (typeof tp === "number" && tp >= 1) totalPages = tp;
        if (page >= totalPages) break;
        if (arr.length < CORP_OVERLAY_PAGE_SIZE) break;
        page += 1;
        if (page > CORP_OVERLAY_MAX_PAGES) break;
      }

      return aggregated;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: cardholderClaimDetailRetry,
    retryDelay: cardholderClaimDetailRetryDelay,
  });
}

export function useCardholderClaims(params: ClaimsQueryParams) {
  return useQuery<{ data: ClaimHeader[]; meta?: ClaimsListResponse["meta"] }>({
    queryKey: ["cardholder-claims", params],
    queryFn: async () => {
      const qs = buildQueryString(params);
      const res = (await apiClient.getRaw(`/claims/cardholder/claims${qs ? `?${qs}` : ""}`)) as ClaimsListResponse;
      const arr = Array.isArray(res.data) ? res.data : [];
      return { data: arr.map((x) => mapClaimListItem(x as Record<string, unknown>)), meta: res.meta };
    },
    staleTime: 30 * 1000,
    retry: (failureCount: number, error: unknown) => {
      if (isTooManyRequestsError(error)) return false;
      return failureCount < 1;
    },
  });
}

export function useCardholderClaimDetail(claimId?: string) {
  return useQuery<ClaimHeader>({
    queryKey: ["cardholder-claim-detail", claimId],
    enabled: !!claimId,
    queryFn: () => fetchCardholderClaimDetailById(claimId!),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: cardholderClaimDetailRetry,
    retryDelay: cardholderClaimDetailRetryDelay,
  });
}

export type CreateClaimPayload = {
  requesterId: string;
  requesterName: string;
  company: string;
  branch: string;
  department: string;
  costCenter: string;
  purpose: string;
  paymentMethod: "CORPORATE_CARD" | "CASH" | "PERSONAL_CARD" | "BANK_TRANSFER";
  bankTransactionId?: string;
  merchantName?: string;
  currency: string;
  lines: Array<{
    expenseType: string;
    description: string;
    amount: number;
    vat: number;
    taxInvoiceNo: string;
    invoiceDate: string;
    vendor: string;
    paymentMethod: "CORPORATE_CARD" | "CASH" | "PERSONAL_CARD" | "BANK_TRANSFER";
    projectId: string;
    memo?: string;
    attachmentUrl?: string;
  }>;
};

export function useCreateClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateClaimPayload) => apiClient.post("/claims", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cardholder-claims"] });
      queryClient.invalidateQueries({ queryKey: ["cardholder-claim-detail"] });
    },
  });
}

export type SaveClaimDraftPayload = {
  purpose?: string;
  expenseTypeId?: string;
  subExpenseTypeId?: string;
  vatTypeId?: string;
  glAccountId?: string;
};

export function useSaveClaimDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ claimId, body }: { claimId: string; body: SaveClaimDraftPayload }) =>
      apiClient.patch(`/claims/${claimId}/draft`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cardholder-claims"] });
      queryClient.invalidateQueries({ queryKey: ["cardholder-claim-detail"] });
      queryClient.invalidateQueries({ queryKey: ["corp-card-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["corp-card-transactions-stats"] });
    },
  });
}

function mapClaimFindOneResponse(raw: Record<string, unknown>): ClaimHeader {
  const statusCode = raw.status;
  const statusDisplay = toClaimDisplayStatusFromBackendStatusDisplay(statusCode);
  const lines = Array.isArray(raw.lines)
    ? (raw.lines as Record<string, unknown>[]).map(
        (l): ClaimLine => ({
          id: toStringSafe(l.id, `line-${Date.now()}`),
          expenseType: toExpenseTypeFromBackend(l.expenseType),
          description: toStringSafe(l.description),
          amount: Number(l.amount ?? 0),
          vat: Number(l.vat ?? 0),
          taxInvoiceNo: toStringSafe(l.taxInvoiceNo),
          invoiceDate: toStringSafe(l.invoiceDate),
          vendor: toStringSafe(l.vendor),
          paymentMethod: toPaymentMethodFromBackend(l.paymentMethod),
          projectId: toStringSafe(l.projectId),
          memo: toStringSafe(l.memo),
          attachmentUrl: (l.attachmentUrl as string | undefined) ?? undefined,
        })
      )
    : [];
  const approvalHistory = Array.isArray(raw.approvalSteps)
    ? (raw.approvalSteps as Record<string, unknown>[]).map(
        (s): ApprovalStep => ({
          stepNo: Number(s.stepNo ?? 0),
          approverId: toStringSafe(s.approverId),
          approverName: toStringSafe(s.approverName),
          action: toApprovalActionFromBackend(s.action),
          comment: toStringSafe(s.comment),
          actionDate: (s.actionDate as string | null) ?? null,
        })
      )
    : [];
  const comments = Array.isArray(raw.comments)
    ? (raw.comments as Record<string, unknown>[]).map(
        (c): Comment => ({
          id: toStringSafe(c.id, `cm-${Date.now()}-${Math.random()}`),
          userId: toStringSafe(c.userId),
          userName: toStringSafe(c.userName),
          text: toStringSafe(c.text),
          date: toStringSafe(c.date),
        })
      )
    : [];
  const bankTransactionId = toStringSafe(raw.bankTransactionId) || undefined;
  return {
    id: toStringSafe(raw.id),
    bankTransactionId,
    linkedBankTransaction: undefined,
    corpTxnStatus: undefined,
    corpTxnDocumentStatus: undefined,
    claimNo: toStringSafe(raw.claimNo),
    requesterId: toStringSafe(raw.requesterId),
    requesterName: toStringSafe(raw.requesterName),
    company: toStringSafe(raw.company),
    branch: toStringSafe(raw.branch),
    department: toStringSafe(raw.department),
    costCenter: toStringSafe(raw.costCenter),
    purpose: toStringSafe(raw.purpose),
    expenseTypeId: toStringSafe(raw.expenseTypeId) || undefined,
    subExpenseTypeId: toStringSafe(raw.subExpenseTypeId) || undefined,
    vatTypeId: toStringSafe(raw.vatTypeId) || undefined,
    glAccountId: toStringSafe(raw.glAccountId) || undefined,
    merchantName: (toStringSafe(raw.merchantName) || undefined) as string | undefined,
    currency: toStringSafe(raw.currency, "THB"),
    paymentMethod: toPaymentMethodFromBackend(raw.paymentMethod),
    totalAmount: Number(raw.totalAmount ?? 0),
    totalVat: Number(raw.totalVat ?? 0),
    status: toClaimStatusFromBackendStatusCode(statusCode),
    statusCode: toStringSafe(statusCode) || undefined,
    statusDisplay,
    statusColor: undefined,
    statusMeta: undefined,
    readOnly: undefined,
    accountingStatus: toStringSafe(raw.accountingStatus, "Pending Review") as ClaimHeader["accountingStatus"],
    accountCode: (raw.accountCode as string | undefined) ?? undefined,
    createdDate: toStringSafe(raw.createdDate),
    submittedDate: ((raw.submittedDate as string | null) ?? null) as string | null,
    lines,
    approvalHistory,
    comments,
  };
}

export function useClaimDetailForApprover(claimId?: string) {
  return useQuery<ClaimHeader>({
    queryKey: ["claim-detail-for-approver", claimId],
    enabled: !!claimId,
    queryFn: async () => {
      const res = (await apiClient.get(`/claims/${claimId}`)) as Record<string, unknown>;
      return mapClaimFindOneResponse(res);
    },
    retry: 1,
  });
}

