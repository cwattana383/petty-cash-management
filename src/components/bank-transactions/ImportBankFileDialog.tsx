import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2, AlertTriangle, AlertCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { BankTransaction, ProcessingStatus } from "@/lib/corporate-card-types";
import { useImportBankTransactions, useReportImportFailure, checkFileExists } from "@/hooks/use-bank-transactions";

interface ImportBankFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: () => void;
}

export type ValidationFailureType =
  | "WRONG_FILE_TYPE"
  | "WRONG_ENCODING"
  | "EMPTY_FILE"
  | "MISSING_COLUMNS"
  | "INVALID_ROWS";

interface ParseResult {
  success: BankTransaction[];
  errors: string[];
  fileName: string;
  totalRows: number;
  failureType?: ValidationFailureType;
}

interface ImportResult {
  fileName: string;
  imported: number;
  skipped: number;
  validationErrors: number;
  autoApproved: number;
  requiresApproval: number;
  autoRejected: number;
}

const REQUIRED_HEADERS = [
  "transaction_id", "cardholder_employee_id", "cardholder_name",
  "transaction_date", "posting_date", "billing_amount", "billing_currency",
  "merchant_name", "merchant_city", "merchant_country",
  "mcc_code", "mcc_description", "transaction_type",
  "authorization_code", "reference_number",
];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseCSV(rawText: string, fileName: string): ParseResult {
  const text = rawText.replace(/^\uFEFF/, "");
  if (text.includes("\uFFFD")) {
    return { success: [], errors: ["File encoding is not valid UTF-8. Please save the file as UTF-8 and re-upload."], fileName, totalRows: 0, failureType: "WRONG_ENCODING" };
  }
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) {
    return { success: [], errors: ["File is empty or contains only a header row with no data."], fileName, totalRows: 0, failureType: "EMPTY_FILE" };
  }
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
  const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    return { success: [], errors: [`Missing required columns: ${missing.join(", ")}`], fileName, totalRows: 0, failureType: "MISSING_COLUMNS" };
  }

  const success: BankTransaction[] = [];
  const errors: string[] = [];
  const fileId = fileName;
  const dataRows = lines.length - 1;

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = values[idx] ?? ""; });

      if (!row.transaction_id?.trim()) { errors.push(`Row ${i}: Missing required field 'transaction_id'`); continue; }
      if (!row.cardholder_name?.trim()) { errors.push(`Row ${i}: Missing required field 'cardholder_name'`); continue; }
      if (!row.merchant_name?.trim()) { errors.push(`Row ${i}: Missing required field 'merchant_name'`); continue; }
      if (!DATE_RE.test(row.transaction_date)) { errors.push(`Row ${i}: 'transaction_date' must be YYYY-MM-DD, got "${row.transaction_date}"`); continue; }
      if (!DATE_RE.test(row.posting_date)) { errors.push(`Row ${i}: 'posting_date' must be YYYY-MM-DD, got "${row.posting_date}"`); continue; }
      const amount = parseFloat(row.billing_amount);
      if (isNaN(amount)) { errors.push(`Row ${i}: 'billing_amount' must be a number, got "${row.billing_amount}"`); continue; }
      if (!row.mcc_code?.trim()) { errors.push(`Row ${i}: Missing required field 'mcc_code'`); continue; }

      success.push({
        id: `bt-import-${Date.now()}-${i}`,
        file_id: fileId,
        transaction_id: row.transaction_id,
        cardholder_employee_id: row.cardholder_employee_id,
        cardholder_name: row.cardholder_name,
        transaction_date: row.transaction_date,
        posting_date: row.posting_date,
        billing_amount: amount,
        billing_currency: row.billing_currency || "THB",
        merchant_name: row.merchant_name,
        merchant_city: row.merchant_city,
        merchant_country: row.merchant_country,
        mcc_code: row.mcc_code,
        mcc_description: row.mcc_description,
        category: row.category?.trim() || '',
        import_status: row.import_status?.trim() || null,
        transaction_type: row.transaction_type,
        authorization_code: row.authorization_code,
        reference_number: row.reference_number,
        policy_result: "REQUIRES_APPROVAL" as const,
        policy_reason: "",
        processing_status: "NEW" as ProcessingStatus,
        created_at: new Date().toISOString(),
        card_number: row.card_number?.trim() || null,
        last_4_digit: row.card_number?.trim() ? row.card_number.trim().slice(-4) : null,
        transaction_amount: row.transaction_amount ? parseFloat(row.transaction_amount) || null : null,
        transaction_currency: row.transaction_currency?.trim() || null,
      });
    } catch {
      errors.push(`Row ${i}: Unexpected error while parsing row`);
    }
  }

  return {
    success,
    errors,
    fileName,
    totalRows: dataRows,
    failureType: success.length === 0 && errors.length > 0 ? "INVALID_ROWS" : undefined,
  };
}

export function ImportBankFileDialog({ open, onOpenChange, onImport }: ImportBankFileDialogProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importMutation = useImportBankTransactions();
  const reportFailureMutation = useReportImportFailure();

  const handleFile = async (file: File) => {
    setUploadError(null);

    if (!file.name.toLowerCase().endsWith(".csv")) {
      reportFailureMutation.mutate({ fileName: file.name, errors: [`File "${file.name}" is not a CSV file.`], totalRows: 0, failureType: "WRONG_FILE_TYPE" });
      setUploadError("Invalid file type. Only .csv files are accepted.");
      return;
    }

    // Check against bank_transactions.file_id before any processing
    try {
      const exists = await checkFileExists(file.name);
      if (exists) {
        setUploadError("This file has already been processed. Please check the file and try again.");
        return;
      }
    } catch {
      // If check fails, proceed — the import itself will catch any issues
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text, file.name);

      if (parsed.failureType) {
        reportFailureMutation.mutate({ fileName: parsed.fileName, errors: parsed.errors, totalRows: parsed.totalRows, failureType: parsed.failureType });
        setUploadError(parsed.errors[0]);
        return;
      }

      if (parsed.success.length === 0) {
        setUploadError("No valid rows found in the file.");
        return;
      }

      // Auto-import immediately
      try {
        const response = await importMutation.mutateAsync(parsed.success) as { imported: number; skipped: number; total: number; autoApproved: number; requiresApproval: number; autoRejected: number };
        setImportResult({
          fileName: parsed.fileName,
          imported: response.imported,
          skipped: response.skipped,
          validationErrors: parsed.errors.length,
          autoApproved: response.autoApproved ?? 0,
          requiresApproval: response.requiresApproval ?? 0,
          autoRejected: response.autoRejected ?? 0,
        });
        onImport();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Import failed. Please try again.";
        setUploadError(message);
        reportFailureMutation.mutate({ fileName: parsed.fileName, errors: [message], totalRows: parsed.totalRows });
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleClose = () => {
    if (importMutation.isPending) return;
    setUploadError(null);
    setImportResult(null);
    onOpenChange(false);
  };

  const isProcessing = importMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Bank File</DialogTitle>
          <DialogDescription>
            Upload a CSV file containing bank transactions. The system will automatically apply MCC policies.
          </DialogDescription>
        </DialogHeader>

        {/* ── Processing state ── */}
        {isProcessing && (
          <div className="flex flex-col items-center justify-center py-10 gap-4">
            <Loader2 className="h-14 w-14 text-red-500 animate-spin" />
            <div className="text-center">
              <p className="text-sm font-bold">Processing... Please wait while we import your transactions.</p>
              <p className="text-xs text-muted-foreground mt-1">Validating data and applying policies</p>
            </div>
            <Button disabled className="bg-red-400 text-white opacity-80 cursor-not-allowed w-40">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </Button>
          </div>
        )}

        {/* ── Success state ── */}
        {!isProcessing && importResult && (
          <div className="space-y-3">
            {/* File name */}
            <div className="flex items-center gap-2 rounded-md border p-3 bg-muted/30">
              <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
              <p className="text-sm font-medium truncate">{importResult.fileName}</p>
            </div>

            {/* Stats rows */}
            <div className="rounded-md border divide-y">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <span className="text-sm">Rows imported</span>
                </div>
                <span className="text-sm font-semibold text-emerald-600">{importResult.imported}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <span className="text-sm">Rows skipped</span>
                </div>
                <span className="text-sm font-semibold text-amber-600">{importResult.skipped}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="text-sm">Errors</span>
                </div>
                <span className="text-sm font-semibold text-red-600">{importResult.validationErrors}</span>
              </div>
            </div>

            {/* Policy summary */}
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-xs text-emerald-700">
                Auto Approved: {importResult.autoApproved} · Requires Approval: {importResult.requiresApproval} · Auto Rejected: {importResult.autoRejected}
              </p>
            </div>

            <div className="flex justify-end pt-1">
              <Button className="bg-red-600 hover:bg-red-700 text-white w-24" onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        )}

        {/* ── Drop zone state ── */}
        {!isProcessing && !importResult && (
          <div className="space-y-3">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
            >
              <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Drag & drop your CSV file here, or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">Supported format: .csv</p>
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ""; }} />
            </div>

            {uploadError && (
              <div className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 p-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                <p className="text-sm text-red-700">{uploadError}</p>
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
