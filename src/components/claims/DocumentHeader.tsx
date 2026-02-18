import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";

export type AdvanceStatus = "Requester" | "Approver" | "Accounting" | "Completed" | "Rejected";

interface DocumentHeaderProps {
  advanceNo: string;
  glNo: string;
  status: AdvanceStatus;
  createDate: Date;
}

const statusColors: Record<AdvanceStatus, string> = {
  Requester: "bg-blue-100 text-blue-800 border-blue-200",
  Approver: "bg-amber-100 text-amber-800 border-amber-200",
  Accounting: "bg-purple-100 text-purple-800 border-purple-200",
  Completed: "bg-green-100 text-green-800 border-green-200",
  Rejected: "bg-red-100 text-red-800 border-red-200",
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
          <p className="font-semibold text-sm">{format(createDate, "dd/MM/yyyy HH:mm:ss")}</p>
        </div>
      </CardContent>
    </Card>
  );
}
