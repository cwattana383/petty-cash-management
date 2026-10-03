import { useEffect, useRef, useState, type ReactNode } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { ZoomIn, ZoomOut, Maximize2, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

interface PdfViewerProps {
  /** PDF URL. TODO: connect the real file URL from the storage bucket / API. */
  src?: string;
  /** Rendered as the page when no src is given (mock rows). */
  fallbackPage?: ReactNode;
  /** Natural width of the fallback page in px. */
  fallbackWidth?: number;
}

export default function PdfViewer({ src, fallbackPage, fallbackWidth = 1000 }: PdfViewerProps) {
  const areaRef = useRef<HTMLDivElement>(null);
  const [areaWidth, setAreaWidth] = useState(0);
  const [zoom, setZoom] = useState(1); // 1 = fit width
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(false);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setAreaWidth(el.clientWidth));
    ro.observe(el);
    setAreaWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => { setError(false); setPage(1); setNumPages(0); }, [src]);

  const fitWidth = Math.max(200, areaWidth - 48);
  const pageWidth = fitWidth * zoom;

  return (
    <div className="flex flex-col min-h-0 flex-1 rounded-lg border overflow-hidden">
      <div className="flex items-center gap-1 border-b bg-card px-3 py-1.5">
        <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="w-12 text-center text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
        <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" className="h-8" onClick={() => setZoom(1)}>
          <Maximize2 className="h-4 w-4 mr-1" />Fit width
        </Button>
        {numPages > 1 && (
          <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>Page {page} of {numPages}</span>
            <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Next page" disabled={page >= numPages} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      <div ref={areaRef} className="flex-1 overflow-auto p-6" style={{ backgroundColor: "#F1F5F9" }}>
        {areaWidth > 0 && (src ? (
          error ? (
            <p className="py-16 text-center text-sm text-muted-foreground">Cannot display this file. Use Download to save a copy.</p>
          ) : (
            <Document
              file={src}
              onLoadSuccess={({ numPages: n }) => setNumPages(n)}
              onLoadError={() => setError(true)}
              loading={<div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
              className="flex justify-center"
            >
              <Page pageNumber={page} width={pageWidth} className="shadow-lg" />
            </Document>
          )
        ) : (
          <div className="mx-auto" style={{ width: pageWidth, height: (pageWidth / fallbackWidth) * (fallbackWidth / 1.4) }}>
            <div className="bg-white shadow-lg origin-top-left" style={{ width: fallbackWidth, aspectRatio: "1.4 / 1", transform: `scale(${pageWidth / fallbackWidth})` }}>
              {fallbackPage}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
