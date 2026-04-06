import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  MccPolicyMaster,
  MccPolicyQueryParams,
  PaginatedResponse,
  PolicyType,
} from "@/lib/corporate-card-types";

function mapPolicy(raw: Record<string, unknown>): MccPolicyMaster {
  const et = raw.expenseType as Record<string, unknown> | null;
  const st = raw.expenseSubtype as Record<string, unknown> | null;
  return {
    id: raw.id as string,
    mcc_code: (raw.mccCode as string | null) ?? null,
    description: raw.description as string,
    mcc_code_description: (raw.mccCodeDescription as string | null) ?? null,
    policy_category: (raw.policyCategory as string) ?? 'Allowed',
    policy_type: raw.policyType as PolicyType,
    threshold_amount: raw.thresholdAmount != null ? parseFloat(raw.thresholdAmount as string) : null,
    currency: raw.currency as string,
    active_flag: raw.activeFlag as boolean,
    expense_type_id: (raw.expenseTypeId as string | null) ?? null,
    sub_expense_type_id: (raw.subExpenseTypeId as string | null) ?? null,
    expense_type_name: (et?.expenseType as string | null) ?? null,
    sub_expense_type_name: (st?.subExpenseType as string | null) ?? null,
    created_at: raw.createdAt as string,
    updated_at: raw.updatedAt as string,
  };
}

function buildQueryString(params: MccPolicyQueryParams): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "all") {
      qs.set(key, String(value));
    }
  });
  return qs.toString();
}

export function useMccPolicies(params: MccPolicyQueryParams) {
  return useQuery<PaginatedResponse<MccPolicyMaster>>({
    queryKey: ["mcc-policies", params],
    queryFn: async () => {
      const qs = buildQueryString(params);
      const json = await apiClient.get(`/mcc-policies?${qs}`);
      const items = Array.isArray(json.items) ? json.items : [];
      const meta = json.meta ?? {
        total: items.length,
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        totalPages: 1,
      };
      return {
        data: items.map((r: unknown) => mapPolicy(r as Record<string, unknown>)),
        meta,
      };
    },
    placeholderData: keepPreviousData,
  });
}

interface CreateMccPolicyPayload {
  mccCode?: string | null;
  description: string;
  mccCodeDescription?: string | null;
  policyCategory?: string;
  policyType: PolicyType;
  thresholdAmount?: number | null;
  currency: string;
  activeFlag: boolean;
  expenseTypeId?: string | null;
  subExpenseTypeId?: string | null;
}

export function useCreateMccPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMccPolicyPayload) =>
      apiClient.post("/mcc-policies", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcc-policies"] });
    },
  });
}

interface UpdateMccPolicyPayload {
  id: string;
  data: {
    mccCode?: string | null;
    description?: string;
    mccCodeDescription?: string | null;
    policyCategory?: string;
    policyType?: PolicyType;
    thresholdAmount?: number | null;
    activeFlag?: boolean;
    expenseTypeId?: string | null;
    subExpenseTypeId?: string | null;
  };
}

export function useUpdateMccPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: UpdateMccPolicyPayload) =>
      apiClient.patch(`/mcc-policies/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcc-policies"] });
    },
  });
}

export function useAllMccPolicies(options?: { enabled?: boolean }) {
  return useQuery<MccPolicyMaster[]>({
    queryKey: ["mcc-policies", "all"],
    queryFn: async () => {
      const json = await apiClient.get("/mcc-policies?limit=10000");
      const items = Array.isArray(json.items) ? json.items : [];
      return items.map((r: unknown) => mapPolicy(r as Record<string, unknown>));
    },
    enabled: options?.enabled ?? true,
  });
}

export function useDeleteMccPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/mcc-policies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcc-policies"] });
    },
  });
}

interface ImportMccPolicyPayload {
  mccCode: string;
  description: string;
  mccCodeDescription?: string;
  policyType: PolicyType;
  thresholdAmount?: number | null;
  activeFlag: boolean;
  expenseTypeId: string;
  subExpenseTypeId: string;
}

export function useImportMccPolicies() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rows: ImportMccPolicyPayload[]) =>
      apiClient.post("/mcc-policies/import", rows),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcc-policies"] });
    },
  });
}

interface BulkActionPayload {
  action: "delete" | "activate" | "deactivate";
  ids?: string[];
  selectAll?: boolean;
  filters?: Record<string, string>;
}

export function useBulkMccPolicyAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BulkActionPayload) =>
      apiClient.post("/mcc-policies/bulk", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcc-policies"] });
    },
  });
}
