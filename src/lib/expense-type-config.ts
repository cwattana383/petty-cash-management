export interface RequiredDoc {
  id: string;
  label: string;
  required: boolean;
}

export interface ExpenseTypeConfigItem {
  level1: string;
  level2: string;
  policyRule: "Auto Approve" | "Requires Approval" | "Auto Reject";
  threshold: number | null;
  currency: string;
  glCode: string | null;
  requiredDocs: RequiredDoc[];
  optionalDocs: RequiredDoc[];
  notes?: string;
}

export const EXPENSE_TYPE_CONFIG: ExpenseTypeConfigItem[] = [
  // ── TRANSPORTATION — DOMESTIC ──────────────────────────────
  {
    level1: "Transportation — Domestic",
    level2: "Taxi / Grab",
    policyRule: "Auto Approve",
    threshold: 1500,
    currency: "THB",
    glCode: "5300-002",
    requiredDocs: [
      { id: "receipt", label: "Receipt", required: true },
      { id: "claim_form", label: "Travelling Expenses Claim Form", required: true },
    ],
    optionalDocs: [
      { id: "memo", label: "Memo / Business Purpose (when exceeding Threshold)", required: false },
    ],
  },
  {
    level1: "Transportation — Domestic",
    level2: "BTS / MRT / Public Transit",
    policyRule: "Auto Approve",
    threshold: 500,
    currency: "THB",
    glCode: "5300-002",
    requiredDocs: [
      { id: "claim_form", label: "Travelling Expenses Claim Form", required: true },
    ],
    optionalDocs: [
      { id: "receipt", label: "Receipt / Ticket (if available — optional ≤200 THB)", required: false },
    ],
  },
  {
    level1: "Transportation — Domestic",
    level2: "Train / Inter-city Bus",
    policyRule: "Auto Approve",
    threshold: 1000,
    currency: "THB",
    glCode: "5300-002",
    requiredDocs: [
      { id: "ticket", label: "Train / Inter-city Bus Ticket", required: true },
      { id: "claim_form", label: "Travelling Expenses Claim Form", required: true },
    ],
    optionalDocs: [],
  },
  {
    level1: "Transportation — Domestic",
    level2: "Personal Car — Mileage",
    policyRule: "Auto Approve",
    threshold: 2000,
    currency: "THB",
    glCode: "5300-004",
    requiredDocs: [
      { id: "receipt_fuel", label: "Fuel Receipt (with Vehicle Registration No.)", required: true },
      { id: "trip_detail", label: "Trip Details (Origin–Destination–Kilometers)", required: true },
      { id: "insurance_proof", label: "Insurance Proof (Compulsory + Voluntary)", required: true },
      { id: "claim_form", label: "Travelling Expenses Claim Form", required: true },
    ],
    optionalDocs: [],
  },
  {
    level1: "Transportation — Domestic",
    level2: "EV Car — Mileage",
    policyRule: "Auto Approve",
    threshold: 3000,
    currency: "THB",
    glCode: "5300-004",
    requiredDocs: [
      { id: "ev_receipt", label: "EV Charging Receipt", required: true },
      { id: "trip_detail", label: "Trip Details (Origin–Destination–Kilometers)", required: true },
      { id: "claim_form", label: "Travelling Expenses Claim Form", required: true },
    ],
    optionalDocs: [
      { id: "ev_allowance_note", label: "Note: EV Allowance 3,000 THB/month (HR-CB-001-2024)", required: false },
    ],
  },
  {
    level1: "Transportation — Domestic",
    level2: "Toll Fees",
    policyRule: "Auto Approve",
    threshold: 3500,
    currency: "THB",
    glCode: "5300-002",
    requiredDocs: [
      { id: "receipt", label: "Toll Fee Receipt", required: true },
      { id: "claim_form", label: "Travelling Expenses Claim Form", required: true },
    ],
    optionalDocs: [],
  },
  {
    level1: "Transportation — Domestic",
    level2: "Airport Parking",
    policyRule: "Auto Approve",
    threshold: 500,
    currency: "THB",
    glCode: "5300-002",
    requiredDocs: [
      { id: "receipt", label: "Parking Receipt (≤4 days / 96 hours)", required: true },
    ],
    optionalDocs: [],
  },
  {
    level1: "Transportation — Domestic",
    level2: "Car Rental",
    policyRule: "Requires Approval",
    threshold: null,
    currency: "THB",
    glCode: "5300-003",
    requiredDocs: [
      { id: "invoice", label: "Invoice / Receipt from Car Rental Company", required: true },
      { id: "cga_booking", label: "CGA Booking Confirmation", required: true },
      { id: "travel_approval", label: "Travel Approval Letter", required: true },
    ],
    optionalDocs: [
      { id: "outside_contract_approval", label: "Approval from Associate Director (Off-Contract)", required: false },
    ],
  },
  {
    level1: "Transportation — Domestic",
    level2: "Airline — Domestic",
    policyRule: "Requires Approval",
    threshold: null,
    currency: "THB",
    glCode: "5300-001",
    requiredDocs: [
      { id: "eticket", label: "E-Ticket / Flight Ticket", required: true },
      { id: "director_approval", label: "Approval from Director+ (HQ) or SGM (Store)", required: true },
      { id: "cga_booking", label: "Agency / CGA Booking Confirmation", required: true },
      { id: "tax_invoice", label: "Tax Invoice (Tax Invoice)", required: true },
    ],
    optionalDocs: [
      { id: "boarding_pass", label: "Boarding Pass", required: false },
    ],
  },
  {
    level1: "Transportation — Domestic",
    level2: "Courier / Postage",
    policyRule: "Auto Approve",
    threshold: 500,
    currency: "THB",
    glCode: "5300-005",
    requiredDocs: [
      { id: "receipt", label: "Courier Receipt / Delivery Note", required: true },
    ],
    optionalDocs: [],
  },

  // ── TRANSPORTATION — OVERSEAS ───────────────────────────────
  {
    level1: "Transportation — Overseas",
    level2: "Airline — Overseas",
    policyRule: "Requires Approval",
    threshold: null,
    currency: "THB",
    glCode: "5300-001",
    requiredDocs: [
      { id: "eticket", label: "E-Ticket / Flight Ticket", required: true },
      { id: "boarding_pass", label: "Boarding Pass", required: true },
      { id: "tax_invoice", label: "Tax Invoice / Invoice", required: true },
      { id: "travel_approval", label: "Overseas Travel Approval (Chief Level+)", required: true },
      { id: "cga_booking", label: "Agency / CGA Booking Confirmation", required: true },
      { id: "travel_insurance", label: "Travel Insurance Certificate (notify HR ≥7 days in advance)", required: true },
    ],
    optionalDocs: [
      { id: "upgrade_memo", label: "Justification for Business Class Request", required: false },
      { id: "passport_visa", label: "Passport Copy — Visa Page (for Visa Reimbursement)", required: false },
    ],
  },
  {
    level1: "Transportation — Overseas",
    level2: "Ground Transport (Overseas)",
    policyRule: "Auto Approve",
    threshold: null,
    currency: "THB",
    glCode: "5300-002",
    requiredDocs: [
      { id: "receipt", label: "Ground Transport Receipt at Destination", required: true },
      { id: "perdiem_form", label: "Per Diem Claim Form (Overseas)", required: true },
    ],
    optionalDocs: [],
  },

  // ── MEALS & ENTERTAINMENT ───────────────────────────────────
  {
    level1: "Meals & Entertainment",
    level2: "Per Diem — Domestic (200/day)",
    policyRule: "Auto Approve",
    threshold: 200,
    currency: "THB",
    glCode: "5400-001",
    requiredDocs: [
      { id: "perdiem_form", label: "Domestic Per Diem Claim Form", required: true },
      { id: "travel_approval", label: "Travel Approval Letter", required: true },
    ],
    optionalDocs: [
      { id: "receipt", label: "Meal Receipt (if available)", required: false },
    ],
    notes: "Below Senior Manager level only | Travel ≥50 km cross-province | Work ≥9 hours",
  },
  {
    level1: "Meals & Entertainment",
    level2: "Restaurant — Business Meal",
    policyRule: "Auto Approve",
    threshold: 3000,
    currency: "THB",
    glCode: "5400-001",
    requiredDocs: [
      { id: "receipt", label: "Receipt", required: true },
    ],
    optionalDocs: [
      { id: "tax_invoice", label: "Tax Invoice (Tax Invoice)", required: false },
      { id: "business_purpose", label: "Business Purpose", required: false },
    ],
  },
  {
    level1: "Meals & Entertainment",
    level2: "Night Shift Meal (60/person)",
    policyRule: "Auto Approve",
    threshold: 60,
    currency: "THB",
    glCode: "5400-002",
    requiredDocs: [
      { id: "receipt", label: "Receipt", required: true },
      { id: "headcount", label: "Employee Head Count", required: true },
      { id: "job_type", label: "Job Type (Year-end Stock Take / Cycle Stock / Layout Remodeling / Special Project)", required: true },
      { id: "work_hours_proof", label: "Proof of Work ≥8 Hours", required: true },
    ],
    optionalDocs: [],
    notes: "Policy BC.67024 | Effective 1 Jan–31 Dec 2025 only",
  },
  {
    level1: "Meals & Entertainment",
    level2: "Per Diem — Overseas",
    policyRule: "Auto Approve",
    threshold: null,
    currency: "USD",
    glCode: "5400-001",
    requiredDocs: [
      { id: "perdiem_form", label: "Per Diem Claim Form (Overseas)", required: true },
      { id: "travel_approval", label: "Overseas Travel Approval Letter", required: true },
    ],
    optionalDocs: [
      { id: "receipt", label: "Meal Receipt (if available)", required: false },
    ],
    notes: "Threshold varies by Employee Grade and Country Group (HR-TR-002 Table 2)",
  },
  {
    level1: "Meals & Entertainment",
    level2: "Client Entertainment",
    policyRule: "Requires Approval",
    threshold: null,
    currency: "THB",
    glCode: "5400-003",
    requiredDocs: [
      { id: "entertainment_form", label: "Entertainment Expense Claim Form (CA005)", required: true },
      { id: "receipt", label: "Receipt", required: true },
      { id: "tax_invoice", label: "Tax Invoice (Tax Invoice)", required: true },
      { id: "attendee_list", label: "Attendee List (Name + Company + Position)", required: true },
      { id: "business_purpose", label: "Business Purpose", required: true },
    ],
    optionalDocs: [
      { id: "memo", label: "Memo with Justification (when exceeding Threshold)", required: false },
    ],
  },
  {
    level1: "Meals & Entertainment",
    level2: "Alcohol / Bar",
    policyRule: "Auto Reject",
    threshold: null,
    currency: "THB",
    glCode: null,
    requiredDocs: [],
    optionalDocs: [],
    notes: "Cannot be reimbursed under any circumstances — company policy",
  },

  // ── ACCOMMODATION ───────────────────────────────────────────
  {
    level1: "Accommodation",
    level2: "Hotel — Domestic",
    policyRule: "Auto Approve",
    threshold: null,
    currency: "THB",
    glCode: "5200-001",
    requiredDocs: [
      { id: "hotel_folio", label: "Hotel Folio / Hotel Receipt", required: true },
      { id: "tax_invoice", label: "Tax Invoice (Tax Invoice)", required: true },
      { id: "travel_approval", label: "Travel Approval Letter", required: true },
      { id: "cga_booking", label: "CGA / Agency Booking Confirmation", required: true },
    ],
    optionalDocs: [
      { id: "split_bill", label: "Split Bill x2 (if exceeding room limit)", required: false },
      { id: "single_room_memo", label: "Justification for Single Room (when entitled to Twin Sharing)", required: false },
    ],
    notes: "Threshold varies by Employee Grade (HR-TR-001 Table 3)",
  },
  {
    level1: "Accommodation",
    level2: "Hotel — Overseas",
    policyRule: "Auto Approve",
    threshold: null,
    currency: "USD",
    glCode: "5200-001",
    requiredDocs: [
      { id: "hotel_folio", label: "Hotel Folio / Hotel Receipt", required: true },
      { id: "tax_invoice", label: "Invoice / Tax Invoice", required: true },
      { id: "travel_approval", label: "Overseas Travel Approval Letter", required: true },
      { id: "cga_booking", label: "Agency / CGA Booking Confirmation", required: true },
    ],
    optionalDocs: [
      { id: "booking_confirmation", label: "Booking Confirmation", required: false },
    ],
    notes: "Threshold varies by Employee Grade + Country Group (HR-TR-002 Table 5)",
  },

  // ── OFFICE SUPPLIES ─────────────────────────────────────────
  {
    level1: "Office Supplies",
    level2: "Stationery / Printing",
    policyRule: "Auto Approve",
    threshold: 2000,
    currency: "THB",
    glCode: "5500-001",
    requiredDocs: [
      { id: "receipt", label: "Receipt (required >500 THB)", required: true },
      { id: "tax_invoice", label: "Tax Invoice (Tax Invoice)", required: true },
    ],
    optionalDocs: [
      { id: "nt_catalog_ref", label: "NT Catalog Reference (if item is in catalog)", required: false },
    ],
  },
  {
    level1: "Office Supplies",
    level2: "IT Equipment",
    policyRule: "Requires Approval",
    threshold: null,
    currency: "THB",
    glCode: "5500-002",
    requiredDocs: [
      { id: "receipt", label: "Receipt", required: true },
      { id: "tax_invoice", label: "Tax Invoice (Tax Invoice)", required: true },
      { id: "it_approval", label: "Approval from IT Department (>2,000 THB)", required: true },
      { id: "pr", label: "Purchase Requisition (PR)", required: true },
    ],
    optionalDocs: [],
  },

  // ── OTHER ───────────────────────────────────────────────────
  {
    level1: "Other",
    level2: "Medical / OPD",
    policyRule: "Auto Approve",
    threshold: 2000,
    currency: "THB",
    glCode: "5600-001",
    requiredDocs: [
      { id: "hospital_receipt", label: "Hospital / Clinic Receipt", required: true },
      { id: "medical_cert", label: "Medical Certificate", required: true },
    ],
    optionalDocs: [
      { id: "insurance_claim", label: "Insurance Company Evidence (if claiming from insurance first)", required: false },
      { id: "lab_result", label: "Lab Results / Health Check Summary", required: false },
    ],
  },
  {
    level1: "Other",
    level2: "Funeral — Wreath",
    policyRule: "Auto Approve",
    threshold: 2000,
    currency: "THB",
    glCode: "5600-004",
    requiredDocs: [
      { id: "death_cert", label: "Death Certificate", required: true },
      { id: "welfare_form", label: "Welfare Benefit Request Form", required: true },
      { id: "wreath_receipt", label: "Actual Wreath Receipt (≤2,000 THB)", required: true },
    ],
    optionalDocs: [
      { id: "marriage_cert", label: "Marriage Certificate Copy (for spouse's death)", required: false },
      { id: "birth_cert", label: "Birth Certificate Copy (for child's death)", required: false },
    ],
    notes: "HR-TR-013 | Paid via Petty Cash; funeral allowance 10,000 THB via Payroll",
  },
  {
    level1: "Other",
    level2: "Government License / Permit",
    policyRule: "Auto Approve",
    threshold: 3000,
    currency: "THB",
    glCode: "5600-005",
    requiredDocs: [
      { id: "gov_receipt", label: "Government Agency Receipt", required: true },
      { id: "license_copy", label: "New License / Renewal Document", required: true },
    ],
    optionalDocs: [],
  },
  {
    level1: "Other",
    level2: "Community / Cultural",
    policyRule: "Auto Approve",
    threshold: 1000,
    currency: "THB",
    glCode: "5600-006",
    requiredDocs: [
      { id: "receipt", label: "Receipt / Payment Evidence", required: true },
      { id: "activity_memo", label: "Memo Explaining Activity and Community Connection", required: true },
      { id: "sgm_approval", label: "Approval from SGM / Store Manager", required: true },
    ],
    optionalDocs: [],
  },
  {
    level1: "Other",
    level2: "Wet Waste Disposal",
    policyRule: "Auto Approve",
    threshold: 1000,
    currency: "THB",
    glCode: "5600-007",
    requiredDocs: [
      { id: "receipt", label: "Receipt from Waste Disposal Service Provider", required: true },
      { id: "urgent_memo", label: "Memo Explaining Why Direct Payment Cannot Be Waited For", required: true },
    ],
    optionalDocs: [],
  },
  {
    level1: "Other",
    level2: "Damaged Claims — Customer",
    policyRule: "Auto Approve",
    threshold: 500,
    currency: "THB",
    glCode: "5600-008",
    requiredDocs: [
      { id: "receipt", label: "Receipt / Compensation Evidence", required: true },
      { id: "incident_report", label: "Incident Report", required: true },
    ],
    optionalDocs: [],
  },
  {
    level1: "Other",
    level2: "Cash Advance / ATM",
    policyRule: "Auto Reject",
    threshold: null,
    currency: "THB",
    glCode: null,
    requiredDocs: [],
    optionalDocs: [],
    notes: "Cash withdrawal via card is prohibited — LOA FW-FN-001",
  },
  {
    level1: "Other",
    level2: "Personal Expense",
    policyRule: "Auto Reject",
    threshold: null,
    currency: "THB",
    glCode: null,
    requiredDocs: [],
    optionalDocs: [],
    notes: "Personal expenses cannot be reimbursed under any circumstances",
  },
];

/** Get unique Level 1 expense types */
export const getLevel1Options = (): string[] => {
  return [...new Set(EXPENSE_TYPE_CONFIG.map((c) => c.level1))];
};

/** Get Level 2 sub-types for a given Level 1 */
export const getLevel2Options = (level1: string): string[] => {
  return EXPENSE_TYPE_CONFIG.filter((c) => c.level1 === level1).map((c) => c.level2);
};

/** Get full config for a specific Level 1 + Level 2 combination */
export const getExpenseConfig = (level1: string, level2: string): ExpenseTypeConfigItem | undefined => {
  return EXPENSE_TYPE_CONFIG.find((c) => c.level1 === level1 && c.level2 === level2);
};
