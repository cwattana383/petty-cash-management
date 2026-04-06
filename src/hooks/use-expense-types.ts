import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface ExpenseTypeSubtypeRow {
  id: string;
  subExpenseType: string;
  accountNameEn: string;
  accountCode: string;
  active: boolean;
  updatedAt: string;
  documentTypes: {
    documentType: {
      id: string;
      documentName: string;
      isSupportDocument: boolean;
    };
  }[];
}

export interface ExpenseTypeRow {
  id: string;
  expenseType: string;
  active: boolean;
  subtypes: ExpenseTypeSubtypeRow[];
  updatedAt: string;
}

export interface ExpenseTypeQueryParams {
  search?: string;
  active?: string;
  page?: number;
  limit?: number;
}

interface PaginatedResponse {
  data: ExpenseTypeRow[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

function buildQueryString(params: ExpenseTypeQueryParams): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "all") {
      qs.set(key, String(value));
    }
  });
  return qs.toString();
}

export function useExpenseTypes(params: ExpenseTypeQueryParams) {
  return useQuery<PaginatedResponse>({
    queryKey: ["expense-types", params],
    queryFn: async () => {
      const json = await apiClient.get(`/expense-types?${buildQueryString(params)}`);
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

interface CreateSubtypePayload {
  subExpenseType: string;
  accountNameEn: string;
  accountCode: string;
  active?: boolean;
  documentTypeIds?: string[];
}

interface UpdateSubtypePayload {
  id?: string;
  subExpenseType?: string;
  accountNameEn?: string;
  accountCode?: string;
  active?: boolean;
  documentTypeIds?: string[];
}

interface CreateExpenseTypePayload {
  expenseType: string;
  active?: boolean;
  subtypes?: CreateSubtypePayload[];
}

export function useCreateExpenseType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateExpenseTypePayload) =>
      apiClient.post("/expense-types", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-types"] });
    },
  });
}

interface UpdateExpenseTypePayload {
  id: string;
  data: {
    expenseType?: string;
    active?: boolean;
    subtypes?: UpdateSubtypePayload[];
    removeSubtypeIds?: string[];
  };
}

export function useUpdateExpenseType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: UpdateExpenseTypePayload) =>
      apiClient.patch(`/expense-types/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-types"] });
    },
  });
}

export function useDeleteExpenseType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/expense-types/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-types"] });
    },
  });
}

export function useExpenseType(id: string | undefined) {
  return useQuery<ExpenseTypeRow>({
    queryKey: ["expense-types", "detail", id],
    queryFn: async () => {
      const json = await apiClient.get(`/expense-types/${id}`);
      return json;
    },
    enabled: !!id,
  });
}

export function useAllExpenseTypes(options?: { enabled?: boolean }) {
  return useQuery<ExpenseTypeRow[]>({
    queryKey: ["expense-types", "all"],
    queryFn: async () => {
      const json = await apiClient.get("/expense-types?limit=10000");
      return Array.isArray(json.items) ? json.items : [];
    },
    enabled: options?.enabled ?? true,
  });
}

export function useImportExpenseTypes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rows: CreateExpenseTypePayload[]) =>
      apiClient.post("/expense-types/import", rows),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-types"] });
    },
  });
}

interface BulkActionPayload {
  action: "delete" | "activate" | "deactivate";
  ids?: string[];
  selectAll?: boolean;
  filters?: Record<string, string>;
}

export function useBulkExpenseTypeAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BulkActionPayload) =>
      apiClient.post("/expense-types/bulk", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-types"] });
    },
  });
}
