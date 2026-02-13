import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle, X } from "lucide-react";
import { UploadedDoc, OcrField } from "@/lib/upload-types";
import { currentUser } from "@/lib/mock-data";
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
}

function getOcrValue(fields: OcrField[], label: string): string {
  return fields.find((f) => f.label === label)?.value || "";
}
function getOcrConf(fields: OcrField[], label: string): number {
  return fields.find((f) => f.label === label)?.confidence || 75;
}

export default function VerifyModal({ doc, onClose, onConfirm }: VerifyModalProps) {
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

    // Default line item from OCR
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

    // Receipt date policy: >60 days old
    if (receipt.receiptDate) {
      const rDate = new Date(receipt.receiptDate);
      const daysDiff = Math.floor((Date.now() - rDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 60) w.push(`Receipt date is ${daysDiff} days old (policy: max 60 days)`);
    }

    // Duplicate check stub
    if (receipt.receiptNo && receipt.vendorName) {
      // In real app, check against existing receipts
    }

    // Low confidence fields
    const confFields = [
      { name: "Vendor Name", conf: receipt.vendorNameConf },
      { name: "Tax ID", conf: receipt.vendorTaxIdConf },
      { name: "Receipt No", conf: receipt.receiptNoConf },
    ];
    confFields.forEach((cf) => {
      if (cf.conf < 80) w.push(`${cf.name} has low confidence (${cf.conf}%)`);
    });

    setWarnings(w);
  }, [receipt]);

  const handleConfirm = () => {
    // Validate
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

    // Generate transaction payload
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

    // Build updated OcrFields to pass back
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

  return (
    <Dialog open={!!doc} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] w-[1400px] max-h-[92vh] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b">
          <DialogTitle className="text-base">Verify Document: {doc.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-5 gap-0 flex-1 overflow-hidden" style={{ height: "calc(92vh - 130px)" }}>
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

              <ReceiptInformation data={receipt} onChange={setReceipt} errors={receiptErrors} />
              <AmountBreakdown data={amount} onChange={setAmount} />
              <LineItemDetails lines={lines} onChange={setLines} />
              
            </div>
          </ScrollArea>

          {/* RIGHT PANEL (40%) */}
          <div className="col-span-2 p-5">
            <DocumentPreviewPanel docName={doc.name} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-muted/20">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm} className="gap-2 bg-red-600 hover:bg-red-700 text-white">
            <CheckCircle className="h-4 w-4" /> Confirm & Create Transaction
          </Button>
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
  // Handle dd/mm/yyyy format
  const parts = d.split("/");
  if (parts.length === 3) {
    let year = parseInt(parts[2]);
    if (year > 2500) year -= 543; // Buddhist era
    return `${year}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  }
  return d;
}
