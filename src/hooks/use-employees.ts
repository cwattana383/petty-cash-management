import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse } from "@/lib/corporate-card-types";

export interface EmployeeQueryParams {
  search?: string;
  role?: string;
  department?: string;
  active?: string;
  page?: number;
  limit?: number;
}

export interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  roles: string[];
  branch: string;
  department: string;
  active: boolean;
}

function buildQueryString(params: EmployeeQueryParams): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "all") {
      qs.set(key, String(value));
    }
  });
  return qs.toString();
}

export interface CreateApprovalLevelData {
  approverId: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status?: boolean;
}

export interface CreateEmployeeData {
  employeeCode: string;
  name: string;
  email: string;
  branch: string;
  department: string;
  telephone?: string;
  active?: boolean;
  creditCardLast4?: string;
  cardHolderName?: string;
  storeHeadOffice?: string;
  division?: string;
  roleIds?: string[];
  approvalLevels?: CreateApprovalLevelData[];
}

export function useEmployees(params: EmployeeQueryParams) {
  return useQuery<PaginatedResponse<Employee>>({
    queryKey: ["employees", params],
    queryFn: async () => {
      const qs = buildQueryString(params);
      const json = await apiClient.get(`/admin/employees?${qs}`);
      const items = Array.isArray(json.items) ? json.items : [];
      const meta = json.meta ?? {
        total: items.length,
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        totalPages: 1,
      };
      return {
        data: items,
        meta,
      };
    },
    placeholderData: keepPreviousData,
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ["employee", id],
    queryFn: () => apiClient.get(`/users/${id}`),
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEmployeeData) => apiClient.post("/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateEmployeeData }) =>
      apiClient.patch(`/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee"] });
    },
  });
}

export interface CreateCreditCardData {
  employeeId: string;
  cardType: string;
  bank: string;
  last4Digit: string;
  cardHolderName: string;
  creditLimit: number;
  currency?: string;
  statementCycleDay: number;
  effectiveFrom: string;
  effectiveTo: string;
  status?: string;
  autoReconcile?: boolean;
  requireReceiptUpload?: boolean;
  assignedToUserId: string;
}

export function useCreateCreditCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCreditCardData) =>
      apiClient.post("/credit-cards", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee"] });
    },
  });
}

export function useUpdateCreditCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { last4Digit: string; cardHolderName: string } }) =>
      apiClient.patch(`/credit-cards/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee"] });
    },
  });
}

export interface InviteResult {
  status: "invited" | "already_exists";
  entraObjectId: string;
  emailSent: boolean;
}

export function useInviteEmployee() {
  return useMutation({
    mutationFn: (email: string) =>
      apiClient.post("/users/invite", { email }) as Promise<InviteResult>,
  });
}

export function useToggleEmployeeActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      apiClient.patch(`/users/${id}`, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export function useApprovers() {
  return useQuery<{ id: string; name: string; employeeCode: string }[]>({
    queryKey: ["users", "approvers"],
    queryFn: async () => {
      const data = await apiClient.get("/users?role=Approver&active=true");
      return Array.isArray(data) ? data : [];
    },
  });
}

// ── Bulk CSV Import ──

export interface ImportEmployeeRow {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  telephone?: string;
  branchHeadOffice?: string;
  division?: string;
  department: string;
  branch: string;
  role: string;
  active: boolean;
  creditCardLast4?: string;
  cardHolderName?: string;
}

export function useAllEmployeesForImport(options?: { enabled?: boolean }) {
  return useQuery<Employee[]>({
    queryKey: ["employees", "all-for-import"],
    queryFn: async () => {
      const data = await apiClient.get("/users");
      return Array.isArray(data) ? data : [];
    },
    enabled: options?.enabled ?? true,
  });
}

export function useImportEmployees() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rows: ImportEmployeeRow[]) =>
      apiClient.postRaw("/users/import", rows),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}

export async function checkEntraBatch(emails: string[]): Promise<{ found: string[]; notFound: string[] }> {
  return apiClient.post("/users/check-entra", { emails }) as Promise<{ found: string[]; notFound: string[] }>;
}

interface BulkActionPayload {
  action: "delete" | "activate" | "deactivate";
  ids?: string[];
  selectAll?: boolean;
  filters?: Record<string, string>;
}

export function useBulkEmployeeAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BulkActionPayload) =>
      apiClient.post("/users/bulk", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
}
