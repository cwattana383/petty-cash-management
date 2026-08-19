import { CreditCard, Users, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Hardcoded UI-state seed for claim CLM-Transaction20260415004 only. */
const CLAIM = {
  claimNo: "CLM-Transaction20260415004",
  amount: "฿ 18,750.00",
  currentStatus: "MANAGER_APPROVED",
  cardholder: { name: "John Smith", title: "C-Level Executive", cardLast4: "4821" },
  assistantsCount: 2,
  assistants: ["Sarah Lee", "Somchai Prasert"],
  events: [
    {
      title: "Claim approved",
      status: "MANAGER_APPROVED",
      performedBy: { name: "Theem Veokeki", initials: "TV", role: "MANAGER" },
      onBehalfOf: null as { name: string } | null,
      note: null as string | null,
      timestamp: "15/04/2569 10:03:18",
    },
    {
      title: "Submitted for manager approval",
      status: "PENDING_APPROVAL",
      performedBy: { name: "Sarah Lee", initials: "SL", role: "ASSISTANT" },
      onBehalfOf: { name: "John Smith" },
      note: null,
      timestamp: "15/04/2569 09:20:55",
    },
    {
      title: "Document submission",
      status: "PENDING_APPROVAL",
      performedBy: { name: "Sarah Lee", initials: "SL", role: "ASSISTANT" },
      onBehalfOf: { name: "John Smith" },
      note: "Required documents uploaded and claim submitted for approval",
      timestamp: "15/04/2569 09:20:41",
    },
    {
      title: "Claim Required Approval",
      status: "REQUIRED_APPROVAL",
      performedBy: { name: "System", initials: null, role: "SYSTEM" },
      onBehalfOf: null,
      note: null,
      timestamp: "15/04/2569 09:12:03",
    },
    {
      title: "Claim created",
      status: "MATCHED",
      performedBy: { name: "System", initials: null, role: "SYSTEM" },
      onBehalfOf: null,
      note: null,
      timestamp: "15/04/2569 09:12:03",
    },
  ],
};

const BLUE = "#306FC7";
const YELLOW = "#F6C24A";
const GREEN = "#43938F";
const RED = "#DA3832";

const dotColor: Record<string, string> = {
  MANAGER_APPROVED: GREEN,
  PENDING_APPROVAL: YELLOW,
  REQUIRED_APPROVAL: BLUE,
  MATCHED: "#9CA3AF",
};

function statusBadgeStyle(status: string): React.CSSProperties {
  const c = dotColor[status] || "#9CA3AF";
  return { color: c, borderColor: c, backgroundColor: `${c}14` };
}

export default function DelegatedAuditTrail() {
  const claim = CLAIM;

  return (
    <section className="space-y-4">
      {/* 1) Claim context strip */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <span className="text-[13px] font-semibold text-foreground font-mono">{claim.claimNo}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-[13px] font-semibold text-foreground">{claim.amount}</span>
        <span className="text-muted-foreground">·</span>
        <Badge variant="outline" className="text-[11px] font-mono" style={statusBadgeStyle(claim.currentStatus)}>
          {claim.currentStatus}
        </Badge>
      </div>

      {/* 2) Cardholder & Delegation banner */}
      <div
        className="grid gap-4 rounded-xl border p-4 md:grid-cols-2"
        style={{ backgroundColor: "#fdf4f3", borderColor: "#f3d9d6" }}
      >
        <div className="flex items-start gap-3">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: RED }}
          >
            <CreditCard className="h-4 w-4 text-white" />
          </span>
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: RED }}>
              Cardholder (Owner)
            </p>
            <p className="text-[14px] font-bold text-foreground">{claim.cardholder.name}</p>
            <p className="text-[12px] text-muted-foreground">
              {claim.cardholder.title} · Card ****{claim.cardholder.cardLast4}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: BLUE }}
          >
            <Users className="h-4 w-4 text-white" />
          </span>
          <div className="space-y-1.5">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: BLUE }}>
              Assistants assigned
              <span
                className="flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
                style={{ backgroundColor: BLUE }}
              >
                {claim.assistantsCount}
              </span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {claim.assistants.map((a) => (
                <span
                  key={a}
                  className="rounded-full border bg-white px-2.5 py-0.5 text-[12px]"
                  style={{ color: BLUE, borderColor: BLUE }}
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3) Timeline */}
      <div>
        <div className="mb-3 flex items-center gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            4
          </span>
          <h2 className="text-[15px] font-bold text-foreground">Audit Trail</h2>
          <Badge variant="secondary" className="h-5 px-2 py-0 text-[11px]">
            {claim.events.length} events
          </Badge>
          <div className="flex-1 border-t border-border" />
        </div>

        <div className="relative pl-7">
          <div className="absolute bottom-2 left-[7px] top-2 w-px bg-border" />
          <div className="space-y-5">
            {claim.events.map((evt, i) => {
              const sys = evt.performedBy.role === "SYSTEM";
              const assistant = evt.performedBy.role === "ASSISTANT";
              return (
                <div key={i} className="relative">
                  <span
                    className="absolute -left-7 top-1.5 h-3 w-3 rounded-full border-2 border-background"
                    style={{ backgroundColor: dotColor[evt.status] || "#9CA3AF" }}
                  />
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("font-medium", sys ? "text-xs text-gray-400" : "text-[13px] text-foreground")}>
                        {evt.title}
                      </span>
                      <Badge
                        variant="outline"
                        className="h-[18px] px-1.5 py-0 font-mono text-[10px]"
                        style={statusBadgeStyle(evt.status)}
                      >
                        {evt.status}
                      </Badge>
                    </div>

                    {evt.note && <p className="pl-0.5 text-[13px] italic text-muted-foreground">"{evt.note}"</p>}

                    <div className="flex flex-wrap items-center gap-2">
                      {sys ? (
                        <span className="flex items-center gap-1.5 text-[12px] text-gray-400">
                          <Settings className="h-3.5 w-3.5" />
                          {evt.performedBy.name}
                        </span>
                      ) : (
                        <>
                          <span
                            className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                            style={{ backgroundColor: assistant ? BLUE : "#9CA3AF" }}
                          >
                            {evt.performedBy.initials}
                          </span>
                          <span className="text-[12px] text-foreground">{evt.performedBy.name}</span>
                          <span
                            className={cn(
                              "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                              !assistant && "bg-gray-100 text-gray-600"
                            )}
                            style={assistant ? { backgroundColor: BLUE, color: "#fff" } : undefined}
                          >
                            {evt.performedBy.role}
                          </span>
                        </>
                      )}

                      {assistant && evt.onBehalfOf && (
                        <span
                          className="rounded-full border px-2 py-0.5 text-[11px]"
                          style={{ color: BLUE, borderColor: BLUE, backgroundColor: "#eef4fc" }}
                        >
                          → on behalf of {evt.onBehalfOf.name} (Cardholder)
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground">{evt.timestamp}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4) Legend */}
      <div className="flex flex-wrap items-center gap-4 border-t border-border pt-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: RED }} /> Cardholder
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: BLUE }} /> Assistant delegated
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-gray-400" /> Manager
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-gray-400" /> System
        </span>
      </div>
    </section>
  );
}
