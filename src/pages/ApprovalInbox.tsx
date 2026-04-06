import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Paperclip } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatBEDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import {
  useApprovalInbox,
  useApprovalInboxStats,
  useApproveClaimInbox,
  useRejectClaimInbox,
  type ApprovalInboxClaim,
} from "@/hooks/use-approval-inbox";

function normalizeInboxStatus(s: string | undefined): string {
  if (!s?.trim()) return "";
  return s.trim().toUpperCase().replace(/[\s-]+/g, "_");
}

/** Finalized policy auto-approve must not stay in the approver queue (defensive if API still returns rows). */
function isAutoApprovedInboxClaim(claim: ApprovalInboxClaim): boolean {
  const n = normalizeInboxStatus(claim.status);
  const code = normalizeInboxStatus(claim.statusCode);
  if (n === "AUTO_APPROVED" || code === "AUTO_APPROVED") return true;
  // Human-readable claim status from cardholder API
  if (claim.status?.trim() === "Auto Approved") return true;
  // Some backends store final state as Manager Approved + policy rule on meta (same as Claim detail)
  const rule = claim.statusMeta?.autoApprovalRule;
  if (rule && n === "MANAGER_APPROVED") return true;
  return false;
}

function needsApproverAction(claim: ApprovalInboxClaim): boolean {
  return claim.status === "PENDING_APPROVAL";
}

function inboxActionsCell(
  claim: ApprovalInboxClaim,
  ctx: {
    approvePending: boolean;
    rejectPending: boolean;
    onApprove: () => void;
    onReject: () => void;
  }
): ReactNode {
  if (needsApproverAction(claim)) {
    return (
      <div className="flex items-center justify-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
          disabled={ctx.approvePending}
          onClick={(e) => {
            e.stopPropagation();
            ctx.onApprove();
          }}
          title="Approve"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive/80 hover:bg-red-50"
          disabled={ctx.rejectPending}
          onClick={(e) => {
            e.stopPropagation();
            ctx.onReject();
          }}
          title="Reject"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }
  return <span className="text-xs text-muted-foreground text-center block">—</span>;
}

export default function ApprovalInbox() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rejectDialog, setRejectDialog] = useState<{
    id: string;
    claimNo: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: inboxData, isLoading } = useApprovalInbox();
  const { data: stats } = useApprovalInboxStats();
  const approveMutation = useApproveClaimInbox();
  const rejectMutation = useRejectClaimInbox();

  const claims = (inboxData?.data ?? []).filter((c) => !isAutoApprovedInboxClaim(c));
  const actionableClaims = claims.filter((c) => needsApproverAction(c));

  const handleApprove = (id: string, claimNo: string) => {
    if (!user) return;
    approveMutation.mutate(
      { claimId: id, approverId: user.id, approverName: user.name },
      {
        onSuccess: () =>
          toast({
            title: "Approved",
            description: `${claimNo} has been approved.`,
          }),
        onError: (err) =>
          toast({
            title: "Unable to approve",
            description: err.message,
            variant: "destructive",
          }),
      },
    );
  };

  const handleRejectClick = (id: string, claimNo: string) => {
    setRejectDialog({ id, claimNo });
    setRejectReason("");
  };

  const handleConfirmReject = () => {
    if (!rejectDialog || !user) return;
    rejectMutation.mutate(
      {
        claimId: rejectDialog.id,
        approverId: user.id,
        approverName: user.name,
        comment: rejectReason,
      },
      {
        onSuccess: () => {
          toast({
            title: "Rejected",
            description: `${rejectDialog.claimNo} has been rejected.`,
            variant: "destructive",
          });
          setRejectDialog(null);
          setRejectReason("");
        },
      },
    );
  };

  const toggleSelect = (id: string) => {
    const claim = claims.find((c) => c.id === id);
    if (!claim || !needsApproverAction(claim)) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const ids = actionableClaims.map((c) => c.id);
    if (ids.length === 0) return;
    const allSelected = ids.length > 0 && ids.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(ids));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Approval Inbox</h1>
        <p className="text-muted-foreground">
          Claims that need your approve or reject action. Policy auto outcomes are applied in the
          background and do not appear here.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">
              {stats?.pendingCount ?? 0}
            </p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">
              {stats?.approvedThisMonth ?? 0}
            </p>
            <p className="text-sm text-muted-foreground">Approved This Month</p>
            <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
              Manager approvals recorded this month (policy auto-finalize audit steps excluded).
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">
              ฿
              {(stats?.totalPendingAmount ?? 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="text-sm text-muted-foreground">
              Total Pending Amount
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
          <span className="text-sm font-medium">
            {selectedIds.size} selected
          </span>
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white gap-1"
            disabled={approveMutation.isPending}
            onClick={() => {
              if (!user) return;
              const selected = claims.filter((c) => selectedIds.has(c.id) && needsApproverAction(c));
              Promise.all(
                selected.map((c) =>
                  approveMutation.mutateAsync({
                    claimId: c.id,
                    approverId: user.id,
                    approverName: user.name,
                  }),
                ),
              ).then(() => {
                toast({
                  title: "Approved",
                  description: `${selected.length} claim(s) approved.`,
                });
                setSelectedIds(new Set());
              });
            }}
          >
            <Check className="h-4 w-4" /> Approve Selected
          </Button>
        </div>
      )}

      {/* Claims Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={
                      actionableClaims.length > 0 &&
                      actionableClaims.every((c) => selectedIds.has(c.id))
                    }
                    onCheckedChange={toggleAll}
                    disabled={actionableClaims.length === 0}
                  />
                </TableHead>
                <TableHead>Transaction No.</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Attached File</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center text-muted-foreground py-8"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : claims.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center text-muted-foreground py-8"
                  >
                    No pending approvals at this time
                  </TableCell>
                </TableRow>
              ) : (
                claims.map((claim) => (
                  <TableRow
                    key={claim.id}
                    className={`cursor-pointer hover:bg-muted/30 ${selectedIds.has(claim.id) ? "bg-muted/50" : ""}`}
                    onClick={() => navigate(`/claims/${claim.id}?mode=approve`)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(claim.id)}
                        onCheckedChange={() => toggleSelect(claim.id)}
                        disabled={!needsApproverAction(claim)}
                        aria-label="Select for bulk approve"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {claim.claimNo}
                    </TableCell>
                    <TableCell>{claim.requesterName}</TableCell>
                    <TableCell>{claim.department}</TableCell>
                    <TableCell>{claim.purpose}</TableCell>
                    <TableCell className="text-right font-medium">
                      ฿
                      {Number(claim.totalAmount).toLocaleString("en-US", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </TableCell>
                    <TableCell>
                      {formatBEDate(claim.submittedDate ?? claim.createdDate)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {(claim.documents ?? []).length > 0 ? (
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Paperclip className="h-3.5 w-3.5" />
                          {(claim.documents ?? []).length}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {inboxActionsCell(claim, {
                        approvePending: approveMutation.isPending,
                        rejectPending: rejectMutation.isPending,
                        onApprove: () => handleApprove(claim.id, claim.claimNo),
                        onReject: () => handleRejectClick(claim.id, claim.claimNo),
                      })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog
        open={!!rejectDialog}
        onOpenChange={(v) => !v && setRejectDialog(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <X className="h-5 w-5" />
              Reject Claim — {rejectDialog?.claimNo}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Please provide a reason for rejecting this claim.
            </p>
            <Textarea
              placeholder="Enter rejection reason or comment..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setRejectDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={rejectMutation.isPending}
              onClick={handleConfirmReject}
            >
              Confirm Reject
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
