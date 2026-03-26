import { ReconciliationLink, BankStatementLine, SystemTransaction } from "@/lib/reconciliation-types";
import { formatBEDate, formatBEDateTime } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Unlink } from "lucide-react";

interface Props {
  links: ReconciliationLink[];
  bankLines: BankStatementLine[];
  systemTxns: SystemTransaction[];
  onViewPair: (link: ReconciliationLink) => void;
  onUnmatch: (link: ReconciliationLink) => void;
}

export default function MatchedPairsTable({ links, bankLines, systemTxns, onViewPair, onUnmatch }: Props) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted/50 px-4 py-2 text-sm font-semibold text-foreground border-b">
        Matched Pairs
        <Badge variant="secondary" className="ml-2 text-xs">{links.length}</Badge>
      </div>
      <div className="overflow-auto max-h-[500px]">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead>Bank Line</TableHead>
              <TableHead>Bank Date</TableHead>
              <TableHead>Bank Amount</TableHead>
              <TableHead>↔</TableHead>
              <TableHead>System Txn</TableHead>
              <TableHead>Sys Date</TableHead>
              <TableHead>Sys Amount</TableHead>
              <TableHead>Variance</TableHead>
              <TableHead>Matched By</TableHead>
              <TableHead>Matched At</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {links.length === 0 ? (
              <TableRow><TableCell colSpan={11} className="text-center text-muted-foreground py-6">No matched pairs</TableCell></TableRow>
            ) : links.map((link) => {
              const bank = bankLines.find((b) => b.id === link.bankStatementLineId);
              const sys = systemTxns.find((s) => s.id === link.systemTransactionId);
              return (
                <TableRow key={link.id} className="text-xs hover:bg-muted/50">
                  <TableCell className="font-medium">{bank?.merchantName || link.bankStatementLineId}</TableCell>
                  <TableCell>{formatBEDate(bank?.transactionDate)}</TableCell>
                  <TableCell className="font-medium">฿{bank?.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-center text-green-600 font-bold">⇄</TableCell>
                  <TableCell className="font-medium">{sys?.merchantName || link.systemTransactionId}</TableCell>
                  <TableCell>{formatBEDate(sys?.transactionDate)}</TableCell>
                  <TableCell className="font-medium">฿{sys?.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={link.varianceAmount === 0 ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>
                      ฿{link.varianceAmount.toLocaleString()}
                    </Badge>
                  </TableCell>
                  <TableCell>{link.matchedBy}</TableCell>
                  <TableCell>{formatBEDateTime(link.matchedAt)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => onViewPair(link)}>
                        <Eye className="h-3 w-3 mr-1" />Detail
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-destructive hover:text-destructive" onClick={() => onUnmatch(link)}>
                        <Unlink className="h-3 w-3 mr-1" />Unmatch
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
