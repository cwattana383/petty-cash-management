import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Zap, CheckCircle } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { UploadedDoc, OcrField, mockOcrFields, generateMockOcrWithConfidence, runDecisionEngine } from "@/lib/upload-types";
import UploadArea from "@/components/upload/UploadArea";
import DocumentTable from "@/components/upload/DocumentTable";
import VerifyModal from "@/components/upload/VerifyModal";
import EligibilityModal from "@/components/upload/EligibilityModal";

const initialDocs: UploadedDoc[] = [
  { id: "1", name: "ตัวอย่าง ใบเสร็จ/ใบกำกับภาษี_Part1.pdf", size: 402.1 * 1024, status: "TO_VERIFY", uploadedAt: new Date("2026-02-12T15:03:00"), ocrData: mockOcrFields, ocrConfidenceScore: 82, autoDecisionStatus: "NEED_VERIFY" },
  { id: "2", name: "ตัวอย่าง ใบเสร็จ/ใบกำกับภาษี_Part20.pdf", size: 51.8 * 1024, status: "OCR_FAILED", uploadedAt: new Date("2026-01-28T14:09:00"), ocrConfidenceScore: 45, autoDecisionStatus: "AUTO_REJECT", errorType: "OCR_UNREADABLE" },
  { id: "3", name: "ตัวอย่าง ใบเสร็จ/ใบกำกับภาษี_Part19.pdf", size: 342.9 * 1024, status: "TO_VERIFY", uploadedAt: new Date("2026-01-28T14:09:00"), ocrData: mockOcrFields, ocrConfidenceScore: 78, autoDecisionStatus: "NEED_VERIFY" },
  { id: "4", name: "ตัวอย่าง ใบเสร็จ/ใบกำกับภาษี_Part18.pdf", size: 534.0 * 1024, status: "OCR_FAILED", uploadedAt: new Date("2026-01-28T14:09:00"), ocrConfidenceScore: 55, autoDecisionStatus: "AUTO_REJECT", errorType: "MISSING_REQUIRED_FIELD" },
  { id: "5", name: "ตัวอย่าง ใบเสร็จ/ใบกำกับภาษี_Part17.pdf", size: 49.9 * 1024, status: "VERIFIED", uploadedAt: new Date("2026-01-28T14:09:00"), ocrData: mockOcrFields, ocrConfidenceScore: 95, autoDecisionStatus: "AUTO_ACCEPT" },
  { id: "6", name: "ตัวอย่าง ใบเสร็จ/ใบกำกับภาษี_Part16.pdf", size: 47.0 * 1024, status: "OCR_FAILED", uploadedAt: new Date("2026-01-28T14:09:00"), ocrConfidenceScore: 35, autoDecisionStatus: "AUTO_REJECT", errorType: "FILE_CORRUPT" },
  { id: "7", name: "ตัวอย่าง ใบเสร็จ/ใบกำกับภาษี_Part15.pdf", size: 46.8 * 1024, status: "OCR_PROCESSING", uploadedAt: new Date("2026-01-28T14:09:00") },
];

export default function UploadDocument() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<File[]>([]);
  const [documents, setDocuments] = useState<UploadedDoc[]>(initialDocs);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [verifyDoc, setVerifyDoc] = useState<UploadedDoc | null>(null);
  const [previewDoc, setPreviewDoc] = useState<UploadedDoc | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [eligibilityModal, setEligibilityModal] = useState(false);
  const [ineligibleDocs, setIneligibleDocs] = useState<UploadedDoc[]>([]);
  const [eligibleDocs, setEligibleDocs] = useState<UploadedDoc[]>([]);

  const handleFilesSelected = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  // Apply decision engine after OCR completes
  const applyDecisionEngine = (doc: UploadedDoc): UploadedDoc => {
    const { fields, avgConfidence } = generateMockOcrWithConfidence();
    const { autoDecision, docStatus } = runDecisionEngine(avgConfidence);

    const fieldConf: Record<string, number> = {};
    fields.forEach((f) => { fieldConf[f.label] = f.confidence; });

    const errorType = docStatus === "OCR_FAILED"
      ? (avgConfidence < 50 ? "OCR_UNREADABLE" as const : "MISSING_REQUIRED_FIELD" as const)
      : undefined;

    return {
      ...doc,
      status: docStatus,
      ocrData: docStatus !== "OCR_FAILED" ? fields : undefined,
      ocrConfidenceScore: avgConfidence,
      autoDecisionStatus: autoDecision,
      fieldLevelConfidence: fieldConf,
      errorType,
    };
  };

  // Upload + auto OCR
  const handleProcess = () => {
    setIsProcessing(true);
    const newDocs: UploadedDoc[] = files.map((f, i) => ({
      id: `new-${Date.now()}-${i}`,
      name: f.name,
      size: f.size,
      status: "OCR_PROCESSING" as const,
      uploadedAt: new Date(),
    }));
    setDocuments((prev) => [...newDocs, ...prev]);
    setFiles([]);
    setIsProcessing(false);
    toast.success(`${newDocs.length} เอกสารกำลังประมวลผล OCR`);

    // Auto-run OCR with decision engine for each new doc
    newDocs.forEach((doc) => {
      const delay = 2000 + Math.random() * 2000;
      setTimeout(() => {
        setDocuments((prev) =>
          prev.map((d) => {
            if (d.id !== doc.id) return d;
            const result = applyDecisionEngine(d);
            if (result.autoDecisionStatus === "AUTO_ACCEPT") {
              toast.success(`${doc.name}: Auto-Accept (Confidence: ${result.ocrConfidenceScore}%)`);
            } else if (result.autoDecisionStatus === "NEED_VERIFY") {
              toast.info(`${doc.name}: ต้องการตรวจสอบ (Confidence: ${result.ocrConfidenceScore}%)`);
            } else {
              toast.error(`${doc.name}: OCR Failed (Confidence: ${result.ocrConfidenceScore}%)`);
            }
            return result;
          })
        );
      }, delay);
    });
  };

  // OCR Retry: FAILED/OCR_FAILED → OCR_PROCESSING → Decision Engine
  const handleOcr = (doc: UploadedDoc) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, status: "OCR_PROCESSING" as const } : d))
    );

    const delay = 2000 + Math.random() * 2000;
    setTimeout(() => {
      setDocuments((prev) =>
        prev.map((d) => {
          if (d.id !== doc.id) return d;
          const result = applyDecisionEngine(d);
          if (result.status === "OCR_FAILED") {
            toast.error(`OCR ล้มเหลวสำหรับ ${doc.name}`);
          } else {
            toast.success(`OCR เสร็จสิ้นสำหรับ ${doc.name} (Confidence: ${result.ocrConfidenceScore}%)`);
          }
          return result;
        })
      );
    }, delay);
  };

  // Verify confirm: TO_VERIFY → VERIFIED
  const handleVerifyConfirm = (docId: string, fields: OcrField[]) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, status: "VERIFIED" as const, ocrData: fields, autoDecisionStatus: "AUTO_ACCEPT" as const } : d))
    );
    toast.success("ยืนยันข้อมูล OCR แล้ว");
    setVerifyDoc(null);
  };

  // Reject from verify modal
  const handleVerifyReject = (docId: string) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === docId ? { ...d, status: "REJECTED" as const } : d))
    );
    toast.info("เอกสารถูกปฏิเสธ");
    setVerifyDoc(null);
  };

  // Re-run OCR from verify modal
  const handleVerifyRerunOcr = (docId: string) => {
    setVerifyDoc(null);
    const doc = documents.find((d) => d.id === docId);
    if (doc) handleOcr(doc);
  };

  // Manual expense creation for OCR_FAILED docs
  const handleManualExpense = () => {
    navigate("/claims/create", { state: { isManualExpense: true } });
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

  // Create Claim flow with eligibility check
  const handleCreateClaim = () => {
    const selected = documents.filter((d) => selectedIds.includes(d.id));
    if (selected.length === 0) {
      toast.error("Please select at least one document.");
      return;
    }

    // Check for already-used documents
    const usedDocs = selected.filter((d) => d.status === "USED_IN_CLAIM");
    if (usedDocs.length > 0) {
      toast.error("เอกสารบางรายการถูกใช้ใน Claim แล้ว กรุณายกเลิกการเลือก");
      return;
    }

    // Check for rejected documents
    const rejectedDocs = selected.filter((d) => d.status === "REJECTED");
    if (rejectedDocs.length > 0) {
      toast.error("เอกสารที่ถูก Reject ไม่สามารถนำไปสร้าง Claim ได้");
      return;
    }

    // Only VERIFIED and AUTO_ACCEPT are eligible
    const eligible = selected.filter((d) => d.status === "VERIFIED");
    const ineligible = selected.filter((d) => d.status !== "VERIFIED");

    if (ineligible.length > 0) {
      setEligibleDocs(eligible);
      setIneligibleDocs(ineligible);
      setEligibilityModal(true);
      return;
    }

    navigateWithDocs(eligible);
  };

  const navigateWithDocs = (docs: UploadedDoc[]) => {
    // Mark docs as USED_IN_CLAIM
    const docIds = docs.map((d) => d.id);
    setDocuments((prev) =>
      prev.map((d) => docIds.includes(d.id) ? { ...d, status: "USED_IN_CLAIM" as const, linkedClaimId: `CLM-${Date.now()}` } : d)
    );
    setEligibilityModal(false);
    navigate("/claims/create", { state: { selectedDocs: docs } });
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
        onCreateClaim={handleCreateClaim}
        onManualExpense={handleManualExpense}
      />

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: FileText, title: "Supported Formats", desc: "PDF, JPG, PNG files up to 20MB each" },
          { icon: Zap, title: "AI Extraction", desc: "Documents are automatically processed with confidence scoring" },
          { icon: CheckCircle, title: "Decision Engine", desc: "Auto-accept ≥90%, Verify 70-89%, Reject <70% confidence" },
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
      <VerifyModal
        doc={verifyDoc}
        onClose={() => setVerifyDoc(null)}
        onConfirm={handleVerifyConfirm}
        onReject={handleVerifyReject}
        onRerunOcr={handleVerifyRerunOcr}
      />

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

      {/* Eligibility Modal */}
      <EligibilityModal
        open={eligibilityModal}
        ineligibleDocs={ineligibleDocs}
        eligibleCount={eligibleDocs.length}
        onCancel={() => setEligibilityModal(false)}
        onContinueWithEligible={() => navigateWithDocs(eligibleDocs)}
      />
    </div>
  );
}
