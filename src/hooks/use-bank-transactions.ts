import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  BankTransaction,
  BankTransactionQueryParams,
  BankTransactionStats,
  BankTransactionFilterOptions,
  PaginatedResponse,
  PolicyResult,
  ProcessingStatus,
} from "@/lib/corporate-card-types";

/** Map a single API record (camelCase) to the frontend BankTransaction (snake_case). */
function mapTransaction(raw: Record<string, unknown>): BankTransaction {
  return {
    id: raw.id as string,
    file_id: raw.fileId as string,
    transaction_id: raw.transactionId as string,
    cardholder_employee_id: raw.cardholderEmployeeId as string,
    cardholder_name: raw.cardholderName as string,
    transaction_date: raw.transactionDate as string,
    posting_date: raw.postingDate as string,
    billing_amount: Number(raw.billingAmount),
    billing_currency: raw.billingCurrency as string,
    merchant_name: raw.merchantName as string,
    merchant_city: raw.merchantCity as string,
    merchant_country: raw.merchantCountry as string,
    mcc_code: raw.mccCode as string,
    mcc_description: raw.mccDescription as string,
    category: (raw.category as string) ?? '',
    import_status: (raw.importStatus as string | null) ?? null,
    transaction_type: raw.transactionType as string,
    authorization_code: raw.authorizationCode as string,
    reference_number: raw.referenceNumber as string,
    policy_result: raw.policyResult as PolicyResult,
    policy_reason: raw.policyReason as string,
    processing_status: raw.processingStatus as ProcessingStatus,
    created_at: raw.createdAt as string,
    card_number: (raw.cardNumber as string | null) ?? null,
    last_4_digit: (raw.last4Digit as string | null) ?? null,
    transaction_amount: raw.transactionAmount != null ? Number(raw.transactionAmount) : null,
    transaction_currency: (raw.transactionCurrency as string | null) ?? null,
  };
}

function buildQueryString(params: BankTransactionQueryParams): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "all") {
      qs.set(key, String(value));
    }
  });
  return qs.toString();
}

export function useBankTransactions(
  params: BankTransactionQueryParams,
  options: { enabled?: boolean } = {}
) {
  return useBankTransactionsWithOptions(params, options);
}

export function useBankTransactionsWithOptions(
  params: BankTransactionQueryParams,
  options: { enabled?: boolean } = {}
) {
  return useQuery<PaginatedResponse<BankTransaction>>({
    queryKey: ["bank-transactions", params],
    queryFn: async () => {
      const qs = buildQueryString(params);
      const json = await apiClient.get(`/bank-transactions?${qs}`);
      const items = Array.isArray(json.items) ? json.items : [];
      const meta = json.meta ?? {
        total: items.length,
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        totalPages: 1,
      };
      return {
        data: items.map((r: unknown) => mapTransaction(r as Record<string, unknown>)),
        meta,
      };
    },
    placeholderData: keepPreviousData,
    enabled: options.enabled ?? true,
  });
}

export function useBankTransactionStats() {
  return useQuery<BankTransactionStats>({
    queryKey: ["bank-transactions-stats"],
    queryFn: () => apiClient.get("/bank-transactions/stats"),
  });
}

export function useBankTransactionFilterOptions() {
  return useQuery<BankTransactionFilterOptions>({
    queryKey: ["bank-transactions-filter-options"],
    queryFn: () => apiClient.get("/bank-transactions/filter-options"),
    staleTime: 0, // always fetch fresh data
  });
}

export async function checkFileExists(fileId: string): Promise<boolean> {
  const res = await apiClient.get(`/bank-transactions/check-file?fileId=${encodeURIComponent(fileId)}`);
  return (res as { exists: boolean }).exists;
}

export function useReportImportFailure() {
  return useMutation({
    mutationFn: (payload: { fileName: string; errors: string[]; totalRows?: number; failureType?: string }) =>
      apiClient.post("/bank-transactions/report-import-failure", payload),
  });
}


export function useImportBankTransactions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (transactions: BankTransaction[]) => {
      const dtos = transactions.map((t) => ({
        fileId: t.file_id,
        transactionId: t.transaction_id,
        cardholderEmployeeId: t.cardholder_employee_id,
        cardholderName: t.cardholder_name,
        transactionDate: t.transaction_date,
        postingDate: t.posting_date,
        billingAmount: t.billing_amount,
        billingCurrency: t.billing_currency,
        merchantName: t.merchant_name,
        merchantCity: t.merchant_city,
        merchantCountry: t.merchant_country,
        mccCode: t.mcc_code,
        mccDescription: t.mcc_description,
        category: t.category || undefined,
        importStatus: t.import_status ?? undefined,
        transactionType: t.transaction_type,
        authorizationCode: t.authorization_code,
        referenceNumber: t.reference_number,
        cardNumber: t.card_number ?? undefined,
        last4Digit: t.last_4_digit ?? undefined,
        transactionAmount: t.transaction_amount ?? undefined,
        transactionCurrency: t.transaction_currency ?? undefined,
      }));
      return apiClient.post("/bank-transactions/import", dtos);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["bank-transactions-stats"] });
      queryClient.invalidateQueries({ queryKey: ["bank-transactions-filter-options"] });
    },
  });
}
