import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ShieldX } from "lucide-react";
import { UploadedDoc, STATUS_CONFIG } from "@/lib/upload-types";

interface EligibilityModalProps {
  open: boolean;
  ineligibleDocs: UploadedDoc[];
  eligibleCount: number;
  onCancel: () => void;
  onContinueWithEligible: () => void;
}

export default function EligibilityModal({
  open, ineligibleDocs, eligibleCount, onCancel, onContinueWithEligible,
}: EligibilityModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Ineligible Documents
          </DialogTitle>
          <DialogDescription>
            Please verify all documents before creating a claim. Only verified documents can be used.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-40 overflow-y-auto">
          {ineligibleDocs.map((doc) => {
            const cfg = STATUS_CONFIG[doc.status];
            return (
              <div key={doc.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted">
                <span className="truncate max-w-[200px]">{doc.name}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${cfg.badgeClass}`}>{cfg.label}</span>
                  {doc.ocrConfidenceScore != null && (
                    <span className="text-xs text-muted-foreground">{doc.ocrConfidenceScore}%</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button
            onClick={onContinueWithEligible}
            disabled={eligibleCount === 0}
          >
            Continue with {eligibleCount} eligible doc{eligibleCount !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
