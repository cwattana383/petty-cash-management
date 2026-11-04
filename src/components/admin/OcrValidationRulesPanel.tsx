import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { readCardTypeMaster } from "@/lib/card-type-master";
import { DEFAULT_OCR_KEY, readOcrCardRules, resolveOcrCardRule, saveOcrCardRule, resetOcrCardRule, ocrToleranceSchema, type OcrTolerance, type OcrCardRule } from "@/lib/ocr-card-type-rules";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useRoles } from "@/lib/role-context";
import { Save, ShieldCheck, Info } from "lucide-react";
import { formatBEDateTime } from "@/lib/utils";

type Draft = Record<keyof OcrTolerance, string>;
const toDraft = (rule: OcrCardRule): Draft => ({
  amountToleranceThb: String(rule.amountToleranceThb),
  amountTolerancePct: String(rule.amountTolerancePct),
  dateToleranceDays: String(rule.dateToleranceDays),
});

export default function OcrValidationRulesPanel() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { roles } = useRoles();
  const isAdmin = roles.includes("Admin");
  const [rules, setRules] = useState(readOcrCardRules);
  const [cardTypes, setCardTypes] = useState(readCardTypeMaster);
  const [selected, setSelected] = useState(DEFAULT_OCR_KEY);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<string | null>(null);
  const [config, setConfig] = useState<Draft>(() => toDraft(resolveOcrCardRule(rules, selected)));
  const selectedRule = resolveOcrCardRule(rules, selected);
  const selectedName = selected === DEFAULT_OCR_KEY ? "Default (all other card types)" : cardTypes.find((type) => type.id === selected)?.name ?? "";
  const activeTypes = cardTypes.filter((type) => type.active);
  const hasSpecificRule = selected !== DEFAULT_OCR_KEY && Boolean(rules[selected]);
  const editable = isAdmin && (selected === DEFAULT_OCR_KEY || hasSpecificRule || creating);
  const savedDraft = toDraft(selectedRule);
  const dirty = creating || (Object.keys(config) as (keyof Draft)[]).some((key) => config[key] !== savedDraft[key]);
  const numericConfig = Object.fromEntries(Object.entries(config).map(([key, value]) => [key, value.trim() === "" ? NaN : Number(value)]));
  const validation = ocrToleranceSchema.safeParse(numericConfig);
  const errors = validation.success ? {} : Object.fromEntries(validation.error.issues.map((issue) => [issue.path[0], issue.message]));

  useEffect(() => {
    const refresh = () => setCardTypes(readCardTypeMaster());
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => { window.removeEventListener("storage", refresh); window.removeEventListener("focus", refresh); };
  }, []);

  const selectType = (key: string) => {
    setSelected(key);
    setCreating(false);
    setConfig(toDraft(resolveOcrCardRule(rules, key)));
  };
  const requestSelect = (key: string) => {
    if (key === selected) return;
    if (dirty) setPendingSelection(key);
    else selectType(key);
  };
  useEffect(() => {
    if (selected !== DEFAULT_OCR_KEY && !activeTypes.some((type) => type.id === selected)) {
      setSelected(DEFAULT_OCR_KEY);
      setCreating(false);
      setConfig(toDraft(resolveOcrCardRule(rules, DEFAULT_OCR_KEY)));
    }
  }, [cardTypes, selected, rules]);

  const update = (field: keyof Draft, value: string) => setConfig((prev) => ({ ...prev, [field]: value }));
  const handleSave = () => {
    if (!editable || !validation.success || !user) return;
    try {
      const next = saveOcrCardRule(rules, selected, validation.data, user.name);
      setRules(next);
      setCreating(false);
      setConfig(toDraft(resolveOcrCardRule(next, selected)));
      toast({ title: `OCR rules saved for ${selectedName}`, className: "ocr-save-toast" });
    } catch {
      toast({ title: "Failed to save OCR validation rules", variant: "destructive" });
    }
  };
  const handleReset = () => {
    if (!isAdmin || !hasSpecificRule) return;
    try {
      const next = resetOcrCardRule(rules, selected);
      setRules(next);
      setCreating(false);
      setConfig(toDraft(resolveOcrCardRule(next, selected)));
    } catch {
      toast({ title: "Failed to save OCR validation rules", variant: "destructive" });
    }
  };
  const renderRow = (key: string, name: string) => {
    const rule = resolveOcrCardRule(rules, key);
    return (
      <Button key={key} variant="ghost" onClick={() => requestSelect(key)} aria-pressed={selected === key}
        className={`h-auto w-full min-w-0 flex-col items-start gap-2 whitespace-normal rounded-none border-l-4 p-3 text-left ${selected === key ? "border-primary bg-accent text-foreground" : "border-transparent"}`}>
        <span className="flex w-full min-w-0 flex-wrap items-center gap-2">
          <span className="min-w-0 break-words">{name}</span>
          <Badge variant="outline" className={rules[key] ? "ocr-configured" : "ocr-using-default"}>{rules[key] ? "Configured" : "Using Default"}</Badge>
        </span>
        <span className="text-xs font-normal text-muted-foreground">Amount ±{rule.amountToleranceThb} THB / {rule.amountTolerancePct}% · Date ±{rule.dateToleranceDays} days</span>
      </Button>
    );
  };

  return (
    <div className="ocr-card-type-settings space-y-6">
      <div>
        <h2 className="text-lg font-semibold">OCR Validation Rules</h2>
        <p className="text-sm text-muted-foreground">
          Configure tolerance thresholds for document matching during OCR validation.
        </p>
      </div>

      <div className="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="min-w-0 space-y-4 rounded-lg border p-4">
          <h3 className="font-semibold">Card Type</h3>
          <Input aria-label="Search card type" placeholder="Search card type" value={search} maxLength={100} onChange={(e) => setSearch(e.target.value)} />
          <div className="-mx-4">
            {renderRow(DEFAULT_OCR_KEY, "Default (all other card types)")}
            {activeTypes.filter((type) => type.name.toLowerCase().includes(search.trim().toLowerCase())).map((type) => renderRow(type.id, type.name))}
          </div>
          {activeTypes.length === 0 && <p className="text-sm text-muted-foreground">No card types found. Add card types in Master Data.</p>}
        </aside>
        <div className="min-w-0 space-y-6">
          <div>
            <h3 className="text-lg font-semibold">OCR Validation Rules – {selectedName}</h3>
            <p className="text-sm text-muted-foreground">Configure tolerance thresholds for document matching during OCR validation.</p>
          </div>

      {!isAdmin && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>Read-only view — only Finance Manager or IT Admin can edit these settings.</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Amount Matching</CardTitle>
          <CardDescription>Configure tolerance for matching invoice amounts against bank transactions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amt-thb">Amount Tolerance (THB)</Label>
              <div className="relative">
                <Input
                  id="amt-thb"
                  type="number"
                  min={0}
                  step={0.01}
                  value={config.amountToleranceThb}
                  aria-invalid={Boolean(errors.amountToleranceThb)}
                  aria-describedby={errors.amountToleranceThb ? "amountToleranceThb-error" : undefined}
                  onChange={(e) => update("amountToleranceThb", e.target.value)}
                  disabled={!editable}
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">THB</span>
              </div>
              {errors.amountToleranceThb && <p id="amountToleranceThb-error" className="text-xs text-destructive">{errors.amountToleranceThb}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="amt-pct">Amount Tolerance (%)</Label>
              <div className="relative">
                <Input
                  id="amt-pct"
                  type="number"
                  min={0}
                  max={100}
                  step={0.1}
                  value={config.amountTolerancePct}
                  aria-invalid={Boolean(errors.amountTolerancePct)}
                  aria-describedby={errors.amountTolerancePct ? "amountTolerancePct-error" : undefined}
                  onChange={(e) => update("amountTolerancePct", e.target.value)}
                  disabled={!editable}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
              </div>
              {errors.amountTolerancePct && <p id="amountTolerancePct-error" className="text-xs text-destructive">{errors.amountTolerancePct}</p>}
            </div>
          </div>
          <p className="text-xs text-muted-foreground flex items-start gap-1.5">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            System uses whichever tolerance is greater (absolute THB or % of transaction amount)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Date Matching</CardTitle>
          <CardDescription>Configure tolerance for matching invoice dates against bank transaction dates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-xs space-y-2">
            <Label htmlFor="date-days">Date Tolerance (Days)</Label>
            <div className="relative">
              <Input
                id="date-days"
                type="number"
                min={0}
                step={1}
                value={config.dateToleranceDays}
                  aria-invalid={Boolean(errors.dateToleranceDays)}
                  aria-describedby={errors.dateToleranceDays ? "dateToleranceDays-error" : undefined}
                onChange={(e) => update("dateToleranceDays", e.target.value)}
                disabled={!editable}
                className="pr-14"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">days</span>
            </div>
              {errors.dateToleranceDays && <p id="dateToleranceDays-error" className="text-xs text-destructive">{errors.dateToleranceDays}</p>}
          </div>
          <p className="text-xs text-muted-foreground flex items-start gap-1.5">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            Max number of days difference allowed between invoice date and bank transaction date
          </p>
        </CardContent>
      </Card>

      {selectedName === "Fleet Card" && (
        <div className="flex items-start gap-2 rounded-md border border-primary/20 bg-accent px-4 py-3 text-sm text-accent-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          Fleet Card invoices are issued by the gas station and match the bank amount exactly. Tolerance 0 is recommended.
        </div>
      )}
      {isAdmin && (
        <div className="flex flex-wrap items-center gap-3">
          {editable ? <Button onClick={handleSave} disabled={!validation.success}><Save className="mr-2 h-4 w-4" />Save Changes</Button>
            : <Button onClick={() => setCreating(true)}>Create specific rule</Button>}
          {hasSpecificRule && <Button variant="secondary" onClick={handleReset}>Reset to Default</Button>}
        </div>
      )}

      <Separator />

      <p className="text-xs text-muted-foreground">
        Last updated: {formatBEDateTime(selectedRule.updatedAt)}
        {` by ${selectedRule.updatedBy}`}
      </p>
        </div>
      </div>
      <AlertDialog open={pendingSelection !== null} onOpenChange={(open) => { if (!open) setPendingSelection(null); }}>
        <AlertDialogContent className="ocr-card-type-settings" aria-describedby={undefined}>
          <AlertDialogHeader><AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => {
              if (pendingSelection !== null) selectType(pendingSelection);
              setPendingSelection(null);
            }}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
