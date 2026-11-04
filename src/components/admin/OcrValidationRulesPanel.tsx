import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRoles } from "@/lib/role-context";
import { useToast } from "@/hooks/use-toast";
import { useOcrUnsavedChanges } from "@/hooks/use-ocr-unsaved-changes";
import { readCardTypeMaster } from "@/lib/card-type-master";
import { DEFAULT_OCR_KEY, readOcrCardRules, resolveOcrCardRule, saveOcrCardRules, ocrToleranceSchema, type OcrTolerance } from "@/lib/ocr-card-type-rules";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { Save, ShieldCheck, Info, RotateCcw } from "lucide-react";
import { formatBEDateTime } from "@/lib/utils";

type Draft = Record<keyof OcrTolerance, string>;
type Edits = Record<string, Draft | null>;
const fields: { key: keyof Draft; label: string; unit: string; step: number }[] = [
  { key: "amountToleranceThb", label: "Amount Tolerance (THB)", unit: "THB", step: 0.01 },
  { key: "amountTolerancePct", label: "Amount Tolerance (%)", unit: "%", step: 0.1 },
  { key: "dateToleranceDays", label: "Date Tolerance (Days)", unit: "days", step: 1 },
];
const toDraft = (rule: OcrTolerance): Draft => ({ amountToleranceThb: String(rule.amountToleranceThb), amountTolerancePct: String(rule.amountTolerancePct), dateToleranceDays: String(rule.dateToleranceDays) });
const parseDraft = (draft: Draft) => ocrToleranceSchema.safeParse(Object.fromEntries(Object.entries(draft).map(([key, value]) => [key, value.trim() === "" ? NaN : Number(value)])));

export default function OcrValidationRulesPanel() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { roles } = useRoles();
  const isAdmin = roles.includes("Admin");
  const [rules, setRules] = useState(readOcrCardRules);
  const [cardTypes, setCardTypes] = useState(readCardTypeMaster);
  const [search, setSearch] = useState("");
  const [edits, setEdits] = useState<Edits>({});
  const [resetKey, setResetKey] = useState<string | null>(null);
  const dirty = Object.keys(edits).length > 0;
  const navigation = useOcrUnsavedChanges(dirty);
  const invalid = Object.values(edits).some((draft) => draft !== null && !parseDraft(draft).success);
  const activeTypes = cardTypes.filter((type) => type.active);
  const rows = [{ id: DEFAULT_OCR_KEY, name: "Default (other card types)" }, ...activeTypes.filter((type) => type.name.toLowerCase().includes(search.trim().toLowerCase()))];
  const defaultDraft = edits[DEFAULT_OCR_KEY] ?? toDraft(resolveOcrCardRule(rules, DEFAULT_OCR_KEY));
  const ownRule = (key: string) => edits[key] === null ? false : Boolean(edits[key] || rules[key]);
  const draftFor = (key: string): Draft => edits[key] ?? (ownRule(key) ? toDraft(resolveOcrCardRule(rules, key)) : defaultDraft);

  useEffect(() => {
    const refresh = () => setCardTypes(readCardTypeMaster());
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => { window.removeEventListener("storage", refresh); window.removeEventListener("focus", refresh); };
  }, []);

  const update = (key: string, field: keyof Draft, value: string) => {
    const next = { ...draftFor(key), [field]: value };
    setEdits((previous) => {
      const result = { ...previous, [key]: next };
      const saved = rules[key];
      if (saved && fields.every(({ key: name }) => next[name] === String(saved[name]))) delete result[key];
      return result;
    });
  };
  const save = () => {
    if (!isAdmin || !user || !dirty || invalid) return;
    const batch: Record<string, OcrTolerance | null> = {};
    for (const [key, draft] of Object.entries(edits)) {
      if (draft === null) { batch[key] = null; continue; }
      const result = parseDraft(draft);
      if (!result.success) return;
      batch[key] = result.data;
    }
    try {
      setRules(saveOcrCardRules(rules, batch, user.name));
      setEdits({});
      toast({ title: "OCR rules saved", className: "ocr-save-toast" });
    } catch {
      toast({ title: "Failed to save OCR validation rules", variant: "destructive" });
    }
  };
  const reset = () => {
    if (!isAdmin || resetKey === null || resetKey === DEFAULT_OCR_KEY) return;
    setEdits((previous) => {
      const next = { ...previous };
      if (rules[resetKey]) next[resetKey] = null;
      else delete next[resetKey];
      return next;
    });
    setResetKey(null);
  };

  return (
    <div className="ocr-card-type-settings min-w-0 space-y-6">
      <div>
        <h2 className="text-lg font-semibold">OCR Validation Rules</h2>
        <p className="text-sm text-muted-foreground">Configure tolerance thresholds for document matching during OCR validation.</p>
      </div>
      {!isAdmin && <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0" /><span>Read-only view — only Finance Manager or IT Admin can edit these settings.</span></div>}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Input className="w-full sm:w-72" aria-label="Search card type" placeholder="Search card type" maxLength={100} value={search} onChange={(event) => setSearch(event.target.value)} />
          <span className="text-xs text-muted-foreground">{activeTypes.length} card types from Master Data</span>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <Table className="min-w-[1000px] table-fixed">
          <TableHeader><TableRow>
            <TableHead className="w-[240px]">Card Type</TableHead>
            {fields.map((field) => <TableHead key={field.key} className="w-[175px]">{field.label}</TableHead>)}
            <TableHead className="w-[185px]">Last updated</TableHead>
            <TableHead className="w-[65px]"><span className="sr-only">Reset</span></TableHead>
          </TableRow></TableHeader>
          <TableBody>{rows.map((row) => {
            const draft = draftFor(row.id);
            const specific = ownRule(row.id);
            const parsed = parseDraft(draft);
            const errors = parsed.success ? {} : Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0], issue.message]));
            const metadata = specific ? rules[row.id] : undefined;
            return <TableRow key={row.id} className={row.id in edits ? "ocr-edited-row" : ""}>
              <TableCell><div className="space-y-2"><div className="font-medium">{row.name}</div><Badge variant="outline" className={specific ? "ocr-configured" : "ocr-using-default"}>{specific ? "Configured" : "Default"}</Badge></div></TableCell>
              {fields.map((field) => <TableCell key={field.key} className="align-top">
                <div className="relative">
                  <Input type="number" min={0} max={field.key === "amountTolerancePct" ? 100 : undefined} step={field.step} disabled={!isAdmin}
                    aria-label={`${row.name} ${field.label}`} aria-invalid={Boolean(errors[field.key])} aria-describedby={errors[field.key] ? `${row.id}-${field.key}-error` : undefined}
                    value={draft[field.key]} onChange={(event) => update(row.id, field.key, event.target.value)}
                    className={`pr-12 ${!specific ? "text-muted-foreground" : ""} ${errors[field.key] ? "border-destructive focus-visible:ring-destructive" : ""}`} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{field.unit}</span>
                </div>
                {errors[field.key] && <p id={`${row.id}-${field.key}-error`} className="mt-1 text-xs text-destructive">{errors[field.key]}</p>}
              </TableCell>)}
              <TableCell>{metadata ? <div className="space-y-1"><div className="whitespace-nowrap text-xs">{formatBEDateTime(metadata.updatedAt).slice(0, -3)}</div><div className="text-xs text-muted-foreground">{metadata.updatedBy}</div></div> : "-"}</TableCell>
              <TableCell>{specific && row.id !== DEFAULT_OCR_KEY && <Button variant="ghost" size="icon" aria-label={`Reset ${row.name}`} disabled={!isAdmin} onClick={() => setResetKey(row.id)}><RotateCcw className="h-4 w-4" /></Button>}</TableCell>
            </TableRow>;
          })}</TableBody>
        </Table>
      </div>
      {activeTypes.length === 0 && <p className="text-sm text-muted-foreground">No card types found. Add card types in Master Data.</p>}
      <div className="space-y-2 text-xs text-muted-foreground">
        <p className="flex items-start gap-1.5"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />System uses whichever tolerance is greater (absolute THB or % of transaction amount).</p>
        <p className="flex items-start gap-1.5"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />Max number of days difference allowed between invoice date and bank transaction date.</p>
      </div>
      {isAdmin && <div className="flex flex-wrap items-center gap-3"><Button disabled={!dirty || invalid} onClick={save}><Save className="mr-2 h-4 w-4" />Save Changes</Button><span className="text-xs text-muted-foreground">Edit any value to enable Save. Edited rows are highlighted.</span></div>}
      <AlertDialog open={resetKey !== null} onOpenChange={(open) => { if (!open) setResetKey(null); }}>
        <AlertDialogContent className="ocr-card-type-settings" aria-describedby={undefined}>
          <AlertDialogHeader><AlertDialogTitle>Reset to default?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={reset}>Reset</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={navigation.open} onOpenChange={(open) => { if (!open) navigation.keepEditing(); }}>
        <AlertDialogContent className="ocr-card-type-settings" aria-describedby={undefined}>
          <AlertDialogHeader><AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel onClick={navigation.keepEditing}>Keep editing</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={navigation.discard}>Discard</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
