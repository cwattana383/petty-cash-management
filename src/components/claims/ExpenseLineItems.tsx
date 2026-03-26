import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Info,
  Plus,
  Trash2,
} from "lucide-react";
import {
  VAT_TYPE_CONFIG,
  getVatTypeConfig,
  getDefaultVatType,
} from "@/lib/vat-type-config";

export interface LineItem {
  id: string;
  supplierName: string;
  grossAmount: number;
  vatTypeId: string;
  vatTypeAutoFilled: boolean;
  vatTypeOriginal: string;
  vatTypeChanged: boolean;
  vatChangeReason: string;
  netAmount: number;
  vatAmount: number;
  taxInvoiceNumber: string;
  note: string;
}

function createEmptyLineItem(defaultVatId: string): LineItem {
  return {
    id: `li-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    supplierName: "",
    grossAmount: 0,
    vatTypeId: defaultVatId,
    vatTypeAutoFilled: !!defaultVatId,
    vatTypeOriginal: defaultVatId,
    vatTypeChanged: false,
    vatChangeReason: "",
    netAmount: 0,
    vatAmount: 0,
    taxInvoiceNumber: "",
    note: "",
  };
}

function calcVat(gross: number, vatTypeId: string): { net: number; vat: number } {
  if (gross <= 0) return { net: 0, vat: 0 };
  const config = getVatTypeConfig(vatTypeId);
  if (!config) return { net: gross, vat: 0 };

  switch (config.calcMethod) {
    case "exclusive":
    case "average": {
      const net = Math.round((gross / 1.07) * 100) / 100;
      const vat = Math.round((gross - net) * 100) / 100;
      return { net, vat };
    }
    case "inclusive":
      return { net: gross, vat: 0 };
    case "none":
    default:
      return { net: gross, vat: 0 };
  }
}

interface Props {
  subExpenseType: string;
  glCode: string;
  onValidationChange: (valid: boolean) => void;
  onTotalChange?: (totalGross: number) => void;
  hasTaxInvoiceDoc: boolean;
}

export default function ExpenseLineItems({
  subExpenseType,
  glCode,
  onValidationChange,
  onTotalChange,
  hasTaxInvoiceDoc,
}: Props) {
  const defaultVatId = getDefaultVatType(subExpenseType) || "no_vat";
  const [items, setItems] = useState<LineItem[]>([createEmptyLineItem(defaultVatId)]);
  const [showVatDocWarning, setShowVatDocWarning] = useState(false);

  useEffect(() => {
    const newDefaultVatId = getDefaultVatType(subExpenseType) || "no_vat";
    setItems([createEmptyLineItem(newDefaultVatId)]);
  }, [subExpenseType]);

  useEffect(() => {
    const allValid = items.every((item) => {
      const config = getVatTypeConfig(item.vatTypeId);
      if (config?.requiresTaxInvoice && !item.taxInvoiceNumber.trim()) return false;
      if (item.vatTypeChanged && !item.vatChangeReason.trim()) return false;
      return true;
    });

    const needsTaxDoc = items.some((item) => {
      const config = getVatTypeConfig(item.vatTypeId);
      return config?.requiresTaxInvoice;
    });
    setShowVatDocWarning(needsTaxDoc && !hasTaxInvoiceDoc);

    onValidationChange(allValid);
  }, [items, hasTaxInvoiceDoc, onValidationChange]);

  // Report total gross to parent
  useEffect(() => {
    const totalGross = items.reduce((s, i) => s + i.grossAmount, 0);
    onTotalChange?.(totalGross);
  }, [items, onTotalChange]);

  const updateItem = useCallback((id: string, updates: Partial<LineItem>) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...updates };
        if ("grossAmount" in updates || "vatTypeId" in updates) {
          const { net, vat } = calcVat(updated.grossAmount, updated.vatTypeId);
          updated.netAmount = net;
          updated.vatAmount = vat;
        }
        return updated;
      })
    );
  }, []);

  const addLineItem = () => {
    const newDefaultVatId = getDefaultVatType(subExpenseType) || "no_vat";
    setItems((prev) => [...prev, createEmptyLineItem(newDefaultVatId)]);
  };

  const removeLineItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleVatTypeChange = (id: string, newVatTypeId: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const changed = newVatTypeId !== item.vatTypeOriginal;
    updateItem(id, {
      vatTypeId: newVatTypeId,
      vatTypeChanged: changed,
      vatChangeReason: changed ? item.vatChangeReason : "",
    });
  };

  const handleSwitchToClaim100 = (id: string) => {
    handleVatTypeChange(id, "claim_100");
  };

  const totalGross = items.reduce((s, i) => s + i.grossAmount, 0);
  const totalNet = items.reduce((s, i) => s + i.netAmount, 0);
  const totalVat = items.reduce((s, i) => s + i.vatAmount, 0);

  const fmt = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Card className="border border-border rounded-xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold">Receipt/Tax Invoice Details</CardTitle>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            Enter details from the receipt — multiple items can be added.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {items.map((item, idx) => {
          const vatConfig = getVatTypeConfig(item.vatTypeId);
          const requiresTaxInvoice = vatConfig?.requiresTaxInvoice ?? false;
          const showTaxField = item.vatTypeId !== "no_vat";

          return (
            <div
              key={item.id}
              className="border border-border rounded-lg p-4 space-y-4 bg-background"
            >
              <div className="flex items-center justify-between">
                {items.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeLineItem(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Gross Amount */}
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-semibold text-foreground">
                    Gross Amount (THB) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    className="text-[13px] text-right"
                    placeholder="0.00"
                    value={item.grossAmount || ""}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      updateItem(item.id, { grossAmount: val });
                    }}
                  />
                </div>

                {/* VAT Type */}
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-semibold text-foreground">VAT Type</Label>
                  <Select
                    value={item.vatTypeId}
                    onValueChange={(v) => handleVatTypeChange(item.id, v)}
                  >
                    <SelectTrigger className="text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VAT_TYPE_CONFIG.map((vt) => (
                        <SelectItem key={vt.id} value={vt.id} className="text-[13px]">
                          {vt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Net Amount */}
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-semibold text-foreground">Net Amount (THB)</Label>
                  <Input readOnly className="bg-muted/40 text-[13px] text-right" value={fmt(item.netAmount)} />
                  {item.vatTypeId === "unclaim_100" && item.grossAmount > 0 && (
                    <p className="text-[11px] text-amber-600">VAT included in cost — not claimable</p>
                  )}
                  {item.vatTypeId === "avg" && item.grossAmount > 0 && (
                    <p className="text-[11px] text-blue-600">VAT will be split by NF:FF ratio by Accounting</p>
                  )}
                </div>

                {/* VAT Amount */}
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-semibold text-foreground">VAT Amount (THB)</Label>
                  <Input readOnly className="bg-muted/40 text-[13px] text-right" value={fmt(item.vatAmount)} />
                </div>


              </div>

              {/* VAT type changed — reason */}
              {item.vatTypeChanged && (
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-semibold text-foreground">
                    Reason for VAT Type Change <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    className="text-[13px]"
                    placeholder="Explain why the VAT type was changed"
                    value={item.vatChangeReason}
                    onChange={(e) => updateItem(item.id, { vatChangeReason: e.target.value })}
                  />
                  {!item.vatChangeReason.trim() && (
                    <p className="text-xs text-destructive">Please specify the reason for changing VAT Type</p>
                  )}
                </div>
              )}

              {/* No VAT but has tax invoice */}
              {item.vatTypeId === "no_vat" && hasTaxInvoiceDoc && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
                  <p className="text-[13px] text-amber-800 mb-2">
                    You attached a Tax Invoice — would you like to change VAT Type to Claim 100?
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50" onClick={() => handleSwitchToClaim100(item.id)}>
                      Change to Claim 100
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs">Keep No VAT</Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}


      </CardContent>
    </Card>
  );
}
