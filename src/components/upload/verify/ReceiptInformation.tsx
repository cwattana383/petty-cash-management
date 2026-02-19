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
  buyerTaxId: string;
  buyerTaxIdConf: number;
  buyerNameAddress: string;
  buyerNameAddressConf: number;
  invoiceNumber: string;
  invoiceNumberConf: number;
  invoiceDate: string;
  invoiceDateConf: number;
  vatAmount: string;
  vatAmountConf: number;
  vendorSellerInfo: string;
  vendorSellerInfoConf: number;
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
          <FileText className="h-4 w-4" /> Document Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Buyer Tax ID */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-xs text-muted-foreground">Buyer Tax ID (เลขประจำตัวผู้เสียภาษี)</Label>
            {confidenceBadge(data.buyerTaxIdConf)}
          </div>
          <Input value={data.buyerTaxId} onChange={(e) => set("buyerTaxId", e.target.value)} className={`h-8 text-sm ${data.buyerTaxIdConf < 80 ? "border-yellow-400 bg-yellow-50" : ""}`} />
          {errors.buyerTaxId && <p className="text-xs text-destructive mt-0.5">{errors.buyerTaxId}</p>}
        </div>

        {/* Buyer Name and Address */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-xs text-muted-foreground">Buyer Name and Address</Label>
            {confidenceBadge(data.buyerNameAddressConf)}
          </div>
          <Input value={data.buyerNameAddress} onChange={(e) => set("buyerNameAddress", e.target.value)} className={`h-8 text-sm ${data.buyerNameAddressConf < 80 ? "border-yellow-400 bg-yellow-50" : ""}`} />
          {errors.buyerNameAddress && <p className="text-xs text-destructive mt-0.5">{errors.buyerNameAddress}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Invoice Number */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs text-muted-foreground">Invoice Number</Label>
              {confidenceBadge(data.invoiceNumberConf)}
            </div>
            <Input value={data.invoiceNumber} onChange={(e) => set("invoiceNumber", e.target.value)} className={`h-8 text-sm ${data.invoiceNumberConf < 80 ? "border-yellow-400 bg-yellow-50" : ""}`} />
            {errors.invoiceNumber && <p className="text-xs text-destructive mt-0.5">{errors.invoiceNumber}</p>}
          </div>

          {/* Invoice Date */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs text-muted-foreground">Invoice Date</Label>
              {confidenceBadge(data.invoiceDateConf)}
            </div>
            <Input type="date" value={data.invoiceDate} onChange={(e) => set("invoiceDate", e.target.value)} className={`h-8 text-sm ${data.invoiceDateConf < 80 ? "border-yellow-400 bg-yellow-50" : ""}`} />
            {errors.invoiceDate && <p className="text-xs text-destructive mt-0.5">{errors.invoiceDate}</p>}
          </div>
        </div>

        {/* Vendor/Seller Information */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-xs text-muted-foreground">Vendor/Seller Information</Label>
            {confidenceBadge(data.vendorSellerInfoConf)}
          </div>
          <Input value={data.vendorSellerInfo} onChange={(e) => set("vendorSellerInfo", e.target.value)} className={`h-8 text-sm ${data.vendorSellerInfoConf < 80 ? "border-yellow-400 bg-yellow-50" : ""}`} />
          {errors.vendorSellerInfo && <p className="text-xs text-destructive mt-0.5">{errors.vendorSellerInfo}</p>}
        </div>

        <div className="grid grid-cols-3 gap-3">
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
