import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface ApprovalInboxClaim {
  id: string;
  claimNo: string;
  requesterId: string;
  requesterName: string;
  department: string;
  purpose: string;
  totalAmount: number;
  status: string;
  /** Some APIs send enum here while `status` stays human-readable */
  statusCode?: string;
  statusMeta?: {
    autoApprovalRule?: string;
  };
  submittedDate: string | null;
  createdDate: string;
  overrideFlag: boolean;
  overrideReason: string | null;
  documents?: { id: string }[];
  approvalSteps: {
    id: string;
    stepNo: number;
    approverId: string;
    approverName: string;
    action: string;
    comment: string;
    actionDate: string | null;
  }[];
}

export interface ApprovalInboxStats {
  pendingCount: number;
  /** From GET /claims/approval-inbox/stats — approval steps APPROVED this month, excluding policy auto-audit rows. */
  approvedThisMonth: number;
  totalPendingAmount: number;
}

interface ApprovalInboxParams {
  page?: number;
  limit?: number;
}

interface ApprovalInboxResponse {
  data: ApprovalInboxClaim[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export function useClaimForApprover(id: string | undefined) {
  return useQuery<ApprovalInboxClaim>({
    queryKey: ['claim-for-approver', id],
    queryFn: () => apiClient.get(`/claims/${id}`),
    enabled: !!id,
  });
}

export function useApprovalInbox(params: ApprovalInboxParams = {}) {
  const { page = 1, limit = 20 } = params;
  return useQuery<ApprovalInboxResponse>({
    queryKey: ['approval-inbox', page, limit],
    queryFn: async () => {
      const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
      return apiClient.getRaw(`/claims/approval-inbox?${qs}`);
    },
    refetchInterval: 30_000,
  });
}

export function useApprovalInboxStats() {
  return useQuery<ApprovalInboxStats>({
    queryKey: ['approval-inbox-stats'],
    queryFn: () => apiClient.get('/claims/approval-inbox/stats'),
    refetchInterval: 30_000,
  });
}

export function useApproveClaimInbox() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ claimId, approverId, approverName, comment }: {
      claimId: string;
      approverId: string;
      approverName: string;
      comment?: string;
    }) =>
      apiClient.patch(`/claims/${claimId}/status`, {
        status: 'MANAGER_APPROVED',
        approverId,
        approverName,
        comment: comment ?? '',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-inbox'] });
      queryClient.invalidateQueries({ queryKey: ['approval-inbox-stats'] });
    },
  });
}

export function useRejectClaimInbox() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ claimId, approverId, approverName, comment }: {
      claimId: string;
      approverId: string;
      approverName: string;
      comment?: string;
    }) =>
      apiClient.patch(`/claims/${claimId}/status`, {
        status: 'REJECT',
        approverId,
        approverName,
        comment: comment ?? '',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-inbox'] });
      queryClient.invalidateQueries({ queryKey: ['approval-inbox-stats'] });
    },
  });
}
