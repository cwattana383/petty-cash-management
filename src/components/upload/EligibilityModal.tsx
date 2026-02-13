import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { UploadedDoc } from "@/lib/upload-types";

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
            Some selected documents are not VERIFIED and cannot be included in a claim.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 max-h-40 overflow-y-auto">
          {ineligibleDocs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted">
              <span className="truncate max-w-[250px]">{doc.name}</span>
              <span className="text-xs text-muted-foreground uppercase">{doc.status}</span>
            </div>
          ))}
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
