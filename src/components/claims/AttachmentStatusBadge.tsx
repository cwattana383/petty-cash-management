import { Paperclip, Eye, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type AttachmentOcrStatus = "none" | "pass" | "partial" | "fail";

interface AttachmentStatusBadgeProps {
  fileCount: number;
  ocrStatus: AttachmentOcrStatus;
  onAttach: (e: React.MouseEvent) => void;
  onPreview?: (e: React.MouseEvent) => void;
}

export default function AttachmentStatusBadge({ fileCount, ocrStatus, onAttach, onPreview }: AttachmentStatusBadgeProps) {
  if (fileCount === 0 || ocrStatus === "none") {
    return (
      <Button size="sm" variant="destructive" onClick={onAttach}>
        <Paperclip className="h-3.5 w-3.5 mr-1" />
        แนบเอกสาร
      </Button>
    );
  }

  if (fileCount > 1) {
    return (
      <Badge variant="outline" className="bg-muted text-foreground cursor-pointer" onClick={onPreview || onAttach}>
        <Paperclip className="h-3 w-3 mr-1" />
        {fileCount} ไฟล์
      </Badge>
    );
  }

  if (ocrStatus === "pass") {
    return (
      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 cursor-pointer gap-1" onClick={onPreview || onAttach}>
        ✅ 1 ไฟล์ — ผ่าน
        <Eye className="h-3 w-3 ml-0.5" />
      </Badge>
    );
  }

  if (ocrStatus === "partial") {
    return (
      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 cursor-pointer" onClick={onPreview || onAttach}>
        ⚠️ 1 ไฟล์ — รอยืนยัน
      </Badge>
    );
  }

  // fail
  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
        ❌ 1 ไฟล์ — ไม่ผ่าน
      </Badge>
      <button className="text-xs text-primary underline flex items-center gap-0.5" onClick={onAttach}>
        <Pencil className="h-3 w-3" /> แก้ไข
      </button>
    </div>
  );
}
