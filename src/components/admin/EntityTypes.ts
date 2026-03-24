export interface TaxIdEntry {
  id: string;
  taxId: string;
  branchType: "Head Office" | "Branch";
  branchNo: string;
  isPrimary: boolean;
}

export interface CompanyIdentity {
  id: string;
  companyCode: string;
  legalNameTh: string;
  legalNameEn: string;
  effectiveStartDate: string;
  effectiveEndDate: string;
  status: "Active" | "Inactive";
  taxIds: TaxIdEntry[];
  aliases: string[];
  addressTh: {
    addressLine1: string;
    subdistrict: string;
    district: string;
    province: string;
    postalCode: string;
    country: string;
  };
  addressEn: {
    addressLine1: string;
    subdistrict: string;
    district: string;
    province: string;
    postalCode: string;
    country: string;
  };
  addressAliases: string[];
  lastUpdated: string;
}

export const emptyAddress = {
  addressLine1: "",
  subdistrict: "",
  district: "",
  province: "",
  postalCode: "",
  country: "Thailand",
};

export const createEmptyEntity = (): CompanyIdentity => ({
  id: crypto.randomUUID(),
  companyCode: "",
  legalNameTh: "",
  legalNameEn: "",
  effectiveStartDate: "",
  effectiveEndDate: "",
  status: "Active",
  taxIds: [{ id: crypto.randomUUID(), taxId: "", branchType: "Head Office", branchNo: "", isPrimary: true }],
  aliases: [],
  addressTh: { ...emptyAddress },
  addressEn: { ...emptyAddress },
  addressAliases: [],
  lastUpdated: new Date().toISOString().split("T")[0],
});

export const mockCompanyIdentities: CompanyIdentity[] = [
  {
    id: "1",
    companyCode: "CORP-01",
    legalNameTh: "CP Axtra Public Company Limited",
    legalNameEn: "CPAxtra Company",
    effectiveStartDate: "2020-01-01",
    effectiveEndDate: "2026-02-13",
    status: "Active",
    taxIds: [
      { id: "t1", taxId: "0107567000414", branchType: "Head Office", branchNo: "", isPrimary: true },
      { id: "t2", taxId: "0107536000270", branchType: "Branch", branchNo: "00001", isPrimary: false },
    ],
    aliases: ["CPAxtra", "CP Axtra"],
    addressTh: { addressLine1: "123 Sukhumvit Road", subdistrict: "Khlong Toei", district: "Khlong Toei", province: "Bangkok", postalCode: "10110", country: "Thailand" },
    addressEn: { addressLine1: "123 Sukhumvit Rd.", subdistrict: "Khlong Toei", district: "Khlong Toei", province: "Bangkok", postalCode: "10110", country: "Thailand" },
    addressAliases: ["123 Sukhumvit, Khlong Toei, Bangkok", "CPAxtra Sukhumvit"],
    lastUpdated: "2026-02-10",
  },
  {
    id: "2",
    companyCode: "CORP-02",
    legalNameTh: "ABC Trading Company Limited",
    legalNameEn: "ABC Trading Co., Ltd.",
    effectiveStartDate: "2021-06-01",
    effectiveEndDate: "",
    status: "Active",
    taxIds: [
      { id: "t3", taxId: "0105564012345", branchType: "Head Office", branchNo: "", isPrimary: true },
    ],
    aliases: ["ABC Trading"],
    addressTh: { addressLine1: "456 Phahonyothin Road", subdistrict: "Chatuchak", district: "Chatuchak", province: "Bangkok", postalCode: "10900", country: "Thailand" },
    addressEn: { addressLine1: "456 Phaholyothin Rd.", subdistrict: "Chatuchak", district: "Chatuchak", province: "Bangkok", postalCode: "10900", country: "Thailand" },
    addressAliases: [],
    lastUpdated: "2026-01-15",
  },
  {
    id: "3",
    companyCode: "CORP-03",
    legalNameTh: "ABC Logistics Company Limited",
    legalNameEn: "ABC Logistics Co., Ltd.",
    effectiveStartDate: "2022-01-01",
    effectiveEndDate: "",
    status: "Active",
    taxIds: [
      { id: "t4", taxId: "0105565098765", branchType: "Head Office", branchNo: "", isPrimary: true },
    ],
    aliases: ["ABC Logistics", "ABC Logistics"],
    addressTh: { addressLine1: "789 Bangna-Trad Road", subdistrict: "Bangna", district: "Bangna", province: "Bangkok", postalCode: "10260", country: "Thailand" },
    addressEn: { addressLine1: "789 Bangna-Trad Rd.", subdistrict: "Bang Na", district: "Bang Na", province: "Bangkok", postalCode: "10260", country: "Thailand" },
    addressAliases: ["789 Bangna-Trad, Bangkok"],
    lastUpdated: "2026-02-05",
  },
];
