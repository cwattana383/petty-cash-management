export interface VatTypeConfigItem {
  id: string;
  label: string;
  description: string;
  vatRate: number;
  calcMethod: "exclusive" | "inclusive" | "average" | "none";
  requiresTaxInvoice: boolean;
  examples: string[];
}

export const VAT_TYPE_CONFIG: VatTypeConfigItem[] = [
  {
    id: "claim_100",
    label: "Claim 100",
    description: "Input VAT claimable 100% — Full tax invoice available (NF items)",
    vatRate: 0.07,
    calcMethod: "exclusive",
    requiresTaxInvoice: true,
    examples: ["Airline", "Hotel", "Office Supplies", "Courier"],
  },
  {
    id: "unclaim_100",
    label: "Un-Claim 100",
    description: "VAT not claimable — Absorbed into cost (FF items e.g. produce bags)",
    vatRate: 0.07,
    calcMethod: "inclusive",
    requiresTaxInvoice: true,
    examples: ["FF packaging", "Fresh produce bags"],
  },
  {
    id: "avg",
    label: "AVG",
    description: "Average VAT — Shared expenses split by NF:FF ratio",
    vatRate: 0.07,
    calcMethod: "average",
    requiresTaxInvoice: true,
    examples: ["Light bulbs", "General store supplies", "Shared equipment"],
  },
  {
    id: "no_vat",
    label: "No VAT",
    description: "No tax invoice — Supplier not VAT-registered or exempt",
    vatRate: 0,
    calcMethod: "none",
    requiresTaxInvoice: false,
    examples: ["Taxi", "BTS/MRT", "Government fees", "Medical", "Small vendors"],
  },
];

export const DEFAULT_VAT_BY_SUBTYPE: Record<string, string> = {
  "Taxi / Grab": "no_vat",
  "BTS / MRT / Public Transit": "no_vat",
  "Train / Inter-city Bus": "no_vat",
  "Personal Car — Mileage": "no_vat",
  "EV Car — Mileage": "no_vat",
  "Toll Fees": "no_vat",
  "Airport Parking": "no_vat",
  "Car Rental": "claim_100",
  "Airline — Domestic": "claim_100",
  "Airline — Overseas": "claim_100",
  "Courier / Postage": "claim_100",
  "Ground Transport (Overseas)": "no_vat",
  "Per Diem — Domestic (200/day)": "no_vat",
  "Restaurant — Business Meal": "claim_100",
  "Night Shift Meal (60/person)": "no_vat",
  "Per Diem — Overseas": "no_vat",
  "Client Entertainment": "claim_100",
  "Hotel — Domestic": "claim_100",
  "Hotel — Overseas": "claim_100",
  "Stationery / Printing": "claim_100",
  "IT Equipment": "claim_100",
  "Medical / OPD": "no_vat",
  "Funeral — Wreath": "no_vat",
  "Government License / Permit": "no_vat",
  "Community / Cultural": "no_vat",
  "Wet Waste Disposal": "no_vat",
  "Damaged Claims — Customer": "no_vat",
};

/** Get VAT type config by id */
export const getVatTypeConfig = (id: string): VatTypeConfigItem | undefined => {
  return VAT_TYPE_CONFIG.find((v) => v.id === id);
};

/** Get default VAT type id for a given Sub Expense Type */
export const getDefaultVatType = (subExpenseType: string): string | undefined => {
  return DEFAULT_VAT_BY_SUBTYPE[subExpenseType];
};

/** Get default VAT type config for a given Sub Expense Type */
export const getDefaultVatTypeConfig = (subExpenseType: string): VatTypeConfigItem | undefined => {
  const id = getDefaultVatType(subExpenseType);
  return id ? getVatTypeConfig(id) : undefined;
};
