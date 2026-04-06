import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ActorType = "system" | "cardholder" | "manager" | "finance";

interface AuditEvent {
  id: string;
  actor: ActorType;
  actorName?: string;
  title: string;
  statusBadge: string;
  timestamp: string;
  message?: string;
  isCurrent?: boolean;
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
};

const MOCK_AUDIT_TRAIL: AuditEvent[] = [
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

export default function AuditTrail() {
  const events = MOCK_AUDIT_TRAIL;
  const isSystem = (a: ActorType) => a === "system";

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Audit Trail</h3>
        <Badge variant="secondary" className="text-[11px] px-2 py-0 h-5">
          {events.length} events
        </Badge>
      </div>

      <div className="relative pl-7">
        {/* Vertical connector line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

        <div className="space-y-5">
          {events.map((evt, idx) => {
            const config = actorConfig[evt.actor];
            const sys = isSystem(evt.actor);

            return (
              <div
                key={evt.id}
                className={cn(
                  "relative",
                  evt.isCurrent && "border-l-2 border-amber-400 -ml-[1px] pl-5 py-2 bg-amber-50/40 rounded-r-lg"
                )}
              >
                {/* Dot */}
                <div
                  className={cn(
                    "absolute top-1.5 h-3 w-3 rounded-full border-2 border-background",
                    config.dotColor,
                    evt.isCurrent && "left-[-21px]",
                    !evt.isCurrent && "-left-7",
                    evt.isCurrent && "animate-pulse"
                  )}
                />

                <div className="space-y-1">
                  {/* Title + badge row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("font-medium", sys ? "text-xs text-gray-400" : "text-[13px] text-foreground")}>
                      {evt.title}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-1.5 py-0 h-[18px] font-mono",
                        config.badgeClass
                      )}
                    >
                      {evt.statusBadge}
                    </Badge>
                  </div>

                  {/* Message (italic quote) */}
                  {evt.message && (
                    <p className="text-[13px] italic text-muted-foreground pl-0.5">
                      "{evt.message}"
                    </p>
                  )}

                  {/* Actor + timestamp */}
                  <p className={cn("flex items-center gap-1.5", sys ? "text-[11px] text-gray-400" : "text-xs text-muted-foreground")}>
                    <span>{config.emoji}</span>
                    <span>{evt.actorName || config.label}</span>
                    <span>·</span>
                    <span>{evt.timestamp}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
