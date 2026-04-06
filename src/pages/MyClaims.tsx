import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, CalendarIcon, Upload, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { type ClaimHeader } from "@/lib/types";
import { formatBEDate, cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { ACCEPTED_MIME_TYPES, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from "@/lib/upload-types";
import OcrResultCard, { type OcrResultState } from "@/components/claims/OcrResultCard";
import {
  usePreviewClaimDocumentOcr,
  previewResponseToOcrDisplayFields,
  previewValidationToResultState,
  type PreviewOcrResponse,
} from "@/hooks/use-claim-documents";
import SupportingDocsSection, { SupportingFile } from "@/components/claims/SupportingDocsSection";
import { AttachmentOcrStatus } from "@/components/claims/AttachmentStatusBadge";
import NoDocumentWarningDialog from "@/components/claims/NoDocumentWarningDialog";
import { useCorpCardTransactions, useCorpCardTransactionStats } from "@/hooks/use-corp-card-transactions";
import { useCardholderClaimsCorpOverlay } from "@/hooks/use-cardholder-claims";
import { useAuth } from "@/lib/auth-context";
import { useRoles } from "@/lib/role-context";
import { toDocumentContractStatus } from "@/lib/corp-document-status";
import {
  TAB_STATUS_FILTER,
  type StatusTab,
  getDeductionPeriod,
  formatMyClaimsNumber,
  formatMyClaimsCurrency,
  rowRouteId,
  toDisplayStatus,
  effectiveCorpDocumentStatus,
  toPortalApprovalStatus,
  isPortalStatusInTab,
  approvalStatusDisplayText,
  approvalStatusBadgeClassForDisplay,
  documentStatusBadgeClass,
  documentStatusLabel,
} from "@/lib/portal-claim-row-status";

type UploadFlowState = "dropzone" | "processing" | "result" | "confirmed";

interface ClaimAttachmentData {
  taxInvoiceFileName: string;
  ocrStatus: AttachmentOcrStatus;
  supportingFiles: SupportingFile[];
  totalFileCount: number;
}

export default function MyClaims() {
  const PAGE_SIZE = 20;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { roles } = useRoles();
  const isAdminView = roles.includes("Admin");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<StatusTab>("pending_invoice");
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState<Date>(() => {
    const saved = localStorage.getItem("claims_dateFrom");
    if (saved) {
      const d = new Date(saved);
      if (!isNaN(d.getTime())) return d;
    }
    const y = new Date().getFullYear();
    return new Date(y, 0, 1);
  });
  const [dateTo, setDateTo] = useState<Date>(() => {
    const saved = localStorage.getItem("claims_dateTo");
    if (saved) {
      const d = new Date(saved);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  });

  useEffect(() => {
    localStorage.setItem("claims_dateFrom", dateFrom.toISOString());
  }, [dateFrom]);

  useEffect(() => {
    localStorage.setItem("claims_dateTo", dateTo.toISOString());
  }, [dateTo]);

  const [attachments, setAttachments] = useState<Record<string, ClaimAttachmentData>>({});

  const [uploadDialog, setUploadDialog] = useState<{ open: boolean; claimId: string }>({
    open: false,
    claimId: "",
  });
  const [flowState, setFlowState] = useState<UploadFlowState>("dropzone");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResultState>("partial");
  const [previewData, setPreviewData] = useState<PreviewOcrResponse | null>(null);
  const [supportingFiles, setSupportingFiles] = useState<SupportingFile[]>([]);
  const previewOcr = usePreviewClaimDocumentOcr();
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const [warningDialog, setWarningDialog] = useState<{ open: boolean; claimId: string }>({
    open: false,
    claimId: "",
  });

  const dateFromStr = format(dateFrom, "yyyy-MM-dd");
  const dateToStr = format(dateTo, "yyyy-MM-dd");

  const corpQuery = useCorpCardTransactions({
    page,
    limit: PAGE_SIZE,
    dateFrom: dateFromStr,
    dateTo: dateToStr,
    search: search || undefined,
    status: TAB_STATUS_FILTER[activeTab].join(","),
    employeeId: isAdminView ? undefined : user?.employeeCode,
  });

  const statsQuery = useCorpCardTransactionStats(isAdminView ? undefined : user?.employeeCode);

  useEffect(() => {
    setPage(1);
  }, [search, activeTab, dateFrom, dateTo]);

  const rawItems = useMemo(() => corpQuery.data?.data?.items ?? [], [corpQuery.data?.data?.items]);
  const claimsOverlayQuery = useCardholderClaimsCorpOverlay({
    dateFrom: dateFromStr,
    dateTo: dateToStr,
    search: search || undefined,
  });
  const claimByBankTxnId = useMemo(() => {
    const m = new Map<string, ClaimHeader>();
    for (const c of claimsOverlayQuery.data ?? []) {
      if (c.bankTransactionId) m.set(c.bankTransactionId, c);
    }
    return m;
  }, [claimsOverlayQuery.data]);
  const filteredItems = useMemo(() => {
    return rawItems.filter((txn) => {
      const claim = txn.bankTransactionId ? claimByBankTxnId.get(txn.bankTransactionId) : undefined;
      const att = attachments[rowRouteId(txn)];
      const displayFromClaim = claim ? toDisplayStatus(claim.status, !!att, claim.statusDisplay) : null;
      const rawDoc = effectiveCorpDocumentStatus(txn, claim);
      const portalStatus = toPortalApprovalStatus(txn.status, rawDoc, claim, displayFromClaim);
      if (!portalStatus) return false;
      const docStatus = toDocumentContractStatus(rawDoc);
      return isPortalStatusInTab(portalStatus, activeTab, docStatus, claim);
    });
  }, [rawItems, claimByBankTxnId, attachments, activeTab]);

  const items = filteredItems;
  const meta = corpQuery.data?.data?.meta ?? {
    total: 0,
    totalAmount: 0,
    page,
    limit: PAGE_SIZE,
    totalPages: 1,
  };

  const stats = statsQuery.data;
  const showDeductionCol = activeTab === "rejected" || activeTab === "all";

  const resetDialog = () => {
    setUploadDialog({ open: false, claimId: "" });
    setFlowState("dropzone");
    setSelectedFile(null);
    setPreviewData(null);
    setSupportingFiles([]);
  };

  const handleFileSelected = useCallback(
    (files: FileList | File[]) => {
      const file = Array.from(files)[0];
      if (!file) return;
      if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
        toast({ title: "Unsupported file type", description: "Please upload PDF, JPG, or PNG", variant: "destructive" });
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({
          title: "File too large",
          description: `File size must not exceed ${MAX_FILE_SIZE_MB}MB`,
          variant: "destructive",
        });
        return;
      }
      const claimId = uploadDialog.claimId?.trim();
      if (!claimId) {
        toast({
          title: "ไม่พบรหัสเคลม",
          description: "เปิดการแนบเอกสารจากรายการที่ผูกกับเคลมแล้ว หรือจากหน้ารายละเอียดเคลม เพื่อให้ระบบเรียก OCR ได้",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      setPreviewData(null);
      setFlowState("processing");
      previewOcr.mutate(
        { claimId, file, documentTypeId: undefined },
        {
          onSuccess: (data) => {
            setPreviewData(data);
            setOcrResult(previewValidationToResultState(data.validationResults));
            setFlowState("result");
          },
          onError: (err) => {
            toast({
              title: "อ่าน OCR ไม่สำเร็จ",
              description: err instanceof Error ? err.message : "ลองใหม่อีกครั้ง",
              variant: "destructive",
            });
            setFlowState("dropzone");
            setSelectedFile(null);
          },
        }
      );
    },
    [previewOcr, uploadDialog.claimId]
  );

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
    resetDialog();
    toast({ title: "Submitted for approval", description: `Attached ${totalFiles} files — status changed to Pending Approval` });
  };

  const handleSubmitWithoutDoc = (_claimId: string) => {
    setWarningDialog({ open: false, claimId: "" });
    toast({
      title: "Submitted",
      description: "Submitted without document — may be deducted from salary if not attached by deadline",
      variant: "destructive",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Expenses</h1>
          <p className="text-muted-foreground">Manage your expenses</p>
        </div>
      </div>

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

      {stats && (
        <div className="border rounded-lg bg-card px-5 py-3.5 flex flex-wrap items-center gap-6">
          <div>
            <span className="text-muted-foreground text-sm">Transactions</span>
            <p className="font-semibold text-foreground">{formatMyClaimsNumber(meta.total)} transactions</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <span className="text-muted-foreground text-sm">Total</span>
            <p className="font-semibold text-foreground text-lg">฿{formatMyClaimsCurrency(meta.totalAmount)}</p>
          </div>
          {activeTab === "rejected" && stats.rejectedCount > 0 && (
            <>
              <div className="w-px h-8 bg-border" />
              <div>
                <span className="text-muted-foreground text-sm">All rejected : Deduction period</span>
                <p className="font-semibold text-foreground">{getDeductionPeriod(dateToStr)}</p>
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 p-4 border rounded-lg bg-card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-sm text-muted-foreground whitespace-nowrap">Transaction Date:</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-[160px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatBEDate(format(dateFrom, "yyyy-MM-dd"))}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={(d) => {
                  if (d) {
                    setDateFrom(d);
                    setPage(1);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <span className="text-sm text-muted-foreground">to</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-[160px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatBEDate(format(dateTo, "yyyy-MM-dd"))}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={(d) => {
                  if (d) {
                    setDateTo(d);
                    setPage(1);
                  }
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as StatusTab);
            setPage(1);
          }}
        >
          <TabsList>
            <TabsTrigger value="pending_invoice">Pending Document</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction No.</TableHead>
              <TableHead>Transaction Date</TableHead>
              <TableHead>Merchant Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Approval Status</TableHead>
              <TableHead>Document Status</TableHead>
              {showDeductionCol && <TableHead>Deduction Period</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showDeductionCol ? 8 : 7}
                  className="text-center text-muted-foreground py-8"
                >
                  {corpQuery.isFetching ? "Loading…" : "No transactions found for this status."}
                </TableCell>
              </TableRow>
            ) : (
              items.flatMap((txn) => {
                const routeId = rowRouteId(txn);
                const claim = txn.bankTransactionId ? claimByBankTxnId.get(txn.bankTransactionId) : undefined;
                const att = attachments[routeId];
                const displayFromClaim = claim
                  ? toDisplayStatus(claim.status, !!att, claim.statusDisplay)
                  : null;
                const rawDoc = effectiveCorpDocumentStatus(txn, claim);
                const badgeLabel = toPortalApprovalStatus(txn.status, rawDoc, claim, displayFromClaim);
                if (!badgeLabel) return [];
                const approvalText = approvalStatusDisplayText(
                  badgeLabel,
                  txn.status,
                  claim,
                  displayFromClaim
                );
                const badgeClass = approvalStatusBadgeClassForDisplay(approvalText);
                const documentStatus = toDocumentContractStatus(rawDoc);
                const dateStr = txn.transactionDate.slice(0, 10);
                return [
                  <TableRow
                    key={txn.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/claims/${routeId}`)}
                  >
                    <TableCell className="font-medium">{txn.bankTransactionId ?? "—"}</TableCell>
                    <TableCell>{formatBEDate(dateStr)}</TableCell>
                    <TableCell>{txn.merchantName || "—"}</TableCell>
                    <TableCell>{txn.mccDescription || "—"}</TableCell>
                    <TableCell className="text-right">
                      ฿{formatMyClaimsCurrency(txn.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={badgeClass}>
                        {approvalText}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={documentStatusBadgeClass(documentStatus)}>
                        {documentStatusLabel(documentStatus)}
                      </Badge>
                    </TableCell>
                    {showDeductionCol && (
                      <TableCell className="text-sm">
                        {txn.status === "AUTO_REJECTED"
                          ? getDeductionPeriod(txn.transactionDate)
                          : claim?.status === "Pending Salary Deduction"
                            ? getDeductionPeriod(txn.transactionDate)
                            : displayFromClaim === "AUTO_REJECTED" || displayFromClaim === "MANAGER_REJECTED"
                              ? "N/A"
                              : "—"}
                      </TableCell>
                    )}
                  </TableRow>,
                ];
              })
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between px-4 py-3 border-t">
          <span className="text-sm text-muted-foreground">
            Showing {meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1}–
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || corpQuery.isFetching}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span className="flex items-center px-3 text-sm text-muted-foreground">
              Page {meta.page} of {meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= meta.totalPages || corpQuery.isFetching}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <Dialog
        open={uploadDialog.open}
        onOpenChange={(open) => {
          if (!open) resetDialog();
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Attach Document</DialogTitle>
            <DialogDescription>Upload Tax Invoice for automatic verification (PDF, JPG, PNG)</DialogDescription>
          </DialogHeader>

          {flowState === "dropzone" && (
            <div
              className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-primary transition-colors"
              onClick={() => uploadInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileSelected(e.dataTransfer.files);
              }}
            >
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Drag & drop Tax Invoice here, or click to browse</p>
              <p className="text-xs text-muted-foreground">Supported: PDF, JPG, PNG — max {MAX_FILE_SIZE_MB}MB</p>
            </div>
          )}

          {flowState === "processing" && (
            <div className="flex flex-col items-center gap-4 py-10">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <div className="text-center space-y-1">
                <p className="text-base font-semibold text-foreground">กำลังอ่านเอกสาร...</p>
                <p className="text-sm text-muted-foreground">กำลังเรียกระบบ OCR จากเซิร์ฟเวอร์ กรุณารอสักครู่</p>
              </div>
            </div>
          )}

          {flowState === "result" && selectedFile && previewData && (
            <OcrResultCard
              fileName={selectedFile.name}
              resultState={ocrResult}
              fields={previewResponseToOcrDisplayFields(previewData)}
              onConfirm={handleOcrConfirm}
              onReupload={handleOcrReupload}
            />
          )}

          {flowState === "confirmed" && (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
                ✅ Tax Invoice verified — {selectedFile?.name}
              </div>
              <SupportingDocsSection files={supportingFiles} onChange={setSupportingFiles} />
              <div className="flex justify-end pt-2">
                <Button onClick={handleFinalSubmit}>
                  Confirm and Submit for Approval ({1 + supportingFiles.length} files)
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
