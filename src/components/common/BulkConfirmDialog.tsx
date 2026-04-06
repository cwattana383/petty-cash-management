import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface BulkConfirmDialogProps {
  open: boolean;
  action: "delete" | "activate" | "deactivate" | null;
  count: number;
  resourceName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

const ACTION_CONFIG = {
  delete: {
    title: "Delete Selected Records",
    getDescription: (count: number, resource: string) =>
      `Are you sure you want to delete ${count} ${resource}? This action cannot be undone.`,
    confirmLabel: "Delete",
    confirmClass: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  },
  activate: {
    title: "Activate Selected Records",
    getDescription: (count: number, resource: string) =>
      `Are you sure you want to activate ${count} ${resource}?`,
    confirmLabel: "Activate",
    confirmClass: "",
  },
  deactivate: {
    title: "Deactivate Selected Records",
    getDescription: (count: number, resource: string) =>
      `Are you sure you want to deactivate ${count} ${resource}?`,
    confirmLabel: "Deactivate",
    confirmClass: "",
  },
};

export default function BulkConfirmDialog({
  open,
  action,
  count,
  resourceName,
  onConfirm,
  onCancel,
  isProcessing = false,
}: BulkConfirmDialogProps) {
  if (!action) return null;

  const config = ACTION_CONFIG[action];

  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{config.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {config.getDescription(count, resourceName)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isProcessing}
            className={config.confirmClass}
          >
            {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {config.confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
