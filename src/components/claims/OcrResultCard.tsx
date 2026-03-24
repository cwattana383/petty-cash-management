import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export type OcrResultState = "pass" | "partial" | "fail";

interface OcrField {
  label: string;
  value: string;
  status: string;
  color: "green" | "amber" | "grey";
}

const OCR_FIELDS: OcrField[] = [
  { label: "Tax ID", value: "0105556016761", status: "✅ ตรงกับ CPAxtra", color: "green" },
  { label: "ชื่อผู้ซื้อ", value: "บริษัท CP Axtra จำกัด", status: "✅ ตรงกัน", color: "green" },
  { label: "Buyer Address", value: "1468 ถ.พัฒนาการ กทม.", status: "⚠️ ตรงบางส่วน", color: "amber" },
  { label: "หมายเลขบัตรเครดิต", value: "XXXX-XXXX-XXXX-1234", status: "✅ ตรงกัน", color: "green" },
  { label: "ยอดเงินในเอกสาร", value: "฿1,500.00", status: "✅ ตรงกับรายการ", color: "green" },
  { label: "วันที่ในเอกสาร", value: "28/02/2569", status: "✅ อยู่ในช่วงเวลา", color: "green" },
  { label: "Invoice No.Tax Invoice", value: "INV-2025-0892", status: "ℹ️ Saveแล้ว", color: "grey" },
];

const statusColors: Record<string, string> = {
  green: "bg-green-100 text-green-800 border-green-200",
  amber: "bg-amber-100 text-amber-800 border-amber-200",
  grey: "bg-muted text-muted-foreground border-border",
};

interface OcrResultCardProps {
  fileName: string;
  resultState: OcrResultState;
  onConfirm: () => void;
  onReupload: () => void;
}

export default function OcrResultCard({ fileName, resultState, onConfirm, onReupload }: OcrResultCardProps) {
  return (
    <div className="space-y-4">
      {/* File header */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
        <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{fileName}</p>
          <p className="text-xs text-muted-foreground">Tax Invoice</p>
        </div>
      </div>

      {/* OCR Results Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">ฟิลด์</TableHead>
              <TableHead className="text-xs">ข้อมูลที่อ่านได้</TableHead>
              <TableHead className="text-xs">สถานะ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {OCR_FIELDS.map((f) => (
              <TableRow key={f.label}>
                <TableCell className="text-xs font-medium py-2">{f.label}</TableCell>
                <TableCell className="text-xs py-2 font-mono">{f.value}</TableCell>
                <TableCell className="py-2">
                  <Badge variant="outline" className={`text-[10px] ${statusColors[f.color]}`}>{f.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Result Banner + Buttons */}
      {resultState === "pass" && (
        <>
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
            ✅ Verified — Document is complete and correct
          </div>
          <div className="flex justify-end">
            <Button onClick={onConfirm} className="bg-green-600 hover:bg-green-700 text-white">
              Confirm and Submit for Approval
            </Button>
          </div>
        </>
      )}

      {resultState === "partial" && (
        <>
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            ⚠️ Partially verified — Buyer address partially matches. The system will record it for Finance to review.
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onReupload}>Upload New Document</Button>
            <Button onClick={onConfirm}>Confirm — Document is Correct</Button>
          </div>
        </>
      )}

      {resultState === "fail" && (
        <>
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
            ❌ Verification failed — Tax ID does not match CPAxtra records. Please use tax invoices issued in the name of CPAxtra only.
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={onReupload}>Upload New Document</Button>
          </div>
        </>
      )}
    </div>
  );
}
