import { useState } from "react";
import { User, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CardAuditBadge =
  | "CREATED"
  | "ASSIGNED"
  | "HANDOVER_CONFIRMED"
  | "RECEIVED"
  | "ACTIVE"
  | "REASSIGNED";

export interface CardAuditEvent {
  id: string;
  title: string;
  badge: CardAuditBadge;
  /** "System" for automatic actions. */
  performer: string;
  isSystem?: boolean;
  /** DD/MM/YYYY HH:mm */
  timestamp: string;
  detail?: string;
}

const BADGE_CLASS: Record<CardAuditBadge, string> = {
  CREATED: "bg-gray-100 text-gray-600 border-gray-200",
  ASSIGNED: "bg-blue-50 text-blue-700 border-blue-200",
  HANDOVER_CONFIRMED: "bg-orange-50 text-orange-700 border-orange-200",
  RECEIVED: "bg-blue-50 text-blue-700 border-blue-200",
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REASSIGNED: "bg-orange-50 text-orange-700 border-orange-200",
};

const DOT_CLASS: Record<CardAuditBadge, string> = {
  CREATED: "bg-gray-400",
  ASSIGNED: "bg-blue-500",
  HANDOVER_CONFIRMED: "bg-amber-500",
  RECEIVED: "bg-blue-500",
  ACTIVE: "bg-emerald-500",
  REASSIGNED: "bg-amber-500",
};

const VISIBLE_COUNT = 5;

/** Sort helper for "DD/MM/YYYY HH:mm" strings (newest first). */
function toSortKey(ts: string): number {
  const m = ts.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
  if (!m) return 0;
  return new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5]).getTime();
}

export function buildCardAuditEvents(opts: {
  cardType?: string;
  last4?: string;
  cardholderName?: string;
}): CardAuditEvent[] {
  const last4 = (opts.last4 || "1234").slice(-4);
  const holder = opts.cardholderName || "Somchai Naidee";
  const createdTitle = opts.cardType === "Fleet Card" ? "Fleet Card Created" : "Card Created";
  return [
    {
      id: "ca-1",
      title: createdTitle,
      badge: "CREATED",
      performer: "Marry Lee",
      timestamp: "09/09/2026 16:25",
      detail: `Card **** **** **** ${last4} created.`,
    },
    {
      id: "ca-2",
      title: "Cardholder Assigned",
      badge: "ASSIGNED",
      performer: "Marry Lee",
      timestamp: "09/09/2026 16:40",
      detail: `Assigned to ${holder} for Store 010001 บมจ.ซีพี แอ็กซ์ตร้า สาขาลาดพร้าว`,
    },
    {
      id: "ca-3",
      title: "Physical Card Handover Confirmed",
      badge: "HANDOVER_CONFIRMED",
      performer: "Marry Lee",
      timestamp: "10/09/2026 10:45",
    },
    {
      id: "ca-4",
      title: "Card Receipt Confirmed",
      badge: "RECEIVED",
      performer: `${holder} (Cardholder)`,
      timestamp: "10/09/2026 11:20",
      detail: "Confirmed via email link.",
    },
    {
      id: "ca-5",
      title: "Card Status Changed to Active",
      badge: "ACTIVE",
      performer: "System",
      isSystem: true,
      timestamp: "10/09/2026 11:20",
      detail: "Status changed from Received to Active.",
    },
    {
      id: "ca-6",
      title: "Cardholder Reassigned",
      badge: "REASSIGNED",
      performer: "Marry Lee",
      timestamp: "10/09/2026 11:35",
      detail: `Cardholder changed from Anan Chaiyasit to ${holder}.`,
    },
  ];
}

export default function CardAuditTrail({ events }: { events: CardAuditEvent[] }) {
  const [expanded, setExpanded] = useState(false);
  const sorted = [...events].sort((a, b) => toSortKey(b.timestamp) - toSortKey(a.timestamp));
  const hasMore = sorted.length > VISIBLE_COUNT;
  const visible = expanded ? sorted : sorted.slice(0, VISIBLE_COUNT);

  return (
    <Card className="rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-[15px] font-bold text-foreground">Audit Trail</h2>
        <Badge variant="secondary" className="text-[11px] px-2 py-0 h-5">
          {sorted.length} events
        </Badge>
        <div className="flex-1 border-t border-border" />
      </div>

      <div className="relative pl-7">
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
        <div className="space-y-5">
          {visible.map((evt, i) => {
            const isLatest = i === 0 && !expanded ? true : i === 0;
            return (
              <div
                key={evt.id}
                className={cn(
                  "relative",
                  isLatest && "border-l-2 border-amber-400 -ml-[1px] pl-5 py-2 bg-amber-50/40 rounded-r-lg"
                )}
              >
                <div
                  className={cn(
                    "absolute top-1.5 h-3 w-3 rounded-full border-2 border-background",
                    DOT_CLASS[evt.badge],
                    isLatest ? "left-[-21px]" : "-left-7"
                  )}
                />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] font-medium text-foreground">{evt.title}</span>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] px-1.5 py-0 h-[18px] font-mono", BADGE_CLASS[evt.badge])}
                    >
                      {evt.badge}
                    </Badge>
                  </div>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{evt.performer}</span>
                    <span>·</span>
                    <span>{evt.timestamp}</span>
                  </p>
                  {evt.detail && (
                    <p className="text-[13px] italic text-muted-foreground pl-0.5">{evt.detail}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {hasMore && (
          <button
            type="button"
            onClick={() => setExpanded((p) => !p)}
            className="flex items-center gap-1 mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? (
              <>Show less <ChevronUp className="h-3 w-3" /></>
            ) : (
              <>See all {sorted.length} events <ChevronDown className="h-3 w-3" /></>
            )}
          </button>
        )}
      </div>
    </Card>
  );
}
