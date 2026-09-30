import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, ChevronsUpDown, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRolesOverview } from "@/hooks/use-roles";
import { useAuth } from "@/lib/auth-context";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CARD_TYPE_OPTIONS } from "@/components/admin/CardManagementList";

interface ScopeRole { id: string; name: string; key: string; userCount: number; isLocked: boolean }
interface ScopeOption { key: string; label: string }

/** Card types come from the Card Management Card Type filter source. */
function cardTypeOptions(): ScopeOption[] {
  return CARD_TYPE_OPTIONS.map((t) => {
    const label = /credit/i.test(t) ? "Credit Card" : t;
    return { key: label.toLowerCase().replace(/[^a-z0-9]+/g, "_"), label };
  });
}

const SCOPE_GROUPS: { menuKey: string; label: string; source: () => ScopeOption[]; enabled: boolean }[] = [
  { menuKey: "card_management", label: "Card Management", source: cardTypeOptions, enabled: true },
];

const FALLBACK_ROLES = [
  { id: "r-admin", name: "System Admin", userCount: 3, isSystem: true },
  { id: "r-fleet", name: "Fleet Admin", userCount: 5, isSystem: false },
  { id: "r-credit", name: "Credit Card Admin", userCount: 4, isSystem: false },
  { id: "r-approver", name: "Approver", userCount: 42, isSystem: false },
];

const STORAGE_KEY = "role_data_scope";
interface ScopeRow {
  id: string; role_id: string; menu_key: string; scope_value: string;
  created_by: string; created_at: string; updated_by: string; updated_at: string;
}
const readRows = (): ScopeRow[] => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; } };

function loadScope(roleId: string): Record<string, string[]> {
  const rows = readRows().filter((r) => r.role_id === roleId);
  const out: Record<string, string[]> = {};
  SCOPE_GROUPS.forEach((g) => {
    const saved = rows.filter((r) => r.menu_key === g.menuKey).map((r) => r.scope_value);
    out[g.menuKey] = saved.length ? saved : g.source().map((o) => o.key);
  });
  return out;
}

export function scopePill(options: ScopeOption[], selected: string[]) {
  const picked = options.filter((o) => selected.includes(o.key));
  if (picked.length === 0) return { text: "Sees nothing", className: "bg-red-50 text-red-600" };
  if (picked.length === options.length) return { text: "All card types", className: "bg-muted text-muted-foreground" };
  if (picked.length === 1 && picked[0].key === "fleet_card")
    return { text: "Fleet Card only", style: { background: "rgba(67,147,143,0.14)", color: "rgb(40,110,106)" } };
  if (picked.length === 1 && picked[0].key === "credit_card")
    return { text: "Credit Card only", style: { background: "rgba(48,111,199,0.12)", color: "rgb(48,111,199)" } };
  return { text: picked.map((p) => p.label).join(", "), className: "bg-muted text-muted-foreground" };
}

export default function DataScopePanel() {
  const { data } = useRolesOverview();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const roles: ScopeRole[] = useMemo(() => {
    const src = data && data.length ? data : (FALLBACK_ROLES as any[]);
    return src
      .filter((r: any) => r.isActive !== false)
      .map((r: any) => ({
        id: r.id,
        name: r.name,
        key: r.key ?? String(r.name).toUpperCase().replace(/[^A-Z0-9]+/g, "_"),
        userCount: r.userCount ?? 0,
        isLocked: r.isLocked ?? !!r.isSystem,
      }));
  }, [data]);

  const [roleId, setRoleId] = useState<string | null>(null);
  const [saved, setSaved] = useState<Record<string, string[]>>({});
  const [draft, setDraft] = useState<Record<string, string[]>>({});
  const [open, setOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const [error, setError] = useState("");

  const role = roles.find((r) => r.id === roleId) ?? null;
  const dirty = JSON.stringify(saved) !== JSON.stringify(draft);

  const applyRole = (id: string) => {
    const s = loadScope(id);
    setRoleId(id); setSaved(s); setDraft(s); setError("");
  };

  useEffect(() => {
    const q = searchParams.get("role");
    if (q && !roleId) {
      const r = roles.find((x) => x.key === q);
      if (r) applyRole(r.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roles, searchParams]);

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const pickRole = (id: string) => {
    setOpen(false);
    if (id === roleId) return;
    if (dirty) setPendingRole(id);
    else applyRole(id);
  };

  const toggle = (menuKey: string, key: string) =>
    setDraft((d) => {
      const cur = d[menuKey] ?? [];
      return { ...d, [menuKey]: cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key] };
    });

  const handleSave = () => {
    if (!role) { setError("Select a role first"); return; }
    if ((draft.card_management ?? []).length === 0) { setError("Select at least one card type for Card Management"); return; }
    const who = user?.email || user?.name || "unknown";
    const now = new Date().toISOString();
    const existing = readRows();
    let rows = existing;
    SCOPE_GROUPS.forEach((g) => {
      const prev = existing.filter((r) => r.role_id === role.id && r.menu_key === g.menuKey);
      rows = rows.filter((r) => !(r.role_id === role.id && r.menu_key === g.menuKey));
      (draft[g.menuKey] ?? []).forEach((v) => {
        const old = prev.find((p) => p.scope_value === v);
        rows.push({
          id: old?.id ?? crypto.randomUUID(), role_id: role.id, menu_key: g.menuKey, scope_value: v,
          created_by: old?.created_by ?? who, created_at: old?.created_at ?? now, updated_by: who, updated_at: now,
        });
      });
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    setSaved(draft); setError("");
    toast({ title: "Data scope saved" });
  };

  const handleCancel = () => { setDraft(saved); setError(""); };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Data Scope</h2>
        <p className="text-sm text-muted-foreground">Choose a role, then tick which data it can see on each menu.</p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="space-y-1.5 max-w-md">
            <Label>Role <span className="text-destructive">*</span></Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                  <span className="flex items-center gap-1.5 truncate">
                    {role ? <>{role.isLocked && <Lock className="h-3.5 w-3.5" />}{role.name} ({role.key})</> : <span className="text-muted-foreground">Select role</span>}
                  </span>
                  <ChevronsUpDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
                <Command>
                  <CommandInput placeholder="Search role..." />
                  <CommandList>
                    <CommandEmpty>No role found.</CommandEmpty>
                    <CommandGroup>
                      {roles.map((r) => (
                        <CommandItem key={r.id} value={`${r.name} ${r.key}`} onSelect={() => pickRole(r.id)}>
                          <Check className={cn("mr-2 h-4 w-4", roleId === r.id ? "opacity-100" : "opacity-0")} />
                          {r.isLocked && <Lock className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />}
                          {r.name} ({r.key})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {role && <p className="text-xs text-muted-foreground">{role.userCount} users assigned</p>}
            {role?.isLocked && <p className="text-xs text-muted-foreground">Locked role, cannot be changed</p>}
          </div>

          <div className="space-y-2">
            <Label>Data scope</Label>
            {!role ? (
              <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
                Select a role to set its data scope.
              </div>
            ) : (
              SCOPE_GROUPS.filter((g) => g.enabled).map((g) => {
                const opts = g.source();
                const sel = draft[g.menuKey] ?? [];
                const count = opts.filter((o) => sel.includes(o.key)).length;
                const all = count === opts.length && opts.length > 0;
                const pill = scopePill(opts, sel);
                return (
                  <div key={g.menuKey} className="rounded-md border">
                    <div className="flex items-center justify-between px-4 py-3 border-b">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={all ? true : count > 0 ? "indeterminate" : false}
                          disabled={role.isLocked}
                          onCheckedChange={() => setDraft((d) => ({ ...d, [g.menuKey]: all ? [] : opts.map((o) => o.key) }))}
                        />
                        <span className="text-sm font-medium uppercase tracking-wide">{g.label}</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", pill.className)} style={pill.style}>{pill.text}</span>
                        <span className="text-xs text-muted-foreground">{count}/{opts.length} selected</span>
                      </div>
                    </div>
                    <div className="py-2">
                      {opts.map((o) => (
                        <label key={o.key} className="flex items-center gap-2 pl-10 pr-4 py-1.5 cursor-pointer">
                          <Checkbox checked={sel.includes(o.key)} disabled={role.isLocked} onCheckedChange={() => toggle(g.menuKey, o.key)} />
                          <span className="text-sm">{o.label}</span>
                          <span className="text-xs font-mono text-muted-foreground">{g.menuKey}:{o.key}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            {!role?.isLocked && <Button onClick={handleSave}>Save changes</Button>}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!pendingRole} onOpenChange={(o) => !o && setPendingRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription />
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (pendingRole) applyRole(pendingRole); setPendingRole(null); }}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
