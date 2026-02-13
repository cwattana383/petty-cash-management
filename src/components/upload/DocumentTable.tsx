import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { FileText, Eye, Zap, Trash2, Loader2, ClipboardList } from "lucide-react";
import { UploadedDoc, STATUS_CONFIG, formatFileSize, formatDate } from "@/lib/upload-types";

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

export default function DocumentTable({
  documents, selectedIds, onToggleSelect, onToggleSelectAll,
  onVerify, onOcr, onPreview, onDelete, onCreateClaim,
}: DocumentTableProps) {
  if (documents.length === 0) return null;

  const allSelected = selectedIds.length === documents.length && documents.length > 0;
  const someSelected = selectedIds.length > 0 && selectedIds.length < documents.length;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Uploaded Documents ({documents.length})</h3>
              <p className="text-sm text-muted-foreground">All uploaded documents</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Selected: {selectedIds.length} / {documents.length}
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
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(doc.id)}
                      onCheckedChange={() => onToggleSelect(doc.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded bg-blue-50 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-blue-500" />
                      </div>
                      <span className="text-sm font-medium truncate max-w-[250px]">{doc.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatFileSize(doc.size)}</TableCell>
                  <TableCell><StatusBadge status={doc.status} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(doc.uploadedAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {/* Verify: only TO_VERIFY */}
                      {doc.status === "TO_VERIFY" && (
                        <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => onVerify(doc)}>
                          <Eye className="h-3.5 w-3.5" /> Verify
                        </Button>
                      )}

                      {/* Retry OCR: only FAILED */}
                      {doc.status === "FAILED" && (
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


                      {/* Delete: always available except processing */}
                      {doc.status !== "OCR_PROCESSING" && (
                        <Button variant="outline" size="sm" className="gap-1 text-xs text-destructive hover:text-destructive" onClick={() => onDelete(doc.id)}>
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
