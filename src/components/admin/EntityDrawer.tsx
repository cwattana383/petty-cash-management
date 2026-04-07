import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, AlertTriangle, Pencil } from "lucide-react";
import { CompanyIdentity, TaxIdEntry, createEmptyEntity, emptyAddress } from "./EntityTypes";
import { toast } from "@/hooks/use-toast";

interface EntityDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: CompanyIdentity | null;
  mode: "view" | "edit" | "create";
  onSave: (entity: CompanyIdentity) => void | Promise<void>;
  existingCodes: string[];
  existingTaxIds: string[];
  isSaving?: boolean;
}

export default function EntityDrawer({ open, onOpenChange, entity, mode: initialMode, onSave, existingCodes, existingTaxIds, isSaving = false }: EntityDrawerProps) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState<CompanyIdentity>(createEmptyEntity());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newAlias, setNewAlias] = useState("");
  const [newAddressAlias, setNewAddressAlias] = useState("");

  useEffect(() => {
    setMode(initialMode);
    if (entity && (initialMode === "edit" || initialMode === "view")) {
      setForm(JSON.parse(JSON.stringify(entity)));
    } else {
      setForm(createEmptyEntity());
    }
    setErrors({});
    setNewAlias("");
    setNewAddressAlias("");
  }, [entity, initialMode, open]);

  const isReadOnly = mode === "view";

  const validate = (data: CompanyIdentity): boolean => {
    const errs: Record<string, string> = {};
    if (!data.companyCode.trim()) errs.companyCode = "Company Code is required";
    else {
      const otherCodes = existingCodes.filter((code) => code !== entity?.companyCode?.toUpperCase());
      if (otherCodes.includes(data.companyCode.toUpperCase())) errs.companyCode = "Company Code already exists";
    }
    if (!data.legalNameTh.trim()) errs.legalNameTh = "Legal Entity Name (TH) is required";
    if (!data.effectiveStartDate) errs.effectiveStartDate = "Effective Start Date is required";
    if (data.effectiveEndDate && data.effectiveStartDate && data.effectiveEndDate <= data.effectiveStartDate) errs.effectiveEndDate = "End Date must be after Start Date";
    if (data.taxIds.length === 0) errs.taxIds = "At least 1 Tax ID is required";
    const hasPrimary = data.taxIds.some((t) => t.isPrimary);
    if (!hasPrimary) errs.taxIdPrimary = "At least 1 Primary Tax ID is required";
    data.taxIds.forEach((t, i) => {
      if (!t.taxId) errs[`taxId_${i}`] = "Tax ID is required";
      else if (!/^\d{13}$/.test(t.taxId)) errs[`taxId_${i}`] = "Tax ID must be exactly 13 digits";
      const otherTaxIds = existingTaxIds.filter((id) => !entity?.taxIds.some((et) => et.taxId === id));
      if (otherTaxIds.includes(t.taxId)) errs[`taxId_${i}_dup`] = "Tax ID already exists in system";
    });
    // check duplicates within form
    const seen = new Set<string>();
    data.taxIds.forEach((t, i) => {
      if (t.taxId && seen.has(t.taxId)) errs[`taxId_${i}_dup`] = "Duplicate Tax ID";
      seen.add(t.taxId);
    });
    // alias duplicates
    const aliasSeen = new Set<string>();
    data.nameAliases.forEach((a, i) => {
      if (aliasSeen.has(a.alias.toLowerCase())) errs[`alias_${i}`] = "Duplicate alias";
      aliasSeen.add(a.alias.toLowerCase());
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    // Auto-add any pending alias/address alias text before saving
    const pendingNameAliases = newAlias.trim()
      ? [...form.nameAliases, { id: crypto.randomUUID(), alias: newAlias.trim() }]
      : form.nameAliases;
    const pendingAddressAliases = newAddressAlias.trim()
      ? [...form.addressAliases, { id: crypto.randomUUID(), alias: newAddressAlias.trim() }]
      : form.addressAliases;
    const finalForm = { ...form, nameAliases: pendingNameAliases, addressAliases: pendingAddressAliases };
    setForm(finalForm);
    setNewAlias("");
    setNewAddressAlias("");

    if (!validate(finalForm)) {
      toast({ title: "Validation Error", description: "Please fix the errors before saving.", variant: "destructive" });
      return;
    }
    try {
      await onSave({ ...finalForm, companyCode: finalForm.companyCode.toUpperCase(), lastUpdated: new Date().toISOString().split("T")[0] });
      onOpenChange(false);
    } catch {
      toast({ title: "Save Failed", description: "An error occurred while saving. Please try again.", variant: "destructive" });
    }
  };

  const updateField = (field: keyof CompanyIdentity, value: CompanyIdentity[keyof CompanyIdentity]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addTaxId = () => {
    setForm((prev) => ({
      ...prev,
      taxIds: [...prev.taxIds, { id: crypto.randomUUID(), taxId: "", branchType: "สำนักงานใหญ่" as const, branchNo: "", isPrimary: false }],
    }));
  };

  const removeTaxId = (id: string) => {
    setForm((prev) => ({ ...prev, taxIds: prev.taxIds.filter((t) => t.id !== id) }));
  };

  const updateTaxId = (id: string, field: keyof TaxIdEntry, value: TaxIdEntry[keyof TaxIdEntry]) => {
    setForm((prev) => ({
      ...prev,
      taxIds: prev.taxIds.map((t) => {
        if (t.id !== id) {
          if (field === "isPrimary" && value === true) return { ...t, isPrimary: false };
          return t;
        }
        return { ...t, [field]: value };
      }),
    }));
  };

  const addAlias = () => {
    if (!newAlias.trim()) return;
    setForm((prev) => ({
      ...prev,
      nameAliases: [...prev.nameAliases, { id: crypto.randomUUID(), alias: newAlias.trim() }],
    }));
    setNewAlias("");
  };

  const removeAlias = (index: number) => {
    setForm((prev) => ({
      ...prev,
      nameAliases: prev.nameAliases.filter((_, i) => i !== index),
    }));
  };

  const addAddressAlias = () => {
    if (!newAddressAlias.trim()) return;
    setForm((prev) => ({
      ...prev,
      addressAliases: [...prev.addressAliases, { id: crypto.randomUUID(), alias: newAddressAlias.trim() }],
    }));
    setNewAddressAlias("");
  };

  const removeAddressAlias = (index: number) => {
    setForm((prev) => ({
      ...prev,
      addressAliases: prev.addressAliases.filter((_, i) => i !== index),
    }));
  };

  const updateAddress = (lang: "addressTh" | "addressEn", field: string, value: string) => {
    setForm((prev) => ({ ...prev, [lang]: { ...prev[lang], [field]: value } }));
  };

  const title = mode === "create" ? "Add Company Identity" : mode === "edit" ? "Edit Company Identity" : form.legalNameTh || "Company Detail";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="!max-w-2xl !w-full p-0 flex flex-col">
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
          <div className="p-6 space-y-6">
            {/* Section 1: Basic Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Company Code <span className="text-destructive">*</span></Label>
                    <Input
                      value={form.companyCode}
                      onChange={(e) => updateField("companyCode", e.target.value.toUpperCase())}
                      disabled={isReadOnly}
                      placeholder="e.g. CORP-01"
                      className={errors.companyCode ? "border-destructive" : ""}
                    />
                    {errors.companyCode && <p className="text-xs text-destructive">{errors.companyCode}</p>}
                  </div>
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
                </div>
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
                <div className="space-y-1.5">
                  <Label className="text-xs">Legal Entity Name (EN)</Label>
                  <Input value={form.legalNameEn} onChange={(e) => updateField("legalNameEn", e.target.value)} disabled={isReadOnly} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Effective Start Date <span className="text-destructive">*</span></Label>
                    <Input
                      type="date"
                      value={form.effectiveStartDate}
                      onChange={(e) => updateField("effectiveStartDate", e.target.value)}
                      disabled={isReadOnly}
                      className={errors.effectiveStartDate ? "border-destructive" : ""}
                    />
                    {errors.effectiveStartDate && <p className="text-xs text-destructive">{errors.effectiveStartDate}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Effective End Date</Label>
                    <Input
                      type="date"
                      value={form.effectiveEndDate}
                      onChange={(e) => updateField("effectiveEndDate", e.target.value)}
                      disabled={isReadOnly}
                      className={errors.effectiveEndDate ? "border-destructive" : ""}
                    />
                    {errors.effectiveEndDate && <p className="text-xs text-destructive">{errors.effectiveEndDate}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Tax ID Configuration */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Tax ID Configuration</CardTitle>
                  {!isReadOnly && (
                    <Button size="sm" variant="outline" onClick={addTaxId}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Tax ID
                    </Button>
                  )}
                </div>
                {(errors.taxIds || errors.taxIdPrimary) && (
                  <div className="flex items-center gap-1.5 text-xs text-destructive mt-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {errors.taxIds || errors.taxIdPrimary}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {form.taxIds.map((t, i) => (
                  <div key={t.id} className="border rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">Tax ID #{i + 1}</span>
                        {t.isPrimary && <Badge className="bg-primary/10 text-primary text-xs">Primary</Badge>}
                      </div>
                      {!isReadOnly && form.taxIds.length > 1 && (
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeTaxId(t.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Tax ID (13 digits) <span className="text-destructive">*</span></Label>
                        <Input
                          value={t.taxId}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 13);
                            updateTaxId(t.id, "taxId", val);
                          }}
                          disabled={isReadOnly}
                          placeholder="0000000000000"
                          maxLength={13}
                          className={errors[`taxId_${i}`] || errors[`taxId_${i}_dup`] ? "border-destructive" : ""}
                        />
                        {(errors[`taxId_${i}`] || errors[`taxId_${i}_dup`]) && (
                          <p className="text-xs text-destructive">{errors[`taxId_${i}`] || errors[`taxId_${i}_dup`]}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Branch Type</Label>
                        <Select
                          value={t.branchType}
                          onValueChange={(v) => updateTaxId(t.id, "branchType", v)}
                          disabled={isReadOnly}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Head Office">Head Office</SelectItem>
                            <SelectItem value="สาขา">สาขา</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Branch No.</Label>
                        <Input
                          value={t.branchNo}
                          onChange={(e) => updateTaxId(t.id, "branchNo", e.target.value.replace(/\D/g, ""))}
                          disabled={isReadOnly || t.branchType === "สำนักงานใหญ่"}
                          placeholder={t.branchType === "สาขา" ? "e.g. 00001" : "-"}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Primary</Label>
                        <div className="flex items-center h-10">
                          <input
                            type="radio"
                            name="primaryTaxId"
                            checked={t.isPrimary}
                            onChange={() => updateTaxId(t.id, "isPrimary", true)}
                            disabled={isReadOnly}
                            className="h-4 w-4 text-primary"
                          />
                          <span className="ml-2 text-xs">Set as Primary</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Section 3: Company Name Alias */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Company Name Alias</CardTitle>
                <p className="text-xs text-muted-foreground">Used for fuzzy matching with OCR results</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {form.nameAliases.map((a, i) => (
                  <div key={a.id} className="flex items-center gap-2">
                    <Input value={a.alias} onChange={(e) => {
                      const updated = [...form.nameAliases];
                      updated[i] = { ...updated[i], alias: e.target.value };
                      updateField("nameAliases", updated);
                    }} disabled={isReadOnly} />
                    {!isReadOnly && (
                      <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => removeAlias(i)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                    {errors[`alias_${i}`] && <p className="text-xs text-destructive">{errors[`alias_${i}`]}</p>}
                  </div>
                ))}
                {!isReadOnly && (
                  <div className="flex items-center gap-2">
                    <Input
                      value={newAlias}
                      onChange={(e) => setNewAlias(e.target.value)}
                      placeholder="Add new alias name..."
                      onKeyDown={(e) => e.key === "Enter" && addAlias()}
                    />
                    <Button size="sm" variant="outline" onClick={addAlias} disabled={!newAlias.trim()}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
                {form.nameAliases.length === 0 && isReadOnly && (
                  <p className="text-xs text-muted-foreground italic">No aliases configured</p>
                )}
              </CardContent>
            </Card>

            {/* Section 4: Address Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Address Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground mb-2 block">Primary Address (TH)</Label>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Address Line 1</Label>
                      <Input value={form.addressTh.addressLine1} onChange={(e) => updateAddress("addressTh", "addressLine1", e.target.value)} disabled={isReadOnly} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Subdistrict</Label>
                        <Input value={form.addressTh.subdistrict} onChange={(e) => updateAddress("addressTh", "subdistrict", e.target.value)} disabled={isReadOnly} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">District</Label>
                        <Input value={form.addressTh.district} onChange={(e) => updateAddress("addressTh", "district", e.target.value)} disabled={isReadOnly} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Province</Label>
                        <Input value={form.addressTh.province} onChange={(e) => updateAddress("addressTh", "province", e.target.value)} disabled={isReadOnly} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Postal Code</Label>
                        <Input value={form.addressTh.postalCode} onChange={(e) => updateAddress("addressTh", "postalCode", e.target.value.replace(/\D/g, "").slice(0, 5))} disabled={isReadOnly} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Country</Label>
                        <Input value={form.addressTh.country} onChange={(e) => updateAddress("addressTh", "country", e.target.value)} disabled={isReadOnly} />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-xs font-semibold text-muted-foreground mb-2 block">Primary Address (EN) — Optional</Label>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Address Line 1</Label>
                      <Input value={form.addressEn.addressLine1} onChange={(e) => updateAddress("addressEn", "addressLine1", e.target.value)} disabled={isReadOnly} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Subdistrict</Label>
                        <Input value={form.addressEn.subdistrict} onChange={(e) => updateAddress("addressEn", "subdistrict", e.target.value)} disabled={isReadOnly} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">District</Label>
                        <Input value={form.addressEn.district} onChange={(e) => updateAddress("addressEn", "district", e.target.value)} disabled={isReadOnly} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Province</Label>
                        <Input value={form.addressEn.province} onChange={(e) => updateAddress("addressEn", "province", e.target.value)} disabled={isReadOnly} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Postal Code</Label>
                        <Input value={form.addressEn.postalCode} onChange={(e) => updateAddress("addressEn", "postalCode", e.target.value.replace(/\D/g, "").slice(0, 5))} disabled={isReadOnly} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Country</Label>
                        <Input value={form.addressEn.country} onChange={(e) => updateAddress("addressEn", "country", e.target.value)} disabled={isReadOnly} />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 5: Address Alias */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Address Alias</CardTitle>
                <p className="text-xs text-muted-foreground">Short forms, variations for OCR matching</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {form.addressAliases.map((a, i) => (
                  <div key={a.id} className="flex items-center gap-2">
                    <Input value={a.alias} onChange={(e) => {
                      const updated = [...form.addressAliases];
                      updated[i] = { ...updated[i], alias: e.target.value };
                      updateField("addressAliases", updated);
                    }} disabled={isReadOnly} />
                    {!isReadOnly && (
                      <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => removeAddressAlias(i)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
                {!isReadOnly && (
                  <div className="flex items-center gap-2">
                    <Input
                      value={newAddressAlias}
                      onChange={(e) => setNewAddressAlias(e.target.value)}
                      placeholder="Add address alias..."
                      onKeyDown={(e) => e.key === "Enter" && addAddressAlias()}
                    />
                    <Button size="sm" variant="outline" onClick={addAddressAlias} disabled={!newAddressAlias.trim()}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
                {form.addressAliases.length === 0 && isReadOnly && (
                  <p className="text-xs text-muted-foreground italic">No address aliases configured</p>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Footer */}
        {!isReadOnly && (
          <div className="border-t px-6 py-4 flex items-center justify-end gap-3 shrink-0">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
            <Button variant="destructive" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : mode === "create" ? "Create Company Identity" : "Save Changes"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
