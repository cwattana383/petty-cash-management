import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, FileText, Paperclip } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useClaims } from "@/lib/claims-context";
import { formatBEDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ApprovalInbox() {
  const navigate = useNavigate();
  const { claims, updateClaim } = useClaims();
  const { toast } = useToast();
  const [previewFile, setPreviewFile] = useState<{ name: string; url: string } | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ id: string; claimNo: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchRejectDialog, setBatchRejectDialog] = useState(false);
  const [batchRejectReason, setBatchRejectReason] = useState("");

  const pendingClaims = claims.filter((c) => c.status === "Pending Approval");
  const approvedThisMonth = claims.filter((c) => c.status === "Auto Approved").length;
  const totalPending = pendingClaims.reduce((s, c) => s + c.totalAmount, 0);

  const handleApprove = (id: string, claimNo: string) => {
    updateClaim(id, { status: "Auto Approved" });
    toast({ title: "Approved", description: `${claimNo} has been approved.` });
  };

  const handleRejectClick = (id: string, claimNo: string) => {
    setRejectDialog({ id, claimNo });
    setRejectReason("");
  };

  const handleConfirmReject = () => {
    if (!rejectDialog) return;
    updateClaim(rejectDialog.id, { status: "Final Rejected" });
    toast({ title: "Rejected", description: `${rejectDialog.claimNo} has been rejected. Reason: ${rejectReason || "No reason provided"}`, variant: "destructive" });
    setRejectDialog(null);
    setRejectReason("");
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === pendingClaims.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingClaims.map((c) => c.id)));
    }
  };

  const handleBatchApprove = () => {
    const selected = pendingClaims.filter((c) => selectedIds.has(c.id));
    selected.forEach((c) => updateClaim(c.id, { status: "Auto Approved" }));
    toast({ title: "Approved", description: `${selected.length} claim(s) have been approved.` });
    setSelectedIds(new Set());
  };

  const handleBatchRejectClick = () => {
    setBatchRejectDialog(true);
    setBatchRejectReason("");
  };

  const handleConfirmBatchReject = () => {
    const selected = pendingClaims.filter((c) => selectedIds.has(c.id));
    selected.forEach((c) => updateClaim(c.id, { status: "Final Rejected" }));
    toast({ title: "Rejected", description: `${selected.length} claim(s) have been rejected. Reason: ${batchRejectReason || "No reason provided"}`, variant: "destructive" });
    setSelectedIds(new Set());
    setBatchRejectDialog(false);
    setBatchRejectReason("");
  };

  // Mock attached file per claim
  const getAttachedFile = (claimNo: string) => {
    const mockFiles: Record<string, { name: string; url: string }> = {
      "TXN20250128001": { name: "receipt_taxi.pdf", url: "#" },
      "TXN20250128002": { name: "invoice_dinner.pdf", url: "#" },
      "TXN20250127001": { name: "boarding_pass.pdf", url: "#" },
      "TXN20250127002": { name: "hotel_receipt.jpg", url: "#" },
      "TXN20250126001": { name: "supplies_receipt.pdf", url: "#" },
    };
    return mockFiles[claimNo] || null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Approval Inbox</h1>
        <p className="text-muted-foreground">Review and approve expense claims</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">{pendingClaims.length}</p><p className="text-sm text-muted-foreground">Pending</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-foreground">{approvedThisMonth}</p><p className="text-sm text-muted-foreground">Approved This Month</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-foreground">฿{totalPending.toLocaleString()}</p><p className="text-sm text-muted-foreground">Total Pending Amount</p></CardContent></Card>
      </div>

      {/* Batch Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1" onClick={handleBatchApprove}>
            <Check className="h-4 w-4" /> Approve Selected
          </Button>
          <Button size="sm" variant="destructive" className="gap-1" onClick={handleBatchRejectClick}>
            <X className="h-4 w-4" /> Reject Selected
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={pendingClaims.length > 0 && selectedIds.size === pendingClaims.length}
                    onCheckedChange={toggleAll}
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
              {pendingClaims.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No pending approvals</TableCell></TableRow>
              ) : (
                pendingClaims.map((a) => {
                  const file = getAttachedFile(a.claimNo);
                  return (
                    <TableRow key={a.id} className={selectedIds.has(a.id) ? "bg-muted/50" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(a.id)}
                          onCheckedChange={() => toggleSelect(a.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{a.claimNo}</TableCell>
                      <TableCell>{a.requesterName}</TableCell>
                      <TableCell>{a.department}</TableCell>
                      <TableCell>{a.purpose}</TableCell>
                      <TableCell className="text-right font-medium">฿{a.totalAmount.toLocaleString()}</TableCell>
                      <TableCell>{formatBEDate(a.submittedDate)}</TableCell>
                      <TableCell>
                        {file ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:text-primary/80 gap-1.5 px-2"
                            onClick={() => setPreviewFile(file)}
                          >
                            <Paperclip className="h-3.5 w-3.5" />
                            <span className="text-xs">{file.name}</span>
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleApprove(a.id, a.claimNo)}
                            title="Approve"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive/80 hover:bg-red-50"
                            onClick={() => handleRejectClick(a.id, a.claimNo)}
                            title="Reject"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reject Reason Dialog (single) */}
      <Dialog open={!!rejectDialog} onOpenChange={(v) => !v && setRejectDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <X className="h-5 w-5" />
              Reject Claim — {rejectDialog?.claimNo}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Please provide a reason for rejecting this claim.</p>
            <Textarea
              placeholder="Enter rejection reason or comment..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setRejectDialog(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmReject}>Confirm Reject</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Batch Reject Reason Dialog */}
      <Dialog open={batchRejectDialog} onOpenChange={(v) => !v && setBatchRejectDialog(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <X className="h-5 w-5" />
              Reject {selectedIds.size} Claim(s)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Please provide a reason for rejecting the selected claims.</p>
            <Textarea
              placeholder="Enter rejection reason or comment..."
              value={batchRejectReason}
              onChange={(e) => setBatchRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setBatchRejectDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmBatchReject}>Confirm Reject</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* File Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={(v) => !v && setPreviewFile(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Attached Document
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-muted/50 rounded-lg p-6 flex flex-col items-center gap-3">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm font-medium">{previewFile?.name}</p>
              <p className="text-xs text-muted-foreground">Click below to download the document</p>
              <Button size="sm" variant="outline">
                Download File
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}