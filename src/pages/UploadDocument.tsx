import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Zap, CheckCircle, Eye, Code, Trash2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface UploadedDoc {
  id: string;
  name: string;
  size: number;
  ocrStatus: "To Verify" | "Processing" | "Verified" | "Failed";
  uploadedAt: Date;
  ocrData?: OcrField[];
}

interface OcrField {
  label: string;
  value: string;
  confidence: number;
}

const mockOcrFields: OcrField[] = [
  { label: "เลขประจำตัวผู้เสียภาษี", value: "0503568005200", confidence: 95 },
  { label: "วันเดือนปี", value: "19/12/2025", confidence: 90 },
  { label: "เลขที่", value: "054", confidence: 85 },
  { label: "ชื่อ ผู้มีหน้าที่หักภาษี ณ ที่จ่าย", value: "ห้างหุ้นส่วนจำกัด นาราพาเจริญ", confidence: 95 },
  { label: "ประเภทรายได้", value: "ค่าบริการ", confidence: 80 },
  { label: "อัตราภาษี", value: "3", confidence: 90 },
  { label: "จำนวนเงิน", value: "10,000.00", confidence: 95 },
];

export default function UploadDocument() {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [documents, setDocuments] = useState<UploadedDoc[]>([
    { id: "1", name: "ตัวอย่าง หัก ณ ที่จ่าย_Part1.pdf", size: 402.1 * 1024, ocrStatus: "To Verify", uploadedAt: new Date("2026-02-12T15:03:00"), ocrData: mockOcrFields },
    { id: "2", name: "ตัวอย่าง หัก ณ ที่จ่าย_Part20.pdf", size: 51.8 * 1024, ocrStatus: "To Verify", uploadedAt: new Date("2026-01-28T14:09:00"), ocrData: mockOcrFields },
    { id: "3", name: "ตัวอย่าง หัก ณ ที่จ่าย_Part19.pdf", size: 342.9 * 1024, ocrStatus: "To Verify", uploadedAt: new Date("2026-01-28T14:09:00"), ocrData: mockOcrFields },
    { id: "4", name: "ตัวอย่าง หัก ณ ที่จ่าย_Part18.pdf", size: 534.0 * 1024, ocrStatus: "Failed", uploadedAt: new Date("2026-01-28T14:09:00"), ocrData: mockOcrFields },
    { id: "5", name: "ตัวอย่าง หัก ณ ที่จ่าย_Part17.pdf", size: 49.9 * 1024, ocrStatus: "To Verify", uploadedAt: new Date("2026-01-28T14:09:00"), ocrData: mockOcrFields },
    { id: "6", name: "ตัวอย่าง หัก ณ ที่จ่าย_Part16.pdf", size: 47.0 * 1024, ocrStatus: "To Verify", uploadedAt: new Date("2026-01-28T14:09:00"), ocrData: mockOcrFields },
    { id: "7", name: "ตัวอย่าง หัก ณ ที่จ่าย_Part15.pdf", size: 46.8 * 1024, ocrStatus: "To Verify", uploadedAt: new Date("2026-01-28T14:09:00"), ocrData: mockOcrFields },
  ]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [verifyDoc, setVerifyDoc] = useState<UploadedDoc | null>(null);
  const [verifyFields, setVerifyFields] = useState<OcrField[]>([]);
  const [previewDoc, setPreviewDoc] = useState<UploadedDoc | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...dropped]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
  };

  const handleProcess = () => {
    const newDocs: UploadedDoc[] = files.map((f, i) => ({
      id: `new-${Date.now()}-${i}`,
      name: f.name,
      size: f.size,
      ocrStatus: "To Verify" as const,
      uploadedAt: new Date(),
      ocrData: mockOcrFields,
    }));
    setDocuments((prev) => [...newDocs, ...prev]);
    setFiles([]);
    toast.success(`${newDocs.length} เอกสารถูกอัปโหลดแล้ว`);
  };

  const handleDelete = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    toast.success("ลบเอกสารแล้ว");
  };

  const handleOcr = (doc: UploadedDoc) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, ocrStatus: "Processing" as const } : d))
    );
    setTimeout(() => {
      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, ocrStatus: "To Verify" as const } : d))
      );
      toast.success(`OCR เสร็จสิ้นสำหรับ ${doc.name}`);
    }, 2000);
  };

  const openVerify = (doc: UploadedDoc) => {
    setVerifyDoc(doc);
    setVerifyFields(doc.ocrData ? [...doc.ocrData] : []);
  };

  const handleVerifyConfirm = () => {
    if (verifyDoc) {
      setDocuments((prev) =>
        prev.map((d) => (d.id === verifyDoc.id ? { ...d, ocrStatus: "Verified" as const, ocrData: verifyFields } : d))
      );
      toast.success("ยืนยันข้อมูล OCR แล้ว");
    }
    setVerifyDoc(null);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) => prev.length === documents.length ? [] : documents.map((d) => d.id));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const formatDate = (d: Date) =>
    `${d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })} at ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}`;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "To Verify":
        return <Badge variant="outline" className="border-orange-300 bg-orange-50 text-orange-600 gap-1"><span className="h-1.5 w-1.5 rounded-full bg-orange-500" />To Verify</Badge>;
      case "Processing":
        return <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-600 gap-1"><span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />Processing</Badge>;
      case "Verified":
        return <Badge variant="outline" className="border-green-300 bg-green-50 text-green-600 gap-1"><span className="h-1.5 w-1.5 rounded-full bg-green-500" />Verified</Badge>;
      case "Failed":
        return <Badge variant="outline" className="border-red-300 bg-red-50 text-red-600 gap-1"><span className="h-1.5 w-1.5 rounded-full bg-red-500" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const confidenceColor = (c: number) => {
    if (c >= 90) return "bg-green-100 text-green-700";
    if (c >= 80) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Upload Documents</h1>
        <p className="text-muted-foreground">Upload documents for AI-powered extraction</p>
      </div>

      {/* Upload Area */}
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
              accept=".pdf,.png,.doc,.docx"
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
          <p className="text-xs text-muted-foreground mt-3">Supported: PDF, PNG, DOC, DOCX (max 10 files)</p>
        </CardContent>
      </Card>

      {/* Selected files before processing */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Selected Files ({files.length})</h3>
            <div className="space-y-2">
              {files.map((file, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm flex-1 truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</span>
                </div>
              ))}
            </div>
            <Button className="mt-4 w-full" onClick={handleProcess}>Process Documents with AI</Button>
          </CardContent>
        </Card>
      )}

      {/* Document List Table */}
      {documents.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">WHT Documents ({documents.length})</h3>
                <p className="text-sm text-muted-foreground">All uploaded Withholding Tax documents</p>
              </div>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedIds.length === documents.length && documents.length > 0}
                        onCheckedChange={toggleSelectAll}
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
                          onCheckedChange={() => toggleSelect(doc.id)}
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
                      <TableCell className="text-sm text-muted-foreground">{formatSize(doc.size)}</TableCell>
                      <TableCell>{getStatusBadge(doc.ocrStatus)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(doc.uploadedAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {doc.ocrStatus !== "Failed" && (
                            <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => openVerify(doc)}>
                              <Eye className="h-3.5 w-3.5" /> Verify
                            </Button>
                          )}
                          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => handleOcr(doc)}>
                            <Code className="h-3.5 w-3.5" /> OCR
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => setPreviewDoc(doc)}>
                            <Eye className="h-3.5 w-3.5" /> Preview
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1 text-xs text-destructive hover:text-destructive" onClick={() => handleDelete(doc.id)}>
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: FileText, title: "Supported Formats", desc: "PDF, PNG, DOC, DOCX files up to 20MB each" },
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
      <Dialog open={!!verifyDoc} onOpenChange={(open) => !open && setVerifyDoc(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Verify Document: {verifyDoc?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-6 overflow-y-auto max-h-[65vh] pr-2">
            {/* Left: OCR Results */}
            <div>
              <h4 className="font-semibold mb-1">OCR Results</h4>
              <p className="text-sm text-muted-foreground mb-4">Review and edit extracted fields if needed</p>
              <div className="space-y-4">
                {verifyFields.map((field, idx) => (
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
                        const updated = [...verifyFields];
                        updated[idx] = { ...updated[idx], value: e.target.value };
                        setVerifyFields(updated);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
            {/* Right: PDF Preview placeholder */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h4 className="font-semibold">PDF Preview</h4>
                  <p className="text-sm text-muted-foreground">Original document for reference</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}>
                    <Search className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-sm font-medium min-w-[40px] text-center">{zoomLevel}%</span>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoomLevel((z) => Math.min(200, z + 10))}>
                    <Search className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="border rounded-lg bg-muted/30 h-[55vh] flex items-center justify-center overflow-auto">
                <div className="text-center text-muted-foreground p-8" style={{ transform: `scale(${zoomLevel / 100})` }}>
                  <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-sm">PDF Preview</p>
                  <p className="text-xs mt-1">เอกสารจะแสดงตรงนี้เมื่อเชื่อมต่อกับ backend</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyDoc(null)}>Cancel</Button>
            <Button onClick={handleVerifyConfirm} className="gap-2">
              <CheckCircle className="h-4 w-4" /> Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Preview: {previewDoc?.name}</DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg bg-muted/30 h-[60vh] flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-sm">PDF Preview</p>
              <p className="text-xs mt-1">เอกสารจะแสดงตรงนี้เมื่อเชื่อมต่อกับ backend</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
