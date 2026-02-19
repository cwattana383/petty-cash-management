import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle, X, RefreshCw } from "lucide-react";
import { UploadedDoc, OcrField } from "@/lib/upload-types";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReceiptInformation, { type ReceiptData } from "./verify/ReceiptInformation";
import AmountBreakdown, { type AmountData } from "./verify/AmountBreakdown";
import DocumentPreviewPanel from "./verify/DocumentPreviewPanel";

interface VerifyModalProps {
  doc: UploadedDoc | null;
  onClose: () => void;
  onConfirm: (docId: string, fields: OcrField[]) => void;
  onReject?: (docId: string) => void;
  onRerunOcr?: (docId: string) => void;
}

function getOcrValue(fields: OcrField[], label: string): string {
  return fields.find((f) => f.label === label)?.value || "";
}
function getOcrConf(fields: OcrField[], label: string): number {
  return fields.find((f) => f.label === label)?.confidence || 75;
}

export default function VerifyModal({ doc, onClose, onConfirm, onReject, onRerunOcr }: VerifyModalProps) {
  const ocrFields = doc?.ocrData || [];

  const [receipt, setReceipt] = useState<ReceiptData>({
    buyerTaxId: "", buyerTaxIdConf: 75,
    buyerName: "", buyerNameConf: 75,
    buyerAddress: "", buyerAddressConf: 75,
    buyerNameAddress: "", buyerNameAddressConf: 75,
    invoiceNumber: "", invoiceNumberConf: 75,
    invoiceDate: "", invoiceDateConf: 75,
    vatAmount: "", vatAmountConf: 75,
    vendorSellerInfo: "", vendorSellerInfoConf: 75,
    paymentMethod: "Credit Card", currency: "THB", country: "TH",
  });

  const [amount, setAmount] = useState<AmountData>({
    description: "", subtotal: 0, subtotalConf: 75, totalAmount: "", totalAmountConf: 75, vatRate: "7", vatAmount: 0, vatAmountConf: 75, whtCode: "", whtAmount: 0, whtAmountConf: 75, grandTotal: 0,
  });

  const [receiptErrors, setReceiptErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<string[]>([]);

  // Initialize from OCR data
  useEffect(() => {
    if (!doc?.ocrData) return;
    const f = doc.ocrData;

    setReceipt({
      buyerTaxId: getOcrValue(f, "เลขประจำตัวผู้เสียภาษี"),
      buyerTaxIdConf: getOcrConf(f, "เลขประจำตัวผู้เสียภาษี"),
      buyerName: getOcrValue(f, "ชื่อ ผู้มีหน้าที่หักภาษี ณ ที่จ่าย"),
      buyerNameConf: getOcrConf(f, "ชื่อ ผู้มีหน้าที่หักภาษี ณ ที่จ่าย"),
      buyerAddress: "",
      buyerAddressConf: 75,
      buyerNameAddress: getOcrValue(f, "ชื่อ ผู้มีหน้าที่หักภาษี ณ ที่จ่าย"),
      buyerNameAddressConf: getOcrConf(f, "ชื่อ ผู้มีหน้าที่หักภาษี ณ ที่จ่าย"),
      invoiceNumber: getOcrValue(f, "เลขที่"),
      invoiceNumberConf: getOcrConf(f, "เลขที่"),
      invoiceDate: convertThaiDate(getOcrValue(f, "วันเดือนปี")),
      invoiceDateConf: getOcrConf(f, "วันเดือนปี"),
      vatAmount: getOcrValue(f, "VAT Amount"),
      vatAmountConf: getOcrConf(f, "VAT Amount"),
      vendorSellerInfo: getOcrValue(f, "สาขา") || "สำนักงานใหญ่",
      vendorSellerInfoConf: getOcrConf(f, "สาขา") || 80,
      paymentMethod: "Credit Card",
      currency: "THB",
      country: "TH",
    });

    const subtotal = parseNum(getOcrValue(f, "จำนวนเงิน"));
    const taxRate = parseFloat(getOcrValue(f, "อัตราภาษี")) || 0;
    const vatAmt = parseNum(getOcrValue(f, "VAT Amount"));
    const whtCode = getOcrValue(f, "WHT Code");
    const whtAmt = parseNum(getOcrValue(f, "WHT Amount"));
    const calcVat = taxRate > 0 ? Math.round(subtotal * (taxRate / 100) * 100) / 100 : vatAmt;

    setAmount({
      description: getOcrValue(f, "ประเภทรายได้") || "Expense item",
      subtotal,
      subtotalConf: getOcrConf(f, "จำนวนเงิน"),
      totalAmount: getOcrValue(f, "จำนวนเงิน"),
      totalAmountConf: getOcrConf(f, "จำนวนเงิน"),
      vatRate: taxRate === 7 ? "7" : taxRate === 0 ? "0" : "7",
      vatAmount: vatAmt || calcVat,
      vatAmountConf: getOcrConf(f, "VAT Amount"),
      whtCode: whtCode || "",
      whtAmount: whtAmt,
      whtAmountConf: getOcrConf(f, "WHT Amount"),
      grandTotal: Math.round((subtotal + (vatAmt || calcVat) - whtAmt) * 100) / 100,
    });
  }, [doc]);

  // Validation warnings
  useEffect(() => {
    const w: string[] = [];

    if (receipt.invoiceDate) {
      const rDate = new Date(receipt.invoiceDate);
      const daysDiff = Math.floor((Date.now() - rDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 30) w.push(`Invoice date is ${daysDiff} days old (policy: max 30 days)`);
    }

    // Low confidence fields
    const confFields = [
      { name: "Buyer Name", conf: receipt.buyerNameAddressConf },
      { name: "Tax ID", conf: receipt.buyerTaxIdConf },
      { name: "Invoice No", conf: receipt.invoiceNumberConf },
    ];
    confFields.forEach((cf) => {
      if (cf.conf < 80) w.push(`${cf.name} has low confidence (${cf.conf}%) — กรุณาตรวจสอบ`);
    });

    // Overall doc confidence warning
    if (doc?.ocrConfidenceScore != null && doc.ocrConfidenceScore < 80) {
      w.push(`Overall OCR confidence is low: ${doc.ocrConfidenceScore}%`);
    }

    setWarnings(w);
  }, [receipt, doc]);

  const handleConfirm = () => {
    const errs: Record<string, string> = {};
    if (!receipt.buyerTaxId) errs.buyerTaxId = "Required";
    if (!receipt.buyerNameAddress) errs.buyerNameAddress = "Required";
    if (!receipt.invoiceNumber) errs.invoiceNumber = "Required";
    if (!receipt.invoiceDate) errs.invoiceDate = "Required";

    setReceiptErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    const transactionId = `TXN-${Date.now()}`;
    const payload = {
      transaction_id: transactionId,
      transaction_type: "PETTY_CASH",
      invoice_no: receipt.invoiceNumber,
      invoice_date: receipt.invoiceDate,
      buyer_name: receipt.buyerNameAddress,
      buyer_tax_id: receipt.buyerTaxId,
      vendor_seller_info: receipt.vendorSellerInfo,
      subtotal: amount.subtotal,
      vat_amount: amount.vatAmount,
      wht_amount: amount.whtAmount,
      total: amount.grandTotal,
      currency: receipt.currency,
      payment_method: receipt.paymentMethod,
      description: amount.description,
    };
    console.log("Transaction Payload:", JSON.stringify(payload, null, 2));

    const updatedFields: OcrField[] = [
      { label: "เลขประจำตัวผู้เสียภาษี", value: receipt.buyerTaxId, confidence: receipt.buyerTaxIdConf },
      { label: "วันเดือนปี", value: receipt.invoiceDate, confidence: receipt.invoiceDateConf },
      { label: "เลขที่", value: receipt.invoiceNumber, confidence: receipt.invoiceNumberConf },
      { label: "ชื่อ ผู้มีหน้าที่หักภาษี ณ ที่จ่าย", value: receipt.buyerNameAddress, confidence: receipt.buyerNameAddressConf },
      { label: "ประเภทรายได้", value: amount.description || "", confidence: 100 },
      { label: "อัตราภาษี", value: amount.vatRate, confidence: 100 },
      { label: "จำนวนเงิน", value: amount.grandTotal.toFixed(2), confidence: 100 },
      { label: "VAT Code", value: `V${amount.vatRate}`, confidence: 100 },
      { label: "VAT Amount", value: amount.vatAmount.toFixed(2), confidence: 100 },
      { label: "WHT Code", value: amount.whtAmount > 0 ? "W3" : "", confidence: 100 },
      { label: "WHT Amount", value: amount.whtAmount.toFixed(2), confidence: 100 },
    ];

    toast.success(`Transaction ${transactionId} created`);
    onConfirm(doc!.id, updatedFields);
  };

  if (!doc) return null;

  // Field-level confidence summary for right panel
  const lowConfFields = doc.ocrData?.filter((f) => f.confidence < 80) || [];

  return (
    <Dialog open={!!doc} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] w-[1400px] max-h-[92vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base">Verify Document: {doc.name}</DialogTitle>
              {doc.ocrConfidenceScore != null && (
                <p className="text-xs text-muted-foreground mt-1">
                  Overall Confidence: <span className={`font-semibold ${doc.ocrConfidenceScore >= 90 ? "text-green-600" : doc.ocrConfidenceScore >= 70 ? "text-orange-600" : "text-red-600"}`}>{doc.ocrConfidenceScore}%</span>
                  {doc.autoDecisionStatus && <span className="ml-2">• Decision: {doc.autoDecisionStatus.replace("_", " ")}</span>}
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-5 gap-0 flex-1 overflow-hidden" style={{ height: "calc(92vh - 160px)" }}>
          {/* LEFT PANEL (60%) */}
          <ScrollArea className="col-span-3 border-r">
            <div className="p-5 space-y-4">
              {/* Warnings */}
              {warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-1">
                  {warnings.map((w, i) => (
                    <p key={i} className="text-xs text-yellow-700 flex items-center gap-1.5">
                      <AlertTriangle className="h-3 w-3 shrink-0" /> {w}
                    </p>
                  ))}
                </div>
              )}

              {/* Low confidence fields highlight */}
              {lowConfFields.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-red-700 mb-1">⚠️ Fields with low confidence (&lt;80%):</p>
                  <div className="flex flex-wrap gap-1.5">
                    {lowConfFields.map((f) => (
                      <span key={f.label} className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                        {f.label}: {f.confidence.toFixed(2)}%
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <ReceiptInformation data={receipt} onChange={setReceipt} errors={receiptErrors} />
              <AmountBreakdown data={amount} onChange={setAmount} />
              
            </div>
          </ScrollArea>

          {/* RIGHT PANEL (40%) */}
          <div className="col-span-2 p-5 flex flex-col">
            <DocumentPreviewPanel docName={doc.name} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-muted/20">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            {onReject && (
              <Button variant="outline" onClick={() => onReject(doc.id)} className="gap-2 text-destructive hover:text-destructive border-destructive/50 hover:bg-destructive/10">
                <X className="h-4 w-4" /> Reject Document
              </Button>
            )}
            <Button onClick={handleConfirm} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
              <CheckCircle className="h-4 w-4" /> Accept Document
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helpers
function parseNum(s: string): number {
  return parseFloat((s || "0").replace(/,/g, "")) || 0;
}

function convertThaiDate(d: string): string {
  if (!d) return "";
  const parts = d.split("/");
  if (parts.length === 3) {
    let year = parseInt(parts[2]);
    if (year > 2500) year -= 543;
    return `${year}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  }
  return d;
}
