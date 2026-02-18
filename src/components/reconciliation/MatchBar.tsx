import { Button } from "@/components/ui/button";
import { AlertTriangle, Link2, X } from "lucide-react";
import { BankStatementLine, SystemTransaction } from "@/lib/reconciliation-types";

interface Props {
  bankLine: BankStatementLine | null;
  systemTxn: SystemTransaction | null;
  onMatch: () => void;
  onClear: () => void;
  warning: string | null;
}

export default function MatchBar({ bankLine, systemTxn, onMatch, onClear, warning }: Props) {
  if (!bankLine && !systemTxn) return null;

  const bothSelected = !!bankLine && !!systemTxn;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-card border-2 border-primary/30 rounded-xl shadow-xl px-6 py-3 flex items-center gap-4 max-w-2xl">
      <div className="flex-1 text-sm">
        <div className="flex items-center gap-3">
          <div className="text-xs">
            <span className="font-medium text-muted-foreground">Bank:</span>{" "}
            {bankLine ? (
              <span className="font-semibold">{bankLine.merchantName} — ฿{bankLine.amount.toLocaleString()}</span>
            ) : (
              <span className="text-muted-foreground italic">Select a bank line</span>
            )}
          </div>
          <Link2 className="h-4 w-4 text-muted-foreground" />
          <div className="text-xs">
            <span className="font-medium text-muted-foreground">System:</span>{" "}
            {systemTxn ? (
              <span className="font-semibold">{systemTxn.merchantName} — ฿{systemTxn.amount.toLocaleString()}</span>
            ) : (
              <span className="text-muted-foreground italic">Select a system txn</span>
            )}
          </div>
        </div>
        {warning && (
          <div className="flex items-center gap-1 mt-1 text-xs text-orange-600">
            <AlertTriangle className="h-3 w-3" />{warning}
          </div>
        )}
      </div>
      <Button size="sm" disabled={!bothSelected} onClick={onMatch}>
        <Link2 className="h-4 w-4 mr-1" />Match
      </Button>
      <Button size="sm" variant="ghost" onClick={onClear}>
        <X className="h-4 w-4 mr-1" />Clear
      </Button>
    </div>
  );
}
