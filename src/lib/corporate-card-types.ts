export type PolicyResult = "AUTO_APPROVED" | "AUTO_REJECTED" | "REQUIRES_APPROVAL";
export type ProcessingStatus = "NEW" | "PROCESSED" | "ERROR";
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
  transaction_type: string;
  authorization_code: string;
  reference_number: string;
  policy_result: PolicyResult;
  policy_reason: string;
  processing_status: ProcessingStatus;
  created_at: string;
}

export interface MccPolicyMaster {
  mcc_code: string;
  description: string;
  category: string;
  mcc_code_ref: string;
  mcc_code_description: string;
  description_subtype: string;
  policy_type: PolicyType;
  threshold_amount: number | null;
  currency: string;
  active_flag: boolean;
  updated_at: string;
}
