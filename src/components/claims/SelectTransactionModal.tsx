import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CreditCard } from "lucide-react";
interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (txnId: string) => void;
}

export default function SelectTransactionModal({ open, onClose, onSelect }: Props) {
  const pending: never[] = [];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Select Corporate Card Transaction</DialogTitle>
        </DialogHeader>
        <div className="rounded-md border max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Merchant</TableHead>
                <TableHead>Card</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No pending transactions</TableCell></TableRow>
              ) : (
                pending.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium text-sm">{t.id}</TableCell>
                    <TableCell className="text-sm">{t.transaction_date}</TableCell>
                    <TableCell className="text-sm">{t.merchant_name}</TableCell>
                    <TableCell className="text-sm">xxxx-{t.card_last4}</TableCell>
                    <TableCell className="text-right text-sm font-medium">฿{t.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => onSelect(t.id)}>Select</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
