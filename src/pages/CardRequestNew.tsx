import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, User, DollarSign, Paperclip, FileText, X, Check, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { toast } from "@/hooks/use-toast";
import EmployeePicker from "@/components/admin/EmployeePicker";
import { employeeFullName } from "@/lib/employee-directory-mock-data";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  STORE_LOCATIONS,
  generateRequestNo,
  saveCardRequest,
  createApprovalInboxItem,
  type CardRequest,
  type CardRequestCardType,
} from "@/lib/card-request-types";

const RED = "#DA3832";
const BLUE = "#306FC7";
const GREEN = "#43938F";

function formatCEDate(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="h-5 w-5" style={{ color: RED }} />
      <h3 className="font-bold text-base text-foreground">{title}</h3>
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

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-muted text-muted-foreground">
      {status}
    </span>
  );
}

function CardTypeBadge({ cardType }: { cardType?: CardRequestCardType }) {
  if (!cardType) return null;
  const isFleet = cardType === "Fleet Card";
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", isFleet ? "bg-green-50" : "bg-blue-50")}
      style={{ color: isFleet ? GREEN : BLUE }}
    >
      {cardType}
    </span>
  );
}

export default function CardRequestNew() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const today = useMemo(() => new Date(), []);
  const inputCls = "bg-background border rounded-lg";

  const [requestNo, setRequestNo] = useState("");
  const [status, setStatus] = useState<CardRequest["status"]>("Draft");
  const [cardType, setCardType] = useState<CardRequestCardType | undefined>(undefined);
  const [employeeId, setEmployeeId] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [position, setPosition] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loaRef, setLoaRef] = useState("");
  const [storeOpen, setStoreOpen] = useState(false);
  const [storeLocation, setStoreLocation] = useState("");
  const [storeCode, setStoreCode] = useState("");
  const [holderSgm, setHolderSgm] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [issuingBank, setIssuingBank] = useState("");
  const [cardNetwork, setCardNetwork] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [perTransactionLimit, setPerTransactionLimit] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [costCenter, setCostCenter] = useState("");
  const [purpose, setPurpose] = useState("");
  const [attachment, setAttachment] = useState<{ name: string; size: number } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isFleet = cardType === "Fleet Card";
  const requesterName = user?.name ?? "HR User";
  const approverName = "Direct Manager (1 level up)";

  const errCls = (k: string) => (errors[k] ? " border-destructive" : "");
  const clearErr = (k: string) => setErrors((p) => { const n = { ...p }; delete n[k]; return n; });

  const buildRequest = (no: string, nextStatus: CardRequest["status"], submittedAt?: string): CardRequest => ({
    requestNo: no,
    status: nextStatus,
    cardType,
    requester: requesterName,
    requesterId: user?.id,
    requestDate: today.toISOString(),
    approverName,
    employeeId: isFleet ? undefined : employeeId,
    employeeName: isFleet ? undefined : employeeName,
    position: isFleet ? undefined : position,
    email: isFleet ? undefined : email,
    phone: isFleet ? undefined : phone,
    loaRef: isFleet ? undefined : loaRef,
    storeLocation: isFleet ? storeLocation : undefined,
    storeCode: isFleet ? storeCode : undefined,
    vehiclePlate: isFleet ? vehiclePlate : undefined,
    holderSgm: isFleet ? holderSgm : undefined,
    issuingBank,
    cardNetwork,
    currency: "THB",
    creditLimit,
    perTransactionLimit,
    monthlyLimit,
    costCenter,
    purpose,
    attachment,
    audit: {
      createdBy: requesterName,
      createdAt: today.toISOString(),
      submittedAt,
    },
  });

  const ensureRequestNo = () => {
    if (requestNo) return requestNo;
    const no = generateRequestNo();
    setRequestNo(no);
    return no;
  };

  const handleSaveDraft = () => {
    if (!cardType) {
      setErrors({ cardType: "Card Type is required" });
      return;
    }
    const no = ensureRequestNo();
    saveCardRequest(buildRequest(no, "Draft"));
    setStatus("Draft");
    toast({ title: `Draft saved — ${no}` });
    navigate("/card-requests");
  };

  const handleSubmit = () => {
    const e: Record<string, string> = {};
    if (!cardType) e.cardType = "Card Type is required";
    if (cardType === "Corporate Credit Card" && !employeeId) e.employeeId = "Employee ID is required";
    if (isFleet && !storeLocation) e.storeLocation = "Store / Location is required";
    if (isFleet && !vehiclePlate.trim()) e.vehiclePlate = "Vehicle plate is required";
    if (!issuingBank) e.issuingBank = "Issuing Bank is required";
    if (!creditLimit.trim()) e.creditLimit = "Requested Credit Limit is required";
    setErrors(e);
    if (Object.keys(e).length > 0) {
      toast({ title: "Please enter all required fields", variant: "destructive" });
      return;
    }
    const no = ensureRequestNo();
    const submittedAt = new Date().toISOString();
    saveCardRequest(buildRequest(no, "Pending Approval", submittedAt));
    createApprovalInboxItem({
      objectType: "Card Request",
      requestNo: no,
      cardType,
      requesterName,
      approverName,
      amount: creditLimit,
      status: "Pending Approval",
      submittedAt,
    });
    setStatus("Pending Approval");
    toast({ title: `Submitted for approval — ${no}` });
    navigate("/card-requests");
  };

  return (
    <div className="space-y-4 rounded-xl p-4" style={{ backgroundColor: "#F5F6F7" }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">New Card Request</h2>
          <p className="text-sm text-muted-foreground">Corporate Credit Card &amp; Fleet Card — Card Request / คำขอบัตร</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-foreground">{requestNo || "—"}</span>
          <StatusBadge status={status} />
        </div>
      </div>

      {/* SECTION 1 */}
      <Card className="rounded-2xl p-5">
        <SectionHeader icon={CreditCard} title="Request Information" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2 md:col-span-3">
            <FieldLabel required>Card Type</FieldLabel>
            <div className="inline-flex rounded-lg border bg-background p-1">
              {(["Corporate Credit Card", "Fleet Card"] as CardRequestCardType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setCardType(t); clearErr("cardType"); }}
                  className={cn(
                    "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
                    cardType === t ? "text-white" : "text-muted-foreground hover:bg-muted",
                  )}
                  style={cardType === t ? { backgroundColor: RED } : undefined}
                >
                  {t}
                </button>
              ))}
            </div>
            {errors.cardType && <p className="text-xs text-destructive">{errors.cardType}</p>}
          </div>
          <div className="space-y-2">
            <FieldLabel>Requester</FieldLabel>
            <Input className={inputCls} value={requesterName} readOnly />
          </div>
          <div className="space-y-2">
            <FieldLabel>Request Date</FieldLabel>
            <Input className={inputCls} value={formatCEDate(today)} readOnly />
          </div>
          <div className="space-y-2">
            <FieldLabel>Approval routes to</FieldLabel>
            <Input className={inputCls} value="Direct Manager (1 level up)" readOnly />
            <p className="text-xs text-muted-foreground">via Approval Inbox</p>
          </div>
        </div>
      </Card>

      {/* SECTION 2 */}
      <Card className="rounded-2xl p-5">
        <SectionHeader icon={User} title="Cardholder &amp; Assignment" />
        {!cardType && <p className="text-sm text-muted-foreground">Select a Card Type to continue.</p>}
        {cardType === "Corporate Credit Card" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <FieldLabel required>Employee ID</FieldLabel>
              <EmployeePicker
                value={employeeId}
                className={errCls("employeeId")}
                onSelect={(emp) => {
                  setEmployeeId(emp.employeeId);
                  setEmployeeName(employeeFullName(emp));
                  setPosition(emp.position);
                  setEmail(emp.email);
                  setPhone(emp.phone);
                  clearErr("employeeId");
                }}
              />
              {errors.employeeId && <p className="text-xs text-destructive">{errors.employeeId}</p>}
            </div>
            <div className="space-y-2">
              <FieldLabel>Employee Name</FieldLabel>
              <Input className={inputCls} value={employeeName} readOnly />
            </div>
            <div className="space-y-2">
              <FieldLabel>Position</FieldLabel>
              <Input className={inputCls} value={position} readOnly />
            </div>
            <div className="space-y-2">
              <FieldLabel>Email</FieldLabel>
              <Input className={inputCls} value={email} readOnly />
            </div>
            <div className="space-y-2">
              <FieldLabel>Phone</FieldLabel>
              <Input className={inputCls} value={phone} readOnly />
            </div>
            <div className="space-y-2">
              <FieldLabel>LOA / Authority ref</FieldLabel>
              <Input className={inputCls} value={loaRef} onChange={(ev) => setLoaRef(ev.target.value)} />
            </div>
          </div>
        )}
        {isFleet && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <FieldLabel required>Store / Location</FieldLabel>
              <Popover open={storeOpen} onOpenChange={setStoreOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={storeOpen}
                    className={cn("w-full justify-between font-normal", errCls("storeLocation"))}
                  >
                    <span className={storeLocation ? "" : "text-muted-foreground"}>{storeLocation || "Search store or location"}</span>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
                  <Command>
                    <CommandInput placeholder="Search store or location" />
                    <CommandList className="max-h-72">
                      <CommandEmpty>No stores found</CommandEmpty>
                      <CommandGroup>
                        {STORE_LOCATIONS.map((s) => (
                          <CommandItem
                            key={s.storeCode}
                            value={`${s.name} ${s.storeCode}`}
                            onSelect={() => {
                              setStoreLocation(s.name);
                              setStoreCode(s.storeCode);
                              setHolderSgm(s.sgm);
                              clearErr("storeLocation");
                              setStoreOpen(false);
                            }}
                            className="flex items-start gap-2"
                          >
                            <Check className={cn("h-4 w-4 mt-0.5", storeLocation === s.name ? "opacity-100" : "opacity-0")} />
                            <span className="flex flex-col">
                              <span className="font-semibold">{s.name}</span>
                              <span className="text-xs text-muted-foreground">{s.storeCode}</span>
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.storeLocation && <p className="text-xs text-destructive">{errors.storeLocation}</p>}
            </div>
            <div className="space-y-2">
              <FieldLabel>Store code</FieldLabel>
              <Input className={inputCls} value={storeCode} readOnly />
            </div>
            <div className="space-y-2">
              <FieldLabel required>Vehicle plate</FieldLabel>
              <Input
                className={inputCls + errCls("vehiclePlate")}
                value={vehiclePlate}
                onChange={(ev) => { setVehiclePlate(ev.target.value); clearErr("vehiclePlate"); }}
              />
              {errors.vehiclePlate && <p className="text-xs text-destructive">{errors.vehiclePlate}</p>}
            </div>
            <div className="space-y-2">
              <FieldLabel>Holder (SGM)</FieldLabel>
              <Input className={inputCls} value={holderSgm} readOnly />
            </div>
          </div>
        )}
      </Card>

      {/* SECTION 3 */}
      <Card className="rounded-2xl p-5">
        <SectionHeader icon={DollarSign} title="Financial Control" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <FieldLabel required>Issuing Bank</FieldLabel>
            <Select value={issuingBank} onValueChange={(v) => { setIssuingBank(v); clearErr("issuingBank"); }}>
              <SelectTrigger className={inputCls + errCls("issuingBank")}><SelectValue placeholder="" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="KBank">KBank</SelectItem>
                <SelectItem value="Krungsri">Krungsri</SelectItem>
              </SelectContent>
            </Select>
            {errors.issuingBank && <p className="text-xs text-destructive">{errors.issuingBank}</p>}
          </div>
          <div className="space-y-2">
            <FieldLabel>Card Network</FieldLabel>
            <Select value={cardNetwork} onValueChange={setCardNetwork}>
              <SelectTrigger className={inputCls}><SelectValue placeholder="" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Visa">Visa</SelectItem>
                <SelectItem value="Mastercard">Mastercard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <FieldLabel>Currency</FieldLabel>
            <Input className={inputCls} value="THB" readOnly />
          </div>
          <div className="space-y-2">
            <FieldLabel required>Requested Credit Limit</FieldLabel>
            <Input
              className={inputCls + errCls("creditLimit")}
              inputMode="numeric"
              value={creditLimit}
              onChange={(ev) => { setCreditLimit(ev.target.value); clearErr("creditLimit"); }}
            />
            {errors.creditLimit && <p className="text-xs text-destructive">{errors.creditLimit}</p>}
          </div>
          <div className="space-y-2">
            <FieldLabel>Per-transaction Limit</FieldLabel>
            <Input className={inputCls} inputMode="numeric" value={perTransactionLimit} onChange={(ev) => setPerTransactionLimit(ev.target.value)} />
          </div>
          <div className="space-y-2">
            <FieldLabel>Monthly Limit</FieldLabel>
            <Input className={inputCls} inputMode="numeric" value={monthlyLimit} onChange={(ev) => setMonthlyLimit(ev.target.value)} />
          </div>
          <div className="space-y-2">
            <FieldLabel>Cost Center / Account Code</FieldLabel>
            <Input className={inputCls} value={costCenter} onChange={(ev) => setCostCenter(ev.target.value)} />
            <p className="text-xs text-muted-foreground">Fleet = single account/cost code per store</p>
          </div>
        </div>
      </Card>

      {/* SECTION 4 */}
      <Card className="rounded-2xl p-5">
        <SectionHeader icon={Paperclip} title="Purpose &amp; Supporting" />
        <div className="space-y-4">
          <div className="space-y-2">
            <FieldLabel>Purpose / Justification</FieldLabel>
            <Textarea className={inputCls} rows={4} value={purpose} onChange={(ev) => setPurpose(ev.target.value)} />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {attachment && (
              <div className="group relative flex items-center gap-2 rounded-lg border px-3 py-2 bg-background">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-bold text-foreground">{attachment.name}</span>
                <span className="text-xs text-muted-foreground">{Math.round(attachment.size / 1024).toLocaleString()} KB</span>
                <button
                  type="button"
                  aria-label={`Remove ${attachment.name}`}
                  onClick={() => setAttachment(null)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <label className="cursor-pointer rounded-lg border-2 border-dashed px-4 py-2 text-sm font-medium" style={{ borderColor: BLUE, color: BLUE }}>
              + Upload
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(ev) => {
                  const f = ev.target.files?.[0];
                  if (f) setAttachment({ name: f.name, size: f.size });
                }}
              />
            </label>
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <CardTypeBadge cardType={cardType} />
          <p className="text-xs text-muted-foreground">Submit → status Pending Approval → routes to approver's Approval Inbox.</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate("/card-requests")}>Cancel</Button>
          <Button variant="outline" onClick={handleSaveDraft}>Save Draft</Button>
          <Button onClick={handleSubmit} style={{ backgroundColor: RED, color: "#fff" }}>Submit for Approval</Button>
        </div>
      </div>
    </div>
  );
}
