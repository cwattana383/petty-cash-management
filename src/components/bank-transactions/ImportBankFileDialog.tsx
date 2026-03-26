import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, X, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { BankTransaction, PolicyResult, ProcessingStatus } from "@/lib/corporate-card-types";
import { mockMccPolicies } from "@/lib/corporate-card-mock-data";
import { toast } from "sonner";

interface ImportBankFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (transactions: BankTransaction[]) => void;
}

interface ParseResult {
  success: BankTransaction[];
  errors: string[];
  skipped: number;
  fileName: string;
}

type DialogStep = "upload" | "processing" | "result";

const REQUIRED_HEADERS = [
  "transaction_id",
  "cardholder_employee_id",
  "cardholder_name",
  "transaction_date",
  "posting_date",
  "billing_amount",
  "billing_currency",
  "merchant_name",
  "merchant_city",
  "merchant_country",
  "mcc_code",
  "mcc_description",
  "transaction_type",
  "authorization_code",
  "reference_number",
];

// Track previously imported files
const processedFiles: Set<string> = new Set();

function applyPolicy(mccCode: string, amount: number): { result: PolicyResult; reason: string } {
  const policy = mockMccPolicies.find((p) => p.mcc_code === mccCode && p.active_flag);
  if (!policy) return { result: "REQUIRES_APPROVAL", reason: `No active policy for MCC ${mccCode}` };
  if (policy.policy_type === "AUTO_REJECT") return { result: "AUTO_REJECTED", reason: `MCC ${mccCode} is auto-rejected per company policy` };
  if (policy.policy_type === "REQUIRES_APPROVAL") return { result: "REQUIRES_APPROVAL", reason: `${policy.description} requires manager approval` };
  if (policy.threshold_amount && amount > policy.threshold_amount) {
    return { result: "REQUIRES_APPROVAL", reason: `Amount ${amount.toLocaleString()} exceeds threshold ${policy.threshold_amount.toLocaleString()}` };
  }
  return { result: "AUTO_APPROVED", reason: `Amount within ${policy.description} threshold ${policy.threshold_amount?.toLocaleString() ?? "N/A"}` };
}

function parseCSV(text: string, fileName: string): ParseResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { success: [], errors: ["File is empty or has no data rows."], skipped: 0, fileName };

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
  const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    return { success: [], errors: [`Missing required columns: ${missing.join(", ")}`], skipped: 0, fileName };
  }

  const success: BankTransaction[] = [];
  const errors: string[] = [];
  let skipped = 0;
  const fileId = `file-import-${Date.now()}`;

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ""; });

      const amount = parseFloat(row.billing_amount);
      if (isNaN(amount)) { errors.push(`Row ${i}: Invalid billing_amount "${row.billing_amount}"`); skipped++; continue; }
      if (!row.transaction_id) { errors.push(`Row ${i}: Missing transaction_id`); skipped++; continue; }

      const { result, reason } = applyPolicy(row.mcc_code, amount);

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
        transaction_type: row.transaction_type,
        authorization_code: row.authorization_code,
        reference_number: row.reference_number,
        policy_result: result,
        policy_reason: reason,
        processing_status: "NEW" as ProcessingStatus,
        created_at: new Date().toISOString(),
      });
    } catch {
      errors.push(`Row ${i}: Failed to parse row`);
      skipped++;
    }
  }

  return { success, errors, skipped, fileName };
}

export function ImportBankFileDialog({ open, onOpenChange, onImport }: ImportBankFileDialogProps) {
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [step, setStep] = useState<DialogStep>("upload");
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setParseResult(null);
    setStep("upload");
    setFileError(null);
    setIsDragging(false);
  }, []);

  const handleFile = useCallback((file: File) => {
    setFileError(null);

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setFileError("Only .csv files are accepted. Please upload a valid bank statement file.");
      return;
    }

    // Duplicate check
    const fileKey = `${file.name}_${file.lastModified}`;
    if (processedFiles.has(fileKey)) {
      setFileError("This file has already been processed. Please check the file and try again.");
      return;
    }

    // Start processing
    setStep("processing");

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseCSV(text, file.name);

      // Simulate processing delay
      setTimeout(() => {
        processedFiles.add(fileKey);
        setParseResult(result);
        setStep("result");
      }, 2000);
    };
    reader.readAsText(file);
  }, []);

  const handleDone = () => {
    if (parseResult && parseResult.success.length > 0) {
      onImport(parseResult.success);
      toast.success(`Imported ${parseResult.success.length} transactions successfully.`);
    }
    resetState();
    onOpenChange(false);
  };

  const handleClose = () => {
    resetState();
    onOpenChange(false);
  };

  // Reset when dialog opens
  useEffect(() => {
    if (open) resetState();
  }, [open, resetState]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Bank File</DialogTitle>
          <DialogDescription>
            Upload a CSV file containing bank transactions. The system will automatically apply MCC policies.
          </DialogDescription>
        </DialogHeader>

        {/* STEP 1: Upload */}
        {step === "upload" && (
          <div className="space-y-3">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
              }}
            >
              <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Drag & drop your CSV file here, or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">Supported format: .csv</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFile(e.target.files[0]);
                  e.target.value = "";
                }}
              />
            </div>

            {fileError && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-destructive">{fileError}</p>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Processing */}
        {step === "processing" && (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <div className="text-center">
              <p className="text-sm font-medium">Processing... Please wait while we import your transactions.</p>
              <p className="text-xs text-muted-foreground mt-1">Validating data and applying policies</p>
            </div>
          </div>
        )}

        {/* STEP 3: Result Summary */}
        {step === "result" && parseResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-md border p-3 bg-muted/30">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm font-medium truncate flex-1">{parseResult.fileName}</p>
            </div>

            <div className="rounded-lg border divide-y">
              {/* Imported */}
              <div className="flex items-center gap-3 p-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <span className="text-sm flex-1">Rows imported</span>
                <span className="text-sm font-semibold text-emerald-700">{parseResult.success.length}</span>
              </div>
              {/* Skipped */}
              <div className="flex items-center gap-3 p-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                <span className="text-sm flex-1">Rows skipped</span>
                <span className="text-sm font-semibold text-amber-600">{parseResult.skipped}</span>
              </div>
              {/* Errors */}
              <div className="flex items-center gap-3 p-3">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                <span className="text-sm flex-1">Errors</span>
                <span className="text-sm font-semibold text-destructive">{parseResult.errors.length}</span>
              </div>
            </div>

            {parseResult.success.length > 0 && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-xs text-emerald-700">
                  Auto Approved: {parseResult.success.filter(t => t.policy_result === "AUTO_APPROVED").length} ·{" "}
                  Requires Approval: {parseResult.success.filter(t => t.policy_result === "REQUIRES_APPROVAL").length} ·{" "}
                  Auto Rejected: {parseResult.success.filter(t => t.policy_result === "AUTO_REJECTED").length}
                </p>
              </div>
            )}

            {parseResult.errors.length > 0 && (
              <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3">
                <ul className="text-xs text-destructive space-y-0.5 max-h-24 overflow-auto">
                  {parseResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "upload" && (
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
          )}
          {step === "processing" && (
            <Button disabled>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing...
            </Button>
          )}
          {step === "result" && (
            <Button onClick={handleDone}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
