import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { OcrResultDisplayField } from "@/hooks/use-claim-documents";

export type OcrResultState = "pass" | "partial" | "fail";

const statusColors: Record<string, string> = {
  green: "bg-green-100 text-green-800 border-green-200",
  amber: "bg-amber-100 text-amber-800 border-amber-200",
  grey: "bg-muted text-muted-foreground border-border",
};

interface OcrResultCardProps {
  fileName: string;
  resultState: OcrResultState;
  /** From `previewResponseToOcrDisplayFields(previewOcrResponse)` — empty if API returned no rows */
  fields: OcrResultDisplayField[];
  onConfirm: () => void;
  onReupload: () => void;
}

export default function OcrResultCard({
  fileName,
  resultState,
  fields,
  onConfirm,
  onReupload,
}: OcrResultCardProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
        <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{fileName}</p>
          <p className="text-xs text-muted-foreground">ใบกำกับภาษี</p>
        </div>
      </div>

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
            {fields.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-xs text-muted-foreground py-6 text-center">
                  ไม่มีผลการตรวจสอบจากระบบสำหรับไฟล์นี้
                </TableCell>
              </TableRow>
            ) : (
              fields.map((f, i) => (
                <TableRow key={`${f.label}-${i}`}>
                  <TableCell className="text-xs font-medium py-2">{f.label}</TableCell>
                  <TableCell className="text-xs py-2 font-mono break-all max-w-[200px]">{f.value}</TableCell>
                  <TableCell className="py-2">
                    <Badge variant="outline" className={`text-[10px] ${statusColors[f.color]}`}>
                      {f.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {resultState === "pass" && (
        <>
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
            ✅ ผ่านการตรวจสอบ — เอกสารถูกต้องครบถ้วน
          </div>
          <div className="flex justify-end">
            <Button onClick={onConfirm} className="bg-green-600 hover:bg-green-700 text-white">
              ยืนยันและส่งอนุมัติ
            </Button>
          </div>
        </>
      )}

      {resultState === "partial" && (
        <>
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            ⚠️ ผ่านบางส่วน — มีรายการที่ต้องตรวจสอบเพิ่ม หรือบันทึกเพื่อให้ Finance ตรวจสอบภายหลัง
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onReupload}>
              อัปโหลดเอกสารใหม่
            </Button>
            <Button onClick={onConfirm}>ยืนยัน — เอกสารถูกต้องแล้ว</Button>
          </div>
        </>
      )}

      {resultState === "fail" && (
        <>
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
            ❌ ไม่ผ่านการตรวจสอบ — เลขประจำตัวผู้เสียภาษีหรือข้อมูลสำคัญไม่ตรงตามนโยบาย กรุณาใช้ใบกำกับภาษีที่ถูกต้องหรืออัปโหลดใหม่
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={onReupload}>
              อัปโหลดเอกสารใหม่
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
