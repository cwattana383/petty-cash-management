import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface DocumentTypeRow {
  id: string;
  documentName: string;
  isSupportDocument: boolean;
  ocrVerification: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentTypeQueryParams {
  search?: string;
  active?: string;
  page?: number;
  limit?: number;
}

interface PaginatedResponse {
  data: DocumentTypeRow[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

function buildQueryString(params: DocumentTypeQueryParams): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "all") {
      qs.set(key, String(value));
    }
  });
  return qs.toString();
}

export function useDocumentTypes(params: DocumentTypeQueryParams) {
  return useQuery<PaginatedResponse>({
    queryKey: ["document-types", params],
    queryFn: async () => {
      const json = await apiClient.get(`/document-types?${buildQueryString(params)}`);
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

interface CreateDocumentTypePayload {
  documentName: string;
  isSupportDocument?: boolean;
  ocrVerification?: boolean;
  active?: boolean;
}

export function useCreateDocumentType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDocumentTypePayload) =>
      apiClient.post("/document-types", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-types"] });
    },
  });
}

interface BulkActionPayload {
  action: "delete" | "activate" | "deactivate";
  ids?: string[];
  selectAll?: boolean;
  filters?: Record<string, string>;
}

export function useBulkDocumentTypeAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BulkActionPayload) =>
      apiClient.post("/document-types/bulk", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-types"] });
    },
  });
}

interface UpdateDocumentTypePayload {
  id: string;
  data: {
    documentName?: string;
    isSupportDocument?: boolean;
    ocrVerification?: boolean;
    active?: boolean;
  };
}

export function useUpdateDocumentType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: UpdateDocumentTypePayload) =>
      apiClient.patch(`/document-types/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-types"] });
    },
  });
}

export function useDeleteDocumentType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/document-types/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-types"] });
    },
  });
}

export function useAllDocumentTypes(options?: { enabled?: boolean }) {
  return useQuery<DocumentTypeRow[]>({
    queryKey: ["document-types", "all"],
    queryFn: async () => {
      const json = await apiClient.get("/document-types?limit=10000&active=true");
      return Array.isArray(json.items) ? json.items : [];
    },
    enabled: options?.enabled ?? true,
  });
}

export function useAllDocumentTypesForImport(options?: { enabled?: boolean }) {
  return useQuery<DocumentTypeRow[]>({
    queryKey: ["document-types", "all-for-import"],
    queryFn: async () => {
      const json = await apiClient.get("/document-types?limit=10000");
      return Array.isArray(json.items) ? json.items : [];
    },
    enabled: options?.enabled ?? true,
  });
}

interface ImportDocumentTypePayload {
  documentName: string;
  isSupportDocument?: boolean;
  ocrVerification?: boolean;
  active?: boolean;
}

export function useImportDocumentTypes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rows: ImportDocumentTypePayload[]) =>
      apiClient.post("/document-types/import", rows),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-types"] });
    },
  });
}
