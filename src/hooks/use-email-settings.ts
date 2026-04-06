import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface NotificationSetting {
  id: string;
  type: "PENDING_DOCUMENTS" | "PENDING_APPROVAL";
  notificationsEnabled: boolean;
  remindersEnabled: boolean;
  initialDelayMinutes: number;
  reminderIntervalDays: number;
  createdAt: string;
  updatedAt: string;
}

export function useNotificationSettings() {
  return useQuery<NotificationSetting[]>({
    queryKey: ["notification-settings"],
    queryFn: async () => {
      const data = await apiClient.get("/email/notification-settings");
      return data as NotificationSetting[];
    },
  });
}

export function useNotificationSettingByType(type: "PENDING_DOCUMENTS" | "PENDING_APPROVAL") {
  return useQuery<NotificationSetting>({
    queryKey: ["notification-settings", type],
    queryFn: async () => {
      const data = await apiClient.get(`/email/notification-settings/${type}`);
      return data as NotificationSetting;
    },
  });
}

export function useUpdateNotificationSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      type,
      ...dto
    }: {
      type: string;
      notificationsEnabled?: boolean;
      remindersEnabled?: boolean;
      initialDelayMinutes?: number;
      reminderIntervalDays?: number;
    }) => {
      return apiClient.patch(`/email/notification-settings/${type}`, dto);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-settings"] });
    },
  });
}
