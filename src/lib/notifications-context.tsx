import { createContext, useContext, type ReactNode } from "react";

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

export interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

export const NotificationsContext = createContext<NotificationsContextType | null>(null);

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
