import { BankStatementLine } from "@/lib/reconciliation-types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown } from "lucide-react";
import { useState } from "react";

interface Props {
  lines: BankStatementLine[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onRowClick: (line: BankStatementLine) => void;
  highlightIds?: Set<string>;
}

type SortKey = "transactionDate" | "amount";

export default function BankStatementTable({ lines, selectedId, onSelect, onRowClick, highlightIds }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("transactionDate");
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = [...lines].sort((a, b) => {
    const mul = sortAsc ? 1 : -1;
    if (sortKey === "transactionDate") return mul * a.transactionDate.localeCompare(b.transactionDate);
    return mul * (a.amount - b.amount);
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted/50 px-4 py-2 text-sm font-semibold text-foreground border-b flex items-center gap-2">
        ◀ Bank Statement Lines
        <Badge variant="secondary" className="ml-auto text-xs">{lines.length}</Badge>
      </div>
      <div className="overflow-auto max-h-[500px]">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="w-10"></TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort("transactionDate")}>
                <span className="flex items-center gap-1">Date <ArrowUpDown className="h-3 w-3" /></span>
              </TableHead>
              <TableHead>Merchant / Description</TableHead>
              <TableHead className="text-right cursor-pointer" onClick={() => toggleSort("amount")}>
                <span className="flex items-center justify-end gap-1">Amount <ArrowUpDown className="h-3 w-3" /></span>
              </TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Statement</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No bank statement lines</TableCell></TableRow>
            ) : sorted.map((line) => {
              const isSelected = selectedId === line.id;
              const isHighlighted = highlightIds?.has(line.id);
              return (
                <TableRow
                  key={line.id}
                  className={`cursor-pointer text-xs ${isSelected ? "bg-primary/10 ring-1 ring-primary/30" : isHighlighted ? "bg-green-50" : "hover:bg-muted/50"}`}
                  onClick={() => onRowClick(line)}
                >
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => onSelect(checked ? line.id : null)}
                    />
                  </TableCell>
                  <TableCell>{line.transactionDate}</TableCell>
                  <TableCell className="max-w-[180px] truncate" title={line.description}>{line.merchantName}</TableCell>
                  <TableCell className="text-right font-medium">฿{line.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground">{line.reference}</TableCell>
                  <TableCell className="text-muted-foreground">{line.statementId}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
