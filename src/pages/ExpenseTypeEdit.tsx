import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Plus, Trash2, FolderOpen, Layers } from "lucide-react";
import { toast } from "sonner";
import DocumentTypeMultiSelect from "@/components/admin/DocumentTypeMultiSelect";
import {
  type FormSubtype,
  mockDocumentTypes,
  initialData,
} from "@/components/admin/expense-type-data";

let localSubId = 100;

export default function ExpenseTypeEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isView = searchParams.get("mode") === "view";
  const isCreate = !id;

  const existing = id ? initialData.find((r) => r.id === id) : null;
  if (!isCreate && !existing) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 py-8 text-center">
        <p className="text-muted-foreground">Expense type not found.</p>
        <Button variant="outline" onClick={() => navigate("/admin?tab=expense-type")}>Back to Admin</Button>
      </div>
    );
  }

  const [formExpenseType, setFormExpenseType] = useState(existing?.expenseType ?? "");
  const [formActive, setFormActive] = useState(existing?.active ?? true);
  const [formSubtypes, setFormSubtypes] = useState<FormSubtype[]>(
    existing
      ? existing.subtypes.map((s) => ({
          id: s.id,
          subExpenseType: s.subExpenseType,
          accountNameEn: s.accountNameEn,
          accountCode: s.accountCode,
          active: s.active,
          documentTypeIds: s.documentTypeIds ?? [],
        }))
      : []
  );

  const disabled = isView;

  const addSubtypeRow = () => {
    setFormSubtypes((prev) => [
      ...prev,
      { subExpenseType: "", accountNameEn: "", accountCode: "", active: true, documentTypeIds: [] },
    ]);
  };

  const updateSubtypeField = (index: number, field: keyof FormSubtype, value: string | boolean) => {
    setFormSubtypes((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const removeSubtypeRow = (index: number) => {
    setFormSubtypes((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleDocumentType = (subtypeIndex: number, docId: string) => {
    setFormSubtypes((prev) =>
      prev.map((s, i) =>
        i === subtypeIndex
          ? {
              ...s,
              documentTypeIds: s.documentTypeIds.includes(docId)
                ? s.documentTypeIds.filter((id) => id !== docId)
                : [...s.documentTypeIds, docId],
            }
          : s
      )
    );
  };

  const removeDocumentType = (subtypeIndex: number, docId: string) => {
    setFormSubtypes((prev) =>
      prev.map((s, i) =>
        i === subtypeIndex
          ? { ...s, documentTypeIds: s.documentTypeIds.filter((did) => did !== docId) }
          : s
      )
    );
  };

  const handleSave = () => {
    if (!formExpenseType.trim()) {
      toast.error("Expense Type is required.");
      return;
    }
    for (const s of formSubtypes) {
      if (!s.subExpenseType.trim() || !s.accountNameEn.trim() || !s.accountCode.trim()) {
        toast.error("All subtype fields are required.");
        return;
      }
    }
    toast.success(isCreate ? "Expense type created successfully." : "Expense type updated successfully.");
    navigate("/admin?tab=expense-type");
  };

  const title = isCreate
    ? "Create Expense Type"
    : isView
    ? "View Expense Type"
    : "Edit Expense Type";

  const subtitle = isCreate
    ? "Create a new expense type with sub-types."
    : isView
    ? "Expense type details"
    : "Update the expense type and its sub-types.";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin?tab=expense-type")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      {/* Section 1 — Basic Information */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">Basic Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expenseType">Expense Type <span className="text-destructive">*</span></Label>
            <Input
              id="expenseType"
              value={formExpenseType}
              onChange={(e) => setFormExpenseType(e.target.value)}
              placeholder="e.g. Entertainment, Hotel, Transportation"
              disabled={disabled}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Label htmlFor="activeToggle">Status</Label>
              <Badge className={formActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                {formActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <Switch id="activeToggle" checked={formActive} onCheckedChange={setFormActive} disabled={disabled} />
          </div>
        </CardContent>
      </Card>

      {/* Section 2 — Sub Expense Types */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">Sub Expense Types</CardTitle>
              {formSubtypes.length > 0 && (
                <Badge variant="secondary" className="text-xs">{formSubtypes.length}</Badge>
              )}
            </div>
            {!disabled && (
              <Button type="button" size="sm" variant="outline" onClick={addSubtypeRow}>
                <Plus className="h-3.5 w-3.5 mr-1" />Add
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {formSubtypes.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-lg">
              {disabled ? "No sub-types." : 'No sub-types yet. Click "+ Add" to create one.'}
            </div>
          ) : (
            formSubtypes.map((s, i) => (
              <div key={s.id ?? i} className="border rounded-lg p-4 space-y-3 hover:bg-muted/30 transition-colors">
                {/* Subtype header */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Sub Type #{i + 1}</span>
                  <Badge className={s.active ? "bg-green-100 text-green-800 text-xs" : "bg-gray-100 text-gray-600 text-xs"}>
                    {s.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {/* Fields */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Sub Expense Type <span className="text-destructive">*</span></Label>
                    <Input
                      value={s.subExpenseType}
                      onChange={(e) => updateSubtypeField(i, "subExpenseType", e.target.value)}
                      placeholder="Sub Expense Type"
                      className="text-sm"
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Account Name (EN) <span className="text-destructive">*</span></Label>
                    <Input
                      value={s.accountNameEn}
                      onChange={(e) => updateSubtypeField(i, "accountNameEn", e.target.value)}
                      placeholder="Account Name (EN)"
                      className="text-sm"
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Account Code <span className="text-destructive">*</span></Label>
                    <Input
                      value={s.accountCode}
                      onChange={(e) => updateSubtypeField(i, "accountCode", e.target.value)}
                      placeholder="Account Code"
                      className="text-sm"
                      disabled={disabled}
                    />
                  </div>
                </div>
                {/* Required Documents */}
                <DocumentTypeMultiSelect
                  label="Required Documents"
                  items={mockDocumentTypes.filter((d) => !d.isSupportDocument)}
                  selectedIds={s.documentTypeIds}
                  onToggle={(docId) => toggleDocumentType(i, docId)}
                  onRemove={(docId) => removeDocumentType(i, docId)}
                  disabled={disabled}
                />
                {/* Supported Documents */}
                <DocumentTypeMultiSelect
                  label="Supported Documents"
                  items={mockDocumentTypes.filter((d) => d.isSupportDocument)}
                  selectedIds={s.documentTypeIds}
                  onToggle={(docId) => toggleDocumentType(i, docId)}
                  onRemove={(docId) => removeDocumentType(i, docId)}
                  disabled={disabled}
                />
                {/* Footer row */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">Active</Label>
                    <Switch
                      checked={s.active}
                      onCheckedChange={(checked) => updateSubtypeField(i, "active", checked)}
                      disabled={disabled}
                    />
                  </div>
                  {!disabled && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeSubtypeRow(i)}
                      title="Remove subtype"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      {!isView && (
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => navigate("/admin?tab=expense-type")}>Cancel</Button>
          <Button onClick={handleSave}><Save className="h-4 w-4 mr-2" />Save</Button>
        </div>
      )}
      {isView && (
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => navigate("/admin?tab=expense-type")}>Back</Button>
          <Button onClick={() => navigate(`/admin/expense-type/${id}/edit`)}>Edit</Button>
        </div>
      )}
    </div>
  );
}
