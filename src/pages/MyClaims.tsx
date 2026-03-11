import { useState, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, CalendarIcon, Paperclip, Upload, FileText, X, AlertCircle } from "lucide-react";
import { addMonths } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { mockClaims } from "@/lib/mock-data";
import { ClaimStatus } from "@/lib/types";
import { formatBEDate, cn } from "@/lib/utils";
import { format, subDays } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { ACCEPTED_MIME_TYPES, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from "@/lib/upload-types";
import { useNotifications } from "@/lib/notifications-context";

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

const DOC_TYPE_OPTIONS = [
  "ใบกำกับภาษี",
  "ใบเสร็จรับเงิน",
  "ใบอนุมัติเดินทาง",
  "รายชื่อผู้เข้าร่วม",
  "รายงานการเดินทาง",
  "เอกสารอื่นๆ",
] as const;

type DocType = typeof DOC_TYPE_OPTIONS[number];

const MAX_FILES_PER_TXN = 5;

interface AttachedFileEntry {
  file: File;
  docType: DocType;
}

interface SavedAttachment {
  fileName: string;
  size: number;
  docType: DocType;
}

const THAI_MONTHS_SHORT = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

function getDeductionPeriod(txnDate: string): string {
  const d = addMonths(new Date(txnDate), 1);
  const beYear = d.getFullYear() + 543;
  const period = d.getMonth() + 1;
  return `งวดที่ ${period} / ${THAI_MONTHS_SHORT[d.getMonth()]} ${beYear}`;
}

export default function MyClaims() {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<StatusTab>("pending_invoice");
  const [dateFrom, setDateFrom] = useState<Date>(subDays(new Date("2026-02-28"), 6));
  const [dateTo, setDateTo] = useState<Date>(new Date("2026-02-28"));

  // Multi-file attachments per claim
  const [savedAttachments, setSavedAttachments] = useState<Record<string, SavedAttachment[]>>({});
  const [claimStatuses, setClaimStatuses] = useState<Record<string, ClaimStatus>>({});

  // Upload dialog state
  const [uploadDialog, setUploadDialog] = useState<{ open: boolean; claimId: string }>({ open: false, claimId: "" });
  const [pendingFiles, setPendingFiles] = useState<AttachedFileEntry[]>([]);
  const [showValidation, setShowValidation] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const getStatus = (claim: typeof mockClaims[0]): ClaimStatus => {
    return claimStatuses[claim.id] || claim.status;
  };

  const hasTaxInvoice = pendingFiles.some((f) => f.docType === "ใบกำกับภาษี");

  const handleOpenUploadDialog = (e: React.MouseEvent, claimId: string) => {
    e.stopPropagation();
    const existing = savedAttachments[claimId];
    setPendingFiles(
      existing
        ? existing.map((a) => ({ file: new File([], a.fileName, {}), docType: a.docType }))
        : []
    );
    setShowValidation(false);
    setUploadDialog({ open: true, claimId });
  };

  const handleAddFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    const remaining = MAX_FILES_PER_TXN - pendingFiles.length;
    if (remaining <= 0) {
      toast({ title: "จำกัดสูงสุด", description: `อัปโหลดได้สูงสุด ${MAX_FILES_PER_TXN} ไฟล์ต่อรายการ`, variant: "destructive" });
      return;
    }
    const toAdd = arr.slice(0, remaining);
    const invalid: string[] = [];
    const valid: AttachedFileEntry[] = [];
    for (const f of toAdd) {
      if (!ACCEPTED_MIME_TYPES.includes(f.type)) {
        invalid.push(`"${f.name}" — ไม่รองรับ`);
        continue;
      }
      if (f.size > MAX_FILE_SIZE_BYTES) {
        invalid.push(`"${f.name}" — เกิน ${MAX_FILE_SIZE_MB}MB`);
        continue;
      }
      valid.push({ file: f, docType: "เอกสารอื่นๆ" });
    }
    if (invalid.length) toast({ title: "ไฟล์ไม่ผ่าน", description: invalid.join(", "), variant: "destructive" });
    if (valid.length) setPendingFiles((prev) => [...prev, ...valid]);
  }, [pendingFiles.length]);

  const handleRemovePendingFile = (idx: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDocTypeChange = (idx: number, type: DocType) => {
    setPendingFiles((prev) => prev.map((f, i) => (i === idx ? { ...f, docType: type } : f)));
  };

  const handleSubmitFiles = () => {
    if (!hasTaxInvoice) {
      setShowValidation(true);
      return;
    }
    const { claimId } = uploadDialog;
    setSavedAttachments((prev) => ({
      ...prev,
      [claimId]: pendingFiles.map((f) => ({ fileName: f.file.name || f.docType, size: f.file.size, docType: f.docType })),
    }));
    setClaimStatuses((prev) => ({ ...prev, [claimId]: "Pending Approval" }));
    setUploadDialog({ open: false, claimId: "" });
    toast({ title: "แนบเอกสารสำเร็จ", description: "สถานะเปลี่ยนเป็น Pending Approval" });
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

  // Always compute rejected summary (independent of active tab)
  const rejectedItems = useMemo(() => {
    const rejectedStatuses: ClaimStatus[] = ["Auto Reject", "Reject", "Final Reject"];
    return mockClaims.filter((c) => {
      const status = getStatus(c);
      return rejectedStatuses.includes(status);
    });
  }, [claimStatuses]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Expenses</h1>
          <p className="text-muted-foreground">Manage your expenses</p>
        </div>
      </div>

      {/* Hidden file input for upload dialog */}
      <input
        ref={uploadInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleAddFiles(e.target.files);
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
            <p className="font-semibold text-foreground">งวดที่ 3 / มี.ค. 2569</p>
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
              <TableHead>Attached File</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={(activeTab === "rejected" || activeTab === "all") ? 8 : 7} className="text-center text-muted-foreground py-8">No transactions found for this status.</TableCell></TableRow>
            ) : (
              filtered.map((c) => {
                const status = getStatus(c);
                const saved = savedAttachments[c.id];
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
                          : status === "Reject"
                            ? "N/A"
                            : "—"}
                      </TableCell>
                    )}
                    <TableCell>
                      {saved && saved.length > 0 ? (
                        <div className="flex items-center gap-1.5 text-sm">
                          <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{saved.length} file(s)</span>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={(e) => handleOpenUploadDialog(e, c.id)}
                        >
                          <Paperclip className="h-3.5 w-3.5 mr-1" />
                          Attach File
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Multi-file Upload Dialog */}
      <Dialog open={uploadDialog.open} onOpenChange={(open) => { if (!open) setUploadDialog({ open: false, claimId: "" }); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>แนบเอกสาร</DialogTitle>
            <DialogDescription>อัปโหลดเอกสารได้สูงสุด {MAX_FILES_PER_TXN} ไฟล์ต่อรายการ (PDF, JPG, PNG)</DialogDescription>
          </DialogHeader>

          {/* Drop zone */}
          <div
            className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-primary transition-colors"
            onClick={() => uploadInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleAddFiles(e.dataTransfer.files); }}
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">ลากไฟล์มาวาง หรือคลิกเพื่อเลือก</p>
            <p className="text-xs text-muted-foreground">({pendingFiles.length}/{MAX_FILES_PER_TXN} files)</p>
          </div>

          {/* File list */}
          {pendingFiles.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {pendingFiles.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{entry.file.name || entry.docType}</p>
                    {entry.file.size > 0 && (
                      <p className="text-xs text-muted-foreground">{(entry.file.size / 1024).toFixed(0)} KB</p>
                    )}
                  </div>
                  <Select value={entry.docType} onValueChange={(v) => handleDocTypeChange(idx, v as DocType)}>
                    <SelectTrigger className="w-[160px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOC_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleRemovePendingFile(idx)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Validation message */}
          {showValidation && !hasTaxInvoice && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>กรุณาระบุใบกำกับภาษีอย่างน้อย 1 ฉบับ</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setUploadDialog({ open: false, claimId: "" })}>ยกเลิก</Button>
            <Button
              onClick={handleSubmitFiles}
              disabled={pendingFiles.length === 0}
            >
              ยืนยันและส่งอนุมัติ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
