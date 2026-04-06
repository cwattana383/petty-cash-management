import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface NoDocumentWarningDialogProps {
  open: boolean;
  onClose: () => void;
  onGoBack: () => void;
  onSubmitAnyway: () => void;
}

export default function NoDocumentWarningDialog({ open, onClose, onGoBack, onSubmitAnyway }: NoDocumentWarningDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <DialogTitle>ยังไม่ได้แนบเอกสาร</DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-sm">
            รายการนี้ยังไม่มีใบกำกับภาษีแนบ หากไม่แนบเอกสารภายในกำหนด รายการจะถูกหักจากเงินเดือนของคุณโดยอัตโนมัติ
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" className="text-xs" onClick={onSubmitAnyway}>
            ส่งโดยไม่มีเอกสาร
          </Button>
          <Button onClick={onGoBack}>กลับไปแนบเอกสาร</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
