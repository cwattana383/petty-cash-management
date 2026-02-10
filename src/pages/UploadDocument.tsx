import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Zap, CheckCircle } from "lucide-react";

export default function UploadDocument() {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Upload Documents</h1>
        <p className="text-muted-foreground">Upload documents for AI-powered extraction</p>
      </div>

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
          <label>
            <Button className="cursor-pointer">Select Files</Button>
            <input type="file" className="hidden" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleFileSelect} />
          </label>
          <p className="text-xs text-muted-foreground mt-3">Supported: PDF, JPG, PNG, DOC, DOCX (max 10 files)</p>
        </CardContent>
      </Card>

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
            <Button className="mt-4 w-full">Process Documents with AI</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: FileText, title: "Supported Formats", desc: "PDF, JPG, PNG, DOC, DOCX files up to 20MB each" },
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
    </div>
  );
}
