export interface CompanyIdentity {
  id: string;
  companyCode: string;
  legalNameTh: string;
  legalNameEn: string;
  taxId: string;
  address: string;
  status: "Active" | "Inactive";
  lastUpdated: string;
}

export const createEmptyEntity = (nextCode: string): CompanyIdentity => ({
  id: crypto.randomUUID(),
  companyCode: nextCode,
  legalNameTh: "",
  taxId: "",
  address: "",
  status: "Active",
  lastUpdated: new Date().toISOString().split("T")[0],
});

export const mockCompanyIdentities: CompanyIdentity[] = [
  {
    id: "1",
    companyCode: "CORP-01",
    legalNameTh: "CP Axtra Public Company Limited",
    taxId: "0107567000414",
    address: "123 Sukhumvit Road, Khlong Toei, Khlong Toei, Bangkok 10110",
    status: "Active",
    lastUpdated: "2026-02-10",
  },
];
