import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { toThaiDateDisplay } from "@/lib/upload-types";

function confidenceBadge(c: number) {
  const color = c >= 90 ? "bg-green-100 text-green-700" : c >= 80 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700";
  return <span className={`text-xs font-medium px-2 py-0.5 rounded ${color}`}>{c.toFixed(2)}%</span>;
}

export interface ReceiptData {
  buyerTaxId: string;
  buyerTaxIdConf: number;
  buyerName: string;
  buyerNameConf: number;
  buyerAddress: string;
  buyerAddressConf: number;
  buyerNameAddress: string;
  buyerNameAddressConf: number;
  invoiceNumber: string;
  invoiceNumberConf: number;
  invoiceDate: string;
  invoiceDateConf: number;
  invoiceDateDisplay?: string;
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
  const set = (key: keyof ReceiptData, val: string) => {
    const updated = { ...data, [key]: val };
    // Update Thai date display when invoiceDate changes
    if (key === "invoiceDate") {
      updated.invoiceDateDisplay = toThaiDateDisplay(val);
    }
    onChange(updated);
  };

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
            <Label className="text-xs text-muted-foreground">Buyer Tax ID (Tax ID) <span className="text-destructive">*</span></Label>
            {confidenceBadge(data.buyerTaxIdConf)}
          </div>
          <Input value={data.buyerTaxId} onChange={(e) => set("buyerTaxId", e.target.value)} className={`h-8 text-sm ${data.buyerTaxIdConf < 80 ? "border-yellow-400 bg-yellow-50" : ""}`} />
          {errors.buyerTaxId && <p className="text-xs text-destructive mt-0.5">{errors.buyerTaxId}</p>}
        </div>

        {/* Buyer Name */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-xs text-muted-foreground">Buyer Name <span className="text-destructive">*</span></Label>
            {confidenceBadge(data.buyerNameConf)}
          </div>
          <Input value={data.buyerName} onChange={(e) => set("buyerName", e.target.value)} className={`h-8 text-sm ${data.buyerNameConf < 80 ? "border-yellow-400 bg-yellow-50" : ""}`} />
          {errors.buyerName && <p className="text-xs text-destructive mt-0.5">{errors.buyerName}</p>}
        </div>

        {/* Buyer Address */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-xs text-muted-foreground">Buyer Address <span className="text-destructive">*</span></Label>
            {confidenceBadge(data.buyerAddressConf)}
          </div>
          <Input value={data.buyerAddress} onChange={(e) => set("buyerAddress", e.target.value)} className={`h-8 text-sm ${data.buyerAddressConf < 80 ? "border-yellow-400 bg-yellow-50" : ""}`} />
          {errors.buyerAddress && <p className="text-xs text-destructive mt-0.5">{errors.buyerAddress}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Invoice Number */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs text-muted-foreground">Invoice Number <span className="text-destructive">*</span></Label>
              {confidenceBadge(data.invoiceNumberConf)}
            </div>
            <Input value={data.invoiceNumber} onChange={(e) => set("invoiceNumber", e.target.value)} className={`h-8 text-sm ${data.invoiceNumberConf < 80 ? "border-yellow-400 bg-yellow-50" : ""}`} />
            {errors.invoiceNumber && <p className="text-xs text-destructive mt-0.5">{errors.invoiceNumber}</p>}
          </div>

          {/* Invoice Date */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs text-muted-foreground">Invoice Date <span className="text-destructive">*</span></Label>
              {confidenceBadge(data.invoiceDateConf)}
            </div>
            <Input type="date" value={data.invoiceDate} onChange={(e) => set("invoiceDate", e.target.value)} className={`h-8 text-sm ${data.invoiceDateConf < 80 ? "border-yellow-400 bg-yellow-50" : ""}`} />
            {data.invoiceDateDisplay && (
              <p className="text-xs text-muted-foreground mt-0.5">Displayed in BE: {data.invoiceDateDisplay}</p>
            )}
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
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Payment Method */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Payment Method</Label>
            <Select value={data.paymentMethod} onValueChange={(v) => set("paymentMethod", v)}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Credit Card">Credit Card</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
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
