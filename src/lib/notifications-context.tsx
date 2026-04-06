import { createContext, useContext, useCallback, type ReactNode } from "react";
import { useAuth } from "./auth-context";
import { useRoles } from "./role-context";
import {
  useNotificationsList,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
} from "@/hooks/use-notifications";

export type NotificationType = "APPROVAL" | "REJECTION" | "NEED_INFO" | "SYSTEM" | "REMINDER" | "PENDING_APPROVAL";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  target_transaction_id: string;
  read_flag: boolean;
  created_at: string;
  user_id: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { roles } = useRoles();
  const userId = user?.id;
  const activeRole = roles[0];

  const { data: notifications = [] } = useNotificationsList(userId, activeRole);
  const { data: unreadCount = 0 } = useUnreadCount(userId, activeRole);
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  const markAsRead = useCallback(
    (id: string) => markAsReadMutation.mutate(id),
    [markAsReadMutation],
  );

  const markAllAsRead = useCallback(
    () => {
      if (userId) markAllAsReadMutation.mutate(userId);
    },
    [markAllAsReadMutation, userId],
  );

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
