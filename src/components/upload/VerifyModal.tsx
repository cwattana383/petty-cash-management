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
import LineItemDetails, { type LineItem } from "./verify/LineItemDetails";
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
    vendorName: "", vendorNameConf: 75,
    vendorTaxId: "", vendorTaxIdConf: 75,
    vendorBranch: "", vendorBranchConf: 75,
    receiptNo: "", receiptNoConf: 75,
    receiptDate: "", receiptDateConf: 75,
    paymentMethod: "Cash", currency: "THB", country: "TH",
  });

  const [amount, setAmount] = useState<AmountData>({
    subtotal: 0, vatRate: "7", vatAmount: 0, whtAmount: 0, grandTotal: 0,
  });

  const [lines, setLines] = useState<LineItem[]>([]);
  const [receiptErrors, setReceiptErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<string[]>([]);

  // Initialize from OCR data
  useEffect(() => {
    if (!doc?.ocrData) return;
    const f = doc.ocrData;

    setReceipt({
      vendorName: getOcrValue(f, "ชื่อ ผู้มีหน้าที่หักภาษี ณ ที่จ่าย"),
      vendorNameConf: getOcrConf(f, "ชื่อ ผู้มีหน้าที่หักภาษี ณ ที่จ่าย"),
      vendorTaxId: getOcrValue(f, "เลขประจำตัวผู้เสียภาษี"),
      vendorTaxIdConf: getOcrConf(f, "เลขประจำตัวผู้เสียภาษี"),
      vendorBranch: getOcrValue(f, "สาขา") || "สำนักงานใหญ่",
      vendorBranchConf: getOcrConf(f, "สาขา") || 80,
      receiptNo: getOcrValue(f, "เลขที่"),
      receiptNoConf: getOcrConf(f, "เลขที่"),
      receiptDate: convertThaiDate(getOcrValue(f, "วันเดือนปี")),
      receiptDateConf: getOcrConf(f, "วันเดือนปี"),
      paymentMethod: "Cash",
      currency: "THB",
      country: "TH",
    });

    const subtotal = parseNum(getOcrValue(f, "จำนวนเงิน"));
    const taxRate = parseFloat(getOcrValue(f, "อัตราภาษี")) || 0;
    const vatAmt = parseNum(getOcrValue(f, "VAT Amount"));
    const whtAmt = parseNum(getOcrValue(f, "WHT Amount"));
    const calcVat = taxRate > 0 ? Math.round(subtotal * (taxRate / 100) * 100) / 100 : vatAmt;

    setAmount({
      subtotal,
      vatRate: taxRate === 7 ? "7" : taxRate === 0 ? "0" : "7",
      vatAmount: vatAmt || calcVat,
      whtAmount: whtAmt,
      grandTotal: Math.round((subtotal + (vatAmt || calcVat) - whtAmt) * 100) / 100,
    });

    setLines([{
      id: `line-${Date.now()}`,
      description: getOcrValue(f, "ประเภทรายได้") || "Expense item",
      quantity: 1,
      unitPrice: subtotal,
      lineAmount: subtotal,
      expenseCategory: "",
      glAccount: "",
      costCenter: "",
      projectCode: "",
    }]);
  }, [doc]);

  // Validation warnings
  useEffect(() => {
    const w: string[] = [];

    if (receipt.receiptDate) {
      const rDate = new Date(receipt.receiptDate);
      const daysDiff = Math.floor((Date.now() - rDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 60) w.push(`Receipt date is ${daysDiff} days old (policy: max 60 days)`);
    }

    // Low confidence fields
    const confFields = [
      { name: "Vendor Name", conf: receipt.vendorNameConf },
      { name: "Tax ID", conf: receipt.vendorTaxIdConf },
      { name: "Receipt No", conf: receipt.receiptNoConf },
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
    if (!receipt.vendorName) errs.vendorName = "Required";
    if (!receipt.vendorTaxId) errs.vendorTaxId = "Required";
    if (!receipt.receiptNo) errs.receiptNo = "Required";
    if (!receipt.receiptDate) errs.receiptDate = "Required";

    setReceiptErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    const transactionId = `TXN-${Date.now()}`;
    const payload = {
      transaction_id: transactionId,
      transaction_type: "PETTY_CASH",
      receipt_no: receipt.receiptNo,
      receipt_date: receipt.receiptDate,
      vendor_name: receipt.vendorName,
      vendor_tax_id: receipt.vendorTaxId,
      subtotal: amount.subtotal,
      vat_amount: amount.vatAmount,
      wht_amount: amount.whtAmount,
      total: amount.grandTotal,
      currency: receipt.currency,
      payment_method: receipt.paymentMethod,
      lines: lines.map((l) => ({
        description: l.description,
        quantity: l.quantity,
        unit_price: l.unitPrice,
        amount: l.lineAmount,
        expense_category: l.expenseCategory,
        gl_account: l.glAccount,
        cost_center: l.costCenter,
        project_code: l.projectCode,
      })),
    };
    console.log("Transaction Payload:", JSON.stringify(payload, null, 2));

    const updatedFields: OcrField[] = [
      { label: "เลขประจำตัวผู้เสียภาษี", value: receipt.vendorTaxId, confidence: receipt.vendorTaxIdConf },
      { label: "วันเดือนปี", value: receipt.receiptDate, confidence: receipt.receiptDateConf },
      { label: "เลขที่", value: receipt.receiptNo, confidence: receipt.receiptNoConf },
      { label: "ชื่อ ผู้มีหน้าที่หักภาษี ณ ที่จ่าย", value: receipt.vendorName, confidence: receipt.vendorNameConf },
      { label: "ประเภทรายได้", value: lines[0]?.description || "", confidence: 100 },
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
                        {f.label}: {Math.round(f.confidence)}%
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <ReceiptInformation data={receipt} onChange={setReceipt} errors={receiptErrors} />
              <AmountBreakdown data={amount} onChange={setAmount} />
              <LineItemDetails lines={lines} onChange={setLines} />
            </div>
          </ScrollArea>

          {/* RIGHT PANEL (40%) */}
          <div className="col-span-2 p-5 flex flex-col">
            <DocumentPreviewPanel docName={doc.name} />

            {/* OCR Field Confidence Summary */}
            {doc.ocrData && doc.ocrData.length > 0 && (
              <div className="mt-4 border rounded-lg p-3">
                <h4 className="text-xs font-semibold mb-2">Field-level Confidence</h4>
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                  {doc.ocrData.map((f) => (
                    <div key={f.label} className={`flex items-center justify-between text-xs px-2 py-1 rounded ${f.confidence < 80 ? "bg-red-50 border border-red-200" : "bg-muted/50"}`}>
                      <span className="truncate max-w-[180px]">{f.label}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${f.confidence >= 90 ? "bg-green-500" : f.confidence >= 80 ? "bg-yellow-500" : "bg-red-500"}`}
                            style={{ width: `${f.confidence}%` }}
                          />
                        </div>
                        <span className={`font-medium ${f.confidence < 80 ? "text-red-600" : ""}`}>{Math.round(f.confidence)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t bg-muted/20">
          <div className="flex gap-2">
            {onRerunOcr && (
              <Button variant="outline" onClick={() => onRerunOcr(doc.id)} className="gap-2">
                <RefreshCw className="h-4 w-4" /> Re-run OCR
              </Button>
            )}
          </div>
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
