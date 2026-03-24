import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, Check, X, MessageSquare, Clock, CheckCircle, XCircle,
  AlertCircle, Send, AlertTriangle, Upload, FileText, Image, ShieldCheck,
  Loader2, CheckCircle2, Info
} from "lucide-react";
import { formatBEDate } from "@/lib/utils";
import { useClaims } from "@/lib/claims-context";
import { getLevel1Options, getLevel2Options, getExpenseConfig } from "@/lib/expense-type-config";
import ExpenseLineItems from "@/components/claims/ExpenseLineItems";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import DocumentHeader from "@/components/claims/DocumentHeader";

const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
  "Pending Invoice": { color: "bg-orange-100 text-orange-800", icon: Clock },
  "Pending Approval": { color: "bg-yellow-100 text-yellow-800", icon: Clock },
  "Final Rejected": { color: "bg-red-100 text-red-800", icon: XCircle },
  "Auto Approved": { color: "bg-green-100 text-green-800", icon: CheckCircle },
  Reimbursed: { color: "bg-emerald-100 text-emerald-800", icon: CheckCircle },
};

const actionConfig: Record<string, { color: string; icon: React.ElementType }> = {
  Pending: { color: "border-yellow-400 bg-yellow-50", icon: Clock },
  Approved: { color: "border-green-400 bg-green-50", icon: CheckCircle },
  Rejected: { color: "border-red-400 bg-red-50", icon: XCircle },
  "Request Info": { color: "border-blue-400 bg-blue-50", icon: AlertCircle },
  Delegated: { color: "border-purple-400 bg-purple-50", icon: Send },
};

const COST_CENTERS = [
  "CC-FIN-001 Finance",
  "CC-IT-002 IT",
  "CC-HR-003 HR",
];

type DocTab = "tax-invoice" | "receipt" | "abbreviated" | "cash-bill" | "other";

const DOC_TABS: { key: DocTab; label: string; hint: string }[] = [
  { key: "tax-invoice", label: "Tax Invoice", hint: "Must include: invoice number, seller name & address, tax ID, date, VAT amount" },
  { key: "receipt", label: "Receipt", hint: "Must include: payee name & address, date, line items, total amount" },
  { key: "abbreviated", label: "Abbreviated Receipt", hint: "Allowed only for transactions under THB 2,000. Must include: date, shop name, total" },
  { key: "cash-bill", label: "Cash Bill", hint: "Must include: shop name, date, itemized list, total" },
  { key: "other", label: "Other", hint: "Attach any other relevant document" },
];

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: string;
  progress: number;
  ocrStatus: "uploading" | "processing" | "passed" | "incomplete";
}

const SIMULATED_FILES = [
  { name: "INV-2025-0129.pdf", type: "PDF", size: "245 KB" },
  { name: "receipt-grab.jpg", type: "JPG", size: "1.2 MB" },
  { name: "taxi-receipt-scan.png", type: "PNG", size: "890 KB" },
];

export default function ClaimDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getClaimById, updateClaim } = useClaims();
  const { toast } = useToast();
  const claim = getClaimById(id || "");

  // Action dialog
  const [actionDialog, setActionDialog] = useState<{ open: boolean; type: "approve" | "reject" | "info" }>({ open: false, type: "approve" });
  const [comment, setComment] = useState("");

  // Editable fields
  const [purpose, setPurpose] = useState("");
  const [expenseType, setExpenseType] = useState("");
  const [subExpenseType, setSubExpenseType] = useState("");
  const [glAccount, setGlAccount] = useState("");
  const [costCenter, setCostCenter] = useState("");
  const [projectCode, setProjectCode] = useState("");

  // Document uploads per doc slot (keyed by doc id)
  const [docUploads, setDocUploads] = useState<Record<string, UploadedFile>>({});

  // Overseas approval
  const [overseasApprovalStatus, setOverseasApprovalStatus] = useState<"pending" | "approved">("pending");
  const [travelApprovalFiles, setTravelApprovalFiles] = useState<UploadedFile[]>([]);

  // Documents (legacy general uploads)
  const [activeDocTab, setActiveDocTab] = useState<DocTab>("tax-invoice");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileCounter = useRef(0);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Derived config
  const selectedConfig = expenseType && subExpenseType ? getExpenseConfig(expenseType, subExpenseType) : null;
  const isAutoReject = selectedConfig?.policyRule === "Auto Reject";
  const allRequiredDocs = selectedConfig?.requiredDocs || [];
  const allOptionalDocs = selectedConfig?.optionalDocs || [];
  const allRequiredUploaded = allRequiredDocs.length === 0 || allRequiredDocs.every((d) => docUploads[d.id]);

  const simulateUpload = useCallback((files: UploadedFile[], setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>) => {
    const simFile = SIMULATED_FILES[fileCounter.current % SIMULATED_FILES.length];
    fileCounter.current += 1;
    const newFile: UploadedFile = {
      id: `file-${Date.now()}`,
      name: simFile.name,
      type: simFile.type,
      size: simFile.size,
      progress: 0,
      ocrStatus: "uploading",
    };
    setFiles((prev) => [...prev, newFile]);

    // Simulate progress
    let prog = 0;
    const interval = setInterval(() => {
      prog += 20;
      if (prog >= 100) {
        clearInterval(interval);
        setFiles((prev) =>
          prev.map((f) => f.id === newFile.id ? { ...f, progress: 100, ocrStatus: "processing" } : f)
        );
        // Simulate OCR after upload
        setTimeout(() => {
          const passed = Math.random() > 0.25;
          setFiles((prev) =>
            prev.map((f) => f.id === newFile.id ? { ...f, ocrStatus: passed ? "passed" : "incomplete" } : f)
          );
        }, 2000);
      } else {
        setFiles((prev) =>
          prev.map((f) => f.id === newFile.id ? { ...f, progress: prog } : f)
        );
      }
    }, 400);
  }, []);

  const simulateDocSlotUpload = useCallback((docId: string) => {
    const simFile = SIMULATED_FILES[fileCounter.current % SIMULATED_FILES.length];
    fileCounter.current += 1;
    const newFile: UploadedFile = {
      id: `doc-${docId}-${Date.now()}`,
      name: simFile.name,
      type: simFile.type,
      size: simFile.size,
      progress: 0,
      ocrStatus: "uploading",
    };
    setDocUploads((prev) => ({ ...prev, [docId]: newFile }));

    let prog = 0;
    const interval = setInterval(() => {
      prog += 25;
      if (prog >= 100) {
        clearInterval(interval);
        setDocUploads((prev) => prev[docId] ? ({ ...prev, [docId]: { ...prev[docId], progress: 100, ocrStatus: "passed" } }) : prev);
      } else {
        setDocUploads((prev) => prev[docId] ? ({ ...prev, [docId]: { ...prev[docId], progress: prog } }) : prev);
      }
    }, 300);
  }, []);

  if (!claim) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-muted-foreground">Claim not found</p>
        <Button variant="link" onClick={() => navigate("/claims")}>Back to claims</Button>
      </div>
    );
  }

  const isOverseas = expenseType === "Transportation — Overseas";

  const handleSaveDraft = () => {
    toast({ title: "Draft Saved", description: "Your changes have been saved as a draft." });
  };

  const handleSubmit = () => {
    if (isAutoReject) return;
    const newErrors: Record<string, string> = {};
    if (!purpose.trim()) newErrors.purpose = "Purpose is required";
    if (!expenseType) newErrors.expenseType = "Expense Type is required";
    if (!subExpenseType) newErrors.subExpenseType = "Sub Expense Type is required";
    if (!glAccount) newErrors.glAccount = "GL Account is required";
    if (isOverseas && overseasApprovalStatus !== "approved") {
      newErrors.overseas = "Travel approval is required before submitting.";
    }
    if (!allRequiredUploaded) {
      newErrors.documents = "All required documents must be uploaded before submitting.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({ title: "Validation Error", description: "Please complete all required fields.", variant: "destructive" });
      return;
    }

    setErrors({});
    updateClaim(claim.id, { status: "Pending Approval" });
    toast({ title: "Submitted", description: `${claim.claimNo} has been submitted for approval.` });
  };

  const sc = statusConfig[claim.status] || statusConfig["Pending Invoice"];

  const handleAction = (type: "approve" | "reject" | "info") => {
    const newStatus = type === "approve" ? "Auto Approved" : type === "reject" ? "Final Rejected" : "Pending Approval";
    const actionLabel = type === "approve" ? "Approved" : type === "reject" ? "Rejected" : "Request Info";

    updateClaim(claim.id, {
      status: newStatus,
      approvalHistory: claim.approvalHistory.map((s, i) =>
        i === claim.approvalHistory.length - 1
          ? { ...s, action: actionLabel as any, comment, actionDate: new Date().toISOString().slice(0, 10) }
          : s
      ),
      comments: comment
        ? [...claim.comments, { id: `cm-${Date.now()}`, userId: "u2", userName: "สมหญิง แก้วใส", text: comment, date: new Date().toISOString().slice(0, 10) }]
        : claim.comments,
    });

    toast({ title: `Claim ${actionLabel}`, description: `${claim.claimNo} has been ${actionLabel.toLowerCase()}` });
    setActionDialog({ open: false, type: "approve" });
    setComment("");
  };

  const isPendingApproval = claim.status === "Pending Approval";

  const ocrResultFile = uploadedFiles.find((f) => f.ocrStatus === "passed" || f.ocrStatus === "incomplete");

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{claim.claimNo}</h1>
          <p className="text-muted-foreground">{claim.purpose}</p>
        </div>
        {isPendingApproval && (
          <div className="flex gap-2">
            <Button variant="outline" className="text-green-600 border-green-300 hover:bg-green-50" onClick={() => setActionDialog({ open: true, type: "approve" })}>
              <Check className="h-4 w-4 mr-1" />Approve
            </Button>
            <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => setActionDialog({ open: true, type: "reject" })}>
              <X className="h-4 w-4 mr-1" />Reject
            </Button>
            <Button variant="outline" onClick={() => setActionDialog({ open: true, type: "info" })}>
              <MessageSquare className="h-4 w-4 mr-1" />Request Info
            </Button>
          </div>
        )}
      </div>

      {/* Section 1 — Transaction Header (read-only) */}
      <DocumentHeader
        advanceNo={claim.claimNo}
        glNo="-"
        status={claim.status as any}
        createDate={new Date(claim.createdDate)}
      />

      {/* Section 2 — Transaction Details (read-only) */}
      <Card className="border border-border rounded-xl">
        <CardHeader><CardTitle className="text-base font-bold">Transaction Details</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold text-foreground">Transaction No.</Label>
              <Input value={claim.claimNo} readOnly className="bg-muted/40 border-border text-[13px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold text-foreground">Transaction Date</Label>
              <Input value={formatBEDate(claim.createdDate)} readOnly className="bg-muted/40 border-border text-[13px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold text-foreground">Merchant Name</Label>
              <Input value={claim.merchantName || "GRAB TAXI"} readOnly className="bg-muted/40 border-border text-[13px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold text-foreground">Amount</Label>
              <Input
                value={claim.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                readOnly
                className="bg-muted/40 border-border text-right text-[13px]"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-[13px] font-semibold text-foreground">Description</Label>
              <Input value={claim.purpose} readOnly className="bg-muted/40 border-border text-[13px]" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border rounded-xl">
        <CardHeader>
          <div>
            <CardTitle className="text-base font-bold">Expense Information</CardTitle>
            <p className="text-[13px] text-muted-foreground mt-0.5">Completed by Cardholder</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[13px] font-semibold text-foreground">Purpose <span className="text-destructive">*</span></Label>
            <Textarea
              placeholder="Describe the business purpose of this expense"
              value={purpose}
              onChange={(e) => { setPurpose(e.target.value); setErrors((p) => ({ ...p, purpose: "" })); }}
              className="text-[13px] min-h-[80px]"
            />
            {errors.purpose && <p className="text-xs text-destructive">{errors.purpose}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold text-foreground">Expense Type <span className="text-destructive">*</span></Label>
              <Select value={expenseType} onValueChange={(v) => {
                setExpenseType(v);
                setSubExpenseType("");
                setGlAccount("");
                setDocUploads({});
                setErrors((p) => ({ ...p, expenseType: "" }));
              }}>
                <SelectTrigger className="text-[13px]"><SelectValue placeholder="Select expense type" /></SelectTrigger>
                <SelectContent>
                  {getLevel1Options().map((t) => <SelectItem key={t} value={t} className="text-[13px]">{t}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.expenseType && <p className="text-xs text-destructive">{errors.expenseType}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold text-foreground">Sub Expense Type <span className="text-destructive">*</span></Label>
              <Select
                value={subExpenseType}
                onValueChange={(v) => {
                  setSubExpenseType(v);
                  setDocUploads({});
                  const config = getExpenseConfig(expenseType, v);
                  if (config?.glCode) {
                    setGlAccount(config.glCode);
                  } else {
                    setGlAccount("");
                  }
                  setErrors((p) => ({ ...p, subExpenseType: "" }));
                }}
                disabled={!expenseType}
              >
                <SelectTrigger className="text-[13px]"><SelectValue placeholder={expenseType ? "Select sub type" : "Select expense type first"} /></SelectTrigger>
                <SelectContent>
                  {getLevel2Options(expenseType).map((t) => <SelectItem key={t} value={t} className="text-[13px]">{t}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.subExpenseType && <p className="text-xs text-destructive">{errors.subExpenseType}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-[13px] font-semibold text-foreground">GL Account <span className="text-destructive">*</span></Label>
              <Input value={glAccount} readOnly className="bg-muted/40 border-border text-[13px]" placeholder="Auto-filled from sub expense type" />
              {errors.glAccount && <p className="text-xs text-destructive">{errors.glAccount}</p>}
            </div>

          </div>

          {/* Policy info banner */}
          {selectedConfig && (
            <div className="space-y-3 mt-3">
              {selectedConfig.policyRule === "Auto Reject" && (
                <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                  <p className="text-[13px] text-red-800 font-medium">
                    This expense type cannot be reimbursed per company policy.
                  </p>
                </div>
              )}
              {selectedConfig.policyRule === "Requires Approval" && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <p className="text-[13px] text-amber-800 font-medium">
                    This expense requires manager approval before processing.
                  </p>
                </div>
              )}
              {selectedConfig.policyRule === "Auto Approve" && (
                <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  <p className="text-[13px] text-emerald-800 font-medium">
                    This expense will be auto-approved{selectedConfig.threshold !== null && <> if within threshold (THB {selectedConfig.threshold.toLocaleString()})</>}.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Required & Optional Documents Section */}
      {selectedConfig && !isAutoReject && (allRequiredDocs.length > 0 || allOptionalDocs.length > 0) && (
        <Card className="border border-border rounded-xl">
          <CardHeader>
            <CardTitle className="text-base font-bold">Required Documents</CardTitle>
            <p className="text-[13px] text-muted-foreground mt-0.5">Upload all required documents before submitting.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Required docs */}
            {allRequiredDocs.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-red-700 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
                  Required — must upload before submit
                </p>
                <div className="space-y-2">
                  {allRequiredDocs.map((doc) => {
                    const uploaded = docUploads[doc.id];
                    return (
                      <div key={doc.id} className={`flex items-center gap-3 p-3 rounded-lg border ${uploaded ? "border-emerald-200 bg-emerald-50/50" : "border-border bg-background"}`}>
                        <div className="shrink-0">
                          {uploaded ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-foreground">{doc.label}</p>
                          {uploaded && (
                            <p className="text-xs text-muted-foreground mt-0.5">{uploaded.name} • {uploaded.size}</p>
                          )}
                        </div>
                        {uploaded ? (
                          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setDocUploads((prev) => { const n = { ...prev }; delete n[doc.id]; return n; })}>
                            Remove
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => simulateDocSlotUpload(doc.id)}>
                            <Upload className="h-3 w-3" /> Upload
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Optional docs */}
            {allOptionalDocs.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400 inline-block" />
                  Optional — recommended but not required
                </p>
                <div className="space-y-2">
                  {allOptionalDocs.map((doc) => {
                    const uploaded = docUploads[doc.id];
                    return (
                      <div key={doc.id} className={`flex items-center gap-3 p-3 rounded-lg border ${uploaded ? "border-emerald-200 bg-emerald-50/50" : "border-dashed border-border bg-background"}`}>
                        <div className="shrink-0">
                          {uploaded ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          ) : (
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-muted-foreground">{doc.label}</p>
                          {uploaded && (
                            <p className="text-xs text-muted-foreground mt-0.5">{uploaded.name} • {uploaded.size}</p>
                          )}
                        </div>
                        {uploaded ? (
                          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setDocUploads((prev) => { const n = { ...prev }; delete n[doc.id]; return n; })}>
                            Remove
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" className="text-xs gap-1" onClick={() => simulateDocSlotUpload(doc.id)}>
                            <Upload className="h-3 w-3" /> Upload
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedConfig.notes && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                <p className="text-xs text-blue-700 flex items-start gap-1.5">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  {selectedConfig.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}


      {/* Section 4 — Overseas Travel Approval Alert (conditional) */}
      {isOverseas && (
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[14px] font-semibold text-amber-900">Overseas Travel — Pre-approval Required</h4>
                <Badge className={overseasApprovalStatus === "approved"
                  ? "bg-green-100 text-green-800 border-green-200"
                  : "bg-amber-100 text-amber-800 border-amber-200"
                } variant="outline">
                  {overseasApprovalStatus === "approved" ? "Approved" : "Pending Approval"}
                </Badge>
              </div>
              <p className="text-[13px] text-amber-800">
                Please attach your travel approval document before uploading receipts.
              </p>
              {overseasApprovalStatus === "pending" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-400 text-amber-800 hover:bg-amber-100"
                  onClick={() => setOverseasApprovalStatus("approved")}
                >
                  Check Status
                </Button>
              )}
            </div>
          </div>
          {errors.overseas && <p className="text-xs text-destructive">{errors.overseas}</p>}

          <Card className="border border-border rounded-xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Travel Approval Documents <span className="text-destructive">*</span></CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => simulateUpload(travelApprovalFiles, setTravelApprovalFiles)}
              >
                <Upload className="h-6 w-6 text-muted-foreground" />
                <p className="text-[13px] text-muted-foreground">Click to upload Travel Approval Form (TR-001)</p>
                <p className="text-xs text-muted-foreground">Supports PDF, JPG, PNG — Max 10 MB per file</p>
              </div>
              {travelApprovalFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {travelApprovalFiles.map((f) => (
                    <FileRow key={f.id} file={f} onRemove={() => setTravelApprovalFiles((prev) => prev.filter((x) => x.id !== f.id))} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}


      {/* Approval Timeline */}
      {claim.approvalHistory.length > 0 && (
        <Card className="border border-border rounded-xl">
          <CardHeader><CardTitle className="text-base">Approval Timeline</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {claim.approvalHistory.map((step, i) => {
                const ac = actionConfig[step.action] || actionConfig.Pending;
                const Icon = ac.icon;
                return (
                  <div key={i} className={`border-l-4 ${ac.color} p-4 rounded-r-lg`}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="font-medium">Step {step.stepNo}: {step.approverName}</span>
                      <Badge variant="outline">{step.action}</Badge>
                      {step.actionDate && <span className="text-xs text-muted-foreground ml-auto">{formatBEDate(step.actionDate)}</span>}
                    </div>
                    {step.comment && <p className="text-sm text-muted-foreground mt-1">{step.comment}</p>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments */}
      {claim.comments.length > 0 && (
        <Card className="border border-border rounded-xl">
          <CardHeader><CardTitle className="text-base">Comments ({claim.comments.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {claim.comments.map((c) => (
              <div key={c.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{c.userName}</span>
                  <span className="text-xs text-muted-foreground">{formatBEDate(c.date)}</span>
                </div>
                <p className="text-sm mt-1">{c.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Section 6 — Action Bar (sticky footer) */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-6 py-3 flex justify-end gap-3 z-50">
        <Button variant="outline" onClick={handleSaveDraft}>
          Save Draft
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isAutoReject || (selectedConfig && allRequiredDocs.length > 0 && !allRequiredUploaded)}
          className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
        >
          Submit for Approval
        </Button>
      </div>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog((prev) => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === "approve" ? "Approve Claim" : actionDialog.type === "reject" ? "Reject Claim" : "Request More Information"}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder={actionDialog.type === "reject" ? "Reason for rejection (required)..." : "Add a comment (optional)..."}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionDialog({ open: false, type: "approve" }); setComment(""); }}>Cancel</Button>
            <Button
              onClick={() => handleAction(actionDialog.type)}
              disabled={actionDialog.type === "reject" && !comment.trim()}
              className={actionDialog.type === "approve" ? "bg-green-600 hover:bg-green-700" : actionDialog.type === "reject" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {actionDialog.type === "approve" ? "Approve" : actionDialog.type === "reject" ? "Reject" : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── File Row Component ─── */
function FileRow({ file, onRemove }: { file: UploadedFile; onRemove: () => void }) {
  const isPdf = file.type === "PDF";
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background">
      <div className={`h-9 w-9 rounded flex items-center justify-center shrink-0 ${isPdf ? "bg-red-100" : "bg-green-100"}`}>
        {isPdf ? <FileText className="h-4 w-4 text-red-600" /> : <Image className="h-4 w-4 text-green-600" />}
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <p className="text-xs font-medium truncate">{file.name}</p>
          <span className="text-[10px] text-muted-foreground">{file.type} • {file.size}</span>
        </div>
        {file.progress < 100 && (
          <Progress value={file.progress} className="h-1.5" />
        )}
      </div>
      <div className="shrink-0">
        {file.ocrStatus === "uploading" && <span className="text-xs text-muted-foreground">Uploading...</span>}
        {file.ocrStatus === "processing" && (
          <span className="text-xs text-blue-600 flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" /> Processing OCR...
          </span>
        )}
        {file.ocrStatus === "passed" && (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px]">
            <CheckCircle2 className="h-3 w-3 mr-1" /> OCR Passed
          </Badge>
        )}
        {file.ocrStatus === "incomplete" && (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">
            <AlertTriangle className="h-3 w-3 mr-1" /> OCR — Incomplete data
          </Badge>
        )}
      </div>
      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onRemove}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
