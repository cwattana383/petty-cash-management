import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pencil } from "lucide-react";
import { CompanyIdentity, createEmptyEntity } from "./EntityTypes";
import { toast } from "@/hooks/use-toast";

interface EntityDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: CompanyIdentity | null;
  mode: "view" | "edit" | "create";
  onSave: (entity: CompanyIdentity) => void;
  existingTaxIds: string[];
  nextCode: string;
}

export default function EntityDrawer({ open, onOpenChange, entity, mode: initialMode, onSave, existingTaxIds, nextCode }: EntityDrawerProps) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState<CompanyIdentity>(createEmptyEntity(nextCode));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setMode(initialMode);
    if (entity && (initialMode === "edit" || initialMode === "view")) {
      setForm(JSON.parse(JSON.stringify(entity)));
    } else {
      setForm(createEmptyEntity(nextCode));
    }
    setErrors({});
  }, [entity, initialMode, open, nextCode]);

  const isReadOnly = mode === "view";

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.legalNameTh.trim()) errs.legalNameTh = "Legal Entity Name (TH) is required";
    if (!form.taxId) errs.taxId = "Tax ID is required";
    else if (!/^\d{13}$/.test(form.taxId)) errs.taxId = "Tax ID must be exactly 13 digits";
    else {
      const otherTaxIds = existingTaxIds.filter((id) => id !== entity?.taxId);
      if (otherTaxIds.includes(form.taxId)) errs.taxId = "Tax ID already exists in system";
    }
    if (!form.address.trim()) errs.address = "Address is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      toast({ title: "Validation Error", description: "Please fix the errors before saving.", variant: "destructive" });
      return;
    }
    onSave({ ...form, lastUpdated: new Date().toISOString().split("T")[0] });
    onOpenChange(false);
  };

  const updateField = (field: keyof CompanyIdentity, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const title = mode === "create" ? "Add Company Identity" : mode === "edit" ? "Edit Company Identity" : form.legalNameTh || "Company Detail";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="!max-w-xl !w-full p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-lg">{title}</SheetTitle>
              <SheetDescription>{mode === "view" ? "View company identity details" : "Fill in company identity information"}</SheetDescription>
            </div>
            {mode === "view" && (
              <Button size="sm" variant="outline" onClick={() => setMode("edit")}>
                <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-5">
            {/* Legal Entity Name (TH) */}
            <div className="space-y-1.5">
              <Label className="text-xs">Legal Entity Name (TH) <span className="text-destructive">*</span></Label>
              <Input
                value={form.legalNameTh}
                onChange={(e) => updateField("legalNameTh", e.target.value)}
                disabled={isReadOnly}
                className={errors.legalNameTh ? "border-destructive" : ""}
              />
              {errors.legalNameTh && <p className="text-xs text-destructive">{errors.legalNameTh}</p>}
            </div>

            {/* Tax ID */}
            <div className="space-y-1.5">
              <Label className="text-xs">Tax ID (13 digits) <span className="text-destructive">*</span></Label>
              <Input
                value={form.taxId}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 13);
                  updateField("taxId", val);
                }}
                disabled={isReadOnly}
                placeholder="0000000000000"
                maxLength={13}
                className={errors.taxId ? "border-destructive" : ""}
              />
              {errors.taxId && <p className="text-xs text-destructive">{errors.taxId}</p>}
            </div>

            {/* CPAxtra Address */}
            <div className="space-y-1.5">
              <Label className="text-xs">CPAxtra Address <span className="text-destructive">*</span></Label>
              <Textarea
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                disabled={isReadOnly}
                rows={2}
                placeholder="Enter address for OCR address match validation"
                className={errors.address ? "border-destructive" : ""}
              />
              {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <div className="flex items-center gap-2 h-10">
                <Switch
                  checked={form.status === "Active"}
                  onCheckedChange={(c) => updateField("status", c ? "Active" : "Inactive")}
                  disabled={isReadOnly}
                />
                <Badge className={form.status === "Active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                  {form.status}
                </Badge>
              </div>
            </div>

            {/* Company Code (read-only) */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Company Code (auto-generated)</Label>
              <Input
                value={form.companyCode}
                disabled
                className="bg-muted text-muted-foreground"
              />
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        {!isReadOnly && (
          <div className="border-t px-6 py-4 flex justify-end gap-2 shrink-0">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleSave}>
              {initialMode === "create" ? "Create Company Identity" : "Save Changes"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
