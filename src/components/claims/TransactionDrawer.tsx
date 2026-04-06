import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UnifiedExpenseItem } from "@/lib/unified-expenses";
import { CreditCard, Calendar, Building, Hash, DollarSign, FileCheck } from "lucide-react";

interface Props {
  item: UnifiedExpenseItem | null;
  open: boolean;
  onClose: () => void;
}

export default function TransactionDrawer({ item, open, onClose }: Props) {
  if (!item) return null;

  const txn = undefined;
  const rec = undefined;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Transaction Details</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Bank Transaction Info */}
          {txn && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Bank Transaction</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2"><Hash className="h-4 w-4 text-muted-foreground" /> <span className="text-muted-foreground">Transaction ID</span></div>
                <div className="font-medium">{txn.id}</div>

                <div className="flex items-center gap-2"><Building className="h-4 w-4 text-muted-foreground" /> <span className="text-muted-foreground">Merchant</span></div>
                <div className="font-medium">{txn.merchant_name}</div>

                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /> <span className="text-muted-foreground">Transaction Date</span></div>
                <div className="font-medium">{txn.transaction_date}</div>

                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /> <span className="text-muted-foreground">Posting Date</span></div>
                <div className="font-medium">{txn.posting_date}</div>

                <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-muted-foreground" /> <span className="text-muted-foreground">Amount</span></div>
                <div className="font-medium">฿{txn.amount.toLocaleString()}</div>

                <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-muted-foreground" /> <span className="text-muted-foreground">Card</span></div>
                <div className="font-medium">xxxx-{txn.card_last4}</div>

                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /> <span className="text-muted-foreground">Billing Cycle</span></div>
                <div className="font-medium">{txn.billing_cycle}</div>
              </div>
            </div>
          )}

          <Separator />

          {/* Linked Claim */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Linked Claim</h3>
            {item.claim_id ? (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-muted-foreground">Claim ID</div>
                <div className="font-medium">{item.claim_id}</div>
                <div className="text-muted-foreground">Purpose</div>
                <div className="font-medium">{item.purpose}</div>
                <div className="text-muted-foreground">Status</div>
                <div><Badge variant="outline">{item.status}</Badge></div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No claim linked to this transaction.</p>
            )}
          </div>

          <Separator />

          {/* Reconciliation */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2"><FileCheck className="h-4 w-4" /> Reconciliation</h3>
            {rec ? (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-muted-foreground">Match Status</div>
                <div><Badge variant="outline" className="border-green-300 bg-green-50 text-green-700">{rec.match_status}</Badge></div>
                <div className="text-muted-foreground">Variance</div>
                <div className="font-medium">฿{rec.variance_amount.toLocaleString()}</div>
                <div className="text-muted-foreground">Reconciled At</div>
                <div className="font-medium">{rec.reconciled_at || "—"}</div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Not yet reconciled.</p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
