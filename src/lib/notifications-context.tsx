import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

export type NotificationType = "APPROVAL" | "REJECTION" | "NEED_INFO" | "SYSTEM" | "REMINDER";

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

const now = new Date();
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60000).toISOString();

const initialNotifications: Notification[] = [
  { id: "n1", title: "Claim Approved", message: "Your claim EC-2025-001 for Business Travel - Bangkok to Chiang Mai has been approved by Somying Kaewsai.", type: "APPROVAL", target_transaction_id: "c1", read_flag: false, created_at: minutesAgo(5), user_id: "u1" },
  { id: "n2", title: "Claim Rejected", message: "Your claim EC-2025-004 for Taxi to Airport has been rejected. Please review the comments.", type: "REJECTION", target_transaction_id: "c4", read_flag: false, created_at: minutesAgo(30), user_id: "u1" },
  { id: "n3", title: "Additional Info Required", message: "Approver requested more information for claim EC-2025-005 - Conference Registration. Please provide receipts.", type: "NEED_INFO", target_transaction_id: "c5", read_flag: false, created_at: minutesAgo(120), user_id: "u1" },
  { id: "n4", title: "System Maintenance", message: "Scheduled maintenance on Feb 15, 2025. The system will be unavailable from 00:00–02:00.", type: "SYSTEM", target_transaction_id: "", read_flag: true, created_at: minutesAgo(1440), user_id: "u1" },
  { id: "n5", title: "Pending Submission Reminder", message: "You have 2 draft claims pending submission. Please submit before month-end closing.", type: "REMINDER", target_transaction_id: "c3", read_flag: false, created_at: minutesAgo(60), user_id: "u1" },
  { id: "n6", title: "Claim Approved", message: "Your claim EC-2025-002 for Client Meeting Lunch is now pending approval from your manager.", type: "APPROVAL", target_transaction_id: "c2", read_flag: true, created_at: minutesAgo(4320), user_id: "u1" },
  { id: "n7", title: "Policy Update", message: "Travel expense policy has been updated. Maximum daily meal allowance is now ฿500.", type: "SYSTEM", target_transaction_id: "", read_flag: true, created_at: minutesAgo(10080), user_id: "u1" },
];

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notif: Omit<Notification, "id" | "read_flag" | "created_at" | "user_id">) => void;
}

const NotificationsContext = createContext<NotificationsContextType | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const unreadCount = notifications.filter((n) => !n.read_flag).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_flag: true } : n)));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read_flag: true })));
  }, []);

  const addNotification = useCallback((notif: Omit<Notification, "id" | "read_flag" | "created_at" | "user_id">) => {
    const newNotif: Notification = {
      ...notif,
      id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      read_flag: false,
      created_at: new Date().toISOString(),
      user_id: "u1",
    };
    setNotifications((prev) => [newNotif, ...prev]);
  }, []);

  // Auto refresh unread count every 60 seconds (future: replace with websocket)
  useEffect(() => {
    const interval = setInterval(() => {
      // In a real app, this would fetch from the server
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, addNotification }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
