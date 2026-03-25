import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ZoomIn, ZoomOut } from "lucide-react";

export interface OcrExtractedData {
  taxInvoiceNo: string;
  date: string;
  vendorName: string;
  netAmount: string;
  vatAmount: string;
  totalAmount: string;
}

interface OcrVerifyModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: OcrExtractedData) => void;
  fileName: string;
  fileType: string;
  initialData: OcrExtractedData;
}

const FIELDS: { key: keyof OcrExtractedData; label: string; placeholder: string }[] = [
  { key: "taxInvoiceNo", label: "Tax Invoice No.", placeholder: "Could not extract — enter manually" },
  { key: "date", label: "Date (DD/MM/YYYY)", placeholder: "Could not extract — enter manually" },
  { key: "vendorName", label: "Vendor Name", placeholder: "Could not extract — enter manually" },
  { key: "netAmount", label: "Net Amount (THB)", placeholder: "Could not extract — enter manually" },
  { key: "vatAmount", label: "VAT Amount (THB)", placeholder: "Could not extract — enter manually" },
  { key: "totalAmount", label: "Total Amount (THB)", placeholder: "Could not extract — enter manually" },
];

export default function OcrVerifyModal({ open, onClose, onConfirm, fileName, fileType, initialData }: OcrVerifyModalProps) {
  const [data, setData] = useState<OcrExtractedData>(initialData);
  const [zoom, setZoom] = useState(100);

  const handleChange = (key: keyof OcrExtractedData, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-5xl w-[95vw] h-[85vh] p-0 flex flex-col">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-base font-bold text-foreground">Verify Document — {fileName}</h2>
        </div>

        <div className="flex-1 flex min-h-0">
          {/* Left Panel — OCR Results */}
          <div className="w-1/2 border-r border-border p-6 overflow-y-auto">
            <h3 className="text-sm font-semibold text-foreground mb-1">OCR Results</h3>
            <p className="text-xs text-muted-foreground mb-5">Review and edit if needed before confirming</p>

            <div className="space-y-4">
              {FIELDS.map((f) => {
                const isEmpty = !data[f.key];
                return (
                  <div key={f.key} className="space-y-1.5">
                    <Label className="text-[13px] font-medium text-foreground">{f.label}</Label>
                    <Input
                      value={data[f.key]}
                      onChange={(e) => handleChange(f.key, e.target.value)}
                      placeholder={f.placeholder}
                      className={`text-[13px] ${isEmpty ? "border-destructive" : ""}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel — Document Preview */}
          <div className="w-1/2 flex flex-col bg-muted/30">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Document Preview</h3>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setZoom((z) => Math.max(50, z - 25))}
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <span className="text-xs text-muted-foreground w-10 text-center">{zoom}%</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setZoom((z) => Math.min(200, z + 25))}
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center p-4">
              <div
                className="bg-white border border-border rounded shadow-sm flex items-center justify-center"
                style={{ width: `${zoom * 3}px`, height: `${zoom * 4}px`, transition: "width 0.2s, height 0.2s" }}
              >
                <div className="text-center text-muted-foreground p-4">
                  <p className="text-sm font-medium">{fileName}</p>
                  <p className="text-xs mt-1">{fileType} document preview</p>
                  <p className="text-xs mt-3 text-muted-foreground/60">
                    (Document preview placeholder)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => onConfirm(data)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
