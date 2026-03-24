import { useState, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, CalendarIcon, Upload, X } from "lucide-react";
import { addMonths } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { mockClaims } from "@/lib/mock-data";
import { ClaimStatus } from "@/lib/types";
import { formatBEDate, cn } from "@/lib/utils";
import { format, subDays } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { ACCEPTED_MIME_TYPES, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from "@/lib/upload-types";
import { useNotifications } from "@/lib/notifications-context";
import OcrProcessingState from "@/components/claims/OcrProcessingState";
import OcrResultCard, { OcrResultState } from "@/components/claims/OcrResultCard";
import SupportingDocsSection, { SupportingFile } from "@/components/claims/SupportingDocsSection";
import AttachmentStatusBadge, { AttachmentOcrStatus } from "@/components/claims/AttachmentStatusBadge";
import NoDocumentWarningDialog from "@/components/claims/NoDocumentWarningDialog";

type StatusTab = "pending_invoice" | "rejected" | "approved" | "all";

const TAB_STATUS_MAP: Record<StatusTab, ClaimStatus[]> = {
  pending_invoice: ["Pending Invoice"],
  rejected: ["Auto Reject", "Reject", "Final Reject"],
  approved: ["Auto Approved", "Manager Approved", "Reimbursed"],
  all: [],
};

const statusVariant: Record<ClaimStatus, string> = {
  "Pending Invoice": "bg-orange-100 text-orange-800",
  "Pending Approval": "bg-yellow-100 text-yellow-800",
  "Final Rejected": "bg-red-100 text-red-800",
  "Auto Reject": "bg-red-100 text-red-800",
  "Reject": "bg-red-100 text-red-800",
  "Final Reject": "bg-red-100 text-red-800",
  "Auto Approved": "bg-green-100 text-green-800",
  "Manager Approved": "bg-green-100 text-green-800",
  "Reimbursed": "bg-emerald-100 text-emerald-800",
};

const THAI_MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

function getDeductionPeriod(txnDate: string): string {
  const d = addMonths(new Date(txnDate), 1);
  const beYear = d.getFullYear() + 543;
  const period = d.getMonth() + 1;
  return `Period ${period} / ${THAI_MONTHS_SHORT[d.getMonth()]} ${beYear}`;
}

// Upload dialog flow states
type UploadFlowState = "dropzone" | "processing" | "result" | "confirmed";

interface ClaimAttachmentData {
  taxInvoiceFileName: string;
  ocrStatus: AttachmentOcrStatus;
  supportingFiles: SupportingFile[];
  totalFileCount: number;
}

export default function MyClaims() {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<StatusTab>("pending_invoice");
  const [dateFrom, setDateFrom] = useState<Date>(subDays(new Date("2026-02-28"), 6));
  const [dateTo, setDateTo] = useState<Date>(new Date("2026-02-28"));

  // Attachment data per claim
  const [attachments, setAttachments] = useState<Record<string, ClaimAttachmentData>>({});
  const [claimStatuses, setClaimStatuses] = useState<Record<string, ClaimStatus>>({});

  // Upload dialog state
  const [uploadDialog, setUploadDialog] = useState<{ open: boolean; claimId: string }>({ open: false, claimId: "" });
  const [flowState, setFlowState] = useState<UploadFlowState>("dropzone");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResultState>("partial"); // demo default
  const [supportingFiles, setSupportingFiles] = useState<SupportingFile[]>([]);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // No-document warning dialog
  const [warningDialog, setWarningDialog] = useState<{ open: boolean; claimId: string }>({ open: false, claimId: "" });

  const getStatus = (claim: typeof mockClaims[0]): ClaimStatus => {
    return claimStatuses[claim.id] || claim.status;
  };

  const resetDialog = () => {
    setUploadDialog({ open: false, claimId: "" });
    setFlowState("dropzone");
    setSelectedFile(null);
    setSupportingFiles([]);
  };

  const handleOpenUploadDialog = (e: React.MouseEvent, claimId: string) => {
    e.stopPropagation();
    setFlowState("dropzone");
    setSelectedFile(null);
    setOcrResult("partial");
    setSupportingFiles([]);
    setUploadDialog({ open: true, claimId });
  };

  const handleFileSelected = useCallback((files: FileList | File[]) => {
    const file = Array.from(files)[0];
    if (!file) return;
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      toast({ title: "filesไม่รองรับ", description: "กรุณาอัปโหลด PDF, JPG หรือ PNG", variant: "destructive" });
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast({ title: "filesใหญ่เกินไป", description: `ขนาดfilesต้องไม่เกิน ${MAX_FILE_SIZE_MB}MB`, variant: "destructive" });
      return;
    }
    setSelectedFile(file);
    setFlowState("processing");
  }, []);

  const handleOcrComplete = useCallback(() => {
    setFlowState("result");
  }, []);

  const handleOcrConfirm = () => {
    setFlowState("confirmed");
  };

  const handleOcrReupload = () => {
    setSelectedFile(null);
    setFlowState("dropzone");
  };

  const handleFinalSubmit = () => {
    const { claimId } = uploadDialog;
    const totalFiles = 1 + supportingFiles.length;
    setAttachments((prev) => ({
      ...prev,
      [claimId]: {
        taxInvoiceFileName: selectedFile?.name || "tax-invoice.pdf",
        ocrStatus: ocrResult === "fail" ? "fail" : ocrResult === "partial" ? "partial" : "pass",
        supportingFiles,
        totalFileCount: totalFiles,
      },
    }));
    setClaimStatuses((prev) => ({ ...prev, [claimId]: "Pending Approval" }));
    resetDialog();
    toast({ title: "ส่งApproveสำเร็จ", description: `แนบ ${totalFiles} files สถานะเปลี่ยนเป็น Pending Approval` });
  };

  // Warning dialog: submit without document
  const handleSubmitWithoutDoc = (claimId: string) => {
    setClaimStatuses((prev) => ({ ...prev, [claimId]: "Pending Approval" }));
    setWarningDialog({ open: false, claimId: "" });
    toast({ title: "ส่งApproved", description: "Submit Without Document — อาจถูกหักเงินเดือนหากไม่แนบภายในกำหนด", variant: "destructive" });
  };

  const filtered = useMemo(() => {
    return mockClaims.filter((c) => {
      const status = getStatus(c);
      const allowedStatuses = TAB_STATUS_MAP[activeTab];
      if (allowedStatuses.length > 0 && !allowedStatuses.includes(status)) return false;
      const txnDate = new Date(c.createdDate);
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      if (txnDate < from || txnDate > to) return false;
      if (search) {
        const kw = search.toLowerCase();
        const searchable = [c.claimNo, c.purpose, c.requesterName].join(" ").toLowerCase();
        if (!searchable.includes(kw)) return false;
      }
      return true;
    });
  }, [search, activeTab, dateFrom, dateTo, claimStatuses]);

  const rejectedItems = useMemo(() => {
    const rejectedStatuses: ClaimStatus[] = ["Auto Reject", "Reject", "Final Reject"];
    return mockClaims.filter((c) => rejectedStatuses.includes(getStatus(c)));
  }, [claimStatuses]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Expenses</h1>
          <p className="text-muted-foreground">Manage your expenses</p>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={uploadInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFileSelected(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Summary Bar */}
      {rejectedItems.length > 0 && (
        <div className="border rounded-lg bg-card px-5 py-3.5 flex items-center gap-6">
          <div>
            <span className="text-muted-foreground text-sm">Transactions</span>
            <p className="font-semibold text-foreground">4 transactions</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <span className="text-muted-foreground text-sm">Total</span>
            <p className="font-semibold text-foreground text-lg">฿69,900</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <span className="text-muted-foreground text-sm">All rejected · Deduction period</span>
            <p className="font-semibold text-foreground">Period 3 / Mar 2026</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 p-4 border rounded-lg bg-card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search expenses..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Transaction Date:</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatBEDate(format(dateFrom, "yyyy-MM-dd"))}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFrom} onSelect={(d) => d && setDateFrom(d)} initialFocus />
            </PopoverContent>
          </Popover>
          <span className="text-sm text-muted-foreground">to</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatBEDate(format(dateTo, "yyyy-MM-dd"))}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateTo} onSelect={(d) => d && setDateTo(d)} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as StatusTab)}>
          <TabsList>
            <TabsTrigger value="pending_invoice">Pending Invoice</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction No.</TableHead>
              <TableHead>Transaction Date</TableHead>
              <TableHead>Merchant Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              {(activeTab === "rejected" || activeTab === "all") && <TableHead>Deduction Period</TableHead>}
              
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={(activeTab === "rejected" || activeTab === "all") ? 7 : 6} className="text-center text-muted-foreground py-8">No transactions found for this status.</TableCell></TableRow>
            ) : (
              filtered.map((c) => {
                const status = getStatus(c);
                const att = attachments[c.id];
                return (
                  <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/claims/${c.id}`)}>
                    <TableCell className="font-medium">{c.claimNo}</TableCell>
                    <TableCell>{formatBEDate(c.createdDate)}</TableCell>
                    <TableCell>{c.merchantName || "—"}</TableCell>
                    <TableCell>{c.purpose}</TableCell>
                    <TableCell className="text-right">฿{c.totalAmount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusVariant[status]}>{status}</Badge>
                    </TableCell>
                    {(activeTab === "rejected" || activeTab === "all") && (
                      <TableCell className="text-sm">
                        {["Auto Reject", "Final Reject"].includes(status)
                          ? getDeductionPeriod(c.createdDate)
                          : status === "Reject" ? "N/A" : "—"}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Upload Dialog with OCR Flow */}
      <Dialog open={uploadDialog.open} onOpenChange={(open) => { if (!open) resetDialog(); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>แนบเอกสาร</DialogTitle>
            <DialogDescription>อัปโหลดTax Invoiceเพื่อตรวจสอบอัตโนมัติ (PDF, JPG, PNG)</DialogDescription>
          </DialogHeader>

          {/* STATE: Dropzone */}
          {flowState === "dropzone" && (
            <div
              className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-primary transition-colors"
              onClick={() => uploadInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFileSelected(e.dataTransfer.files); }}
            >
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">ลากfilesTax Invoiceมาวาง หรือคลิกเพื่อเลือก</p>
              <p className="text-xs text-muted-foreground">รองรับ PDF, JPG, PNG ขนาดไม่เกิน {MAX_FILE_SIZE_MB}MB</p>
            </div>
          )}

          {/* STATE: Processing */}
          {flowState === "processing" && (
            <OcrProcessingState onComplete={handleOcrComplete} />
          )}

          {/* STATE: Result */}
          {flowState === "result" && selectedFile && (
            <OcrResultCard
              fileName={selectedFile.name}
              resultState={ocrResult}
              onConfirm={handleOcrConfirm}
              onReupload={handleOcrReupload}
            />
          )}

          {/* STATE: Confirmed — show supporting docs + final submit */}
          {flowState === "confirmed" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
                ✅ Tax Invoiceผ่านการตรวจสอบแล้ว — {selectedFile?.name}
              </div>

              <SupportingDocsSection
                files={supportingFiles}
                onChange={setSupportingFiles}
              />

              <div className="flex justify-end pt-2">
                <Button onClick={handleFinalSubmit}>
                  Confirm and Submit for Approval ({1 + supportingFiles.length} files)
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* No-document warning */}
      <NoDocumentWarningDialog
        open={warningDialog.open}
        onClose={() => setWarningDialog({ open: false, claimId: "" })}
        onGoBack={() => {
          const claimId = warningDialog.claimId;
          setWarningDialog({ open: false, claimId: "" });
          setUploadDialog({ open: true, claimId });
          setFlowState("dropzone");
          setSelectedFile(null);
          setSupportingFiles([]);
        }}
        onSubmitAnyway={() => handleSubmitWithoutDoc(warningDialog.claimId)}
      />
    </div>
  );
}
