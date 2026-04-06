import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, BellOff, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNotifications, type NotificationType, type Notification } from "@/lib/notifications-context";
import { useUnmatchedByBatch } from "@/hooks/use-notifications";

const borderColorMap: Record<NotificationType, string> = {
  APPROVAL: "border-l-green-500",
  REJECTION: "border-l-red-500",
  NEED_INFO: "border-l-yellow-500",
  SYSTEM: "border-l-gray-400",
  REMINDER: "border-l-blue-500",
  PENDING_APPROVAL: "border-l-purple-500",
};

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} mins ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const typeLabel: Record<NotificationType, string> = {
  APPROVAL: "Approval",
  REJECTION: "Rejection",
  NEED_INFO: "Need Info",
  SYSTEM: "System",
  REMINDER: "Reminder",
  PENDING_APPROVAL: "Pending Approval",
};

const typeBadgeColor: Record<NotificationType, string> = {
  APPROVAL: "bg-green-100 text-green-700",
  REJECTION: "bg-red-100 text-red-700",
  NEED_INFO: "bg-yellow-100 text-yellow-700",
  SYSTEM: "bg-gray-100 text-gray-600",
  REMINDER: "bg-blue-100 text-blue-700",
  PENDING_APPROVAL: "bg-purple-100 text-purple-700",
};

function NotificationDetailDialog({
  notification,
  batchId,
  onClose,
  onNavigate,
}: {
  notification: Notification | null;
  batchId: string | null;
  onClose: () => void;
  onNavigate: (path: string) => void;
}) {
  const { data: txnIds = [], isLoading } = useUnmatchedByBatch(batchId);

  return (
    <Dialog open={!!notification} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">{notification?.title}</DialogTitle>
        </DialogHeader>
        {notification && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeBadgeColor[notification.type]}`}>
                {typeLabel[notification.type]}
              </span>
              <span className="text-xs text-muted-foreground">{relativeTime(notification.created_at)}</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{notification.message}</p>

            {batchId && (
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">
                  Unmatched Transaction IDs
                  {!isLoading && txnIds.length > 0 && (
                    <span className="ml-1 text-muted-foreground font-normal">({txnIds.length})</span>
                  )}
                </p>
                {isLoading ? (
                  <p className="text-xs text-muted-foreground">Loading...</p>
                ) : txnIds.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No transactions found for this batch.</p>
                ) : (
                  <ScrollArea className="h-48 rounded border border-border bg-muted/30 p-2">
                    <div className="space-y-1">
                      {txnIds.map((id) => (
                        <p key={id} className="text-xs font-mono text-foreground">{id}</p>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            )}

            {notification.target_transaction_id && (
              <Button className="w-full" onClick={() => onNavigate(`/claims/${notification.target_transaction_id}`)}>
                View Transaction
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Notification | null>(null);
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const handleNotificationClick = (notif: Notification) => {
    markAsRead(notif.id);
    setOpen(false);
    setSelected(notif);
  };

  const sorted = [...notifications].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Extract batchId from system notification messages like "N transaction(s) in batch <uuid> could not be matched..."
  const selectedBatchId = selected?.type === "SYSTEM"
    ? (selected.message.match(/batch\s+([0-9a-f-]{36})/i)?.[1] ?? null)
    : null;

  return (
    <>
      <NotificationDetailDialog
        notification={selected}
        batchId={selectedBatchId}
        onClose={() => setSelected(null)}
        onNavigate={(path) => { setSelected(null); navigate(path); }}
      />
      <div className="relative" ref={panelRef}>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => setOpen((p) => !p)}
          aria-label="Notifications"
        >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold px-1"
            aria-label={`${unreadCount} unread notifications`}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[360px] bg-popover border border-border rounded-lg shadow-lg z-50 flex flex-col" style={{ maxHeight: "80vh" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 text-muted-foreground hover:text-foreground"
                onClick={markAllAsRead}
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                Mark all as read
              </Button>
            )}
          </div>

          {/* Body */}
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BellOff className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="font-medium text-sm text-foreground">You're all caught up!</p>
              <p className="text-xs text-muted-foreground">No new notifications</p>
            </div>
          ) : (
            <ScrollArea className="flex-1 min-h-0">
              <div className="divide-y divide-border">
                {sorted.map((notif) => (
                  <button
                    key={notif.id}
                    className={`w-full text-left px-4 py-3 border-l-4 ${borderColorMap[notif.type]} hover:bg-accent/50 transition-colors cursor-pointer ${
                      !notif.read_flag ? "bg-muted/50" : ""
                    }`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notif.read_flag ? "font-semibold" : "font-normal"} text-foreground truncate`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {notif.message}
                        </p>
                        <p className="text-[11px] text-muted-foreground/70 mt-1">
                          {relativeTime(notif.created_at)}
                        </p>
                      </div>
                      {!notif.read_flag && (
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
    </>
  );
}
