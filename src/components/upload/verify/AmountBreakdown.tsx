import { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, DollarSign } from "lucide-react";

export interface AmountData {
  subtotal: number;
  vatRate: string;
  vatAmount: number;
  whtAmount: number;
  grandTotal: number;
}

interface Props {
  data: AmountData;
  onChange: (d: AmountData) => void;
}

export default function AmountBreakdown({ data, onChange }: Props) {
  const set = (key: keyof AmountData, val: number | string) => {
    const next = { ...data, [key]: val };

    // Auto-calculate VAT if rate is 7%
    if (key === "subtotal" || key === "vatRate") {
      const sub = key === "subtotal" ? (val as number) : next.subtotal;
      const rate = key === "vatRate" ? (val as string) : next.vatRate;
      if (rate === "7") {
        next.vatAmount = Math.round(sub * 0.07 * 100) / 100;
      }
      if (rate === "0" || rate === "Exempt" || rate === "Non-VAT") {
        next.vatAmount = 0;
      }
      next.subtotal = sub;
      next.vatRate = rate as string;
    }

    // Recalculate grand total
    next.grandTotal = Math.round(((next.subtotal || 0) + (next.vatAmount || 0) - (next.whtAmount || 0)) * 100) / 100;
    onChange(next);
  };

  // Balance check
  const expectedVat = data.vatRate === "7" ? Math.round(data.subtotal * 0.07 * 100) / 100 : null;
  const vatMismatch = expectedVat !== null && Math.abs(data.vatAmount - expectedVat) > 0.01;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <DollarSign className="h-4 w-4" /> Amount Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Subtotal */}
        <div>
          <Label className="text-xs text-muted-foreground">Subtotal</Label>
          <Input
            type="number"
            value={data.subtotal || ""}
            onChange={(e) => set("subtotal", parseFloat(e.target.value) || 0)}
            className="h-8 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* VAT Rate */}
          <div>
            <Label className="text-xs text-muted-foreground">VAT Rate</Label>
            <Select value={data.vatRate} onValueChange={(v) => set("vatRate", v)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7%</SelectItem>
                <SelectItem value="0">0%</SelectItem>
                <SelectItem value="Exempt">Exempt</SelectItem>
                <SelectItem value="Non-VAT">Non-VAT</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* VAT Amount */}
          <div>
            <Label className="text-xs text-muted-foreground">VAT Amount</Label>
            <Input
              type="number"
              value={data.vatAmount || ""}
              onChange={(e) => {
                const next = { ...data, vatAmount: parseFloat(e.target.value) || 0 };
                next.grandTotal = Math.round((next.subtotal + next.vatAmount - next.whtAmount) * 100) / 100;
                onChange(next);
              }}
              className={`h-8 text-sm ${vatMismatch ? "border-yellow-400 bg-yellow-50" : ""}`}
            />
            {vatMismatch && (
              <p className="text-xs text-yellow-600 flex items-center gap-1 mt-0.5">
                <AlertTriangle className="h-3 w-3" /> Expected: {expectedVat?.toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* WHT */}
        <div>
          <Label className="text-xs text-muted-foreground">Withholding Tax</Label>
          <Input
            type="number"
            value={data.whtAmount || ""}
            onChange={(e) => set("whtAmount", parseFloat(e.target.value) || 0)}
            className="h-8 text-sm"
          />
        </div>

        {/* Grand Total */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Grand Total</Label>
            <span className="text-lg font-bold text-primary">
              {data.grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
