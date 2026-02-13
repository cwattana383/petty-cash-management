import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { FileText, CheckCircle, ZoomIn, ZoomOut } from "lucide-react";
import { UploadedDoc, OcrField } from "@/lib/upload-types";

interface VerifyModalProps {
  doc: UploadedDoc | null;
  onClose: () => void;
  onConfirm: (docId: string, fields: OcrField[]) => void;
}

function confidenceColor(c: number) {
  if (c >= 90) return "bg-green-100 text-green-700";
  if (c >= 80) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
}

export default function VerifyModal({ doc, onClose, onConfirm }: VerifyModalProps) {
  const [fields, setFields] = useState<OcrField[]>([]);
  const [zoomLevel, setZoomLevel] = useState(100);

  useEffect(() => {
    if (doc?.ocrData) setFields([...doc.ocrData]);
  }, [doc]);

  if (!doc) return null;

  return (
    <Dialog open={!!doc} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Verify Document: {doc.name}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-6 overflow-y-auto max-h-[65vh] pr-2">
          {/* Left: OCR Results */}
          <div>
            <h4 className="font-semibold mb-1">OCR Results</h4>
            <p className="text-sm text-muted-foreground mb-4">Review and edit extracted fields if needed</p>
            <div className="space-y-4">
              {fields.map((field, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-sm text-muted-foreground">{field.label}</Label>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${confidenceColor(field.confidence)}`}>
                      {field.confidence}%
                    </span>
                  </div>
                  <Input
                    value={field.value}
                    onChange={(e) => {
                      const updated = [...fields];
                      updated[idx] = { ...updated[idx], value: e.target.value };
                      setFields(updated);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          {/* Right: PDF Preview */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div>
                <h4 className="font-semibold">Document Preview</h4>
                <p className="text-sm text-muted-foreground">Original document for reference</p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}>
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <span className="text-sm font-medium min-w-[40px] text-center">{zoomLevel}%</span>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoomLevel((z) => Math.min(200, z + 10))}>
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="border rounded-lg bg-muted/30 h-[55vh] flex items-center justify-center overflow-auto">
              <div className="text-center text-muted-foreground p-8" style={{ transform: `scale(${zoomLevel / 100})` }}>
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-sm">Document Preview</p>
                <p className="text-xs mt-1">เอกสารจะแสดงตรงนี้เมื่อเชื่อมต่อกับ backend</p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onConfirm(doc.id, fields)} className="gap-2">
            <CheckCircle className="h-4 w-4" /> Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
