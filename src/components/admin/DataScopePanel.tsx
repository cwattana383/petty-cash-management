import { useEffect, useMemo, useState } from "react";
import { Lock, Search } from "lucide-react";
import { useRolesOverview } from "@/hooks/use-roles";
import { useAuth } from "@/lib/auth-context";
import { CARD_TYPE_OPTIONS } from "@/components/admin/CardManagementList";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

/** role_card_type_scope rows (role_id, card_type_id, created_by, created_at) */
interface ScopeRow {
  role_id: string;
  card_type_id: string;
  created_by: string;
  created_at: string;
  updated_by?: string;
  updated_at?: string;
}

const STORAGE_KEY = "role_card_type_scope";

function readScope(): ScopeRow[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

let dirtyFlag = false;
// eslint-disable-next-line react-refresh/only-export-components
export const isDataScopeDirty = () => dirtyFlag;

// eslint-disable-next-line react-refresh/only-export-components
export function resultLabel(ticked: string[], all: string[]) {
  if (ticked.length === 0) return "";
  if (ticked.length === all.length) return "All card types";
  if (ticked.length === 1) return `${ticked[0]} only`;
  return ticked.join(", ");
}

function ResultPill({ ticked, all }: { ticked: string[]; all: string[] }) {
  const label = resultLabel(ticked, all);
  if (!label) return null;
  let style: React.CSSProperties | undefined;
  if (ticked.length === 1 && ticked.length !== all.length) {
    style = /fleet/i.test(ticked[0])
      ? { background: "rgba(67,147,143,0.14)", color: "rgb(40,110,106)" }
      : /credit/i.test(ticked[0])
      ? { background: "rgba(48,111,199,0.12)", color: "rgb(48,111,199)" }
      : undefined;
  }
  return (
    <Badge variant="outline" className="rounded-full border-transparent bg-muted text-foreground" style={style}>
      {label}
    </Badge>
  );
}

export default function DataScopePanel() {
  const { data: roles, isLoading } = useRolesOverview();
  const { user } = useAuth();
  const cardTypes = CARD_TYPE_OPTIONS;
  const [saved, setSaved] = useState<ScopeRow[]>(() => readScope());
  const [draft, setDraft] = useState<Record<string, string[]>>({});
  const [search, setSearch] = useState("");

  const savedFor = (roleId: string) => {
    const rows = saved.filter((r) => r.role_id === roleId).map((r) => r.card_type_id);
    return rows.length ? cardTypes.filter((c) => rows.includes(c)) : [...cardTypes];
  };
  const current = (roleId: string) => draft[roleId] ?? savedFor(roleId);

  const dirty = Object.keys(draft).some((id) => {
    const a = draft[id];
    const b = savedFor(id);
    return a.length !== b.length || a.some((x) => !b.includes(x));
  });
  const hasError = (roles ?? []).some((r) => current(r.id).length === 0);

  useEffect(() => {
    dirtyFlag = dirty;
    const onUnload = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [dirty]);
  useEffect(() => () => { dirtyFlag = false; }, []);

  const toggle = (roleId: string, type: string, on: boolean) => {
    const cur = current(roleId);
    const next = on ? cardTypes.filter((c) => cur.includes(c) || c === type) : cur.filter((c) => c !== type);
    setDraft((d) => ({ ...d, [roleId]: next }));
  };

  const handleSave = () => {
    if (hasError) return;
    const by = (user as any)?.email || (user as any)?.name || "admin";
    const now = new Date().toISOString();
    let rows = [...saved];
    Object.entries(draft).forEach(([roleId, types]) => {
      const prev = rows.filter((r) => r.role_id === roleId);
      rows = rows.filter((r) => r.role_id !== roleId);
      types.forEach((t) => {
        const existing = prev.find((p) => p.card_type_id === t);
        rows.push({
          role_id: roleId,
          card_type_id: t,
          created_by: existing?.created_by ?? by,
          created_at: existing?.created_at ?? now,
          updated_by: by,
          updated_at: now,
        });
      });
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    setSaved(rows);
    setDraft({});
    toast({ title: "Data scope saved" });
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (roles ?? []).filter(
      (r) => !q || r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)
    );
  }, [roles, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Data Scope</h2>
          <p className="text-sm text-muted-foreground">
            Choose which card types each role can see. Applies to Card Management, Approval Inbox and Accounting Review.
          </p>
        </div>
        <Button onClick={handleSave} disabled={!dirty || hasError}>Save changes</Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search role name or key..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role</TableHead>
              {cardTypes.map((c) => (
                <TableHead key={c} className="text-center">{c}</TableHead>
              ))}
              <TableHead>Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow><TableCell colSpan={cardTypes.length + 2} className="text-center text-muted-foreground py-8">Loading roles...</TableCell></TableRow>
            )}
            {filtered.map((r) => {
              const locked = !!(r as any).isLocked;
              const ticked = current(r.id);
              return (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="flex items-center gap-1.5 font-medium">
                      {r.name}
                      {locked && (
                        <Tooltip>
                          <TooltipTrigger asChild><Lock className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                          <TooltipContent>Locked role, cannot be changed</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{r.id}</div>
                    {ticked.length === 0 && (
                      <div className="text-xs text-destructive mt-1">Select at least one card type</div>
                    )}
                  </TableCell>
                  {cardTypes.map((c) => (
                    <TableCell key={c} className="text-center">
                      <Checkbox
                        checked={ticked.includes(c)}
                        disabled={locked}
                        onCheckedChange={(v) => toggle(r.id, c, !!v)}
                      />
                    </TableCell>
                  ))}
                  <TableCell><ResultPill ticked={ticked} all={cardTypes} /></TableCell>
                </TableRow>
              );
            })}
            {!isLoading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={cardTypes.length + 2} className="text-center text-muted-foreground py-8">No roles found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
