import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, MessageSquare, Eye } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useClaims } from "@/lib/claims-context";
import { formatBEDate } from "@/lib/utils";

export default function ApprovalInbox() {
  const navigate = useNavigate();
  const { claims } = useClaims();

  const pendingClaims = claims.filter((c) => c.status === "Pending Approval");
  const approvedThisMonth = claims.filter((c) => c.status === "Auto Approved").length;
  const totalPending = pendingClaims.reduce((s, c) => s + c.totalAmount, 0);

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

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim No.</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingClaims.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No pending approvals</TableCell></TableRow>
              ) : (
                pendingClaims.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.claimNo}</TableCell>
                    <TableCell>{a.requesterName}</TableCell>
                    <TableCell>{a.department}</TableCell>
                    <TableCell>{a.purpose}</TableCell>
                    <TableCell className="text-right font-medium">฿{a.totalAmount.toLocaleString()}</TableCell>
                    <TableCell>{formatBEDate(a.submittedDate)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/claims/${a.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
