import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { BankStatementLine, SystemTransaction, ReconciliationLink } from "@/lib/reconciliation-types";
import { formatBEDate, formatBEDateTime } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  bankLine?: BankStatementLine | null;
  systemTxn?: SystemTransaction | null;
  link?: ReconciliationLink | null;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h4>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value ?? "—"}</span>
    </div>
  );
}

export default function ReconciliationDetailDrawer({ open, onClose, bankLine, systemTxn, link }: Props) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-[420px] sm:w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Reconciliation Detail</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-5">
          {bankLine && (
            <Section title="Bank Statement Line">
              <Row label="Statement ID" value={bankLine.statementId} />
              <Row label="Transaction Date" value={formatBEDate(bankLine.transactionDate)} />
              <Row label="Posting Date" value={formatBEDate(bankLine.postingDate)} />
              <Row label="Merchant" value={bankLine.merchantName} />
              <Row label="Description" value={bankLine.description} />
              <Row label="Amount" value={`฿${bankLine.amount.toLocaleString()}`} />
              <Row label="Reference" value={bankLine.reference} />
              <Row label="Auth Code" value={bankLine.authorizationCode} />
              <Row label="MCC" value={bankLine.mcc} />
              <Row label="Status" />
              <Badge className={bankLine.reconciliationStatus === "Matched" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                {bankLine.reconciliationStatus}
              </Badge>
            </Section>
          )}

          {bankLine && systemTxn && <Separator />}

          {systemTxn && (
            <Section title="System Transaction">
              <Row label="ID" value={systemTxn.claimId || systemTxn.id} />
              <Row label="Type" value={systemTxn.type} />
              <Row label="Date" value={formatBEDate(systemTxn.transactionDate)} />
              <Row label="Merchant" value={systemTxn.merchantName} />
              <Row label="Purpose" value={systemTxn.purpose} />
              <Row label="Amount" value={`฿${systemTxn.amount.toLocaleString()}`} />
              <Row label="Category" value={systemTxn.expenseCategory} />
              <Row label="Approval Status" />
              <Badge className={
                systemTxn.status === "Approved" ? "bg-green-100 text-green-800" :
                systemTxn.status === "Rejected" ? "bg-red-100 text-red-800" :
                "bg-yellow-100 text-yellow-800"
              }>
                {systemTxn.status}
              </Badge>
              {systemTxn.invoiceValidationStatus && (
                <Row label="Invoice Validation" value={systemTxn.invoiceValidationStatus} />
              )}
            </Section>
          )}

          {link && (
            <>
              <Separator />
              <Section title="Audit Trail">
                <Row label="Matched By" value={link.matchedBy} />
                <Row label="Matched At" value={formatBEDateTime(link.matchedAt)} />
                <Row label="Variance" value={`฿${link.varianceAmount.toLocaleString()}`} />
                <Row label="Status" />
                <Badge className="bg-green-100 text-green-800">{link.status}</Badge>
              </Section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
