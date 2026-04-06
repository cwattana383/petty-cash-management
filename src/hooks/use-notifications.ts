import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Notification } from "@/lib/notifications-context";

function mapNotification(raw: Record<string, unknown>): Notification {
  return {
    id: raw.id as string,
    title: raw.title as string,
    message: raw.message as string,
    type: raw.type as Notification["type"],
    target_transaction_id: (raw.targetTransactionId as string) ?? "",
    read_flag: raw.readFlag as boolean,
    created_at: raw.createdAt as string,
    user_id: raw.userId as string,
  };
}

export function useNotificationsList(userId: string | undefined, activeRole?: string) {
  return useQuery<Notification[]>({
    queryKey: ["notifications", userId, activeRole],
    queryFn: async () => {
      const params = new URLSearchParams({ userId: userId! });
      if (activeRole) params.set("role", activeRole);
      const data = await apiClient.get(`/notifications?${params}`);
      const items = Array.isArray(data) ? data : [];
      return items.map((r: unknown) => mapNotification(r as Record<string, unknown>));
    },
    enabled: !!userId,
    refetchInterval: 5000,
  });
}

export function useUnreadCount(userId: string | undefined, activeRole?: string) {
  return useQuery<number>({
    queryKey: ["notifications-unread-count", userId, activeRole],
    queryFn: async () => {
      const params = new URLSearchParams({ userId: userId! });
      if (activeRole) params.set("role", activeRole);
      const data = await apiClient.get(`/notifications/unread-count?${params}`);
      return (data as { count: number }).count;
    },
    enabled: !!userId,
    refetchInterval: 5000,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });
}

export function useUnmatchedByBatch(batchId: string | null) {
  return useQuery<string[]>({
    queryKey: ["unmatched-transactions", batchId],
    queryFn: async () => {
      const data = await apiClient.get(
        `/transaction-matching/unmatched?batchId=${batchId}&limit=500`,
      );
      const items = Array.isArray((data as { items?: unknown[] }).items)
        ? (data as { items: Record<string, unknown>[] }).items
        : [];
      return items.map((r) => (r.bankTransactionId as string) ?? r.id as string);
    },
    enabled: !!batchId,
    staleTime: 60_000,
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => apiClient.patch("/notifications/read-all", { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });
}
