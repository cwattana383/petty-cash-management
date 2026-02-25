import { SystemTransaction } from "@/lib/reconciliation-types";
import { formatBEDate } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";

const statusColors: Record<string, string> = {
  "Pending Invoice": "bg-orange-100 text-orange-800",
  "Pending Submit": "bg-orange-100 text-orange-800",
  "Pending Approval": "bg-yellow-100 text-yellow-800",
  "Auto Approved": "bg-green-100 text-green-800",
  "Final Rejected": "bg-red-100 text-red-800",
  "Reimbursed": "bg-emerald-100 text-emerald-800",
};

interface Props {
  transactions: SystemTransaction[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onRowClick: (txn: SystemTransaction) => void;
  highlightIds?: Set<string>;
}

export default function SystemTransactionTable({ transactions, selectedId, onSelect, onRowClick, highlightIds }: Props) {
  const navigate = useNavigate();

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted/50 px-4 py-2 text-sm font-semibold text-foreground border-b flex items-center gap-2">
        System Transactions ▶
        <Badge variant="secondary" className="ml-auto text-xs">{transactions.length}</Badge>
      </div>
      <div className="overflow-auto max-h-[500px]">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="w-10"></TableHead>
              
              <TableHead>Date</TableHead>
              <TableHead>Merchant / Vendor</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No system transactions</TableCell></TableRow>
            ) : transactions.map((txn) => {
              const isSelected = selectedId === txn.id;
              const isHighlighted = highlightIds?.has(txn.id);
              return (
                <TableRow
                  key={txn.id}
                  className={`cursor-pointer text-xs ${isSelected ? "bg-primary/10 ring-1 ring-primary/30" : isHighlighted ? "bg-green-50" : "hover:bg-muted/50"}`}
                  onClick={() => onRowClick(txn)}
                >
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => onSelect(checked ? txn.id : null)}
                    />
                  </TableCell>
                  
                  <TableCell>{formatBEDate(txn.transactionDate)}</TableCell>
                  <TableCell className="max-w-[150px] truncate">{txn.merchantName}</TableCell>
                  <TableCell className="max-w-[150px] truncate text-muted-foreground">{txn.purpose}</TableCell>
                  <TableCell className="text-right font-medium">฿{txn.amount.toLocaleString()}</TableCell>
                  <TableCell>{txn.source}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
