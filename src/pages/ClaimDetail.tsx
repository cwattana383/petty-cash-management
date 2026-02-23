import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Check, X, MessageSquare, Clock, CheckCircle, XCircle, AlertCircle, Send } from "lucide-react";
import { useClaims } from "@/lib/claims-context";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import DocumentHeader from "@/components/claims/DocumentHeader";

const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
  Draft: { color: "bg-muted text-muted-foreground", icon: Clock },
  "Pending Approval": { color: "bg-yellow-100 text-yellow-800", icon: Clock },
  Approved: { color: "bg-green-100 text-green-800", icon: CheckCircle },
  Rejected: { color: "bg-red-100 text-red-800", icon: XCircle },
  "Need Info": { color: "bg-blue-100 text-blue-800", icon: AlertCircle },
  Paid: { color: "bg-emerald-100 text-emerald-800", icon: CheckCircle },
  Reconciled: { color: "bg-purple-100 text-purple-800", icon: CheckCircle },
};

const actionConfig: Record<string, { color: string; icon: React.ElementType }> = {
  Pending: { color: "border-yellow-400 bg-yellow-50", icon: Clock },
  Approved: { color: "border-green-400 bg-green-50", icon: CheckCircle },
  Rejected: { color: "border-red-400 bg-red-50", icon: XCircle },
  "Request Info": { color: "border-blue-400 bg-blue-50", icon: AlertCircle },
  Delegated: { color: "border-purple-400 bg-purple-50", icon: Send },
};

export default function ClaimDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getClaimById, updateClaim } = useClaims();
  const { toast } = useToast();
  const claim = getClaimById(id || "");

  const [actionDialog, setActionDialog] = useState<{ open: boolean; type: "approve" | "reject" | "info" }>({ open: false, type: "approve" });
  const [comment, setComment] = useState("");

  if (!claim) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-muted-foreground">Claim not found</p>
        <Button variant="link" onClick={() => navigate("/claims")}>Back to claims</Button>
      </div>
    );
  }

  const sc = statusConfig[claim.status] || statusConfig.Draft;
  const StatusIcon = sc.icon;

  const handleAction = (type: "approve" | "reject" | "info") => {
    const newStatus = type === "approve" ? "Approved" : type === "reject" ? "Rejected" : "Need Info";
    const actionLabel = type === "approve" ? "Approved" : type === "reject" ? "Rejected" : "Request Info";

    updateClaim(claim.id, {
      status: newStatus,
      approvalHistory: claim.approvalHistory.map((s, i) =>
        i === claim.approvalHistory.length - 1
          ? { ...s, action: actionLabel as any, comment, actionDate: new Date().toISOString().slice(0, 10) }
          : s
      ),
      comments: comment
        ? [...claim.comments, { id: `cm-${Date.now()}`, userId: "u2", userName: "สมหญิง แก้วใส", text: comment, date: new Date().toISOString().slice(0, 10) }]
        : claim.comments,
    });

    toast({ title: `Claim ${actionLabel}`, description: `${claim.claimNo} has been ${actionLabel.toLowerCase()}` });
    setActionDialog({ open: false, type: "approve" });
    setComment("");
  };

  const isPendingApproval = claim.status === "Pending Approval";

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{claim.claimNo}</h1>
            <Badge className={sc.color}><StatusIcon className="h-3 w-3 mr-1" />{claim.status}</Badge>
          </div>
          <p className="text-muted-foreground">{claim.purpose}</p>
        </div>
        {isPendingApproval && (
          <div className="flex gap-2">
            <Button variant="outline" className="text-green-600 border-green-300 hover:bg-green-50" onClick={() => setActionDialog({ open: true, type: "approve" })}>
              <Check className="h-4 w-4 mr-1" />Approve
            </Button>
            <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => setActionDialog({ open: true, type: "reject" })}>
              <X className="h-4 w-4 mr-1" />Reject
            </Button>
            <Button variant="outline" onClick={() => setActionDialog({ open: true, type: "info" })}>
              <MessageSquare className="h-4 w-4 mr-1" />Request Info
            </Button>
          </div>
        )}
      </div>

      {/* Document Header */}
      <DocumentHeader
        advanceNo={claim.claimNo}
        glNo="-"
        status={claim.status === "Pending Approval" ? "Approver" : claim.status === "Approved" ? "Completed" : claim.status === "Rejected" ? "Rejected" : "Requester"}
        createDate={new Date(claim.createdDate)}
      />

      {/* Requester Information (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Requester Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label>Employee</Label>
              <Input value={claim.requesterName} disabled />
            </div>
            <div>
              <Label>Telephone</Label>
              <Input value="0657778899" disabled />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={`${claim.requesterName.split(" ")[0].toLowerCase()}@cpaxtra.co.th`} disabled />
            </div>
            <div>
              <Label>แผนก (Department)</Label>
              <Input value={claim.department} disabled />
            </div>
            <div>
              <Label>Division</Label>
              <Input value={claim.costCenter} disabled />
            </div>
            <div>
              <Label>สาขา (Branch)</Label>
              <Input value={claim.branch} disabled />
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Lines */}
      <Card>
        <CardHeader><CardTitle className="text-base">Expense Lines ({claim.lines.length})</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Invoice Date</TableHead>
                <TableHead>Invoice Number</TableHead>
                <TableHead>Attached File</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Supplier Name</TableHead>
                <TableHead>Account Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Expense Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>VAT Code</TableHead>
                <TableHead className="text-right">VAT Amount</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead>WHT Code</TableHead>
                <TableHead className="text-right">WHT Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claim.lines.map((l, i) => (
                <TableRow key={l.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{l.invoiceDate || "-"}</TableCell>
                  <TableCell>{l.taxInvoiceNo || "-"}</TableCell>
                  <TableCell>{l.attachmentUrl ? <a href={l.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">📎 ดูไฟล์</a> : <span className="text-muted-foreground">-</span>}</TableCell>
                  <TableCell>{l.paymentMethod || "-"}</TableCell>
                  <TableCell>{l.vendor || "-"}</TableCell>
                  <TableCell>{"-"}</TableCell>
                  <TableCell>{l.description}</TableCell>
                  <TableCell><Badge variant="outline">{l.expenseType}</Badge></TableCell>
                  <TableCell className="text-right font-medium">฿{l.amount.toLocaleString()}</TableCell>
                  <TableCell>{"-"}</TableCell>
                  <TableCell className="text-right">฿{l.vat.toLocaleString()}</TableCell>
                  <TableCell className="text-right">฿{(l.amount + l.vat).toLocaleString()}</TableCell>
                  <TableCell>{"-"}</TableCell>
                  <TableCell className="text-right">฿0</TableCell>
                  <TableCell>{"-"}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell colSpan={9} className="text-right">Total</TableCell>
                <TableCell className="text-right text-primary">฿{claim.totalAmount.toLocaleString()}</TableCell>
                <TableCell />
                <TableCell className="text-right">฿{claim.totalVat.toLocaleString()}</TableCell>
                <TableCell className="text-right">฿{(claim.totalAmount + claim.totalVat).toLocaleString()}</TableCell>
                <TableCell />
                <TableCell className="text-right">฿0</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Approval Timeline */}
      {claim.approvalHistory.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Approval Timeline</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {claim.approvalHistory.map((step, i) => {
                const ac = actionConfig[step.action] || actionConfig.Pending;
                const Icon = ac.icon;
                return (
                  <div key={i} className={`border-l-4 ${ac.color} p-4 rounded-r-lg`}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">Step {step.stepNo}: {step.approverName}</span>
                      <Badge variant="outline">{step.action}</Badge>
                      {step.actionDate && <span className="text-xs text-muted-foreground ml-auto">{step.actionDate}</span>}
                    </div>
                    {step.comment && <p className="text-sm text-muted-foreground mt-1">{step.comment}</p>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments */}
      {claim.comments.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Comments ({claim.comments.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {claim.comments.map((c) => (
              <div key={c.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{c.userName}</span>
                  <span className="text-xs text-muted-foreground">{c.date}</span>
                </div>
                <p className="text-sm mt-1">{c.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog((prev) => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === "approve" ? "Approve Claim" : actionDialog.type === "reject" ? "Reject Claim" : "Request More Information"}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder={actionDialog.type === "reject" ? "Reason for rejection (required)..." : "Add a comment (optional)..."}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionDialog({ open: false, type: "approve" }); setComment(""); }}>Cancel</Button>
            <Button
              onClick={() => handleAction(actionDialog.type)}
              disabled={actionDialog.type === "reject" && !comment.trim()}
              className={actionDialog.type === "approve" ? "bg-green-600 hover:bg-green-700" : actionDialog.type === "reject" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {actionDialog.type === "approve" ? "Approve" : actionDialog.type === "reject" ? "Reject" : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
