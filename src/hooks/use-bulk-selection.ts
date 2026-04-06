import { useState, useCallback, useEffect } from "react";

interface UseBulkSelectionOptions {
  /** Items on the current page */
  items: { id: string }[];
  /** Total record count (for "select all across pages" display) */
  totalCount: number;
}

export function useBulkSelection({ items, totalCount }: UseBulkSelectionOptions) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAllPages, setSelectAllPages] = useState(false);

  // Clear selection when items change (page/filter change)
  useEffect(() => {
    setSelectedIds(new Set());
    setSelectAllPages(false);
  }, [items]);

  const toggleOne = useCallback((id: string) => {
    setSelectAllPages(false);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAllOnPage = useCallback(() => {
    setSelectAllPages(false);
    const pageIds = items.map((i) => i.id);
    setSelectedIds((prev) => {
      const allSelected = pageIds.every((id) => prev.has(id));
      if (allSelected) {
        // Deselect all on page
        const next = new Set(prev);
        pageIds.forEach((id) => next.delete(id));
        return next;
      }
      // Select all on page
      const next = new Set(prev);
      pageIds.forEach((id) => next.add(id));
      return next;
    });
  }, [items]);

  const selectAllAcrossPages = useCallback(() => {
    setSelectAllPages(true);
    setSelectedIds(new Set());
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectAllPages(false);
  }, []);

  const pageIds = items.map((i) => i.id);
  const isAllOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const isIndeterminate = selectedIds.size > 0 && !isAllOnPageSelected && !selectAllPages;
  const hasSelection = selectedIds.size > 0 || selectAllPages;
  const selectionCount = selectAllPages ? totalCount : selectedIds.size;

  return {
    selectedIds,
    selectAllPages,
    toggleOne,
    toggleAllOnPage,
    selectAllAcrossPages,
    clearSelection,
    isAllOnPageSelected,
    isIndeterminate,
    hasSelection,
    selectionCount,
  };
}
