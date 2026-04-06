import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { CompanyIdentity, TaxIdEntry } from "@/components/admin/EntityTypes";
import type { PaginatedResponse } from "@/lib/corporate-card-types";

export interface EntityQueryParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

interface RawTaxIdEntry {
  id: string;
  taxId: string;
  branchType: "HEAD_OFFICE" | "BRANCH";
  branchNo: string;
  isPrimary: boolean;
}

interface RawNameAlias {
  id: string;
  alias: string;
}

interface RawAddress {
  id: string;
  language: "TH" | "EN";
  addressLine1: string;
  subdistrict: string;
  district: string;
  province: string;
  postalCode: string;
  country: string;
}

interface RawAddressAlias {
  id: string;
  alias: string;
}

interface RawEntity {
  id: string;
  companyCode: string;
  legalNameTh: string;
  legalNameEn: string;
  effectiveStartDate: string;
  effectiveEndDate: string;
  status: "ACTIVE" | "INACTIVE";
  lastUpdated: string;
  taxIds: RawTaxIdEntry[];
  nameAliases: RawNameAlias[];
  addresses: RawAddress[];
  addressAliases: RawAddressAlias[];
}

const emptyAddress = {
  addressLine1: "",
  subdistrict: "",
  district: "",
  province: "",
  postalCode: "",
  country: "Thailand",
};

function mapBranchTypeFromBackend(bt: string): "สำนักงานใหญ่" | "สาขา" {
  return bt === "HEAD_OFFICE" ? "สำนักงานใหญ่" : "สาขา";
}

function mapBranchTypeToBackend(bt: string): "HEAD_OFFICE" | "BRANCH" {
  return bt === "สำนักงานใหญ่" ? "HEAD_OFFICE" : "BRANCH";
}

function toDateString(isoOrDate: string): string {
  if (!isoOrDate) return "";
  return isoOrDate.slice(0, 10);
}

function deriveAddressByLanguage(addresses: RawAddress[], lang: "TH" | "EN") {
  const found = addresses.find((a) => a.language === lang);
  if (!found) return { ...emptyAddress };
  return {
    addressLine1: found.addressLine1 || "",
    subdistrict: found.subdistrict || "",
    district: found.district || "",
    province: found.province || "",
    postalCode: found.postalCode || "",
    country: found.country || "Thailand",
  };
}

function mapEntity(raw: RawEntity): CompanyIdentity {
  const addresses = raw.addresses ?? [];
  return {
    id: raw.id,
    companyCode: raw.companyCode,
    legalNameTh: raw.legalNameTh,
    legalNameEn: raw.legalNameEn,
    effectiveStartDate: toDateString(raw.effectiveStartDate),
    effectiveEndDate: toDateString(raw.effectiveEndDate),
    status: raw.status === "ACTIVE" ? "Active" : "Inactive",
    nameAliases: (raw.nameAliases ?? []).map((a) => ({ id: a.id, alias: a.alias })),
    addresses: addresses.map((a) => ({
      id: a.id,
      language: a.language,
      addressLine1: a.addressLine1 || "",
      subdistrict: a.subdistrict || "",
      district: a.district || "",
      province: a.province || "",
      postalCode: a.postalCode || "",
      country: a.country || "Thailand",
    })),
    addressAliases: (raw.addressAliases ?? []).map((a) => ({ id: a.id, alias: a.alias })),
    addressTh: deriveAddressByLanguage(addresses, "TH"),
    addressEn: deriveAddressByLanguage(addresses, "EN"),
    lastUpdated: toDateString(raw.lastUpdated),
    taxIds: (raw.taxIds ?? []).map((t): TaxIdEntry => ({
      id: t.id,
      taxId: t.taxId,
      branchType: mapBranchTypeFromBackend(t.branchType),
      branchNo: t.branchNo ?? "",
      isPrimary: t.isPrimary,
    })),
  };
}

function buildQueryString(params: EntityQueryParams): string {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== "all") {
      qs.set(key, String(value));
    }
  });
  return qs.toString();
}

function toCreatePayload(entity: CompanyIdentity) {
  return {
    companyCode: entity.companyCode,
    legalNameTh: entity.legalNameTh,
    legalNameEn: entity.legalNameEn || undefined,
    effectiveStartDate: entity.effectiveStartDate,
    effectiveEndDate: entity.effectiveEndDate || undefined,
    nameAliases: entity.nameAliases.map((a) => ({ alias: a.alias })),
    addresses: [
      { language: "TH" as const, ...entity.addressTh },
      { language: "EN" as const, ...entity.addressEn },
    ],
    addressAliases: entity.addressAliases.map((a) => ({ alias: a.alias })),
    taxIds: entity.taxIds.map((t) => ({
      taxId: t.taxId,
      branchType: mapBranchTypeToBackend(t.branchType),
      branchNo: t.branchNo || "00000",
      isPrimary: t.isPrimary,
    })),
  };
}

function toUpdatePayload(entity: CompanyIdentity) {
  return {
    legalNameTh: entity.legalNameTh,
    legalNameEn: entity.legalNameEn || undefined,
    effectiveStartDate: entity.effectiveStartDate,
    effectiveEndDate: entity.effectiveEndDate || undefined,
    status: entity.status === "Active" ? "ACTIVE" : "INACTIVE",
    nameAliases: entity.nameAliases.map((a) => ({ alias: a.alias })),
    addresses: [
      { language: "TH" as const, ...entity.addressTh },
      { language: "EN" as const, ...entity.addressEn },
    ],
    addressAliases: entity.addressAliases.map((a) => ({ alias: a.alias })),
    taxIds: entity.taxIds.map((t) => ({
      taxId: t.taxId,
      branchType: mapBranchTypeToBackend(t.branchType),
      branchNo: t.branchNo || "00000",
      isPrimary: t.isPrimary,
    })),
  };
}

export function useEntities(params: EntityQueryParams) {
  return useQuery<PaginatedResponse<CompanyIdentity>>({
    queryKey: ["entities", params],
    queryFn: async () => {
      const qs = buildQueryString(params);
      const json = await apiClient.get(`/admin/entities?${qs}`);
      const items = Array.isArray(json.items) ? json.items : [];
      const meta = json.meta ?? {
        total: items.length,
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        totalPages: 1,
      };
      return {
        data: items.map((r: RawEntity) => mapEntity(r)),
        meta,
      };
    },
    placeholderData: keepPreviousData,
  });
}

export function useCreateEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entity: CompanyIdentity) =>
      apiClient.post("/admin/entities", toCreatePayload(entity)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entities"] });
    },
  });
}

export function useUpdateEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, entity }: { id: string; entity: CompanyIdentity }) =>
      apiClient.patch(`/admin/entities/${id}`, toUpdatePayload(entity)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entities"] });
    },
  });
}

export function useToggleEntityStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, currentStatus }: { id: string; currentStatus: "Active" | "Inactive" }) =>
      apiClient.patch(`/admin/entities/${id}`, {
        status: currentStatus === "Active" ? "INACTIVE" : "ACTIVE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entities"] });
    },
  });
}

export function useDeleteEntity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/entities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entities"] });
    },
  });
}

interface BulkActionPayload {
  action: "delete" | "activate" | "deactivate";
  ids?: string[];
  selectAll?: boolean;
  filters?: Record<string, string>;
}

export function useBulkEntityAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BulkActionPayload) =>
      apiClient.post("/admin/entities/bulk", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entities"] });
    },
  });
}
