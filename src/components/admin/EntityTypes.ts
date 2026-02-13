export interface TaxIdEntry {
  id: string;
  taxId: string;
  branchType: "สำนักงานใหญ่" | "สาขา";
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
  taxIds: [{ id: crypto.randomUUID(), taxId: "", branchType: "สำนักงานใหญ่", branchNo: "", isPrimary: true }],
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
    legalNameTh: "บริษัท ซีพี แอ็กซ์ตร้า จำกัด (มหาชน)",
    legalNameEn: "CPAxtra Company",
    effectiveStartDate: "2020-01-01",
    effectiveEndDate: "2026-02-13",
    status: "Active",
    taxIds: [
      { id: "t1", taxId: "0107567000414", branchType: "สำนักงานใหญ่", branchNo: "", isPrimary: true },
      { id: "t2", taxId: "0107536000270", branchType: "สาขา", branchNo: "00001", isPrimary: false },
    ],
    aliases: ["CPAxtra", "ซีพี แอ็กซ์ตร้า"],
    addressTh: { addressLine1: "123 ถนนสุขุมวิท", subdistrict: "คลองเตย", district: "คลองเตย", province: "กรุงเทพมหานคร", postalCode: "10110", country: "Thailand" },
    addressEn: { addressLine1: "123 Sukhumvit Rd.", subdistrict: "Khlong Toei", district: "Khlong Toei", province: "Bangkok", postalCode: "10110", country: "Thailand" },
    addressAliases: ["123 สุขุมวิท คลองเตย กทม", "CPAxtra สุขุมวิท"],
    lastUpdated: "2026-02-10",
  },
  {
    id: "2",
    companyCode: "CORP-02",
    legalNameTh: "บริษัท ABC Trading จำกัด",
    legalNameEn: "ABC Trading Co., Ltd.",
    effectiveStartDate: "2021-06-01",
    effectiveEndDate: "",
    status: "Active",
    taxIds: [
      { id: "t3", taxId: "0105564012345", branchType: "สำนักงานใหญ่", branchNo: "", isPrimary: true },
    ],
    aliases: ["ABC Trading"],
    addressTh: { addressLine1: "456 ถนนพหลโยธิน", subdistrict: "จตุจักร", district: "จตุจักร", province: "กรุงเทพมหานคร", postalCode: "10900", country: "Thailand" },
    addressEn: { addressLine1: "456 Phaholyothin Rd.", subdistrict: "Chatuchak", district: "Chatuchak", province: "Bangkok", postalCode: "10900", country: "Thailand" },
    addressAliases: [],
    lastUpdated: "2026-01-15",
  },
  {
    id: "3",
    companyCode: "CORP-03",
    legalNameTh: "บริษัท ABC Logistics จำกัด",
    legalNameEn: "ABC Logistics Co., Ltd.",
    effectiveStartDate: "2022-01-01",
    effectiveEndDate: "",
    status: "Active",
    taxIds: [
      { id: "t4", taxId: "0105565098765", branchType: "สำนักงานใหญ่", branchNo: "", isPrimary: true },
    ],
    aliases: ["ABC Logistics", "เอบีซี โลจิสติกส์"],
    addressTh: { addressLine1: "789 ถนนบางนา-ตราด", subdistrict: "บางนา", district: "บางนา", province: "กรุงเทพมหานคร", postalCode: "10260", country: "Thailand" },
    addressEn: { addressLine1: "789 Bangna-Trad Rd.", subdistrict: "Bang Na", district: "Bang Na", province: "Bangkok", postalCode: "10260", country: "Thailand" },
    addressAliases: ["789 บางนา-ตราด กทม"],
    lastUpdated: "2026-02-05",
  },
];
