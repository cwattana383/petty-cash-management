import { Button } from "@/components/ui/button";
import { FileText, ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface Props {
  docName: string;
  totalPages?: number;
}

export default function DocumentPreviewPanel({ docName, totalPages = 1 }: Props) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="font-semibold text-sm">Document Preview</h4>
          <p className="text-xs text-muted-foreground">Original document for reference</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.max(50, z - 10))}>
            <ZoomOut className="h-3 w-3" />
          </Button>
          <span className="text-xs font-medium min-w-[36px] text-center">{zoom}%</span>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.min(200, z + 10))}>
            <ZoomIn className="h-3 w-3" />
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setRotation((r) => (r + 90) % 360)}>
            <RotateCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Page navigation */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mb-2">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <span className="text-xs font-medium">
            Page {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="border rounded-lg bg-muted/30 flex-1 flex items-center justify-center overflow-auto min-h-[300px]">
        <div
          className="text-center text-muted-foreground p-8 transition-transform"
          style={{ transform: `scale(${zoom / 100}) rotate(${rotation}deg)` }}
        >
          <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-sm font-medium">{docName}</p>
          {totalPages > 1 && <p className="text-xs mt-1">Page {currentPage} of {totalPages}</p>}
          <p className="text-xs mt-1">เอกสารจะแสดงตรงนี้เมื่อเชื่อมต่อกับ backend</p>
        </div>
      </div>
    </div>
  );
}
