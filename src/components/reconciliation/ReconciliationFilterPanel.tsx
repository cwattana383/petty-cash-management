import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Search, RotateCcw } from "lucide-react";
import { ReconciliationFilters, defaultFilters } from "@/lib/reconciliation-types";

interface Props {
  filters: ReconciliationFilters;
  onChange: (f: ReconciliationFilters) => void;
  onAutoReconcile?: () => void;
}

export default function ReconciliationFilterPanel({ filters, onChange, onAutoReconcile }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  const update = (key: keyof ReconciliationFilters, val: string) =>
    onChange({ ...filters, [key]: val });

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            className="flex items-center gap-1 text-sm font-semibold text-foreground"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            Search & Filters
          </button>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => onChange(defaultFilters)}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" />Reset
            </Button>
          </div>
        </div>

        {!collapsed && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Keyword */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Merchant, reference, claim no., auth code..."
                className="pl-9"
                value={filters.keyword}
                onChange={(e) => update("keyword", e.target.value)}
              />
            </div>

            {/* Transaction Type */}
            <Select value={filters.transactionType} onValueChange={(v) => update("transactionType", v)}>
              <SelectTrigger><SelectValue placeholder="Transaction Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="claim">Claim</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>

            {/* Transaction Source */}
            <Select value={filters.transactionSource} onValueChange={(v) => update("transactionSource", v)}>
              <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="Bank">Bank</SelectItem>
                <SelectItem value="System">System</SelectItem>
                <SelectItem value="User">User</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <Input type="date" placeholder="From" value={filters.dateFrom} onChange={(e) => update("dateFrom", e.target.value)} className="text-xs" />
              <span className="text-muted-foreground text-xs">-</span>
              <Input type="date" placeholder="To" value={filters.dateTo} onChange={(e) => update("dateTo", e.target.value)} className="text-xs" />
            </div>

            {/* Amount Range */}
            <div className="flex items-center gap-2">
              <Input type="number" placeholder="Min ฿" value={filters.amountMin} onChange={(e) => update("amountMin", e.target.value)} className="text-xs" />
              <span className="text-muted-foreground text-xs">-</span>
              <Input type="number" placeholder="Max ฿" value={filters.amountMax} onChange={(e) => update("amountMax", e.target.value)} className="text-xs" />
            </div>

            {/* Auto Reconcile */}
            {onAutoReconcile && (
              <Button size="sm" variant="default" onClick={onAutoReconcile} className="h-9">
                Auto Reconcile
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
