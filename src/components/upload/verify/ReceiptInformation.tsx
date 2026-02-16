import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

function confidenceBadge(c: number) {
  const color = c >= 90 ? "bg-green-100 text-green-700" : c >= 80 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700";
  return <span className={`text-xs font-medium px-2 py-0.5 rounded ${color}`}>{c.toFixed(2)}%</span>;
}

export interface ReceiptData {
  vendorName: string;
  vendorNameConf: number;
  vendorTaxId: string;
  vendorTaxIdConf: number;
  vendorBranch: string;
  vendorBranchConf: number;
  receiptNo: string;
  receiptNoConf: number;
  receiptDate: string;
  receiptDateConf: number;
  paymentMethod: string;
  currency: string;
  country: string;
}

interface Props {
  data: ReceiptData;
  onChange: (d: ReceiptData) => void;
  errors: Record<string, string>;
}

export default function ReceiptInformation({ data, onChange, errors }: Props) {
  const set = (key: keyof ReceiptData, val: string) => onChange({ ...data, [key]: val });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4" /> Receipt Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Vendor Name */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-xs text-muted-foreground">Vendor Name</Label>
            {confidenceBadge(data.vendorNameConf)}
          </div>
          <Input value={data.vendorName} onChange={(e) => set("vendorName", e.target.value)} className={`h-8 text-sm ${data.vendorNameConf < 80 ? "border-yellow-400 bg-yellow-50" : ""}`} />
          {errors.vendorName && <p className="text-xs text-destructive mt-0.5">{errors.vendorName}</p>}
        </div>

        {/* Vendor Tax ID */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-xs text-muted-foreground">Vendor Tax ID</Label>
            {confidenceBadge(data.vendorTaxIdConf)}
          </div>
          <Input value={data.vendorTaxId} onChange={(e) => set("vendorTaxId", e.target.value)} className={`h-8 text-sm ${data.vendorTaxIdConf < 80 ? "border-yellow-400 bg-yellow-50" : ""}`} />
          {errors.vendorTaxId && <p className="text-xs text-destructive mt-0.5">{errors.vendorTaxId}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Vendor Branch */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs text-muted-foreground">Vendor Branch</Label>
              {confidenceBadge(data.vendorBranchConf)}
            </div>
            <Input value={data.vendorBranch} onChange={(e) => set("vendorBranch", e.target.value)} className={`h-8 text-sm ${data.vendorBranchConf < 80 ? "border-yellow-400 bg-yellow-50" : ""}`} />
          </div>

          {/* Receipt No */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs text-muted-foreground">Receipt No.</Label>
              {confidenceBadge(data.receiptNoConf)}
            </div>
            <Input value={data.receiptNo} onChange={(e) => set("receiptNo", e.target.value)} className={`h-8 text-sm ${data.receiptNoConf < 80 ? "border-yellow-400 bg-yellow-50" : ""}`} />
            {errors.receiptNo && <p className="text-xs text-destructive mt-0.5">{errors.receiptNo}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Receipt Date */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs text-muted-foreground">Receipt Date</Label>
              {confidenceBadge(data.receiptDateConf)}
            </div>
            <Input type="date" value={data.receiptDate} onChange={(e) => set("receiptDate", e.target.value)} className={`h-8 text-sm ${data.receiptDateConf < 80 ? "border-yellow-400 bg-yellow-50" : ""}`} />
            {errors.receiptDate && <p className="text-xs text-destructive mt-0.5">{errors.receiptDate}</p>}
          </div>

          {/* Payment Method */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Payment Method</Label>
            <Select value={data.paymentMethod} onValueChange={(v) => set("paymentMethod", v)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Transfer">Transfer</SelectItem>
                <SelectItem value="Credit Card">Credit Card</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Currency */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Currency</Label>
            <Select value={data.currency} onValueChange={(v) => set("currency", v)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="THB">THB</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="JPY">JPY</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Country */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Country</Label>
            <Select value={data.country} onValueChange={(v) => set("country", v)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TH">Thailand</SelectItem>
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="JP">Japan</SelectItem>
                <SelectItem value="SG">Singapore</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
