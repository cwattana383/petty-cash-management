import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { FileText, Eye, Zap, Trash2, Loader2, ClipboardList, ShieldCheck, ShieldX, ShieldAlert, Ban, AlertOctagon } from "lucide-react";
import { UploadedDoc, STATUS_CONFIG, NON_SELECTABLE_STATUSES, formatFileSize, formatDate } from "@/lib/upload-types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DocumentTableProps {
  documents: UploadedDoc[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onVerify: (doc: UploadedDoc) => void;
  onOcr: (doc: UploadedDoc) => void;
  onPreview: (doc: UploadedDoc) => void;
  onDelete: (id: string) => void;
  onCreateClaim: () => void;
  onManualExpense: () => void;
}

function StatusBadge({ status }: { status: UploadedDoc["status"] }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={`${cfg.badgeClass} gap-1`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dotClass} ${cfg.animate ? "animate-pulse" : ""}`} />
      {cfg.label}
    </Badge>
  );
}

function DecisionBadge({ doc }: { doc: UploadedDoc }) {
  if (!doc.autoDecisionStatus) return null;
  const config: Record<string, { icon: typeof ShieldCheck; label: string; className: string }> = {
    AUTO_ACCEPT: { icon: ShieldCheck, label: "Auto Accept", className: "text-green-600" },
    MANUAL_ACCEPT: { icon: ShieldCheck, label: "Manual Accept", className: "text-blue-600" },
    NEED_VERIFY: { icon: ShieldAlert, label: "Need Verify", className: "text-orange-600" },
    AUTO_REJECT: { icon: ShieldX, label: "Auto Reject", className: "text-red-600" },
  };
  const c = config[doc.autoDecisionStatus] || config.AUTO_REJECT;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className={`flex items-center gap-1 text-xs ${c.className}`}>
            <c.icon className="h-3.5 w-3.5" />
            <span>{c.label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Confidence: {doc.ocrConfidenceScore ?? "N/A"}%</p>
          {doc.errorType && <p>Error: {doc.errorType}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function isSelectable(doc: UploadedDoc): boolean {
  return !NON_SELECTABLE_STATUSES.includes(doc.status);
}

export default function DocumentTable({
  documents, selectedIds, onToggleSelect, onToggleSelectAll,
  onVerify, onOcr, onPreview, onDelete, onCreateClaim, onManualExpense,
}: DocumentTableProps) {
  // Filter out USED_IN_CLAIM documents from display
  const visibleDocs = documents.filter((d) => d.status !== "USED_IN_CLAIM");

  if (visibleDocs.length === 0) return null;

  const selectableDocs = visibleDocs.filter(isSelectable);
  const allSelected = selectableDocs.length > 0 && selectableDocs.every((d) => selectedIds.includes(d.id));
  const someSelected = selectableDocs.some((d) => selectedIds.includes(d.id)) && !allSelected;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Uploaded Documents ({visibleDocs.length})</h3>
              <p className="text-sm text-muted-foreground">All uploaded documents</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Selected: {selectedIds.filter((id) => visibleDocs.some((d) => d.id === id)).length} / {visibleDocs.length}
            </span>
            <Button
              onClick={onCreateClaim}
              disabled={selectedIds.length === 0}
              className="gap-1.5"
            >
              <ClipboardList className="h-4 w-4" />
              Create Claim
            </Button>
          </div>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? "indeterminate" : false}
                    onCheckedChange={onToggleSelectAll}
                  />
                </TableHead>
                <TableHead>Filename</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>OCR Status</TableHead>
                <TableHead>Decision</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleDocs.map((doc) => {
                const canSelect = isSelectable(doc);
                const isDuplicate = doc.status === "DUPLICATE_BLOCKED";
                const isBuyerMismatch = doc.status === "BUYER_MISMATCH";

                return (
                  <TableRow key={doc.id} className={isDuplicate || isBuyerMismatch ? "bg-red-50/50" : ""}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(doc.id)}
                        onCheckedChange={() => onToggleSelect(doc.id)}
                        disabled={!canSelect}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded bg-blue-50 flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-medium truncate max-w-[250px] block">{doc.name}</span>
                          {isDuplicate && (
                            <p className="text-xs text-red-600 mt-0.5">This document is duplicated with an existing document and cannot be processed.</p>
                          )}
                          {isBuyerMismatch && (
                            <p className="text-xs text-pink-600 mt-0.5">Buyer Tax ID/Name/Address does not match Entities Profile.</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatFileSize(doc.size)}</TableCell>
                    <TableCell><StatusBadge status={doc.status} /></TableCell>
                    <TableCell><DecisionBadge doc={doc} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(doc.uploadedAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {/* Verify: TO_VERIFY */}
                        {doc.status === "TO_VERIFY" && (
                          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => onVerify(doc)}>
                            <Eye className="h-3.5 w-3.5" /> Verify
                          </Button>
                        )}

                        {/* View: VERIFIED (same modal, editable) */}
                        {doc.status === "VERIFIED" && (
                          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => onVerify(doc)}>
                            <Eye className="h-3.5 w-3.5" /> View
                          </Button>
                        )}

                        {/* Retry OCR: FAILED, OCR_FAILED, or REJECTED */}
                        {(doc.status === "FAILED" || doc.status === "OCR_FAILED" || doc.status === "REJECTED") && (
                          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => onOcr(doc)}>
                            <Zap className="h-3.5 w-3.5" /> Retry OCR
                          </Button>
                        )}

                        {/* Processing indicator */}
                        {doc.status === "OCR_PROCESSING" && (
                          <Button variant="outline" size="sm" className="gap-1 text-xs" disabled>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing...
                          </Button>
                        )}

                        {/* View mismatch details for BUYER_MISMATCH */}
                        {isBuyerMismatch && doc.buyerMismatchDetails && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-1 text-xs text-pink-600">
                                  <AlertOctagon className="h-3.5 w-3.5" /> View Mismatch
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <div className="text-xs space-y-1">
                                  <p><strong>Extracted:</strong> {doc.buyerMismatchDetails.extractedName}</p>
                                  <p><strong>Tax ID:</strong> {doc.buyerMismatchDetails.extractedTaxId}</p>
                                  <p className="border-t pt-1 mt-1"><strong>Expected:</strong> {doc.buyerMismatchDetails.expectedName}</p>
                                  <p><strong>Tax ID:</strong> {doc.buyerMismatchDetails.expectedTaxId}</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}

                        {/* Delete: always available except processing and used_in_claim */}
                        {doc.status !== "OCR_PROCESSING" && doc.status !== "USED_IN_CLAIM" && (
                          <Button variant="outline" size="sm" className="gap-1 text-xs text-destructive hover:text-destructive" onClick={() => onDelete(doc.id)}>
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
