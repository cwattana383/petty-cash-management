import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Zap, CheckCircle } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { UploadedDoc, OcrField, mockOcrFields } from "@/lib/upload-types";
import UploadArea from "@/components/upload/UploadArea";
import DocumentTable from "@/components/upload/DocumentTable";
import VerifyModal from "@/components/upload/VerifyModal";

const initialDocs: UploadedDoc[] = [
  { id: "1", name: "ตัวอย่าง หัก ณ ที่จ่าย_Part1.pdf", size: 402.1 * 1024, status: "TO_VERIFY", uploadedAt: new Date("2026-02-12T15:03:00"), ocrData: mockOcrFields },
  { id: "2", name: "ตัวอย่าง หัก ณ ที่จ่าย_Part20.pdf", size: 51.8 * 1024, status: "UPLOADED", uploadedAt: new Date("2026-01-28T14:09:00") },
  { id: "3", name: "ตัวอย่าง หัก ณ ที่จ่าย_Part19.pdf", size: 342.9 * 1024, status: "TO_VERIFY", uploadedAt: new Date("2026-01-28T14:09:00"), ocrData: mockOcrFields },
  { id: "4", name: "ตัวอย่าง หัก ณ ที่จ่าย_Part18.pdf", size: 534.0 * 1024, status: "FAILED", uploadedAt: new Date("2026-01-28T14:09:00") },
  { id: "5", name: "ตัวอย่าง หัก ณ ที่จ่าย_Part17.pdf", size: 49.9 * 1024, status: "VERIFIED", uploadedAt: new Date("2026-01-28T14:09:00"), ocrData: mockOcrFields },
  { id: "6", name: "ตัวอย่าง หัก ณ ที่จ่าย_Part16.pdf", size: 47.0 * 1024, status: "UPLOADED", uploadedAt: new Date("2026-01-28T14:09:00") },
  { id: "7", name: "ตัวอย่าง หัก ณ ที่จ่าย_Part15.pdf", size: 46.8 * 1024, status: "OCR_PROCESSING", uploadedAt: new Date("2026-01-28T14:09:00") },
];

export default function UploadDocument() {
  const [files, setFiles] = useState<File[]>([]);
  const [documents, setDocuments] = useState<UploadedDoc[]>(initialDocs);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [verifyDoc, setVerifyDoc] = useState<UploadedDoc | null>(null);
  const [previewDoc, setPreviewDoc] = useState<UploadedDoc | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFilesSelected = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  // Step 1: Upload files → status = UPLOADED
  const handleProcess = () => {
    setIsProcessing(true);
    const newDocs: UploadedDoc[] = files.map((f, i) => ({
      id: `new-${Date.now()}-${i}`,
      name: f.name,
      size: f.size,
      status: "UPLOADED" as const,
      uploadedAt: new Date(),
    }));
    setDocuments((prev) => [...newDocs, ...prev]);
    setFiles([]);
    setIsProcessing(false);
    toast.success(`${newDocs.length} เอกสารถูกอัปโหลดแล้ว (สถานะ: Uploaded)`);
  };

  // OCR: UPLOADED/FAILED → OCR_PROCESSING → TO_VERIFY or FAILED
  const handleOcr = (doc: UploadedDoc) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, status: "OCR_PROCESSING" as const } : d))
    );

    // Simulate async OCR job (2-4 seconds)
    const delay = 2000 + Math.random() * 2000;
    const willSucceed = Math.random() > 0.15; // 85% success rate

    setTimeout(() => {
      setDocuments((prev) =>
        prev.map((d) => {
          if (d.id !== doc.id) return d;
          if (willSucceed) {
            return { ...d, status: "TO_VERIFY" as const, ocrData: mockOcrFields };
          }
          return { ...d, status: "FAILED" as const };
        })
      );
      if (willSucceed) {
        toast.success(`OCR เสร็จสิ้นสำหรับ ${doc.name}`);
      } else {
        toast.error(`OCR ล้มเหลวสำหรับ ${doc.name} — กรุณาลอง Retry`);
      }
    }, delay);
  };

  // Verify confirm: TO_VERIFY → VERIFIED
  const handleVerifyConfirm = (docId: string, fields: OcrField[]) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, status: "VERIFIED" as const, ocrData: fields } : d))
    );
    toast.success("ยืนยันข้อมูล OCR แล้ว");
    setVerifyDoc(null);
  };

  const handleDelete = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    setSelectedIds((prev) => prev.filter((x) => x !== id));
    toast.success("ลบเอกสารแล้ว");
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => prev.length === documents.length ? [] : documents.map((d) => d.id));
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Upload Documents</h1>
        <p className="text-muted-foreground">Upload documents for AI-powered extraction</p>
      </div>

      <UploadArea
        onFilesSelected={handleFilesSelected}
        selectedFiles={files}
        onProcess={handleProcess}
        isProcessing={isProcessing}
      />

      <DocumentTable
        documents={documents}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
        onVerify={(doc) => setVerifyDoc(doc)}
        onOcr={handleOcr}
        onPreview={(doc) => setPreviewDoc(doc)}
        onDelete={handleDelete}
      />

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: FileText, title: "Supported Formats", desc: "PDF, JPG, PNG files up to 20MB each" },
          { icon: Zap, title: "AI Extraction", desc: "Documents are automatically processed for data extraction" },
          { icon: CheckCircle, title: "Review & Export", desc: "Review extracted data and export to Excel or JSON" },
        ].map((item) => (
          <Card key={item.title}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">{item.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <h4 className="font-semibold mb-2">Tips for best results</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• ใช้เอกสารที่มีความชัดเจน ไม่เบลอ</li>
            <li>• หลีกเลี่ยงเอกสารที่มีลายน้ำหรือพื้นหลังซับซ้อน</li>
            <li>• ตรวจสอบให้แน่ใจว่าข้อความอ่านได้ชัดเจน</li>
          </ul>
        </CardContent>
      </Card>

      {/* Verify Modal */}
      <VerifyModal doc={verifyDoc} onClose={() => setVerifyDoc(null)} onConfirm={handleVerifyConfirm} />

      {/* Preview Modal */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Preview: {previewDoc?.name}</DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg bg-muted/30 h-[60vh] flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-sm">Document Preview</p>
              <p className="text-xs mt-1">เอกสารจะแสดงตรงนี้เมื่อเชื่อมต่อกับ backend</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
