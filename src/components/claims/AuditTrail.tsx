import { useState, useRef, useEffect } from "react";
import { Lock, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ClaimHeader } from "@/lib/types";

type ActorType = "system" | "cardholder" | "manager" | "finance" | "assistant";

export interface AuditEvent {
  id: string;
  actor: ActorType;
  actorName?: string;
  /** Cardholder the assistant acted on behalf of (assistant actions only). */
  onBehalfOf?: string;
  title: string;
  statusBadge: string;
  badgeClass?: string;
  timestamp: string;
  message?: string;
  isCurrent?: boolean;
  isTerminal?: boolean;
}


const actorConfig: Record<ActorType, { emoji: string; label: string; dotColor: string; badgeClass: string }> = {
  system: {
    emoji: "⚙️",
    label: "System",
    dotColor: "bg-gray-400",
    badgeClass: "bg-gray-100 text-gray-600 border-gray-200",
  },
  cardholder: {
    emoji: "👤",
    label: "Cardholder",
    dotColor: "bg-emerald-500",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  manager: {
    emoji: "👔",
    label: "Manager",
    dotColor: "bg-amber-500",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  finance: {
    emoji: "🏦",
    label: "Finance Team",
    dotColor: "bg-blue-500",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  assistant: {
    emoji: "🧑‍💼",
    label: "Assistant",
    dotColor: "bg-sky-500",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
  },
};


const STATUS_BADGE_OVERRIDES: Record<string, string> = {
  PENDING_APPROVAL: "bg-blue-50 text-blue-700 border-blue-200",
  MANAGER_REJECTED: "bg-red-50 text-red-700 border-red-200",
  FINAL_REJECTED: "bg-red-100 text-red-900 border-red-300",
  PENDING_DOCUMENTS: "bg-orange-50 text-orange-700 border-orange-200",
  ACCOUNTING_REVIEW: "bg-purple-50 text-purple-700 border border-purple-200",
  RETURNED_BY_FINANCE: "bg-purple-50 text-purple-700 border border-purple-200",
};

export const REQUEST_INFO_TRAIL: AuditEvent[] = [
  {
    id: "evt-5",
    actor: "cardholder",
    title: "Waiting for cardholder response",
    statusBadge: "REQUEST_MORE_INFO",
    timestamp: "now",
    isCurrent: true,
  },
  {
    id: "evt-4",
    actor: "manager",
    actorName: "Somying Rakdee (Manager)",
    title: "Manager requested more information",
    statusBadge: "REQUEST_MORE_INFO",
    timestamp: "01/03/2026 14:30",
    message: "Please attach the original receipt and specify the names of all attendees on the trip.",
  },
  {
    id: "evt-3",
    actor: "cardholder",
    actorName: "Somying Prasertsuk",
    title: "Submitted for manager approval",
    statusBadge: "PENDING_APPROVAL",
    timestamp: "01/03/2026 09:45",
  },
  {
    id: "evt-2",
    actor: "cardholder",
    actorName: "Somying Prasertsuk",
    title: "Documents uploaded",
    statusBadge: "VALIDATED",
    timestamp: "01/03/2026 09:42",
  },
  {
    id: "evt-1",
    actor: "system",
    title: "Transaction imported from bank file",
    statusBadge: "NOT_STARTED",
    timestamp: "01/03/2026 00:15",
  },
];

export const FINAL_REJECTED_TRAIL: AuditEvent[] = [
  {
    id: "fr-9",
    actor: "system",
    title: "No further action allowed",
    statusBadge: "FINAL_REJECTED",
    timestamp: "06/03/2026 14:45",
    isCurrent: true,
    isTerminal: true,
  },
  {
    id: "fr-8",
    actor: "system",
    title: "Second rejection detected — expense permanently closed",
    statusBadge: "FINAL_REJECTED",
    timestamp: "06/03/2026 14:45",
  },
  {
    id: "fr-7",
    actor: "manager",
    actorName: "Somying Rakdee (Manager)",
    title: "Expense rejected again",
    statusBadge: "MANAGER_REJECTED",
    timestamp: "06/03/2026 14:45",
    message: "The resubmitted receipt still does not match. This expense cannot be approved.",
  },
  {
    id: "fr-6",
    actor: "cardholder",
    actorName: "Somying Prasertsuk",
    title: "Resubmitted for approval (2nd attempt)",
    statusBadge: "PENDING_APPROVAL",
    timestamp: "06/03/2026 09:25",
  },
  {
    id: "fr-5",
    actor: "cardholder",
    actorName: "Somying Prasertsuk",
    title: "Documents re-uploaded after rejection",
    statusBadge: "PENDING_DOCUMENTS",
    timestamp: "06/03/2026 09:20",
  },
  {
    id: "fr-4",
    actor: "manager",
    actorName: "Somying Rakdee (Manager)",
    title: "Expense rejected",
    statusBadge: "MANAGER_REJECTED",
    timestamp: "05/03/2026 15:00",
    message: "Receipt amount does not match the card transaction amount. Please check and resubmit.",
  },
  {
    id: "fr-3",
    actor: "cardholder",
    actorName: "Somying Prasertsuk",
    title: "Submitted for manager approval",
    statusBadge: "PENDING_APPROVAL",
    timestamp: "05/03/2026 10:14",
  },
  {
    id: "fr-2",
    actor: "cardholder",
    actorName: "Somying Prasertsuk",
    title: "Documents uploaded",
    statusBadge: "VALIDATED",
    timestamp: "05/03/2026 10:10",
  },
  {
    id: "fr-1",
    actor: "system",
    title: "Transaction imported from bank file",
    statusBadge: "NOT_STARTED",
    timestamp: "05/03/2026 00:15",
  },
];

export const CARDHOLDER_RESUBMIT_TRAIL: AuditEvent[] = [
  {
    id: "cr-5",
    actor: "cardholder",
    actorName: "Somying Prasertsuk",
    title: "Resubmitted for manager approval",
    statusBadge: "PENDING_APPROVAL",
    timestamp: "06/03/2026 09:30",
    message: "Attached the corrected receipt with the matching amount. Please review again.",
    isCurrent: true,
  },
  {
    id: "cr-4",
    actor: "manager",
    actorName: "Somying Rakdee (Manager)",
    title: "Expense rejected",
    statusBadge: "MANAGER_REJECTED",
    timestamp: "05/03/2026 15:00",
    message: "Receipt amount does not match the card transaction amount. Please check and resubmit.",
  },
  {
    id: "cr-3",
    actor: "cardholder",
    actorName: "Somying Prasertsuk",
    title: "Submitted for manager approval",
    statusBadge: "PENDING_APPROVAL",
    timestamp: "05/03/2026 10:14",
  },
  {
    id: "cr-2",
    actor: "cardholder",
    actorName: "Somying Prasertsuk",
    title: "Documents uploaded",
    statusBadge: "VALIDATED",
    timestamp: "05/03/2026 10:10",
  },
  {
    id: "cr-1",
    actor: "system",
    title: "Transaction imported from bank file",
    statusBadge: "NOT_STARTED",
    timestamp: "05/03/2026 00:15",
  },
];

export const FINANCE_RETURN_TRAIL: AuditEvent[] = [
  {
    id: "fr2-7",
    actor: "cardholder",
    actorName: "Somying Prasertsuk",
    title: "Resubmitted to Finance",
    statusBadge: "ACCOUNTING_REVIEW",
    timestamp: "08/03/2026 11:20",
    message: "Updated GL account and re-uploaded the corrected tax invoice as requested.",
    isCurrent: true,
  },
  {
    id: "fr2-6",
    actor: "finance",
    actorName: "Aor (Finance Team)",
    title: "Returned by Finance for correction",
    statusBadge: "RETURNED_BY_FINANCE",
    timestamp: "07/03/2026 16:10",
    message: "Tax invoice header is missing the company tax ID. Please attach a corrected invoice.",
  },
  {
    id: "fr2-5",
    actor: "finance",
    actorName: "Aor (Finance Team)",
    title: "Picked up for accounting review",
    statusBadge: "ACCOUNTING_REVIEW",
    timestamp: "07/03/2026 09:00",
  },
  {
    id: "fr2-4",
    actor: "manager",
    actorName: "Somying Rakdee (Manager)",
    title: "Expense approved",
    statusBadge: "PENDING_APPROVAL",
    timestamp: "06/03/2026 14:00",
  },
  {
    id: "fr2-3",
    actor: "cardholder",
    actorName: "Somying Prasertsuk",
    title: "Submitted for manager approval",
    statusBadge: "PENDING_APPROVAL",
    timestamp: "05/03/2026 10:14",
  },
  {
    id: "fr2-2",
    actor: "cardholder",
    actorName: "Somying Prasertsuk",
    title: "Documents uploaded",
    statusBadge: "VALIDATED",
    timestamp: "05/03/2026 10:10",
  },
  {
    id: "fr2-1",
    actor: "system",
    title: "Transaction imported from bank file",
    statusBadge: "NOT_STARTED",
    timestamp: "05/03/2026 00:15",
  },
];

export const CLM_TEST_FINAL_001_TRAIL: AuditEvent[] = [
  {
    id: "ctf-9",
    actor: "manager",
    actorName: "Somying Kaewsai",
    title: "Claim permanently rejected",
    statusBadge: "FINAL_REJECTED",
    timestamp: "12/05/2569 16:20:00",
    message: "This claim cannot be reimbursed as it does not meet the conditions of the corporate credit card usage policy.",
    isCurrent: true,
    isTerminal: true,
  },
  {
    id: "ctf-8",
    actor: "manager",
    actorName: "Somying Kaewsai",
    title: "Manager rejected resubmitted claim",
    statusBadge: "REJECTED",
    badgeClass: "bg-red-50 text-red-700 border-red-200",
    timestamp: "12/05/2569 16:19:30",
    message: "The submitted claim does not comply with the corporate credit card usage policy.",
  },
  {
    id: "ctf-7",
    actor: "cardholder",
    actorName: "Wilasinee Pratyawongchai",
    title: "Resubmitted for manager approval",
    statusBadge: "RESUBMITTED",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    timestamp: "12/05/2569 15:48:12",
  },
  {
    id: "ctf-6",
    actor: "cardholder",
    actorName: "Wilasinee Pratyawongchai",
    title: "Cardholder added note",
    statusBadge: "NOTE_ADDED",
    badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200",
    timestamp: "12/05/2569 15:47:40",
    message: "Bought a notebook for client meeting prep. Vendor refused to issue a corrected invoice.",
  },
  {
    id: "ctf-5",
    actor: "manager",
    actorName: "Somying Kaewsai",
    title: "Manager requested correction",
    statusBadge: "REQUEST_MORE_INFO",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
    timestamp: "12/05/2569 14:35:10",
    message: "Please provide a corrected invoice that complies with the corporate credit card usage requirements.",
  },
  {
    id: "ctf-4",
    actor: "cardholder",
    actorName: "Wilasinee Pratyawongchai",
    title: "Submitted for manager approval",
    statusBadge: "PENDING_APPROVAL",
    timestamp: "12/05/2569 13:22:45",
  },
  {
    id: "ctf-3",
    actor: "system",
    title: "Document verified",
    statusBadge: "VERIFIED",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    timestamp: "12/05/2569 13:22:30",
    message: "Invoice document validated successfully.",
  },
  {
    id: "ctf-2",
    actor: "cardholder",
    actorName: "Wilasinee Pratyawongchai",
    title: "Document uploaded",
    statusBadge: "UPLOADED",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    timestamp: "12/05/2569 13:21:58",
    message: "20260512_office_supplies_invoice.pdf",
  },
  {
    id: "ctf-1",
    actor: "system",
    title: "Transaction imported from bank file",
    statusBadge: "NOT_STARTED",
    timestamp: "09/05/2569 09:00:00",
  },
];

export function resolveTrailForClaim(claim: ClaimHeader): AuditEvent[] {
  if (claim.id === "CLM-TEST-FINAL-001") return CLM_TEST_FINAL_001_TRAIL;
  switch (claim.status) {
    case "Reject":
      // Partial: up to manager-rejected with isCurrent: true.
      return CARDHOLDER_RESUBMIT_TRAIL.slice(1).map((e, i) =>
        i === 0 ? { ...e, isCurrent: true } : { ...e, isCurrent: false }
      );
    case "Returned For Info":
      return REQUEST_INFO_TRAIL;
    case "Returned By Finance":
      // Partial: up to finance-returned with isCurrent: true.
      return FINANCE_RETURN_TRAIL.slice(1).map((e, i) =>
        i === 0 ? { ...e, isCurrent: true } : { ...e, isCurrent: false }
      );
    case "Final Rejected":
      return FINAL_REJECTED_TRAIL;
    default:
      return REQUEST_INFO_TRAIL;
  }
}

const VISIBLE_COUNT = 5;

interface AuditTrailProps {
  events?: AuditEvent[];
}

export default function AuditTrail({ events: eventsProp }: AuditTrailProps) {
  const events = eventsProp || REQUEST_INFO_TRAIL;
  const isSystem = (a: ActorType) => a === "system";
  const hasTerminal = events.some((e) => e.isTerminal);
  const hasMore = events.length > VISIBLE_COUNT;

  const [expanded, setExpanded] = useState(false);
  const collapsibleRef = useRef<HTMLDivElement>(null);
  const [collapsibleHeight, setCollapsibleHeight] = useState<number | undefined>(undefined);

  const visibleEvents = expanded ? events : events.slice(0, VISIBLE_COUNT);
  const hiddenEvents = events.slice(VISIBLE_COUNT);

  // Measure hidden content height for animation
  useEffect(() => {
    if (collapsibleRef.current) {
      setCollapsibleHeight(collapsibleRef.current.scrollHeight);
    }
  }, [events]);

  return (
    <section>

      {/* Section header — matching SectionDivider style */}
      <div className="flex items-center gap-3 mb-3">
        <span className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
          4
        </span>
        <h2 className="text-[15px] font-bold text-foreground">Audit Trail</h2>
        <Badge variant="secondary" className="text-[11px] px-2 py-0 h-5">
          {events.length} events
        </Badge>
        <div className="flex-1 border-t border-border" />
      </div>

      <div className="relative pl-7">
        {/* Vertical connector line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

        <div className="space-y-5">
          {/* Always-visible events */}
          {events.slice(0, VISIBLE_COUNT).map((evt) => (
            <EventRow key={evt.id} evt={evt} isSystem={isSystem} />
          ))}

          {/* Collapsible hidden events */}
          {hasMore && (
            <div
              ref={collapsibleRef}
              className="space-y-5 overflow-hidden transition-all duration-300 ease-in-out"
              style={{ maxHeight: expanded ? `${collapsibleHeight}px` : "0px", opacity: expanded ? 1 : 0 }}
            >
              {hiddenEvents.map((evt) => (
                <EventRow key={evt.id} evt={evt} isSystem={isSystem} />
              ))}
            </div>
          )}
        </div>

        {/* See all / Show less toggle */}
        {hasMore && (
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className="flex items-center gap-1 mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? (
              <>Show less <ChevronUp className="h-3 w-3" /></>
            ) : (
              <>See all {events.length} events <ChevronDown className="h-3 w-3" /></>
            )}
          </button>
        )}
      </div>
    </section>
  );
}

/* ── Single event row ── */
function EventRow({ evt, isSystem }: { evt: AuditEvent; isSystem: (a: ActorType) => boolean }) {
  const config = actorConfig[evt.actor];
  const sys = isSystem(evt.actor);
  const terminal = evt.isTerminal;
  const badgeOverride = STATUS_BADGE_OVERRIDES[evt.statusBadge];

  const currentClass = evt.isCurrent
    ? terminal
      ? "border-l-2 border-red-800 -ml-[1px] pl-5 py-2 bg-red-50/60 rounded-r-lg"
      : "border-l-2 border-amber-400 -ml-[1px] pl-5 py-2 bg-amber-50/40 rounded-r-lg"
    : "";

  const dotColor = terminal ? "bg-red-800" : config.dotColor;

  return (
    <div className={cn("relative", currentClass)}>
      <div
        className={cn(
          "absolute top-1.5 h-3 w-3 rounded-full border-2 border-background",
          dotColor,
          evt.isCurrent ? "left-[-21px]" : "-left-7",
          evt.isCurrent && !terminal && "animate-pulse"
        )}
      />
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("font-medium", sys ? "text-xs text-gray-400" : "text-[13px] text-foreground")}>
            {evt.title}
          </span>
          <Badge
            variant="outline"
            className={cn("text-[10px] px-1.5 py-0 h-[18px] font-mono", badgeOverride || evt.badgeClass || config.badgeClass)}
          >
            {evt.statusBadge === "FINAL_REJECTED" && <Lock className="h-2.5 w-2.5 mr-0.5" />}
            {evt.statusBadge}
          </Badge>
        </div>
        {evt.message && (
          <p className="text-[13px] italic text-muted-foreground pl-0.5">"{evt.message}"</p>
        )}
        <p className={cn("flex items-center gap-1.5", sys ? "text-[11px] text-gray-400" : "text-xs text-muted-foreground")}>
          <span>{config.emoji}</span>
          <span>{evt.actorName || config.label}</span>
          <span>·</span>
          <span>{evt.timestamp}</span>
        </p>
      </div>
    </div>
  );
}
