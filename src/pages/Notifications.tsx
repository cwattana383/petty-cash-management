import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BellOff, AlertOctagon, CheckCircle2, MessageSquareWarning, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useNotifications } from "@/lib/notifications-context";
import type { Notification, NotificationType } from "@/lib/notifications-context";
import { cn } from "@/lib/utils";

type TypeFilter = "all" | "auto-reject" | "approval" | "system";
type ReadFilter = "all" | "unread" | "read";

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function categoryOf(t: NotificationType): TypeFilter {
  if (t === "REJECTION") return "auto-reject";
  if (t === "APPROVAL" || t === "PENDING_APPROVAL" || t === "NEED_INFO") return "approval";
  return "system";
}

function iconFor(t: NotificationType) {
  if (t === "REJECTION") return { Icon: AlertOctagon, bg: "bg-red-100", color: "text-red-600" };
  if (t === "APPROVAL") return { Icon: CheckCircle2, bg: "bg-emerald-100", color: "text-emerald-600" };
  if (t === "NEED_INFO") return { Icon: MessageSquareWarning, bg: "bg-indigo-100", color: "text-indigo-600" };
  if (t === "PENDING_APPROVAL") return { Icon: Info, bg: "bg-amber-100", color: "text-amber-600" };
  return { Icon: Info, bg: "bg-slate-100", color: "text-slate-600" };
}

function rejectionReasonFor(n: Notification): string | null {
  if (n.type !== "REJECTION") return null;
  if (n.message.includes("3 calendar days") || n.message.includes("Auto-rejected")) return "AGING_TIMEOUT";
  return null;
}

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, markAsRead } = useNotifications();
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const filtered = useMemo(() => {
    return [...notifications]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .filter((n) => {
        if (readFilter === "unread" && n.read_flag) return false;
        if (readFilter === "read" && !n.read_flag) return false;
        if (typeFilter !== "all" && categoryOf(n.type) !== typeFilter) return false;
        return true;
      });
  }, [notifications, readFilter, typeFilter]);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
        <p className="text-sm text-muted-foreground">All alerts and updates about your expense transactions.</p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-md border border-border bg-background p-0.5">
          {(["all", "unread", "read"] as ReadFilter[]).map((r) => (
            <button
              key={r}
              onClick={() => setReadFilter(r)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded capitalize transition-colors",
                readFilter === r
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r}
            </button>
          ))}
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          className="text-xs h-8 px-3 rounded-md border border-border bg-background"
        >
          <option value="all">All types</option>
          <option value="auto-reject">Auto-Reject</option>
          <option value="approval">Approval</option>
          <option value="system">System</option>
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BellOff className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="font-medium text-sm text-foreground">No notifications match your filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const { Icon, bg, color } = iconFor(n.type);
            const reason = rejectionReasonFor(n);
            const txnId = n.target_transaction_id;
            return (
              <Card key={n.id} className={cn("transition-colors", !n.read_flag && "bg-muted/30")}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", bg)}>
                      <Icon className={cn("h-5 w-5", color)} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <p className={cn("text-sm text-foreground", !n.read_flag ? "font-semibold" : "font-medium")}>
                          {n.title}
                        </p>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-muted-foreground">{relativeTime(n.created_at)}</span>
                          {!n.read_flag && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-pre-line mt-1">{n.message}</p>

                      <div className="flex flex-wrap items-center gap-2 mt-2.5">
                        {txnId && (
                          <Badge variant="outline" className="font-mono text-[10px]">{txnId}</Badge>
                        )}
                        {reason && (
                          <Badge className="bg-red-100 text-red-800 text-[10px]">{reason}</Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-2.5">
                        {txnId && (
                          <button
                            onClick={() => {
                              if (!n.read_flag) markAsRead(n.id);
                              navigate(`/claims/${txnId}`);
                            }}
                            className="text-xs text-primary hover:underline"
                          >
                            View transaction
                          </button>
                        )}
                        {!n.read_flag && (
                          <button
                            onClick={() => markAsRead(n.id)}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
