import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, MoreHorizontal, ArrowUp, ArrowDown, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { CARD_MASTER_ROWS, type CardMasterRow, type CardMasterStatus } from "@/lib/card-master-mock-data";

const RED = "#DA3832";
const GREEN = "#43938F";
const YELLOW = "#F6C24A";

const ALL = "ทั้งหมด";
const bankOptions = [ALL, "กสิกรไทย", "กรุงศรี", "ไทยพาณิชย์", "กรุงเทพ", "กรุงไทย", "ทีทีบี"];
const statusOptions = [ALL, "Active", "Suspended", "Cancelled", "Expired"];
const companyOptions = [ALL, "CP AXTRA PCL", "Lotus's", "Makro"];
const typeOptions = [ALL, "Corporate Credit", "Fleet"];

function expiryDate(mmYY: string) {
  const m = /^(\d{2})\/(\d{2})$/.exec(mmYY);
  if (!m) return null;
  return new Date(2000 + Number(m[2]), Number(m[1]), 0, 23, 59, 59);
}
function expiryBE(mmYY: string) {
  const m = /^(\d{2})\/(\d{2})$/.exec(mmYY);
  if (!m) return mmYY;
  return `${m[1]}/${2000 + Number(m[2]) + 543}`;
}
function isExpired(row: CardMasterRow) {
  const d = expiryDate(row.expiry);
  return !!d && d.getTime() < Date.now();
}
function isExpiringSoon(row: CardMasterRow) {
  const d = expiryDate(row.expiry);
  if (!d) return false;
  const diff = d.getTime() - Date.now();
  return diff >= 0 && diff <= 90 * 24 * 60 * 60 * 1000;
}
function effectiveStatus(row: CardMasterRow): CardMasterStatus {
  if (row.status === "Cancelled") return "Cancelled";
  return isExpired(row) ? "Expired" : row.status;
}

function StatusPill({ status }: { status: CardMasterStatus }) {
  const map: Record<CardMasterStatus, { color: string; bg: string }> = {
    Active: { color: GREEN, bg: "#E6F2F1" },
    Suspended: { color: "#8A6400", bg: "#FDF3D8" },
    Cancelled: { color: "#6B7280", bg: "#F1F2F4" },
    Expired: { color: RED, bg: "#FBE7E6" },
  };
  const s = map[status];
  return (
    <span
      className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold border"
      style={{ color: s.color, backgroundColor: s.bg, borderColor: status === "Suspended" ? YELLOW : s.color }}
    >
      {status}
    </span>
  );
}

type SortKey = "cardId" | "creditLimit" | "expiry";

export default function CardManagementList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [type, setType] = useState(ALL);
  const [bank, setBank] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [company, setCompany] = useState(ALL);
  const [expiringOnly, setExpiringOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("cardId");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [rows, setRows] = useState<CardMasterRow[]>(CARD_MASTER_ROWS);
  const [confirm, setConfirm] = useState<{ row: CardMasterRow; action: "Suspend" | "Cancel" } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => setPage(1), [debounced, type, bank, status, company, expiringOnly, pageSize]);

  const stats = useMemo(() => {
    return {
      total: rows.length,
      active: rows.filter((r) => effectiveStatus(r) === "Active").length,
      suspended: rows.filter((r) => effectiveStatus(r) === "Suspended").length,
      expiring: rows.filter((r) => isExpiringSoon(r)).length,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    let list = rows.filter((r) => {
      if (q) {
        const hay = [r.cardId, r.cardholderName ?? "", r.last4, r.plateNo ?? ""].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (type !== ALL) {
        if (type === "Corporate Credit" && r.kind !== "corporate") return false;
        if (type === "Fleet" && r.kind !== "fleet") return false;
      }
      if (bank !== ALL && r.bankTh !== bank) return false;
      if (status !== ALL && effectiveStatus(r) !== status) return false;
      if (company !== ALL && r.company !== company) return false;
      if (expiringOnly && !isExpiringSoon(r)) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "cardId") cmp = a.cardId.localeCompare(b.cardId);
      else if (sortKey === "creditLimit") cmp = a.creditLimit - b.creditLimit;
      else {
        const da = expiryDate(a.expiry)?.getTime() ?? 0;
        const db = expiryDate(b.expiry)?.getTime() ?? 0;
        cmp = da - db;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [rows, debounced, type, bank, status, company, expiringOnly, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = filtered.slice((page - 1) * pageSize, page * pageSize);
  const from = filtered.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, filtered.length);

  const chips: { label: string; clear: () => void }[] = [];
  if (debounced) chips.push({ label: `ค้นหา: ${debounced}`, clear: () => setSearch("") });
  if (type !== ALL) chips.push({ label: `ประเภทบัตร: ${type}`, clear: () => setType(ALL) });
  if (bank !== ALL) chips.push({ label: `ธนาคาร: ${bank}`, clear: () => setBank(ALL) });
  if (status !== ALL) chips.push({ label: `สถานะ: ${status}`, clear: () => setStatus(ALL) });
  if (company !== ALL) chips.push({ label: `บริษัท: ${company}`, clear: () => setCompany(ALL) });
  if (expiringOnly) chips.push({ label: "ใกล้หมดอายุ", clear: () => setExpiringOnly(false) });
  const hasFilters = chips.length > 0;

  const clearAll = () => {
    setSearch("");
    setType(ALL);
    setBank(ALL);
    setStatus(ALL);
    setCompany(ALL);
    setExpiringOnly(false);
  };

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("asc");
    }
  };

  const exportExcel = () => {
    const header = ["Card ID", "ประเภท", "ธนาคาร", "Last 4", "ผูกกับ", "วงเงิน", "หมดอายุ", "สถานะ"];
    const lines = filtered.map((r) =>
      [
        r.cardId,
        r.kind === "corporate" ? "Corporate Credit" : `Fleet (${r.fuelBrand ?? "-"})`,
        r.bankTh,
        r.last4,
        r.kind === "corporate" ? `พนักงาน · ${r.cardholderName ?? ""}` : `ยานพาหนะ · ${r.plateNo ?? ""}`,
        String(r.creditLimit),
        expiryBE(r.expiry),
        effectiveStatus(r),
      ]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(","),
    );
    const csv = "\uFEFF" + [header.join(","), ...lines].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "card-management.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const applyAction = () => {
    if (!confirm) return;
    const next: CardMasterStatus = confirm.action === "Suspend" ? "Suspended" : "Cancelled";
    setRows((p) => p.map((r) => (r.cardId === confirm.row.cardId ? { ...r, status: next } : r)));
    toast({ title: `${confirm.row.cardId} → ${next}` });
    setConfirm(null);
  };

  const SortHeader = ({ k, children, align }: { k: SortKey; children: React.ReactNode; align?: "right" }) => (
    <button
      type="button"
      onClick={() => toggleSort(k)}
      className={`flex items-center gap-1 font-bold text-xs tracking-wide text-muted-foreground uppercase ${align === "right" ? "ml-auto" : ""}`}
    >
      {children}
      {sortKey === k && (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
    </button>
  );

  const statCards = [
    { label: "บัตรทั้งหมด", value: stats.total, color: "inherit", onClick: clearAll },
    {
      label: "Active",
      value: stats.active,
      color: GREEN,
      onClick: () => {
        clearAll();
        setStatus("Active");
      },
    },
    {
      label: "Suspended",
      value: stats.suspended,
      color: YELLOW,
      onClick: () => {
        clearAll();
        setStatus("Suspended");
      },
    },
    {
      label: "ใกล้หมดอายุ (บัตรที่หมดอายุภายใน 90 วัน)",
      value: stats.expiring,
      color: RED,
      onClick: () => {
        clearAll();
        setExpiringOnly(true);
      },
    },
  ];

  return (
    <div className="space-y-4 rounded-xl p-4" style={{ backgroundColor: "#F5F6F7" }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Card Management</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportExcel}>ส่งออก Excel</Button>
          <Button style={{ backgroundColor: RED, color: "#fff" }} onClick={() => navigate("/admin/card-management/new")}>
            + สร้างบัตรใหม่
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <button key={s.label} type="button" onClick={s.onClick} className="text-left">
            <Card className="rounded-2xl p-4 hover:shadow-sm transition-shadow">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            </Card>
          </button>
        ))}
      </div>

      <Card className="rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            className="flex-1 min-w-[240px] bg-background rounded-lg"
            placeholder="ค้นหา Card ID, ชื่อผู้ถือบัตร, เลข 4 หลักท้าย, ทะเบียนรถ"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-[170px] bg-background rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent>{typeOptions.map((o) => <SelectItem key={o} value={o}>{o === ALL ? "ประเภทบัตร: ทั้งหมด" : o}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={bank} onValueChange={setBank}>
            <SelectTrigger className="w-[150px] bg-background rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent>{bankOptions.map((o) => <SelectItem key={o} value={o}>{o === ALL ? "ธนาคาร: ทั้งหมด" : o}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[150px] bg-background rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent>{statusOptions.map((o) => <SelectItem key={o} value={o}>{o === ALL ? "สถานะ: ทั้งหมด" : o}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={company} onValueChange={setCompany}>
            <SelectTrigger className="w-[170px] bg-background rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent>{companyOptions.map((o) => <SelectItem key={o} value={o}>{o === ALL ? "บริษัท: ทั้งหมด" : o}</SelectItem>)}</SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" onClick={clearAll} style={{ color: "#306FC7" }}>ล้างตัวกรอง</Button>
          )}
        </div>
        {hasFilters && (
          <div className="flex flex-wrap gap-2">
            {chips.map((c) => (
              <span key={c.label} className="inline-flex items-center gap-1 rounded-full border bg-background px-3 py-1 text-xs">
                {c.label}
                <button type="button" onClick={c.clear} aria-label={`ลบ ${c.label}`}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </Card>

      <Card className="rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "#F5F6F7" }} className="text-left">
                <th className="px-4 py-3"><SortHeader k="cardId">Card ID</SortHeader></th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">ประเภท</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">ธนาคาร</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Last 4</th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">ผูกกับ</th>
                <th className="px-4 py-3"><SortHeader k="creditLimit" align="right">วงเงิน</SortHeader></th>
                <th className="px-4 py-3"><SortHeader k="expiry">หมดอายุ</SortHeader></th>
                <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">สถานะ</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-t">
                    {Array.from({ length: 9 }).map((__, j) => (
                      <td key={j} className="px-4 py-5"><Skeleton className="h-4 w-full" /></td>
                    ))}
                  </tr>
                ))}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <CreditCard className="mx-auto h-10 w-10 text-muted-foreground" />
                    {rows.length === 0 ? (
                      <>
                        <p className="mt-3 text-sm text-muted-foreground">ยังไม่มีข้อมูลบัตรในระบบ</p>
                        <Button className="mt-3" style={{ backgroundColor: RED, color: "#fff" }} onClick={() => navigate("/admin/card-management/new")}>
                          + สร้างบัตรใหม่
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="mt-3 text-sm text-muted-foreground">ไม่พบบัตรที่ตรงกับเงื่อนไขการค้นหา</p>
                        <Button variant="outline" className="mt-3" onClick={clearAll}>ล้างตัวกรอง</Button>
                      </>
                    )}
                  </td>
                </tr>
              )}

              {!loading &&
                current.map((r) => {
                  const st = effectiveStatus(r);
                  const soon = isExpiringSoon(r);
                  const expired = isExpired(r);
                  return (
                    <tr
                      key={r.cardId}
                      className="border-t hover:bg-muted/40 cursor-pointer"
                      style={{ height: 64 }}
                      onClick={() => navigate(`/admin/card-management/${r.cardId}`)}
                    >
                      <td className="px-4 py-3 font-mono font-semibold text-foreground">{r.cardId}</td>
                      <td className="px-4 py-3">
                        {r.kind === "corporate" ? "Corporate Credit" : `Fleet (${r.fuelBrand})`}
                      </td>
                      <td className="px-4 py-3">{r.bankTh}</td>
                      <td className="px-4 py-3 font-mono">{r.last4}</td>
                      <td className="px-4 py-3">
                        {r.kind === "corporate" ? (
                          <div>
                            <div>พนักงาน</div>
                            <div className="text-xs text-muted-foreground">{r.cardholderName}</div>
                          </div>
                        ) : (
                          <span>ยานพาหนะ · {r.plateNo}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-bold">{r.creditLimit.toLocaleString("en-US")}</td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5"
                          style={{ color: expired ? RED : soon ? "#8A6400" : undefined }}
                        >
                          {soon && !expired && (
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: YELLOW }} />
                          )}
                          {expiryBE(r.expiry)}
                        </span>
                      </td>
                      <td className="px-4 py-3"><StatusPill status={st} /></td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="เมนู">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/admin/card-management/${r.cardId}`)}>ดูรายละเอียด</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/admin/card-management/${r.cardId}`)}>แก้ไข</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setConfirm({ row: r, action: "Suspend" })}>ระงับการใช้งาน (Suspend)</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setConfirm({ row: r, action: "Cancel" })}>ยกเลิกบัตร (Cancel)</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          แสดง {from}–{to} จาก {filtered.length} รายการ
        </p>
        <div className="flex items-center gap-2">
          <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
            <SelectTrigger className="w-[90px] bg-background rounded-lg"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[20, 50, 100].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>ก่อนหน้า</Button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <Button
              key={i}
              size="sm"
              variant={page === i + 1 ? "default" : "outline"}
              style={page === i + 1 ? { backgroundColor: RED, color: "#fff" } : undefined}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </Button>
          ))}
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>ถัดไป</Button>
        </div>
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.action === "Suspend" ? "ระงับการใช้งานบัตร" : "ยกเลิกบัตร"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.action === "Suspend"
                ? `ยืนยันการระงับการใช้งานบัตร ${confirm?.row.cardId}?`
                : `ยืนยันการยกเลิกบัตร ${confirm?.row.cardId}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={applyAction} style={{ backgroundColor: RED, color: "#fff" }}>ยืนยัน</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
