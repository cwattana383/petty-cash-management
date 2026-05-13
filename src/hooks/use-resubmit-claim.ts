import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useClaims } from "@/lib/claims-context";
import { useAuth } from "@/lib/auth-context";
import type { ClaimStatus } from "@/lib/types";
import type { AuditEvent } from "@/components/claims/AuditTrail";

export interface ResubmitClaimInput {
  claimId: string;
  responseMessage?: string;
  newFileIds?: string[];
  cardholderNote?: string;
  /** Original cardholder note value at the time of rejection (for change detection on Reject resubmits). */
  originalCardholderNoteAtRejection?: string;
  /** Set true to bypass the no-changes confirmation gate (BR4). */
  acknowledgeNoChanges?: boolean;
}

export class NoChangesError extends Error {
  constructor() {
    super("no-changes-detected");
    this.name = "NoChangesError";
  }
}

function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useResubmitClaim() {
  const queryClient = useQueryClient();
  const { claims, updateClaim } = useClaims();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: ResubmitClaimInput): Promise<ClaimStatus> => {
      const { claimId, responseMessage, newFileIds, cardholderNote, originalCardholderNoteAtRejection, acknowledgeNoChanges } = input;

      const claim = claims.find((c) => c.id === claimId);
      if (!claim) {
        throw new Error("Claim not found");
      }

      const RESUBMITTABLE: ClaimStatus[] = ["Reject", "Returned For Info", "Returned By Finance"];
      if (!RESUBMITTABLE.includes(claim.status)) {
        throw new Error("Claim is not in a resubmittable state");
      }

      let newStatus: ClaimStatus;
      let newResubmitCount: number | undefined = claim.resubmitCountMgr;
      let newStatusBadge: string;

      if (claim.status === "Reject") {
        if ((claim.resubmitCountMgr ?? 0) >= 1) {
          throw new Error("Maximum resubmission attempts reached — claim is locked");
        }
        const hasNewFiles = !!(newFileIds && newFileIds.length > 0);
        const hasNoteChange =
          cardholderNote !== undefined &&
          (cardholderNote ?? "") !== (originalCardholderNoteAtRejection ?? "");
        const hasChanges = hasNewFiles || hasNoteChange;
        if (!hasChanges && !acknowledgeNoChanges) {
          throw new NoChangesError();
        }
        newStatus = "Pending Approval";
        newResubmitCount = (claim.resubmitCountMgr ?? 0) + 1;
        newStatusBadge = "PENDING_APPROVAL";
      } else if (claim.status === "Returned For Info") {
        newStatus = "Pending Approval";
        newStatusBadge = "PENDING_APPROVAL";
      } else {
        // Returned By Finance
        newStatus = "Accounting Review";
        newStatusBadge = "ACCOUNTING_REVIEW";
      }

      const nowIso = new Date().toISOString();

      const previousEvents: AuditEvent[] = (claim.auditEvents ?? []).map((e) =>
        e.isCurrent ? { ...e, isCurrent: false } : e
      );

      const newEvent: AuditEvent = {
        id: genId(),
        actor: "cardholder",
        actorName: user?.name,
        title: responseMessage ? "Resubmitted with response" : "Resubmitted",
        statusBadge: newStatusBadge,
        timestamp: nowIso,
        message: responseMessage,
        isCurrent: true,
      };

      // Single atomic mock-state mutation.
      updateClaim(claimId, {
        status: newStatus,
        cardholderNote: cardholderNote ?? claim.cardholderNote,
        resubmitCountMgr: newResubmitCount,
        returnedAt: undefined,
        returnedByUserId: undefined,
        returnMessage: undefined,
        returnSource: undefined,
        submittedDate: nowIso,
        auditEvents: [...previousEvents, newEvent],
      });

      // Optional symmetry call — mock endpoint is a no-op; ignore failures.
      try {
        await apiClient.post(`/claims/${claimId}/resubmit`, {
          responseMessage,
          newFileIds,
          cardholderNote,
        });
      } catch {
        // mock endpoint may not exist; ignore.
      }

      return newStatus;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cardholder-claims"] });
      queryClient.invalidateQueries({ queryKey: ["cardholder-claim-detail"] });
      queryClient.invalidateQueries({ queryKey: ["claim-documents"] });
      queryClient.invalidateQueries({ queryKey: ["corp-card-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["corp-card-transactions-stats"] });
    },
  });
}
