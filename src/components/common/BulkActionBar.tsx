import { Button } from "@/components/ui/button";
import { Trash2, CheckCircle, XCircle, X, Loader2 } from "lucide-react";

interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  selectAllPages: boolean;
  isAllOnPageSelected: boolean;
  onSelectAllPages: () => void;
  onDelete: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onClear: () => void;
  isProcessing?: boolean;
}

export default function BulkActionBar({
  selectedCount,
  totalCount,
  selectAllPages,
  isAllOnPageSelected,
  onSelectAllPages,
  onDelete,
  onActivate,
  onDeactivate,
  onClear,
  isProcessing = false,
}: BulkActionBarProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">
          {selectAllPages
            ? `All ${totalCount} records selected`
            : `${selectedCount} selected`}
        </span>
        {isAllOnPageSelected && !selectAllPages && totalCount > selectedCount && (
          <button
            type="button"
            className="text-sm text-primary underline hover:no-underline"
            onClick={onSelectAllPages}
          >
            Select all {totalCount} records across all pages
          </button>
        )}
        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-foreground"
          onClick={onClear}
        >
          Clear selection
        </button>
      </div>
      <div className="flex items-center gap-2">
        {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
        <Button size="sm" variant="outline" onClick={onActivate} disabled={isProcessing}>
          <CheckCircle className="h-3.5 w-3.5 mr-1" />Activate
        </Button>
        <Button size="sm" variant="outline" onClick={onDeactivate} disabled={isProcessing}>
          <XCircle className="h-3.5 w-3.5 mr-1" />Deactivate
        </Button>
        <Button size="sm" variant="destructive" onClick={onDelete} disabled={isProcessing}>
          <Trash2 className="h-3.5 w-3.5 mr-1" />Delete
        </Button>
      </div>
    </div>
  );
}
