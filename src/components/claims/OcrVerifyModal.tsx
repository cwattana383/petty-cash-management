import { useState, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ZoomIn, ZoomOut, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

export interface OcrExtractedData {
  taxInvoiceNo: string;
  date: string;
  vendorName: string;
  netAmount: string;
  vatAmount: string;
  totalAmount: string;
  buyerTaxId?: string;
  buyerAddress?: string;
}

export interface ValidationContext {
  companyTaxId: string;
  companyAddress: string;
  bankAmount: number;
  transactionDate: string; // YYYY-MM-DD
}

interface ValidationResult {
  label: string;
  status: "pass" | "fail" | "warning";
  message: string;
  blocking: boolean;
}

interface OcrVerifyModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm?: (data: OcrExtractedData) => void;
  onRemoveReupload?: () => void;
  fileName: string;
  fileType: string;
  initialData: OcrExtractedData;
  validationContext?: ValidationContext;
  readOnly?: boolean;
}

const FIELDS: { key: keyof OcrExtractedData; label: string; placeholder: string }[] = [
  { key: "taxInvoiceNo", label: "Tax Invoice No.", placeholder: "Could not extract — enter manually" },
  { key: "date", label: "Date (DD/MM/YYYY)", placeholder: "Could not extract — enter manually" },
  { key: "vendorName", label: "Vendor Name", placeholder: "Could not extract — enter manually" },
  { key: "netAmount", label: "Net Amount (THB)", placeholder: "Could not extract — enter manually" },
  { key: "vatAmount", label: "VAT Amount (THB)", placeholder: "Could not extract — enter manually" },
  { key: "totalAmount", label: "Total Amount (THB)", placeholder: "Could not extract — enter manually" },
];

function normalize(s: string) {
  return s.replace(/[\s\-]/g, "").toLowerCase();
}

function parseAmount(s: string): number {
  return parseFloat(s.replace(/,/g, "")) || 0;
}

function parseDateDMY(s: string): Date | null {
  // DD/MM/YYYY (Buddhist or Gregorian)
  const m = s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (!m) return null;
  let year = parseInt(m[3], 10);
  if (year > 2400) year -= 543; // Buddhist era
  return new Date(year, parseInt(m[2], 10) - 1, parseInt(m[1], 10));
}

function runValidations(data: OcrExtractedData, ctx: ValidationContext): ValidationResult[] {
  const results: ValidationResult[] = [];
  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Check 1 — Tax ID Match
  const extractedTaxId = normalize(data.buyerTaxId || "");
  const companyTaxId = normalize(ctx.companyTaxId);
  if (extractedTaxId && companyTaxId && extractedTaxId === companyTaxId) {
    results.push({ label: "Tax ID", status: "pass", message: "Tax ID matched — CPAxtra confirmed", blocking: false });
  } else if (!extractedTaxId) {
    results.push({ label: "Tax ID", status: "fail", message: "Buyer Tax ID could not be extracted. This document may belong to a different company. Please re-upload the correct document.", blocking: true });
  } else {
    results.push({ label: "Tax ID", status: "fail", message: "Tax ID does not match CPAxtra. This document may belong to a different company. Please re-upload the correct document.", blocking: true });
  }

  // Check 2 — Address Check
  const buyerAddr = (data.buyerAddress || "").toLowerCase();
  const addressTokens = ctx.companyAddress
    .split(/[\s,]+/)
    .filter((t) => t.length >= 3)
    .map((t) => t.toLowerCase());
  const brandKeywords = ["cpaxtra", "cp axtra", "makro", "แม็คโคร", "ซีพี แอ็กซ์ตร้า"];
  const allKeywords = [...addressTokens, ...brandKeywords];
  const addressMatch = allKeywords.some((kw) => buyerAddr.includes(kw));
  if (addressMatch) {
    results.push({ label: "Address", status: "pass", message: "CPAxtra address found in document", blocking: false });
  } else {
    results.push({ label: "Address", status: "warning", message: "Could not confirm CPAxtra address in document. Finance will verify.", blocking: false });
  }

  // Check 3 — Amount Check
  const ocrTotal = parseAmount(data.totalAmount);
  const bankAmt = ctx.bankAmount;
  if (bankAmt > 0 && ocrTotal > 0) {
    const diff = Math.abs(ocrTotal - bankAmt) / bankAmt * 100;
    if (diff <= 5) {
      results.push({ label: "Amount", status: "pass", message: `Amount matched — within 5% tolerance (Bank: ฿${fmt(bankAmt)} / Document: ฿${fmt(ocrTotal)})`, blocking: false });
    } else {
      results.push({ label: "Amount", status: "warning", message: `Amount difference is ${diff.toFixed(1)}% — exceeds 5% tolerance (Bank: ฿${fmt(bankAmt)} / Document: ฿${fmt(ocrTotal)}). Finance will review.`, blocking: false });
    }
  } else {
    results.push({ label: "Amount", status: "warning", message: "Could not compare amounts. Finance will review.", blocking: false });
  }

  // Check 4 — Invoice Date
  const invoiceDate = parseDateDMY(data.date);
  const txnDate = new Date(ctx.transactionDate);
  if (invoiceDate && !isNaN(txnDate.getTime())) {
    const diffDays = Math.abs(Math.round((invoiceDate.getTime() - txnDate.getTime()) / (1000 * 60 * 60 * 24)));
    if (diffDays <= 30) {
      results.push({ label: "Date", status: "pass", message: "Invoice date within acceptable range", blocking: false });
    } else {
      results.push({ label: "Date", status: "warning", message: `Invoice date is ${diffDays} days from transaction date. Finance will review.`, blocking: false });
    }
  } else {
    results.push({ label: "Date", status: "warning", message: "Could not validate invoice date. Finance will review.", blocking: false });
  }

  return results;
}

export default function OcrVerifyModal({ open, onClose, onConfirm, onRemoveReupload, fileName, fileType, initialData, validationContext }: OcrVerifyModalProps) {
  const [data, setData] = useState<OcrExtractedData>(initialData);
  const [zoom, setZoom] = useState(100);

  const handleChange = (key: keyof OcrExtractedData, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const validations = useMemo(() => {
    if (!validationContext) return [];
    return runValidations(data, validationContext);
  }, [data, validationContext]);

  const hasBlockingFailure = validations.some((v) => v.blocking && v.status === "fail");

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-5xl w-[95vw] h-[85vh] p-0 flex flex-col">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-bold text-foreground">Verify Document — {fileName}</h2>
        </div>

        <div className="flex-1 flex min-h-0">
          {/* Left Panel — OCR Results */}
          <div className="w-1/2 border-r border-border p-6 overflow-y-auto">
            <h3 className="text-sm font-semibold text-foreground mb-1">OCR Results</h3>
            <p className="text-xs text-muted-foreground mb-5">Review and edit if needed before confirming</p>

            <div className="space-y-4">
              {FIELDS.map((f) => {
                const isEmpty = !data[f.key];
                return (
                  <div key={f.key} className="space-y-1.5">
                    <Label className="text-[13px] font-medium text-foreground">{f.label}</Label>
                    <Input
                      value={data[f.key]}
                      onChange={(e) => handleChange(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      className={`text-[13px] ${isEmpty ? "border-destructive" : ""}`}
                    />
                  </div>
                );
              })}
            </div>

            {/* Validation Results */}
            {validations.length > 0 && (
              <div className="mt-6 pt-5 border-t border-border">
                <h3 className="text-sm font-semibold text-foreground mb-3">Validation Results</h3>
                <div className="space-y-2.5">
                  {validations.map((v, i) => (
                    <div key={i} className="flex items-start gap-2">
                      {v.status === "pass" && <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />}
                      {v.status === "warning" && <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />}
                      {v.status === "fail" && <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />}
                      <span className={`text-[13px] leading-snug ${
                        v.status === "fail" ? "text-destructive font-medium" :
                        v.status === "warning" ? "text-amber-700" :
                        "text-foreground"
                      }`}>
                        {v.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel — Document Preview */}
          <div className="w-1/2 flex flex-col bg-muted/30">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Document Preview</h3>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setZoom((z) => Math.max(50, z - 25))}
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <span className="text-xs text-muted-foreground w-10 text-center">{zoom}%</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setZoom((z) => Math.min(200, z + 25))}
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center p-4">
              <div
                className="bg-white border border-border rounded shadow-sm flex items-center justify-center"
                style={{ width: `${zoom * 3}px`, height: `${zoom * 4}px`, transition: "width 0.2s, height 0.2s" }}
              >
                <div className="text-center text-muted-foreground p-4">
                  <p className="text-sm font-medium">{fileName}</p>
                  <p className="text-xs mt-1">{fileType} document preview</p>
                  <p className="text-xs mt-3 text-muted-foreground/60">
                    (Document preview placeholder)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border flex justify-end gap-3">
          {hasBlockingFailure && onRemoveReupload ? (
            <>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button variant="destructive" onClick={() => { onRemoveReupload(); onClose(); }}>
                Remove &amp; Re-upload
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button
                onClick={() => onConfirm(data)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Confirm
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
