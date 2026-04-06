import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface OcrConfigData {
  id: string;
  amountToleranceThb: number;
  amountTolerancePct: number;
  dateToleranceDays: number;
  updatedBy: string | null;
  updatedAt: string;
}

export function useOcrConfig() {
  return useQuery<OcrConfigData>({
    queryKey: ["ocr-config"],
    queryFn: () => apiClient.get("/ocr-config"),
  });
}

interface UpdateOcrConfigPayload {
  amountToleranceThb?: number;
  amountTolerancePct?: number;
  dateToleranceDays?: number;
  updatedBy?: string;
}

export function useUpdateOcrConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateOcrConfigPayload) =>
      apiClient.patch("/ocr-config", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ocr-config"] });
    },
  });
}
