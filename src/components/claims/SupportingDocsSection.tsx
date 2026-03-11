import { useRef, useCallback } from "react";
import { Upload, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ACCEPTED_MIME_TYPES, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from "@/lib/upload-types";

const SUPPORT_DOC_TYPES = [
  "รายชื่อผู้เข้าร่วม",
  "ใบอนุมัติเดินทาง",
  "รายงานการเดินทาง",
  "เอกสารอื่นๆ",
] as const;

export type SupportDocType = typeof SUPPORT_DOC_TYPES[number];

export interface SupportingFile {
  file: File;
  docType: SupportDocType;
}

const MAX_SUPPORT_FILES = 4;

interface SupportingDocsSectionProps {
  files: SupportingFile[];
  onChange: (files: SupportingFile[]) => void;
}

export default function SupportingDocsSection({ files, onChange }: SupportingDocsSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = useCallback((fileList: FileList | File[]) => {
    const remaining = MAX_SUPPORT_FILES - files.length;
    if (remaining <= 0) {
      toast({ title: "จำกัดสูงสุด", description: `อัปโหลดเอกสารสนับสนุนได้สูงสุด ${MAX_SUPPORT_FILES} ไฟล์`, variant: "destructive" });
      return;
    }
    const arr = Array.from(fileList).slice(0, remaining);
    const valid: SupportingFile[] = [];
    for (const f of arr) {
      if (!ACCEPTED_MIME_TYPES.includes(f.type)) continue;
      if (f.size > MAX_FILE_SIZE_BYTES) continue;
      valid.push({ file: f, docType: "เอกสารอื่นๆ" });
    }
    if (valid.length) onChange([...files, ...valid]);
  }, [files, onChange]);

  return (
    <div className="space-y-3 border-t pt-4">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        multiple
        className="hidden"
        onChange={(e) => { if (e.target.files) handleAdd(e.target.files); e.target.value = ""; }}
      />
      <div>
        <h4 className="text-sm font-semibold text-foreground">เอกสารสนับสนุนเพิ่มเติม (ไม่บังคับ)</h4>
        <p className="text-xs text-muted-foreground mt-0.5">เช่น รายชื่อผู้เข้าร่วม, ใบอนุมัติเดินทาง, รายงานการประชุม</p>
      </div>

      {files.length < MAX_SUPPORT_FILES && (
        <div
          className="border border-dashed rounded-lg p-4 flex flex-col items-center gap-1.5 cursor-pointer hover:border-primary transition-colors"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleAdd(e.dataTransfer.files); }}
        >
          <Upload className="h-5 w-5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">ลากไฟล์มาวาง หรือคลิกเพื่อเลือก ({files.length}/{MAX_SUPPORT_FILES})</p>
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((entry, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-muted">
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <p className="text-xs truncate flex-1 min-w-0">{entry.file.name}</p>
              <Select value={entry.docType} onValueChange={(v) => {
                const next = [...files];
                next[idx] = { ...next[idx], docType: v as SupportDocType };
                onChange(next);
              }}>
                <SelectTrigger className="w-[150px] h-7 text-[11px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUPPORT_DOC_TYPES.map((t) => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => onChange(files.filter((_, i) => i !== idx))}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
