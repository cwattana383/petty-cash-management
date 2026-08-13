import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, User, DollarSign, Truck, Paperclip, FileText, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import EmployeePicker from "@/components/admin/EmployeePicker";
import { employeeFullName } from "@/lib/employee-directory-mock-data";
import { useAuth } from "@/lib/auth-context";
function formatCEDate(v: string) {
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

const RED = "#DA3832";
const BLUE = "#306FC7";
const GREEN = "#43938F";

export interface CardManagementRecord {
  cardId?: string;
  cardType?: string;
  last4?: string;
  cardholderName?: string;
  employeeId?: string;
  employeeName?: string;
  issuingBank?: string;
  cardNetwork?: string;
  issueDate?: string;
  expiry?: string;
  cardStatus?: string;
  company?: string;
  department?: string;
  storeCode?: string;
  position?: string;
  email?: string;
  phone?: string;
  creditLimit?: string;
  currency?: string;
  perTxnLimit?: string;
  monthlyLimit?: string;
  glAccount?: string;
  plateNo?: string;
  fuelType?: string;
  usageRules?: string;
}

interface Props {
  record?: CardManagementRecord;
}

const bankOptions = ["KBank", "Krungsri"];
const networkOptions = ["Visa", "Mastercard", "JCB", "UnionPay", "Amex"];
const statusOptions = ["Created", "Active", "Suspended", "Cancelled", "Expired"];
const companyOptions = ["CP AXTRA PCL", "Lotus's", "Makro"];
const currencyOptions = ["THB", "USD", "EUR", "SGD", "CNY"];

function generateCardId(cardType?: string) {
  const n = String(Math.floor(Math.random() * 90000) + 10000).slice(0, 5);
  const prefix = cardType === "Fleet Card" ? "FL" : "CC";
  return `${prefix}-${new Date().getFullYear()}-${n}`;
}

function formatStamp(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function formatCardDigits(v: string) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}

function groupNumber(v: string) {
  const digits = v.replace(/[^\d]/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-US");
}

function toNumber(v?: string) {
  if (!v) return NaN;
  return Number(v.replace(/,/g, ""));
}

function expiryIsPast(mmYY: string) {
  const m = /^(\d{2})\/(\d{2})$/.exec(mmYY);
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  const end = new Date(year, month, 0, 23, 59, 59);
  return end.getTime() < Date.now();
}

function SectionHeader({ icon: Icon, title, badge }: { icon: any; title: string; badge?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-5 w-5" style={{ color: RED }} />
      <h3 className="font-bold text-base text-foreground">{title}</h3>
      {badge}
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <Label className="font-bold text-foreground">
      {children}
      {required && <span style={{ color: RED }}> *</span>}
    </Label>
  );
}

export default function CardManagementForm({ record }: Props = {}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cardId, setCardId] = useState(() => record?.cardId ?? "");
  const [form, setForm] = useState<CardManagementRecord>({
    cardType: "Corporate Credit Card",
    currency: "THB",
    cardStatus: "Created",
    ...record,
  });
  const [files, setFiles] = useState<{ name: string; size: number }[]>([
    { name: "card-request-form.pdf", size: 120 * 1024 },
  ]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [audit, setAudit] = useState<{ by: string; at: string } | null>(null);
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});
  const registerRef = (k: string) => (el: HTMLElement | null) => {
    fieldRefs.current[k] = el;
  };

  const set = (k: keyof CardManagementRecord, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const isFleet = form.cardType === "Fleet Card";
  const expired = !!form.expiry && expiryIsPast(form.expiry);
  const effectiveStatus = expired ? "Expired" : form.cardStatus;

  const inputCls = "bg-background border rounded-lg";
  const errCls = (k: string) => (errors[k] ? " border-2" : "");
  const errStyle = (k: string) => (errors[k] ? { borderColor: RED } : undefined);

  const validateField = (k: string, f: CardManagementRecord = form): string | undefined => {
    const credit = toNumber(f.creditLimit);
    const perTxn = toNumber(f.perTxnLimit);
    const monthly = toNumber(f.monthlyLimit);
    switch (k) {
      case "cardType":
        return f.cardType ? undefined : "Please enter all required fields";
      case "last4": {
        const digits = (f.last4 ?? "").replace(/\D/g, "");
        const need = f.cardType === "Fleet Card" ? 16 : 4;
        return digits.length === need ? undefined : `Card number must be exactly ${need} digits`;
      }
      case "cardholderName":
        return f.cardholderName?.trim() ? undefined : "Please enter all required fields";
      case "issuingBank":
        return f.issuingBank ? undefined : "Please enter all required fields";
      case "expiry":
        if (!f.expiry) return "Use MM/YY";
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(f.expiry)) return "Use MM/YY";
        return expiryIsPast(f.expiry) ? "Expiry date is in the past" : undefined;
      case "email":
        if (!f.email) return undefined;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email) ? undefined : "Invalid email";
      case "perTxnLimit":
        if (isNaN(perTxn) || isNaN(monthly)) return undefined;
        return perTxn > monthly ? "Must be ≤ Monthly Limit" : undefined;
      case "monthlyLimit":
        if (isNaN(monthly) || isNaN(credit)) return undefined;
        return monthly > credit ? "Must be ≤ Credit Limit" : undefined;
      default:
        return undefined;
    }
  };

  const runBlur = (...keys: string[]) => {
    setErrors((prev) => {
      const next = { ...prev };
      keys.forEach((k) => {
        const msg = validateField(k);
        if (msg) next[k] = msg;
        else delete next[k];
      });
      return next;
    });
  };

  const handleSave = () => {
    const keys = ["cardType", "last4", "cardholderName", "issuingBank", "expiry", "email", "perTxnLimit", "monthlyLimit"];
    const e: Record<string, string> = {};
    keys.forEach((k) => {
      const msg = validateField(k);
      if (msg) e[k] = msg;
    });
    setErrors(e);
    const firstInvalid = keys.find((k) => e[k]);
    if (firstInvalid) {
      const missingRequired = ["cardType", "last4", "cardholderName", "issuingBank", "expiry"].some(
        (k) =>
          !!e[k] &&
          !form[k as keyof CardManagementRecord],
      );
      toast({
        title: missingRequired ? "Please enter all required fields" : "Please fix the highlighted fields",
        variant: "destructive",
      });
      const el = fieldRefs.current[firstInvalid];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        (el as HTMLElement).focus?.();
      }
      return;
    }
    const id = cardId || generateCardId(form.cardType);
    setCardId(id);
    const stamp = formatStamp(new Date());
    setAudit({ by: user?.name ?? "System", at: stamp });
    toast({ title: `Card saved — ${id}` });
    navigate("/admin/card-management");
  };

  const onUpload = (list: FileList | null) => {
    if (!list) return;
    const next: { name: string; size: number }[] = [];
    Array.from(list).forEach((f) => {
      if (f.size > 10 * 1024 * 1024) {
        toast({ title: `${f.name} exceeds 10MB`, variant: "destructive" });
        return;
      }
      next.push({ name: f.name, size: f.size });
    });
    setFiles((p) => [...p, ...next]);
  };

  return (
    <div className="space-y-4 rounded-xl p-4" style={{ backgroundColor: "#F5F6F7" }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Card Management</h2>
          <p className="text-sm text-muted-foreground">Corporate Credit Card &amp; Fleet Card — Card Master</p>
        </div>
      </div>

      {/* SECTION 1 */}
      <Card className="rounded-2xl p-5">
        <SectionHeader icon={CreditCard} title="Card Information" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <FieldLabel required>Card Type</FieldLabel>
            <Select
              value={form.cardType}
              onValueChange={(v) => {
                setForm((p) => ({ ...p, cardType: v, last4: "" }));
                setErrors((p) => { const n = { ...p }; delete n.last4; return n; });
              }}
            >
              <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Corporate Credit Card">Corporate Credit Card</SelectItem>
                <SelectItem value="Fleet Card">Fleet Card</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <FieldLabel required>Card Number</FieldLabel>
            <Input
              ref={registerRef("last4") as any}
              className={inputCls + errCls("last4")}
              style={errStyle("last4")}
              inputMode="numeric"
              maxLength={isFleet ? 19 : 4}
              placeholder={isFleet ? "1114700054212262" : "1234"}
              value={isFleet ? formatCardDigits(form.last4 ?? "") : (form.last4 ?? "")}
              onChange={(ev) => {
                const digits = ev.target.value.replace(/\D/g, "").slice(0, isFleet ? 16 : 4);
                set("last4", digits);
              }}
              onBlur={() => runBlur("last4")}
            />
            {errors.last4 ? (
              <p className="text-xs text-destructive">{errors.last4}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {isFleet ? "Enter the full 16-digit card number" : "Enter the last 4 digits only"}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <FieldLabel>Card Status</FieldLabel>
            <Select value={effectiveStatus} onValueChange={(v) => set("cardStatus", v)} disabled={expired}>
              <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
              <SelectContent>
                {statusOptions.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <FieldLabel required>Issuing Bank</FieldLabel>
            <Select value={form.issuingBank} onValueChange={(v) => { set("issuingBank", v); setErrors((p) => { const n = { ...p }; delete n.issuingBank; return n; }); }}>
              <SelectTrigger ref={registerRef("issuingBank") as any} className={inputCls + errCls("issuingBank")} style={errStyle("issuingBank")}><SelectValue placeholder="" /></SelectTrigger>
              <SelectContent>
                {bankOptions.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.issuingBank && <p className="text-xs text-destructive">{errors.issuingBank}</p>}
          </div>
          <div className="space-y-2">
            <FieldLabel>Issue Date</FieldLabel>
            <div className="flex items-center gap-2">
              <Input type="date" className={inputCls} value={form.issueDate ?? ""} onChange={(ev) => set("issueDate", ev.target.value)} />
              {form.issueDate && <span className="text-sm text-muted-foreground whitespace-nowrap">{formatCEDate(form.issueDate)}</span>}
            </div>
          </div>
          <div className="space-y-2">
            <FieldLabel required>Expiry Date (MM/YY)</FieldLabel>
            <Input
              ref={registerRef("expiry") as any}
              className={inputCls + errCls("expiry")}
              style={errStyle("expiry")}
              maxLength={5}
              onBlur={() => runBlur("expiry")}
              value={form.expiry ?? ""}
              onChange={(ev) => {
                let v = ev.target.value.replace(/[^\d]/g, "").slice(0, 4);
                if (v.length > 2) v = `${v.slice(0, 2)}/${v.slice(2)}`;
                set("expiry", v);
              }}
            />
            {errors.expiry && <p className="text-xs text-destructive">{errors.expiry}</p>}
          </div>
          <div className="space-y-2">
            <FieldLabel>Card Network</FieldLabel>
            <Select value={form.cardNetwork} onValueChange={(v) => set("cardNetwork", v)}>
              <SelectTrigger className={inputCls}><SelectValue placeholder="" /></SelectTrigger>
              <SelectContent>
                {networkOptions.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <FieldLabel required>Cardholder Name</FieldLabel>
            <Input ref={registerRef("cardholderName") as any} className={inputCls + errCls("cardholderName")} style={errStyle("cardholderName")} value={form.cardholderName ?? ""} onChange={(ev) => set("cardholderName", ev.target.value)} onBlur={() => runBlur("cardholderName")} />
            {!!form.employeeName && form.cardholderName !== form.employeeName && (
              <p className="text-xs text-muted-foreground">Overridden — differs from employee record</p>
            )}
            {errors.cardholderName && <p className="text-xs text-destructive">{errors.cardholderName}</p>}
          </div>


        </div>
      </Card>

      {/* SECTION 2 */}
      <Card className="rounded-2xl p-5">
        <SectionHeader icon={User} title="Cardholder &amp; Ownership" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <FieldLabel>Employee ID</FieldLabel>
            <EmployeePicker
              value={form.employeeId}
              className={inputCls}
              onSelect={(e) =>
                setForm((p) => ({
                  ...p,
                  employeeId: e.employeeId,
                  employeeName: employeeFullName(e),
                  cardholderName: employeeFullName(e),
                  position: e.position,
                  email: e.email,
                  phone: e.phone,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <FieldLabel>Employee Name</FieldLabel>
            <Input className={`${inputCls} bg-muted`} readOnly value={form.employeeName ?? ""} />
          </div>
          <div className="space-y-2">
            <FieldLabel>Position / Role</FieldLabel>
            <Input className={inputCls} value={form.position ?? ""} onChange={(ev) => set("position", ev.target.value)} />
          </div>

          <div className="space-y-2">
            <FieldLabel>Email</FieldLabel>
            <Input ref={registerRef("email") as any} type="email" className={inputCls + errCls("email")} style={errStyle("email")} value={form.email ?? ""} onChange={(ev) => set("email", ev.target.value)} onBlur={() => runBlur("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <FieldLabel>Phone</FieldLabel>
            <Input type="tel" className={inputCls} value={form.phone ?? ""} onChange={(ev) => set("phone", ev.target.value)} />
          </div>
        </div>
      </Card>

      {/* SECTION 3 */}
      <Card className="rounded-2xl p-5">
        <SectionHeader icon={DollarSign} title="Financial Control" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <FieldLabel>Credit Limit</FieldLabel>
            <Input inputMode="numeric" className={inputCls} value={form.creditLimit ?? ""} onChange={(ev) => set("creditLimit", groupNumber(ev.target.value))} onBlur={() => runBlur("monthlyLimit", "perTxnLimit")} />
          </div>
          <div className="space-y-2">
            <FieldLabel>Currency</FieldLabel>
            <Select value={form.currency} onValueChange={(v) => set("currency", v)}>
              <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
              <SelectContent>
                {currencyOptions.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <FieldLabel>Per-transaction Limit</FieldLabel>
            <Input ref={registerRef("perTxnLimit") as any} inputMode="numeric" className={inputCls + errCls("perTxnLimit")} style={errStyle("perTxnLimit")} value={form.perTxnLimit ?? ""} onChange={(ev) => set("perTxnLimit", groupNumber(ev.target.value))} onBlur={() => runBlur("perTxnLimit")} />
            {errors.perTxnLimit && <p className="text-xs text-destructive">{errors.perTxnLimit}</p>}
          </div>
          <div className="space-y-2">
            <FieldLabel>Monthly Limit</FieldLabel>
            <Input ref={registerRef("monthlyLimit") as any} inputMode="numeric" className={inputCls + errCls("monthlyLimit")} style={errStyle("monthlyLimit")} value={form.monthlyLimit ?? ""} onChange={(ev) => set("monthlyLimit", groupNumber(ev.target.value))} onBlur={() => runBlur("monthlyLimit", "perTxnLimit")} />
            {errors.monthlyLimit && <p className="text-xs text-destructive">{errors.monthlyLimit}</p>}
          </div>
        </div>
      </Card>

      {/* SECTION 4 — conditional */}
      {isFleet && (
        <Card className="rounded-2xl p-5 border-2 border-dashed" style={{ borderColor: GREEN }}>
          <SectionHeader
            icon={Truck}
            title="Fleet Card Details"
            badge={
              <span className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: "#E6F2F1", color: GREEN }}>
                Shown when Card Type = Fleet Card
              </span>
            }
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <FieldLabel>Vehicle / Plate No.</FieldLabel>
              <Input className={inputCls} placeholder="AB-1234 Bangkok" value={form.plateNo ?? ""} onChange={(ev) => set("plateNo", ev.target.value)} />
            </div>
            <div className="space-y-2">
              <FieldLabel>Fuel Type</FieldLabel>
              <Input className={inputCls} placeholder="Diesel / Gasohol 95" value={form.fuelType ?? ""} onChange={(ev) => set("fuelType", ev.target.value)} />
            </div>
            <div className="space-y-2">
              <FieldLabel>Usage Rules</FieldLabel>
              <Input className={inputCls} placeholder="Pending Ops/HR confirmation" value={form.usageRules ?? ""} onChange={(ev) => set("usageRules", ev.target.value)} />
            </div>
          </div>
        </Card>
      )}

      {/* SECTION 5 */}
      <Card className="rounded-2xl p-5">
        <SectionHeader icon={Paperclip} title="Attachments" />
        <div className="flex flex-wrap items-center gap-3">
          {files.map((f, i) => (
            <div key={`${f.name}-${i}`} className="group relative flex items-center gap-2 rounded-lg border px-3 py-2 bg-background">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-bold text-foreground">{f.name}</span>
              <span className="text-xs text-muted-foreground">{Math.round(f.size / 1024).toLocaleString()} KB</span>
              <button
                type="button"
                aria-label={`Remove ${f.name}`}
                onClick={() => setFiles((p) => p.filter((_, idx) => idx !== i))}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <label
            className="cursor-pointer rounded-lg border-2 border-dashed px-4 py-2 text-sm font-medium"
            style={{ borderColor: BLUE, color: BLUE }}
          >
            + Upload
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(ev) => onUpload(ev.target.files)}
            />
          </label>
        </div>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {audit && (
          <p className="text-xs text-muted-foreground">
            {`Created by: ${audit.by} · ${audit.at} | Last modified by: ${audit.by} · ${audit.at}`}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline">Cancel</Button>
          <Button onClick={handleSave} style={{ backgroundColor: RED, color: "#fff" }}>Save Card</Button>
        </div>
      </div>
    </div>
  );
}
