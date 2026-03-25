export interface CompanyIdentity {
  id: string;
  companyCode: string;
  legalNameTh: string;
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
  {
    id: "2",
    companyCode: "CORP-02",
    legalNameTh: "ABC Trading Company Limited",
    taxId: "0105564012345",
    address: "456 Phahonyothin Road, Chatuchak, Chatuchak, Bangkok 10900",
    status: "Active",
    lastUpdated: "2026-01-15",
  },
  {
    id: "3",
    companyCode: "CORP-03",
    legalNameTh: "ABC Logistics Company Limited",
    taxId: "0105565098765",
    address: "789 Bangna-Trad Road, Bangna, Bangna, Bangkok 10260",
    status: "Active",
    lastUpdated: "2026-02-05",
  },
];
