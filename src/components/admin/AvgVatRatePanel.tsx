import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { LibraryDatePicker } from "@/components/documents/LibraryDatePicker";
import { formatBEDate } from "@/lib/utils";
import {
  type AvgVatRate, getAvgVatStatus, loadAvgVatRates, saveAvgVatRates, sortAvgVatRates,
  findApplicableRate, validateAvgVatRate,
  loadAvgVatAudit, appendAvgVatAudit, diffAvgVatRate, type AvgVatAuditEvent,
} from "@/lib/avg-vat-rate";

const fmtDate = (ymd: string) => formatBEDate(new Date(`${ymd}T00:00:00`));
const fmtStamp = (iso: string) => { const d = new Date(iso); return `${formatBEDate(d)}, ${format(d, "HH:mm")}`; };
const fmtAuditStamp = (iso: string) => { const d = new Date(iso); return `${formatBEDate(d)} ${format(d, "HH:mm")}`; };
const fmtAuditVal = (field: string, v: string) => (field === "AVG VAT Rate %" ? `${v}%` : fmtDate(v));

const statusClass: Record<string, string> = {
  Active: "rounded-full border-green-300 bg-green-50 text-green-700 hover:bg-green-50",
  Upcoming: "rounded-full border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-50",
  Expired: "rounded-full border-border bg-muted text-muted-foreground hover:bg-muted",
};

type Mode = "add" | "edit" | "view";

export default function AvgVatRatePanel() {
  const [rates, setRates] = useState<AvgVatRate[]>(() => loadAvgVatRates());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [dialog, setDialog] = useState<{ mode: Mode; id?: string } | null>(null);
  const [form, setForm] = useState({ rate: "", from: "", to: "" });
  const [error, setError] = useState<{ msg: string; fields: string[] } | null>(null);
  const [gapWarned, setGapWarned] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [trnDate, setTrnDate] = useState("");
  const [audit, setAudit] = useState<AvgVatAuditEvent[]>(() => loadAvgVatAudit());
  const { user } = useAuth();
  const actor = { actorName: user?.name || "System", actorEmail: user?.email, actorEmployeeId: (user as any)?.employeeId };

  const rows = useMemo(() => sortAvgVatRates(rates.filter((r) => !r.deleted)).filter((r) => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || `${r.rate.toFixed(2)}%`.includes(q) || fmtDate(r.from).includes(q) || fmtDate(r.to).includes(q);
    return matchSearch && (statusFilter === "all" || getAvgVatStatus(r).toLowerCase() === statusFilter);
  }), [rates, search, statusFilter]);

  const lookup = trnDate ? findApplicableRate(rates, trnDate) : null;
  const persist = (next: AvgVatRate[]) => { setRates(next); saveAvgVatRates(next); };

  const open = (mode: Mode, r?: AvgVatRate) => {
    setForm(r ? { rate: r.rate.toFixed(2), from: r.from, to: r.to } : { rate: "", from: "", to: "" });
    setError(null); setGapWarned(false); setDialog({ mode, id: r?.id });
  };

  const onSave = () => {
    if (!dialog) return;
    const v = validateAvgVatRate(form, rates, dialog.id);
    if (v.error === "required") {
      return setError({ msg: "Please fill in all required fields.", fields: (["rate", "from", "to"] as const).filter((k) => !form[k] || (k === "rate" && isNaN(Number(form.rate)))) });
    }
    if (v.error === "range") return setError({ msg: "Effective Date To cannot be earlier than Effective Date From.", fields: ["from", "to"] });
    if (v.error === "overlap" && v.overlap) {
      return setError({ msg: `Cannot save. This period overlaps with the existing rate ${v.overlap.rate.toFixed(2)}% (${fmtDate(v.overlap.from)} – ${fmtDate(v.overlap.to)}). Change the dates or edit the existing rate.`, fields: ["from", "to"] });
    }
    setError(null);
    if (v.gap && !gapWarned) { setGapWarned(true); return; }
    const entry: AvgVatRate = { id: dialog.id ?? `avg-${Date.now()}`, rate: Math.round(Number(form.rate) * 100) / 100, from: form.from, to: form.to, updatedAt: new Date().toISOString() };
    const prevEntry = dialog.id ? rates.find((r) => r.id === dialog.id) : undefined;
    persist(dialog.id ? rates.map((r) => (r.id === dialog.id ? entry : r)) : [...rates, entry]);
    if (prevEntry) {
      const changes = diffAvgVatRate(prevEntry, entry);
      if (changes.length) setAudit(appendAvgVatAudit({ rateId: entry.id, type: "Updated", ...actor, at: entry.updatedAt, changes }));
    } else {
      setAudit(appendAvgVatAudit({ rateId: entry.id, type: "Created", ...actor, at: entry.updatedAt, changes: diffAvgVatRate({ ...entry, rate: NaN, from: "", to: "" }, entry).map((c) => ({ ...c, oldValue: "" })) }));
    }
    setDialog(null);
    toast.success("AVG VAT Rate saved");
  };

  const readOnly = dialog?.mode === "view";
  const current = dialog?.id ? rates.find((r) => r.id === dialog.id) : undefined;
  const currentAudit = current ? audit.filter((e) => e.rateId === current.id).sort((x, y) => y.at.localeCompare(x.at)) : [];
  const bad = (f: string) => (error?.fields.includes(f) ? "border-destructive" : "");

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">AVG VAT Rate %</h2>
          <p className="text-sm text-muted-foreground">Manage AVG VAT Rate % and its effective period. The rate is picked from Transaction Date + 1 month.</p>
        </div>
        <Button size="sm" onClick={() => open("add")}><Plus className="h-4 w-4 mr-2" /> Add AVG VAT Rate</Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search rate..." className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <Card className="flex-1">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox aria-label="Select all" checked={rows.length > 0 && rows.every((r) => selected.includes(r.id))}
                      onCheckedChange={(c) => setSelected(c ? rows.map((r) => r.id) : [])} />
                  </TableHead>
                  <TableHead>AVG VAT Rate %</TableHead>
                  <TableHead>Effective Date From</TableHead>
                  <TableHead>Effective Date To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const s = getAvgVatStatus(r);
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Checkbox aria-label="Select row" checked={selected.includes(r.id)}
                          onCheckedChange={(c) => setSelected((p) => (c ? [...p, r.id] : p.filter((x) => x !== r.id)))} />
                      </TableCell>
                      <TableCell className="font-medium">{r.rate.toFixed(2)}%</TableCell>
                      <TableCell>{fmtDate(r.from)}</TableCell>
                      <TableCell>{fmtDate(r.to)}</TableCell>
                      <TableCell><Badge variant="outline" className={statusClass[s]}>{s}</Badge></TableCell>
                      <TableCell>{fmtStamp(r.updatedAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" aria-label="View" onClick={() => open("view", r)}><Eye className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" aria-label="Edit" onClick={() => open("edit", r)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" aria-label="Delete" onClick={() => setDeleteId(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      {rates.filter((r) => !r.deleted).length === 0 ? "No AVG VAT Rate has been set up yet." : "No results found"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="w-full lg:w-72">
          <CardContent className="space-y-3 p-4">
            <p className="text-sm font-semibold">Check which rate applies</p>
            <div className="space-y-1">
              <Label>Transaction Date</Label>
              <LibraryDatePicker label="Transaction Date" value={trnDate} onChange={setTrnDate} />
            </div>
            {lookup && (
              <div className="space-y-1 text-sm">
                <p>+ 1 month = {fmtDate(lookup.target)}</p>
                {lookup.rate ? (
                  <>
                    <p>Applicable rate <span className="font-semibold">{lookup.rate.rate.toFixed(2)}%</span></p>
                    <p className="text-muted-foreground">{fmtDate(lookup.rate.from)} – {fmtDate(lookup.rate.to)}</p>
                  </>
                ) : (
                  <p className="text-destructive">No rate found for this date</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Sheet open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        <SheetContent side="right" className="!max-w-2xl !w-full p-0 flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <div className="flex items-center justify-between pr-8">
              <div>
                <SheetTitle className="text-lg">{dialog?.mode === "add" ? "Add AVG VAT Rate" : dialog?.mode === "edit" ? "Edit AVG VAT Rate" : `AVG VAT Rate ${current ? current.rate.toFixed(2) : ""}%`}</SheetTitle>
                {dialog?.mode !== "edit" && <SheetDescription>{readOnly ? "View AVG VAT Rate details" : "Set the rate and the period it is effective."}</SheetDescription>}
              </div>
              {readOnly && (
                <Button size="sm" variant="outline" onClick={() => setDialog((d) => (d ? { ...d, mode: "edit" } : d))}>
                  <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
                </Button>
              )}
            </div>
          </SheetHeader>
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {error && <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error.msg}</div>}
              {gapWarned && !error && (
                <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">There is a gap between this period and the previous one. Dates in the gap will have no rate.</div>
              )}
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Rate Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>AVG VAT Rate % <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input type="number" step="0.01" value={form.rate} disabled={readOnly} className={`pr-8 ${bad("rate")}`}
                  onChange={(e) => { setForm({ ...form, rate: e.target.value }); setGapWarned(false); }}
                  onBlur={() => form.rate && !isNaN(Number(form.rate)) && setForm((f) => ({ ...f, rate: Number(f.rate).toFixed(2) }))} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
              </div>
            </div>
            {readOnly && current && (
              <div className="space-y-1">
                <Label>Status <span className="text-destructive">*</span></Label>
                <div><Badge variant="outline" className={statusClass[getAvgVatStatus(current)]}>{getAvgVatStatus(current)}</Badge></div>
              </div>
            )}
            {(["from", "to"] as const).map((k) => (
              <div key={k} className="space-y-1">
                <Label>{k === "from" ? "Effective Date From" : "Effective Date To"} <span className="text-destructive">*</span></Label>
                {readOnly ? (
                  <Input value={form[k] ? fmtDate(form[k]) : ""} disabled className="w-[160px]" />
                ) : (
                  <div className={bad(k) ? "w-fit rounded-md ring-1 ring-destructive" : ""}>
                    <LibraryDatePicker label={k === "from" ? "Effective Date From" : "Effective Date To"} value={form[k]}
                      onChange={(v) => { setForm({ ...form, [k]: v }); setGapWarned(false); }} />
                  </div>
                )}
              </div>
            ))}
                </CardContent>
              </Card>
              {readOnly && current && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">2</span>
                    <h3 className="text-sm font-semibold">Audit Trail</h3>
                    <span className="text-xs text-muted-foreground">{currentAudit.length} {currentAudit.length === 1 ? "event" : "events"}</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <Card>
                    <CardContent className="space-y-4 p-4">
                      <div className="flex gap-8 rounded-md bg-muted/50 p-3">
                        <div><p className="text-[11px] uppercase tracking-wide text-muted-foreground">AVG VAT Rate</p><p className="text-sm font-medium">{current.rate.toFixed(2)}%</p></div>
                        <div><p className="text-[11px] uppercase tracking-wide text-muted-foreground">Period</p><p className="text-sm font-medium">{fmtDate(current.from)} – {fmtDate(current.to)}</p></div>
                      </div>
                      <div className="relative space-y-3 pl-6 before:absolute before:left-[7px] before:top-1 before:bottom-1 before:w-px before:bg-border">
                        {currentAudit.map((e, idx) => (
                          <div key={e.id} className="relative">
                            <span className={`absolute -left-6 top-3 h-3.5 w-3.5 rounded-full border-2 border-background ${idx === 0 ? "bg-amber-400" : "bg-muted-foreground/40"}`} />
                            <div className={`rounded-md p-3 ${idx === 0 ? "border-l-4 border-amber-400 bg-amber-50" : ""}`}>
                              <p className="text-sm font-semibold">{e.type}</p>
                              {e.type === "Updated" && e.changes.map((c) => (
                                <p key={c.field} className="text-sm">{c.field}: {fmtAuditVal(c.field, c.oldValue)} → {fmtAuditVal(c.field, c.newValue)}</p>
                              ))}
                              <p className="text-xs text-muted-foreground">{e.actorName}{[e.actorEmail && e.actorEmail !== e.actorName ? e.actorEmail : "", e.actorEmployeeId || ""].filter(Boolean).length ? ` (${[e.actorEmail && e.actorEmail !== e.actorName ? e.actorEmail : "", e.actorEmployeeId || ""].filter(Boolean).join(", ")})` : ""} · {fmtAuditStamp(e.at)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>
          {!readOnly && (
            <div className="flex justify-end gap-2 border-t px-6 py-4">
              <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
              <Button onClick={onSave}>Save</Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete this AVG VAT Rate?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { const at = new Date().toISOString(); persist(rates.map((r) => (r.id === deleteId ? { ...r, deleted: true, updatedAt: at } : r))); if (deleteId) setAudit(appendAvgVatAudit({ rateId: deleteId, type: "Deleted", ...actor, at, changes: [] })); setSelected((p) => p.filter((x) => x !== deleteId)); setDeleteId(null); }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
