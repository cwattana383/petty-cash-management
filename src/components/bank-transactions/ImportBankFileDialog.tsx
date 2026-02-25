import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, X } from "lucide-react";
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
  fileName: string;
}

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
  if (lines.length < 2) return { success: [], errors: ["File is empty or has no data rows."], fileName };

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
  const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    return { success: [], errors: [`Missing required columns: ${missing.join(", ")}`], fileName };
  }

  const success: BankTransaction[] = [];
  const errors: string[] = [];
  const fileId = `file-import-${Date.now()}`;

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ""; });

      const amount = parseFloat(row.billing_amount);
      if (isNaN(amount)) { errors.push(`Row ${i}: Invalid billing_amount "${row.billing_amount}"`); continue; }
      if (!row.transaction_id) { errors.push(`Row ${i}: Missing transaction_id`); continue; }

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
    }
  }

  return { success, errors, fileName };
}

export function ImportBankFileDialog({ open, onOpenChange, onImport }: ImportBankFileDialogProps) {
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please select a CSV file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseCSV(text, file.name);
      setParseResult(result);
    };
    reader.readAsText(file);
  };

  const handleConfirm = () => {
    if (parseResult && parseResult.success.length > 0) {
      onImport(parseResult.success);
      toast.success(`Imported ${parseResult.success.length} transactions successfully.`);
    }
    setParseResult(null);
    onOpenChange(false);
  };

  const handleClose = () => {
    setParseResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Bank File</DialogTitle>
          <DialogDescription>Upload a CSV file containing bank transactions. The system will automatically apply MCC policies.</DialogDescription>
        </DialogHeader>

        {!parseResult ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
          >
            <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">Click to select or drag & drop a CSV file</p>
            <p className="text-xs text-muted-foreground mt-1">Supported format: .csv</p>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ""; }} />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-md border p-3 bg-muted/30">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{parseResult.fileName}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setParseResult(null)}><X className="h-4 w-4" /></Button>
            </div>

            {parseResult.success.length > 0 && (
              <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">{parseResult.success.length} transactions parsed successfully</p>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    Auto Approved: {parseResult.success.filter(t => t.policy_result === "AUTO_APPROVED").length} · 
                    Requires Approval: {parseResult.success.filter(t => t.policy_result === "REQUIRES_APPROVAL").length} · 
                    Auto Rejected: {parseResult.success.filter(t => t.policy_result === "AUTO_REJECTED").length}
                  </p>
                </div>
              </div>
            )}

            {parseResult.errors.length > 0 && (
              <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">{parseResult.errors.length} error(s)</p>
                  <ul className="text-xs text-red-600 mt-1 space-y-0.5 max-h-24 overflow-auto">
                    {parseResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          {parseResult && parseResult.success.length > 0 && (
            <Button onClick={handleConfirm}>Import {parseResult.success.length} Transactions</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
