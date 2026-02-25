import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, CalendarIcon, Paperclip } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { mockClaims } from "@/lib/mock-data";
import { ClaimStatus } from "@/lib/types";
import { formatBEDate, cn } from "@/lib/utils";
import { format, subDays } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { ACCEPTED_MIME_TYPES } from "@/lib/upload-types";

const statusVariant: Record<ClaimStatus, string> = {
  "Pending Invoice": "bg-orange-100 text-orange-800",
  "Pending Approval": "bg-yellow-100 text-yellow-800",
  "Final Rejected": "bg-red-100 text-red-800",
  "Auto Approved": "bg-green-100 text-green-800",
  "Reimbursed": "bg-emerald-100 text-emerald-800",
};

interface AttachedFileInfo {
  fileName: string;
  ocrStatus: "uploading" | "processing" | "done" | "failed";
  ocrConfidence?: number;
}

export default function MyClaims() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Pending Invoice");
  const [dateFrom, setDateFrom] = useState<Date>(subDays(new Date(), 6));
  const [dateTo, setDateTo] = useState<Date>(new Date());

  // Track attached files per claim and claim statuses
  const [attachedFiles, setAttachedFiles] = useState<Record<string, AttachedFileInfo>>({});
  const [claimStatuses, setClaimStatuses] = useState<Record<string, ClaimStatus>>({});
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; claimId: string }>({ open: false, claimId: "" });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeClaimId, setActiveClaimId] = useState<string>("");

  const getStatus = (claim: typeof mockClaims[0]): ClaimStatus => {
    return claimStatuses[claim.id] || claim.status;
  };

  const filtered = useMemo(() => {
    return mockClaims.filter((c) => {
      const status = getStatus(c);
      if (statusFilter !== "all" && status !== statusFilter) return false;

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
  }, [search, statusFilter, dateFrom, dateTo, claimStatuses]);

  const handleAttachClick = (e: React.MouseEvent, claimId: string) => {
    e.stopPropagation();
    setActiveClaimId(claimId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeClaimId) return;

    // Reset input
    e.target.value = "";

    // Validate file type
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      toast({ title: "ไฟล์ไม่รองรับ", description: "รองรับเฉพาะ PDF, JPG, PNG", variant: "destructive" });
      return;
    }

    const claimId = activeClaimId;

    // Step 1: Upload success
    setAttachedFiles((prev) => ({
      ...prev,
      [claimId]: { fileName: file.name, ocrStatus: "uploading" },
    }));

    // Simulate upload delay
    setTimeout(() => {
      setAttachedFiles((prev) => ({
        ...prev,
        [claimId]: { ...prev[claimId], ocrStatus: "processing" },
      }));

      toast({ title: "Upload File Successfully", description: file.name });

      // Step 2 & 3: Simulate OCR processing
      setTimeout(() => {
        const confidence = 90 + Math.random() * 10; // 90-100%
        setAttachedFiles((prev) => ({
          ...prev,
          [claimId]: { ...prev[claimId], ocrStatus: "done", ocrConfidence: Math.round(confidence) },
        }));

        if (confidence >= 90) {
          setConfirmDialog({ open: true, claimId });
        }
      }, 2000);
    }, 1000);
  };

  const handleConfirmApproval = () => {
    const { claimId } = confirmDialog;
    setClaimStatuses((prev) => ({ ...prev, [claimId]: "Pending Approval" }));
    setConfirmDialog({ open: false, claimId: "" });
    toast({ title: "สถานะเปลี่ยนเป็น Pending Approval", description: "รายการถูกส่งเพื่อขออนุมัติแล้ว" });
  };

  const handleCancelApproval = () => {
    setConfirmDialog({ open: false, claimId: "" });
  };

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
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleFileChange}
      />

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
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Pending Invoice">Pending Invoice</SelectItem>
              <SelectItem value="Pending Approval">Pending Approval</SelectItem>
              <SelectItem value="Final Rejected">Final Rejected</SelectItem>
              <SelectItem value="Auto Approved">Auto Approved</SelectItem>
              <SelectItem value="Reimbursed">Reimbursed</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
              <TableHead>Attached File</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No expenses found</TableCell></TableRow>
            ) : (
              filtered.map((c) => {
                const status = getStatus(c);
                const fileInfo = attachedFiles[c.id];
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
                    <TableCell>
                      {fileInfo ? (
                        <div className="flex items-center gap-1.5 text-sm">
                          <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="truncate max-w-[120px]" title={fileInfo.fileName}>{fileInfo.fileName}</span>
                          {fileInfo.ocrStatus === "processing" && (
                            <Badge variant="outline" className="text-xs border-blue-300 bg-blue-50 text-blue-600 animate-pulse">OCR...</Badge>
                          )}
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={(e) => handleAttachClick(e, c.id)}
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

      {/* OCR Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => !open && handleCancelApproval()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attached File Successfully</DialogTitle>
            <DialogDescription>
              Do you want to confirm and submit for approval?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCancelApproval}>Cancel</Button>
            <Button onClick={handleConfirmApproval}>Yes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
