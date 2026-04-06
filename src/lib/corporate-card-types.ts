export type PolicyResult = "AUTO_APPROVED" | "AUTO_REJECTED" | "REQUIRES_APPROVAL";
export type ProcessingStatus = "NEW" | "PENDING_MATCH" | "PROCESSED" | "ERROR";
export type PolicyType = "AUTO_APPROVE" | "AUTO_REJECT" | "REQUIRES_APPROVAL";

export interface BankTransaction {
  id: string;
  file_id: string;
  transaction_id: string;
  cardholder_employee_id: string;
  cardholder_name: string;
  transaction_date: string;
  posting_date: string;
  billing_amount: number;
  billing_currency: string;
  merchant_name: string;
  merchant_city: string;
  merchant_country: string;
  mcc_code: string;
  mcc_description: string;
  category: string;
  import_status?: string | null;
  transaction_type: string;
  authorization_code: string;
  reference_number: string;
  policy_result: PolicyResult;
  policy_reason: string;
  processing_status: ProcessingStatus;
  created_at: string;
  card_number?: string | null;
  last_4_digit?: string | null;
  transaction_amount?: number | null;
  transaction_currency?: string | null;
}

export interface BankTransactionQueryParams {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  postingDateFrom?: string;
  postingDateTo?: string;
  cardholder?: string;
  merchantName?: string;
  merchantCity?: string;
  merchantCountry?: string;
  mccCode?: string;
  transactionType?: string;
  policyResult?: string;
  processingStatus?: string;
  billingAmountMin?: number;
  billingAmountMax?: number;
  billingCurrency?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface BankTransactionStats {
  totalTransactions: number;
  byPolicyResult: Record<string, number>;
  byProcessingStatus: Record<string, number>;
  totalBillingAmount: number;
  thisMonthBillingAmount: number;
}

export interface BankTransactionFilterOptions {
  cardholders: { cardholderEmployeeId: string; cardholderName: string }[];
  mccCodes: { mccCode: string; mccDescription: string }[];
  merchantCountries: string[];
  merchantCities: string[];
  transactionTypes: string[];
  billingCurrencies: string[];
  policyResults: string[];
  processingStatuses: string[];
}

export interface MccPolicyQueryParams {
  search?: string;
  active?: string;
  expenseTypeId?: string;
  subExpenseTypeId?: string;
  page?: number;
  limit?: number;
}

export interface MccPolicyMaster {
  id: string;
  mcc_code: string | null;
  description: string;
  mcc_code_description: string | null;
  policy_category: string;
  policy_type: PolicyType;
  threshold_amount: number | null;
  currency: string;
  active_flag: boolean;
  expense_type_id: string | null;
  sub_expense_type_id: string | null;
  expense_type_name: string | null;
  sub_expense_type_name: string | null;
  created_at: string;
  updated_at: string;
}
