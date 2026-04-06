import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface GlAccountRow {
  id: string;
  expenseTypeId: string;
  expenseSubtypeId: string | null;
  accountCode: string;
  accountName: string;
  active: boolean;
  updatedAt: string;
  expenseType: { id: string; expenseType: string; subtypes: { id: string; subExpenseType: string }[] };
  expenseSubtype: { id: string; subExpenseType: string } | null;
}

export interface GlAccountQueryParams {
  search?: string;
  active?: string;
  page?: number;
  limit?: number;
}

interface PaginatedResponse {
  data: GlAccountRow[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

function buildQueryString(params: GlAccountQueryParams): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "all") {
      qs.set(key, String(value));
    }
  });
  return qs.toString();
}

export function useGlAccounts(params: GlAccountQueryParams) {
  return useQuery<PaginatedResponse>({
    queryKey: ["gl-accounts", params],
    queryFn: async () => {
      const qs = buildQueryString(params);
      const json = await apiClient.get(`/gl-accounts?${qs}`);
      const items = Array.isArray(json.items) ? json.items : [];
      const meta = json.meta ?? {
        total: items.length,
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        totalPages: 1,
      };
      return { data: items, meta };
    },
    placeholderData: keepPreviousData,
  });
}

export function useAllGlAccounts() {
  return useQuery<GlAccountRow[]>({
    queryKey: ["gl-accounts", "all"],
    queryFn: async () => {
      const json = await apiClient.get("/gl-accounts?limit=10000");
      return Array.isArray(json.items) ? json.items : [];
    },
  });
}

interface CreateGlAccountPayload {
  expenseTypeId: string;
  expenseSubtypeId: string;
  accountCode: string;
  accountName: string;
  active?: boolean;
}

export function useCreateGlAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGlAccountPayload) =>
      apiClient.post("/gl-accounts", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gl-accounts"] });
    },
  });
}

interface UpdateGlAccountPayload {
  id: string;
  data: {
    expenseTypeId?: string;
    expenseSubtypeId?: string;
    accountCode?: string;
    accountName?: string;
    active?: boolean;
  };
}

export function useUpdateGlAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: UpdateGlAccountPayload) =>
      apiClient.patch(`/gl-accounts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gl-accounts"] });
    },
  });
}

export function useDeleteGlAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/gl-accounts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gl-accounts"] });
    },
  });
}

export function useImportGlAccounts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rows: CreateGlAccountPayload[]) =>
      apiClient.post("/gl-accounts/import", rows),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gl-accounts"] });
    },
  });
}
