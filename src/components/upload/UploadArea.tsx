import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { MAX_UPLOAD_FILES, MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB, ACCEPTED_MIME_TYPES } from "@/lib/upload-types";

interface UploadAreaProps {
  onFilesSelected: (files: File[]) => void;
  selectedFiles: File[];
  onProcess: () => void;
  isProcessing: boolean;
  onRemoveFile?: (index: number) => void;
}

const ACCEPTED_TYPES = ".pdf,.jpg,.jpeg,.png";

function validateFiles(newFiles: File[], existingCount: number): { valid: File[]; errors: string[] } {
  const errors: string[] = [];
  const valid: File[] = [];

  const totalAfter = existingCount + newFiles.length;
  if (totalAfter > MAX_UPLOAD_FILES) {
    errors.push(`Maximum ${MAX_UPLOAD_FILES} files per upload session. You already have ${existingCount} file(s).`);
    return { valid: [], errors };
  }

  for (const file of newFiles) {
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      errors.push(`Unsupported file type: "${file.name}". Please upload PDF, JPG, or PNG.`);
      continue;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      errors.push(`File "${file.name}" is too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.`);
      continue;
    }
    valid.push(file);
  }

  return { valid, errors };
}

export default function UploadArea({ onFilesSelected, selectedFiles, onProcess, isProcessing, onRemoveFile }: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback((files: File[]) => {
    const { valid, errors } = validateFiles(files, selectedFiles.length);
    errors.forEach((err) => toast.error(err));
    if (valid.length > 0) onFilesSelected(valid);
  }, [onFilesSelected, selectedFiles.length]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
  }, [handleFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(Array.from(e.target.files));
    e.target.value = "";
  };

  return (
    <div className="space-y-4">
      <Card
        className={`border-2 border-dashed transition-colors ${isDragging ? "border-primary bg-accent" : "border-border"}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Upload className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Upload documents</h3>
          <p className="text-sm text-muted-foreground mb-4">Drag and drop files or click to browse</p>
          <div>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              multiple
              accept={ACCEPTED_TYPES}
              onChange={handleFileSelect}
            />
            <Button
              type="button"
              className="cursor-pointer"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              Select Files
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Supported: PDF, JPG, PNG (max {MAX_UPLOAD_FILES} files, {MAX_FILE_SIZE_MB}MB each)</p>
        </CardContent>
      </Card>

      {selectedFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Selected Files ({selectedFiles.length})</h3>
            <div className="space-y-2">
              {selectedFiles.map((file, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm flex-1 truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</span>
                  {onRemoveFile && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemoveFile(i)}>
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button className="mt-4 w-full" onClick={onProcess} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Process Documents with AI"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
