import { useCallback, type ReactNode } from "react";
import { useAuth } from "./auth-context";
import { useRoles } from "./role-context";
import {
  useNotificationsList,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
} from "@/hooks/use-notifications";
import { NotificationsContext } from "./notifications-context";

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
