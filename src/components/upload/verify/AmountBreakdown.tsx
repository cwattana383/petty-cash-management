import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, FileText } from "lucide-react";
import { useState } from "react";

export interface AmountData {
  description: string;
  subtotal: number;
  subtotalConf: number;
  totalAmount: string;
  totalAmountConf: number;
  vatRate: string;
  vatAmount: number;
  vatAmountConf: number;
  whtCode: string;
  whtAmount: number;
  whtAmountConf: number;
  grandTotal: number;
}

interface Props {
  data: AmountData;
  onChange: (d: AmountData) => void;
}

function confidenceBadge(c: number) {
  const color = c >= 90 ? "bg-green-100 text-green-700" : c >= 80 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700";
  return <span className={`text-xs font-medium px-2 py-0.5 rounded ${color}`}>{c.toFixed(2)}%</span>;
}

function formatNumber(val: number): string {
  return val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseFormattedNumber(val: string): number {
  return parseFloat(val.replace(/,/g, "")) || 0;
}

const VAT_RATE_OPTIONS = [
  { value: "AVG", label: "AVG" },
  { value: "Claim 100%", label: "Claim 100%" },
  { value: "No VAT", label: "No VAT" },
  { value: "Unclaim 100%", label: "Unclaim 100%" },
];

const WHT_CODE_OPTIONS = [
  { value: "none", label: "None" },
  { value: "Advertising 3", label: "Advertising 3" },
  { value: "Advertising 53", label: "Advertising 53" },
  { value: "Delivery 3", label: "Delivery 3" },
  { value: "Delivery 53", label: "Delivery 53" },
  { value: "Rental/Prize 3", label: "Rental/Prize 3" },
  { value: "Rental/Prize 53", label: "Rental/Prize 53" },
  { value: "Service (1.5) 3", label: "Service (1.5) 3" },
  { value: "Service (1.5) 53", label: "Service (1.5) 53" },
  { value: "Service 3", label: "Service 3" },
  { value: "Service 53", label: "Service 53" },
];

export default function AmountBreakdown({ data, onChange }: Props) {
  const [subtotalDisplay, setSubtotalDisplay] = useState(data.subtotal ? formatNumber(data.subtotal) : "");
  const [vatDisplay, setVatDisplay] = useState(data.vatAmount ? formatNumber(data.vatAmount) : "");
  const [whtDisplay, setWhtDisplay] = useState(data.whtAmount ? formatNumber(data.whtAmount) : "");

  const set = (key: keyof AmountData, val: number | string) => {
    const next = { ...data, [key]: val };

    if (key === "subtotal" || key === "vatRate") {
      const sub = key === "subtotal" ? (val as number) : next.subtotal;
      const rate = key === "vatRate" ? (val as string) : next.vatRate;

      // VAT calculation based on rate
      if (rate === "AVG" || rate === "Claim 100%") {
        next.vatAmount = Math.round(sub * 0.07 * 100) / 100;
        setVatDisplay(formatNumber(next.vatAmount));
      } else if (rate === "No VAT" || rate === "Unclaim 100%") {
        next.vatAmount = 0;
        setVatDisplay("0.00");
      }
      next.subtotal = sub;
      next.vatRate = rate as string;
    }

    next.grandTotal = Math.round(((next.subtotal || 0) + (next.vatAmount || 0) - (next.whtAmount || 0)) * 100) / 100;
    onChange(next);
  };

  const expectedVat = (data.vatRate === "AVG" || data.vatRate === "Claim 100%") ? Math.round(data.subtotal * 0.07 * 100) / 100 : null;
  const vatMismatch = expectedVat !== null && Math.abs(data.vatAmount - expectedVat) > 0.01;

  // Sync display values when data changes externally (e.g. OCR init)
  const syncDisplayIfNeeded = () => {
    if (data.subtotal && subtotalDisplay === "") setSubtotalDisplay(formatNumber(data.subtotal));
    if (data.vatAmount && vatDisplay === "") setVatDisplay(formatNumber(data.vatAmount));
    if (data.whtAmount && whtDisplay === "") setWhtDisplay(formatNumber(data.whtAmount));
  };
  syncDisplayIfNeeded();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4" /> Document Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Description */}
        <div>
          <Label className="text-xs text-muted-foreground">Description</Label>
          <Input
            value={data.description || ""}
            onChange={(e) => onChange({ ...data, description: e.target.value })}
            className="h-8 text-sm"
            placeholder="Enter description"
          />
        </div>

        {/* Subtotal Amount */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-xs text-muted-foreground">Subtotal Amount</Label>
            {confidenceBadge(data.subtotalConf)}
          </div>
          <Input
            value={subtotalDisplay}
            onChange={(e) => {
              setSubtotalDisplay(e.target.value);
              const num = parseFormattedNumber(e.target.value);
              set("subtotal", num);
            }}
            onBlur={() => setSubtotalDisplay(formatNumber(data.subtotal))}
            className={`h-8 text-sm ${data.subtotalConf < 80 ? "border-yellow-400 bg-yellow-50" : ""}`}
          />
        </div>

        {/* Total Amount */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-xs text-muted-foreground">Total Amount</Label>
            {confidenceBadge(data.totalAmountConf)}
          </div>
          <Input
            value={data.totalAmount || ""}
            onChange={(e) => onChange({ ...data, totalAmount: e.target.value })}
            className={`h-8 text-sm ${data.totalAmountConf < 80 ? "border-yellow-400 bg-yellow-50" : ""}`}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* VAT Rate */}
          <div>
            <Label className="text-xs text-muted-foreground">VAT Rate</Label>
            <Select value={data.vatRate} onValueChange={(v) => set("vatRate", v)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {VAT_RATE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* VAT Amount */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs text-muted-foreground">VAT Amount</Label>
              {confidenceBadge(data.vatAmountConf)}
            </div>
            <Input
              value={vatDisplay}
              onChange={(e) => {
                setVatDisplay(e.target.value);
                const num = parseFormattedNumber(e.target.value);
                const next = { ...data, vatAmount: num };
                next.grandTotal = Math.round((next.subtotal + next.vatAmount - next.whtAmount) * 100) / 100;
                onChange(next);
              }}
              onBlur={() => setVatDisplay(formatNumber(data.vatAmount))}
              className={`h-8 text-sm ${vatMismatch ? "border-yellow-400 bg-yellow-50" : ""} ${data.vatAmountConf < 80 ? "border-yellow-400 bg-yellow-50" : ""}`}
            />
            {vatMismatch && (
              <p className="text-xs text-yellow-600 flex items-center gap-1 mt-0.5">
                <AlertTriangle className="h-3 w-3" /> Expected: {formatNumber(expectedVat!)}
              </p>
            )}
          </div>
        </div>

        {/* WHT Code + Amount */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Withholding Tax Code</Label>
            <Select value={data.whtCode} onValueChange={(v) => set("whtCode", v)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {WHT_CODE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs text-muted-foreground">Withholding Tax Amount</Label>
              {confidenceBadge(data.whtAmountConf)}
            </div>
            <Input
              value={whtDisplay}
              onChange={(e) => {
                setWhtDisplay(e.target.value);
                const num = parseFormattedNumber(e.target.value);
                set("whtAmount", num);
              }}
              onBlur={() => setWhtDisplay(formatNumber(data.whtAmount))}
              className={`h-8 text-sm ${data.whtAmountConf < 80 ? "border-yellow-400 bg-yellow-50" : ""}`}
            />
          </div>
        </div>

        {/* Grand Total */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Grand Total</Label>
            <span className="text-lg font-bold text-primary">
              {formatNumber(data.grandTotal)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
