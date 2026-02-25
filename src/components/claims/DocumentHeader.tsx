import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatBEDateTime } from "@/lib/utils";

export type AdvanceStatus = "Pending Invoice" | "Pending Approval" | "Final Rejected" | "Auto Approved" | "Reimbursed";

interface DocumentHeaderProps {
  advanceNo: string;
  glNo: string;
  status: AdvanceStatus;
  createDate: Date;
}

const statusColors: Record<AdvanceStatus, string> = {
  "Pending Invoice": "bg-orange-100 text-orange-800 border-orange-200",
  "Pending Approval": "bg-amber-100 text-amber-800 border-amber-200",
  "Auto Approved": "bg-green-100 text-green-800 border-green-200",
  "Reimbursed": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Final Rejected": "bg-red-100 text-red-800 border-red-200",
};

export default function DocumentHeader({ advanceNo, glNo, status, createDate }: DocumentHeaderProps) {
  return (
    <Card>
      <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Expense No</p>
          <p className="font-semibold text-sm">{advanceNo}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Status</p>
          <Badge variant="outline" className={statusColors[status]}>
            {status}
          </Badge>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Create Date</p>
          <p className="font-semibold text-sm">{formatBEDateTime(createDate)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
