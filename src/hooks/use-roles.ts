import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface Permission {
  id: string;
  code: string;
  name: string;
  module: string;
  description: string;
}

export interface RoleOverview {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  isSystem: boolean;
  permissions: string[];
  userCount: number;
}

export interface RoleDetail {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
  permissions: Permission[];
  userCount: number;
}

export interface RoleQueryParams {
  search?: string;
  page?: number;
  limit?: number;
}

interface PaginatedRoles {
  items: RoleDetail[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

function buildQueryString(params: RoleQueryParams): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      qs.set(key, String(value));
    }
  });
  return qs.toString();
}

export function useRoles(params: RoleQueryParams) {
  return useQuery<PaginatedRoles>({
    queryKey: ["roles", params],
    queryFn: async () => {
      const qs = buildQueryString(params);
      const json = await apiClient.get(`/admin/roles?${qs}`);
      return {
        items: json.items ?? [],
        meta: json.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1 },
      };
    },
    placeholderData: keepPreviousData,
  });
}

export function useRolesOverview() {
  return useQuery<RoleOverview[]>({
    queryKey: ["roles-overview"],
    queryFn: () => apiClient.get("/admin/roles/stats/overview"),
  });
}

export function useAllPermissions() {
  return useQuery<Permission[]>({
    queryKey: ["permissions"],
    queryFn: () => apiClient.get("/admin/roles/permissions/all"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRole(id: string | null) {
  return useQuery<RoleDetail>({
    queryKey: ["role", id],
    queryFn: () => apiClient.get(`/admin/roles/${id}`),
    enabled: !!id,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; permissionIds?: string[] }) =>
      apiClient.post("/admin/roles", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["roles-overview"] });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string; isActive?: boolean; permissionIds?: string[] } }) =>
      apiClient.patch(`/admin/roles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["roles-overview"] });
      queryClient.invalidateQueries({ queryKey: ["role"] });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["roles-overview"] });
    },
  });
}
