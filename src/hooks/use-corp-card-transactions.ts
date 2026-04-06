import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export type CorpCardTxnStatus =
  | 'NOT_STARTED'
  | 'MATCHED'
  | 'UNMATCHED'
  | 'SKIPPED'
  | 'AUTO_REJECTED'
  | 'AUTO_APPROVED'
  | 'REQUIRED_APPROVAL'
  | 'READY_FOR_APPROVAL'
  | 'PENDING_APPROVAL'
  | 'MANAGER_APPROVED'
  | 'MANAGER_REJECTED'
  | 'FINAL_REJECTED'
  | 'ACCOUNTING_REVIEW'
  | 'SENT_TO_ERP'
  | 'REIMBURSED'
  | 'ERP_FAILED'
  // Backward compatibility while migration is rolling out
  | 'PENDING_DOCUMENTS'
  | 'REQUIRES_APPROVAL'
  | 'UNMATCHED_INACTIVE_CARD'
  | 'AMBIGUOUS_MATCH'
  | 'MATCH_ERROR';

export interface CorpCardTransaction {
  id: string;
  employeeId: string | null;
  creditCardId: string | null;
  cardLast4: string;
  billingCycle: string;
  merchantName: string;
  merchantCity: string;
  merchantCountry: string;
  transactionDate: string;
  postingDate: string;
  amount: number;
  currency: string;
  mccCode: string;
  mccDescription: string;
  category: string;
  importStatus: string | null;
  transactionType: string;
  authorizationCode: string;
  referenceNumber: string;
  cardholderName: string;
  transactionAmount: number | null;
  transactionCurrency: string | null;
  fileId: string | null;
  importSource: 'MANUAL' | 'SCHEDULED';
  status: CorpCardTxnStatus;
  policyResult: 'AUTO_APPROVED' | 'AUTO_REJECTED' | 'REQUIRES_APPROVAL';
  policyReason: string;
  policyThresholdAmount: number | null;
  batchId: string | null;
  bankTransactionId: string | null;
  rawCardholderEmployeeId: string | null;
  unmatchedReason: string | null;
  adminReviewRequired: boolean;
  adminReviewComment: string | null;
  documentStatus: string;
  matchedAt: string | null;
  createdAt: string;
}

export interface CorpCardTxnStats {
  total: number;
  totalAmount: number;
  rejectedCount: number;
  rejectedAmount: number;
}

export interface CorpCardTxnQueryParams {
  search?: string;
  employeeId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

function buildQuery(params: CorpCardTxnQueryParams): string {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && v !== null) q.set(k, String(v));
  });
  return q.toString() ? `?${q.toString()}` : '';
}

export function useCorpCardTransactions(params: CorpCardTxnQueryParams) {
  return useQuery({
    queryKey: ['corp-card-transactions', params],
    queryFn: async () => {
      const qs = buildQuery(params);
      const res = await apiClient.getRaw(`/corp-card-transactions${qs}`);
      return res as {
        data: {
          items: CorpCardTransaction[];
          meta: { total: number; totalAmount: number; page: number; limit: number; totalPages: number };
        };
      };
    },
    placeholderData: (prev) => prev,
  });
}

export function useCorpCardTransactionStats(employeeId?: string) {
  return useQuery({
    queryKey: ['corp-card-transactions-stats', employeeId],
    queryFn: async () => {
      const qs = employeeId ? `?employeeId=${employeeId}` : '';
      const res = await apiClient.get(`/corp-card-transactions/stats${qs}`);
      return res as CorpCardTxnStats;
    },
  });
}
