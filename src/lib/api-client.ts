/**
 * Mock API client for lovable demo.
 * Same interface as the real api-client so all hooks work unchanged.
 * All data lives in-memory; CRUD operations update local stores.
 */

import type { BankTransaction as CorpBankTxn, MccPolicyMaster } from './corporate-card-types';

// ─── In-memory stores ───

let nextId = 1000;
const uid = () => `mock-${++nextId}`;

// Bank Transactions
const bankTransactionsStore: CorpBankTxn[] = [
  { id: "bt-1", file_id: "f1", transaction_id: "TXN20260301001", cardholder_employee_id: "u1", cardholder_name: "Somchai Jaidee", transaction_date: "2026-03-01", posting_date: "2026-03-02", billing_amount: 1500, billing_currency: "THB", merchant_name: "GRAB TAXI", merchant_city: "Bangkok", merchant_country: "TH", mcc_code: "4121", mcc_description: "Taxicabs and Limousines", category: "Transportation", transaction_type: "PURCHASE", authorization_code: "A001", reference_number: "REF001", policy_result: "AUTO_APPROVED", policy_reason: "Amount under threshold", processing_status: "PROCESSED", created_at: "2026-03-01T10:00:00Z" },
  { id: "bt-2", file_id: "f1", transaction_id: "TXN20260301002", cardholder_employee_id: "u1", cardholder_name: "Somchai Jaidee", transaction_date: "2026-03-01", posting_date: "2026-03-02", billing_amount: 3500, billing_currency: "THB", merchant_name: "MARRIOTT HOTEL BKK", merchant_city: "Bangkok", merchant_country: "TH", mcc_code: "7011", mcc_description: "Hotels and Motels", category: "Travel", transaction_type: "PURCHASE", authorization_code: "A002", reference_number: "REF002", policy_result: "REQUIRES_APPROVAL", policy_reason: "Requires manager approval", processing_status: "PROCESSED", created_at: "2026-03-01T10:05:00Z" },
  { id: "bt-3", file_id: "f1", transaction_id: "TXN20260301003", cardholder_employee_id: "u2", cardholder_name: "Somying Kaewsai", transaction_date: "2026-03-02", posting_date: "2026-03-03", billing_amount: 850, billing_currency: "THB", merchant_name: "STARBUCKS", merchant_city: "Bangkok", merchant_country: "TH", mcc_code: "5812", mcc_description: "Eating Places and Restaurants", category: "Meals", transaction_type: "PURCHASE", authorization_code: "A003", reference_number: "REF003", policy_result: "AUTO_APPROVED", policy_reason: "Amount under threshold", processing_status: "PROCESSED", created_at: "2026-03-02T09:00:00Z" },
  { id: "bt-4", file_id: "f1", transaction_id: "TXN20260301004", cardholder_employee_id: "u3", cardholder_name: "Wichai Charoen", transaction_date: "2026-03-03", posting_date: "2026-03-04", billing_amount: 7900, billing_currency: "THB", merchant_name: "Siam Amazing Park", merchant_city: "Bangkok", merchant_country: "TH", mcc_code: "7996", mcc_description: "Amusement Parks", category: "Entertainment", transaction_type: "PURCHASE", authorization_code: "A004", reference_number: "REF004", policy_result: "AUTO_REJECTED", policy_reason: "Amusement Parks not allowed", processing_status: "PROCESSED", created_at: "2026-03-03T14:00:00Z" },
  { id: "bt-5", file_id: "f1", transaction_id: "TXN20260301005", cardholder_employee_id: "u1", cardholder_name: "Somchai Jaidee", transaction_date: "2026-03-04", posting_date: "2026-03-05", billing_amount: 15000, billing_currency: "THB", merchant_name: "THAI AIRWAYS", merchant_city: "Bangkok", merchant_country: "TH", mcc_code: "3000", mcc_description: "Airlines", category: "Travel", transaction_type: "PURCHASE", authorization_code: "A005", reference_number: "REF005", policy_result: "REQUIRES_APPROVAL", policy_reason: "Requires manager approval", processing_status: "PROCESSED", created_at: "2026-03-04T08:30:00Z" },
  { id: "bt-6", file_id: "f2", transaction_id: "TXN20260305001", cardholder_employee_id: "u2", cardholder_name: "Somying Kaewsai", transaction_date: "2026-03-05", posting_date: "2026-03-06", billing_amount: 12000, billing_currency: "THB", merchant_name: "BUDGET CAR RENTAL", merchant_city: "Bangkok", merchant_country: "TH", mcc_code: "7512", mcc_description: "Car Rental Agencies", category: "Transportation", transaction_type: "PURCHASE", authorization_code: "A006", reference_number: "REF006", policy_result: "REQUIRES_APPROVAL", policy_reason: "Requires manager approval", processing_status: "PROCESSED", created_at: "2026-03-05T11:00:00Z" },
  { id: "bt-7", file_id: "f2", transaction_id: "TXN20260305002", cardholder_employee_id: "u1", cardholder_name: "Somchai Jaidee", transaction_date: "2026-03-06", posting_date: "2026-03-07", billing_amount: 279, billing_currency: "THB", merchant_name: "KFC", merchant_city: "Bangkok", merchant_country: "TH", mcc_code: "5814", mcc_description: "Fast Food Restaurants", category: "Meals", transaction_type: "PURCHASE", authorization_code: "A007", reference_number: "REF007", policy_result: "AUTO_APPROVED", policy_reason: "Amount under threshold", processing_status: "PROCESSED", created_at: "2026-03-06T12:15:00Z" },
  { id: "bt-8", file_id: "f2", transaction_id: "TXN20260305003", cardholder_employee_id: "u3", cardholder_name: "Wichai Charoen", transaction_date: "2026-03-07", posting_date: "2026-03-08", billing_amount: 55000, billing_currency: "THB", merchant_name: "Stone Hill Golf Club", merchant_city: "Chiang Mai", merchant_country: "TH", mcc_code: "7941", mcc_description: "Sporting and Recreational Camps", category: "Entertainment", transaction_type: "PURCHASE", authorization_code: "A008", reference_number: "REF008", policy_result: "AUTO_REJECTED", policy_reason: "Golf/Recreation not allowed", processing_status: "PROCESSED", created_at: "2026-03-07T15:00:00Z" },
  { id: "bt-9", file_id: "f2", transaction_id: "TXN20260310001", cardholder_employee_id: "u1", cardholder_name: "Somchai Jaidee", transaction_date: "2026-03-10", posting_date: "2026-03-11", billing_amount: 9200, billing_currency: "THB", merchant_name: "AVIS RENT A CAR", merchant_city: "Pattaya", merchant_country: "TH", mcc_code: "7512", mcc_description: "Car Rental Agencies", category: "Transportation", transaction_type: "PURCHASE", authorization_code: "A009", reference_number: "REF009", policy_result: "REQUIRES_APPROVAL", policy_reason: "Requires manager approval", processing_status: "PROCESSED", created_at: "2026-03-10T09:45:00Z" },
  { id: "bt-10", file_id: "f2", transaction_id: "TXN20260310002", cardholder_employee_id: "u2", cardholder_name: "Somying Kaewsai", transaction_date: "2026-03-10", posting_date: "2026-03-11", billing_amount: 42500, billing_currency: "THB", merchant_name: "SINGAPORE AIRLINES", merchant_city: "Bangkok", merchant_country: "SG", mcc_code: "3000", mcc_description: "Airlines", category: "Travel", transaction_type: "PURCHASE", authorization_code: "A010", reference_number: "REF010", policy_result: "REQUIRES_APPROVAL", policy_reason: "International flight requires approval", processing_status: "PROCESSED", created_at: "2026-03-10T10:00:00Z" },
  { id: "bt-11", file_id: "f3", transaction_id: "TXN20260315001", cardholder_employee_id: "u1", cardholder_name: "Somchai Jaidee", transaction_date: "2026-03-15", posting_date: "2026-03-16", billing_amount: 4500, billing_currency: "THB", merchant_name: "Tiger Kingdom", merchant_city: "Chiang Mai", merchant_country: "TH", mcc_code: "7999", mcc_description: "Tourist Attractions", category: "Entertainment", transaction_type: "PURCHASE", authorization_code: "A011", reference_number: "REF011", policy_result: "AUTO_REJECTED", policy_reason: "Tourist attractions not allowed", processing_status: "NEW", created_at: "2026-03-15T13:00:00Z" },
  { id: "bt-12", file_id: "f3", transaction_id: "TXN20260315002", cardholder_employee_id: "u3", cardholder_name: "Wichai Charoen", transaction_date: "2026-03-16", posting_date: "2026-03-17", billing_amount: 2500, billing_currency: "THB", merchant_name: "Rama 9 Hospital", merchant_city: "Bangkok", merchant_country: "TH", mcc_code: "8062", mcc_description: "Hospitals", category: "Medical", transaction_type: "PURCHASE", authorization_code: "A012", reference_number: "REF012", policy_result: "REQUIRES_APPROVAL", policy_reason: "Medical requires approval", processing_status: "NEW", created_at: "2026-03-16T08:00:00Z" },
];

// Corp Card Transactions — full CorpCardTransaction shape
const corpCardTransactionsStore: Record<string, unknown>[] = [
  { id: "cct-1", bankTransactionId: "bt-1", employeeId: "u1", creditCardId: "cc-1", cardLast4: "1111", billingCycle: "2026-03", employeeCode: "EMP001", merchantName: "GRAB TAXI", merchantCity: "Bangkok", merchantCountry: "TH", transactionDate: "2026-03-01", postingDate: "2026-03-02", amount: 1500, currency: "THB", mccCode: "4121", mccDescription: "Taxicabs and Limousines", category: "Transportation", importStatus: null, transactionType: "PURCHASE", authorizationCode: "A001", referenceNumber: "REF001", cardholderName: "Somchai Jaidee", transactionAmount: 1500, transactionCurrency: "THB", fileId: "f1", importSource: "MANUAL", status: "AUTO_APPROVED", policyResult: "AUTO_APPROVED", policyReason: "Amount under threshold", policyThresholdAmount: 2000, batchId: null, rawCardholderEmployeeId: null, unmatchedReason: null, adminReviewRequired: false, adminReviewComment: null, documentStatus: "PENDING_DOCUMENT", matchedAt: "2026-03-01T10:01:00Z", createdAt: "2026-03-01T10:00:00Z" },
  { id: "cct-2", bankTransactionId: "bt-2", employeeId: "u1", creditCardId: "cc-1", cardLast4: "1111", billingCycle: "2026-03", employeeCode: "EMP001", merchantName: "MARRIOTT HOTEL BKK", merchantCity: "Bangkok", merchantCountry: "TH", transactionDate: "2026-03-01", postingDate: "2026-03-02", amount: 3500, currency: "THB", mccCode: "7011", mccDescription: "Hotels and Motels", category: "Travel", importStatus: null, transactionType: "PURCHASE", authorizationCode: "A002", referenceNumber: "REF002", cardholderName: "Somchai Jaidee", transactionAmount: 3500, transactionCurrency: "THB", fileId: "f1", importSource: "MANUAL", status: "REQUIRES_APPROVAL", policyResult: "REQUIRES_APPROVAL", policyReason: "Requires manager approval", policyThresholdAmount: null, batchId: null, rawCardholderEmployeeId: null, unmatchedReason: null, adminReviewRequired: false, adminReviewComment: null, documentStatus: "PENDING_DOCUMENT", matchedAt: "2026-03-01T10:01:00Z", createdAt: "2026-03-01T10:05:00Z" },
  { id: "cct-3", bankTransactionId: "bt-4", employeeId: "u1", creditCardId: "cc-1", cardLast4: "1111", billingCycle: "2026-03", employeeCode: "EMP001", merchantName: "Siam Amazing Park", merchantCity: "Bangkok", merchantCountry: "TH", transactionDate: "2026-03-03", postingDate: "2026-03-04", amount: 7900, currency: "THB", mccCode: "7996", mccDescription: "Amusement Parks", category: "Entertainment", importStatus: null, transactionType: "PURCHASE", authorizationCode: "A004", referenceNumber: "REF004", cardholderName: "Somchai Jaidee", transactionAmount: 7900, transactionCurrency: "THB", fileId: "f1", importSource: "MANUAL", status: "AUTO_REJECTED", policyResult: "AUTO_REJECTED", policyReason: "Amusement Parks not allowed", policyThresholdAmount: null, batchId: null, rawCardholderEmployeeId: null, unmatchedReason: null, adminReviewRequired: false, adminReviewComment: null, documentStatus: "PENDING_DOCUMENT", matchedAt: "2026-03-03T14:01:00Z", createdAt: "2026-03-03T14:00:00Z" },
  { id: "cct-4", bankTransactionId: "bt-5", employeeId: "u1", creditCardId: "cc-1", cardLast4: "1111", billingCycle: "2026-03", employeeCode: "EMP001", merchantName: "THAI AIRWAYS", merchantCity: "Bangkok", merchantCountry: "TH", transactionDate: "2026-03-04", postingDate: "2026-03-05", amount: 15000, currency: "THB", mccCode: "3000", mccDescription: "Airlines", category: "Travel", importStatus: null, transactionType: "PURCHASE", authorizationCode: "A005", referenceNumber: "REF005", cardholderName: "Somchai Jaidee", transactionAmount: 15000, transactionCurrency: "THB", fileId: "f1", importSource: "MANUAL", status: "REQUIRES_APPROVAL", policyResult: "REQUIRES_APPROVAL", policyReason: "Requires manager approval", policyThresholdAmount: null, batchId: null, rawCardholderEmployeeId: null, unmatchedReason: null, adminReviewRequired: false, adminReviewComment: null, documentStatus: "PENDING_DOCUMENT", matchedAt: "2026-03-04T08:31:00Z", createdAt: "2026-03-04T08:30:00Z" },
  { id: "cct-5", bankTransactionId: "bt-7", employeeId: "u1", creditCardId: "cc-1", cardLast4: "1111", billingCycle: "2026-03", employeeCode: "EMP001", merchantName: "KFC", merchantCity: "Bangkok", merchantCountry: "TH", transactionDate: "2026-03-06", postingDate: "2026-03-07", amount: 279, currency: "THB", mccCode: "5814", mccDescription: "Fast Food Restaurants", category: "Meals", importStatus: null, transactionType: "PURCHASE", authorizationCode: "A007", referenceNumber: "REF007", cardholderName: "Somchai Jaidee", transactionAmount: 279, transactionCurrency: "THB", fileId: "f2", importSource: "MANUAL", status: "AUTO_APPROVED", policyResult: "AUTO_APPROVED", policyReason: "Amount under threshold", policyThresholdAmount: 500, batchId: null, rawCardholderEmployeeId: null, unmatchedReason: null, adminReviewRequired: false, adminReviewComment: null, documentStatus: "PENDING_DOCUMENT", matchedAt: "2026-03-06T12:16:00Z", createdAt: "2026-03-06T12:15:00Z" },
  { id: "cct-6", bankTransactionId: "bt-8", employeeId: "u1", creditCardId: "cc-1", cardLast4: "1111", billingCycle: "2026-03", employeeCode: "EMP001", merchantName: "Stone Hill Golf Club", merchantCity: "Chiang Mai", merchantCountry: "TH", transactionDate: "2026-03-07", postingDate: "2026-03-08", amount: 55000, currency: "THB", mccCode: "7941", mccDescription: "Sporting and Recreational Camps", category: "Entertainment", importStatus: null, transactionType: "PURCHASE", authorizationCode: "A008", referenceNumber: "REF008", cardholderName: "Somchai Jaidee", transactionAmount: 55000, transactionCurrency: "THB", fileId: "f2", importSource: "MANUAL", status: "AUTO_REJECTED", policyResult: "AUTO_REJECTED", policyReason: "Golf/Recreation not allowed", policyThresholdAmount: null, batchId: null, rawCardholderEmployeeId: null, unmatchedReason: null, adminReviewRequired: false, adminReviewComment: null, documentStatus: "PENDING_DOCUMENT", matchedAt: "2026-03-07T15:01:00Z", createdAt: "2026-03-07T15:00:00Z" },
  { id: "cct-7", bankTransactionId: "bt-3", employeeId: "u2", creditCardId: null, cardLast4: "", billingCycle: "2026-03", employeeCode: "EMP002", merchantName: "STARBUCKS", merchantCity: "Bangkok", merchantCountry: "TH", transactionDate: "2026-03-02", postingDate: "2026-03-03", amount: 850, currency: "THB", mccCode: "5812", mccDescription: "Eating Places and Restaurants", category: "Meals", importStatus: null, transactionType: "PURCHASE", authorizationCode: "A003", referenceNumber: "REF003", cardholderName: "Somying Kaewsai", transactionAmount: 850, transactionCurrency: "THB", fileId: "f1", importSource: "MANUAL", status: "AUTO_APPROVED", policyResult: "AUTO_APPROVED", policyReason: "Amount under threshold", policyThresholdAmount: 1500, batchId: null, rawCardholderEmployeeId: null, unmatchedReason: null, adminReviewRequired: false, adminReviewComment: null, documentStatus: "VERIFIED", matchedAt: "2026-03-02T09:01:00Z", createdAt: "2026-03-02T09:00:00Z" },
  { id: "cct-8", bankTransactionId: "bt-9", employeeId: "u1", creditCardId: "cc-1", cardLast4: "1111", billingCycle: "2026-03", employeeCode: "EMP001", merchantName: "AVIS RENT A CAR", merchantCity: "Pattaya", merchantCountry: "TH", transactionDate: "2026-03-10", postingDate: "2026-03-11", amount: 9200, currency: "THB", mccCode: "7512", mccDescription: "Car Rental Agencies", category: "Transportation", importStatus: null, transactionType: "PURCHASE", authorizationCode: "A009", referenceNumber: "REF009", cardholderName: "Somchai Jaidee", transactionAmount: 9200, transactionCurrency: "THB", fileId: "f2", importSource: "MANUAL", status: "REQUIRES_APPROVAL", policyResult: "REQUIRES_APPROVAL", policyReason: "Requires manager approval", policyThresholdAmount: null, batchId: null, rawCardholderEmployeeId: null, unmatchedReason: null, adminReviewRequired: false, adminReviewComment: null, documentStatus: "PENDING_DOCUMENT", matchedAt: "2026-03-10T09:46:00Z", createdAt: "2026-03-10T09:45:00Z" },
  // Returned for Info transactions — April 2026
  { id: "cct-rfi1", bankTransactionId: "bt-rfi1", employeeId: "u1", creditCardId: "cc-1", cardLast4: "1111", billingCycle: "2026-04", employeeCode: "EMP001", merchantName: "GRAB TAXI", merchantCity: "Bangkok", merchantCountry: "TH", transactionDate: "2026-04-01", postingDate: "2026-04-02", amount: 1500, currency: "THB", mccCode: "4121", mccDescription: "Taxicabs and Limousines", category: "Transportation", importStatus: null, transactionType: "PURCHASE", authorizationCode: "B001", referenceNumber: "REFRFI01", cardholderName: "Somchai Jaidee", transactionAmount: 1500, transactionCurrency: "THB", fileId: "f4", importSource: "MANUAL", status: "PENDING_APPROVAL", policyResult: "REQUIRES_APPROVAL", policyReason: "Requires manager approval", policyThresholdAmount: null, batchId: null, rawCardholderEmployeeId: null, unmatchedReason: null, adminReviewRequired: false, adminReviewComment: null, documentStatus: "PENDING_DOCUMENT", matchedAt: "2026-04-01T10:00:00Z", createdAt: "2026-04-01T10:00:00Z", _claimStatus: "RETURNED_FOR_INFO" },
  { id: "cct-rfi2", bankTransactionId: "bt-rfi2", employeeId: "u1", creditCardId: "cc-1", cardLast4: "1111", billingCycle: "2026-04", employeeCode: "EMP001", merchantName: "MARRIOTT HOTEL BKK", merchantCity: "Bangkok", merchantCountry: "TH", transactionDate: "2026-04-02", postingDate: "2026-04-03", amount: 3500, currency: "THB", mccCode: "7011", mccDescription: "Hotels and Motels", category: "Travel", importStatus: null, transactionType: "PURCHASE", authorizationCode: "B002", referenceNumber: "REFRFI02", cardholderName: "Somchai Jaidee", transactionAmount: 3500, transactionCurrency: "THB", fileId: "f4", importSource: "MANUAL", status: "PENDING_APPROVAL", policyResult: "REQUIRES_APPROVAL", policyReason: "Requires manager approval", policyThresholdAmount: null, batchId: null, rawCardholderEmployeeId: null, unmatchedReason: null, adminReviewRequired: false, adminReviewComment: null, documentStatus: "PENDING_DOCUMENT", matchedAt: "2026-04-02T10:00:00Z", createdAt: "2026-04-02T10:00:00Z", _claimStatus: "RETURNED_FOR_INFO" },
  { id: "cct-rfi3", bankTransactionId: "bt-rfi3", employeeId: "u1", creditCardId: "cc-1", cardLast4: "1111", billingCycle: "2026-04", employeeCode: "EMP001", merchantName: "STARBUCKS", merchantCity: "Bangkok", merchantCountry: "TH", transactionDate: "2026-04-03", postingDate: "2026-04-04", amount: 850, currency: "THB", mccCode: "5812", mccDescription: "Eating Places and Restaurants", category: "Meals", importStatus: null, transactionType: "PURCHASE", authorizationCode: "B003", referenceNumber: "REFRFI03", cardholderName: "Somchai Jaidee", transactionAmount: 850, transactionCurrency: "THB", fileId: "f4", importSource: "MANUAL", status: "PENDING_APPROVAL", policyResult: "REQUIRES_APPROVAL", policyReason: "Requires manager approval", policyThresholdAmount: null, batchId: null, rawCardholderEmployeeId: null, unmatchedReason: null, adminReviewRequired: false, adminReviewComment: null, documentStatus: "VALIDATED", matchedAt: "2026-04-03T10:00:00Z", createdAt: "2026-04-03T10:00:00Z", _claimStatus: "RETURNED_FOR_INFO" },
  { id: "cct-rfi4", bankTransactionId: "bt-rfi4", employeeId: "u1", creditCardId: "cc-1", cardLast4: "1111", billingCycle: "2026-04", employeeCode: "EMP001", merchantName: "Siam Amazing Park", merchantCity: "Bangkok", merchantCountry: "TH", transactionDate: "2026-04-04", postingDate: "2026-04-05", amount: 7900, currency: "THB", mccCode: "7996", mccDescription: "Amusement Parks", category: "Entertainment", importStatus: null, transactionType: "PURCHASE", authorizationCode: "B004", referenceNumber: "REFRFI04", cardholderName: "Somchai Jaidee", transactionAmount: 7900, transactionCurrency: "THB", fileId: "f4", importSource: "MANUAL", status: "PENDING_APPROVAL", policyResult: "REQUIRES_APPROVAL", policyReason: "Requires manager approval", policyThresholdAmount: null, batchId: null, rawCardholderEmployeeId: null, unmatchedReason: null, adminReviewRequired: false, adminReviewComment: null, documentStatus: "PENDING_DOCUMENT", matchedAt: "2026-04-04T10:00:00Z", createdAt: "2026-04-04T10:00:00Z", _claimStatus: "RETURNED_FOR_INFO" },
  { id: "cct-rfi5", bankTransactionId: "bt-rfi5", employeeId: "u1", creditCardId: "cc-1", cardLast4: "1111", billingCycle: "2026-04", employeeCode: "EMP001", merchantName: "THAI AIRWAYS", merchantCity: "Bangkok", merchantCountry: "TH", transactionDate: "2026-04-05", postingDate: "2026-04-06", amount: 15000, currency: "THB", mccCode: "3000", mccDescription: "Airlines", category: "Travel", importStatus: null, transactionType: "PURCHASE", authorizationCode: "B005", referenceNumber: "REFRFI05", cardholderName: "Somchai Jaidee", transactionAmount: 15000, transactionCurrency: "THB", fileId: "f4", importSource: "MANUAL", status: "PENDING_APPROVAL", policyResult: "REQUIRES_APPROVAL", policyReason: "Requires manager approval", policyThresholdAmount: null, batchId: null, rawCardholderEmployeeId: null, unmatchedReason: null, adminReviewRequired: false, adminReviewComment: null, documentStatus: "SUBMITTED", matchedAt: "2026-04-05T10:00:00Z", createdAt: "2026-04-05T10:00:00Z", _claimStatus: "RETURNED_FOR_INFO" },
  { id: "cct-rfi6", bankTransactionId: "bt-rfi6", employeeId: "u1", creditCardId: "cc-1", cardLast4: "1111", billingCycle: "2026-04", employeeCode: "EMP001", merchantName: "CENTRAL DEPARTMENT", merchantCity: "Bangkok", merchantCountry: "TH", transactionDate: "2026-04-06", postingDate: "2026-04-07", amount: 2300, currency: "THB", mccCode: "5311", mccDescription: "Department Stores", category: "Shopping", importStatus: null, transactionType: "PURCHASE", authorizationCode: "B006", referenceNumber: "REFRFI06", cardholderName: "Somchai Jaidee", transactionAmount: 2300, transactionCurrency: "THB", fileId: "f4", importSource: "MANUAL", status: "PENDING_APPROVAL", policyResult: "REQUIRES_APPROVAL", policyReason: "Requires manager approval", policyThresholdAmount: null, batchId: null, rawCardholderEmployeeId: null, unmatchedReason: null, adminReviewRequired: false, adminReviewComment: null, documentStatus: "PENDING_DOCUMENT", matchedAt: "2026-04-06T10:00:00Z", createdAt: "2026-04-06T10:00:00Z", _claimStatus: "RETURNED_FOR_INFO" },
  { id: "cct-rfi7", bankTransactionId: "bt-rfi7", employeeId: "u1", creditCardId: "cc-1", cardLast4: "1111", billingCycle: "2026-04", employeeCode: "EMP001", merchantName: "KFC", merchantCity: "Bangkok", merchantCountry: "TH", transactionDate: "2026-04-07", postingDate: "2026-04-08", amount: 279, currency: "THB", mccCode: "5814", mccDescription: "Fast Food Restaurants", category: "Meals", importStatus: null, transactionType: "PURCHASE", authorizationCode: "B007", referenceNumber: "REFRFI07", cardholderName: "Somchai Jaidee", transactionAmount: 279, transactionCurrency: "THB", fileId: "f4", importSource: "MANUAL", status: "PENDING_APPROVAL", policyResult: "REQUIRES_APPROVAL", policyReason: "Requires manager approval", policyThresholdAmount: null, batchId: null, rawCardholderEmployeeId: null, unmatchedReason: null, adminReviewRequired: false, adminReviewComment: null, documentStatus: "PENDING_DOCUMENT", matchedAt: "2026-04-07T10:00:00Z", createdAt: "2026-04-07T10:00:00Z", _claimStatus: "RETURNED_FOR_INFO" },
];

// MCC Policies
const mccPoliciesStore: MccPolicyMaster[] = [
  { id: "pol-1", mcc_code: "4121", description: "Taxicabs and Limousines", mcc_code_description: "Taxicabs/Limousines", policy_category: "", policy_type: "AUTO_APPROVE", threshold_amount: 2000, currency: "THB", active_flag: true, expense_type_id: "et-1", sub_expense_type_id: "set-1", expense_type_name: "Transportation", sub_expense_type_name: "Taxi", created_at: "2026-01-01", updated_at: "2026-01-01" },
  { id: "pol-2", mcc_code: "7011", description: "Hotels and Motels", mcc_code_description: "Hotels/Motels", policy_category: "", policy_type: "REQUIRES_APPROVAL", threshold_amount: null, currency: "THB", active_flag: true, expense_type_id: "et-2", sub_expense_type_id: "set-2", expense_type_name: "Travel", sub_expense_type_name: "Accommodation", created_at: "2026-01-01", updated_at: "2026-01-01" },
  { id: "pol-3", mcc_code: "5812", description: "Eating Places and Restaurants", mcc_code_description: "Restaurants", policy_category: "", policy_type: "AUTO_APPROVE", threshold_amount: 1500, currency: "THB", active_flag: true, expense_type_id: "et-3", sub_expense_type_id: "set-3", expense_type_name: "Meals", sub_expense_type_name: "Business Meals", created_at: "2026-01-01", updated_at: "2026-01-01" },
  { id: "pol-4", mcc_code: "5814", description: "Fast Food Restaurants", mcc_code_description: "Fast Food", policy_category: "", policy_type: "AUTO_APPROVE", threshold_amount: 500, currency: "THB", active_flag: true, expense_type_id: "et-3", sub_expense_type_id: "set-4", expense_type_name: "Meals", sub_expense_type_name: "Fast Food", created_at: "2026-01-01", updated_at: "2026-01-01" },
  { id: "pol-5", mcc_code: "3000", description: "Airlines", mcc_code_description: "Airlines", policy_category: "", policy_type: "REQUIRES_APPROVAL", threshold_amount: null, currency: "THB", active_flag: true, expense_type_id: "et-2", sub_expense_type_id: "set-5", expense_type_name: "Travel", sub_expense_type_name: "Air Travel", created_at: "2026-01-01", updated_at: "2026-01-01" },
  { id: "pol-6", mcc_code: "7996", description: "Amusement Parks", mcc_code_description: "Amusement Parks", policy_category: "", policy_type: "AUTO_REJECT", threshold_amount: null, currency: "THB", active_flag: true, expense_type_id: "et-4", sub_expense_type_id: null, expense_type_name: "Entertainment", sub_expense_type_name: null, created_at: "2026-01-01", updated_at: "2026-01-01" },
  { id: "pol-7", mcc_code: "7941", description: "Sporting and Recreational Camps", mcc_code_description: "Golf/Sports Clubs", policy_category: "", policy_type: "AUTO_REJECT", threshold_amount: null, currency: "THB", active_flag: true, expense_type_id: "et-4", sub_expense_type_id: null, expense_type_name: "Entertainment", sub_expense_type_name: null, created_at: "2026-01-01", updated_at: "2026-01-01" },
  { id: "pol-8", mcc_code: "7512", description: "Car Rental Agencies", mcc_code_description: "Car Rental", policy_category: "", policy_type: "REQUIRES_APPROVAL", threshold_amount: null, currency: "THB", active_flag: true, expense_type_id: "et-1", sub_expense_type_id: "set-6", expense_type_name: "Transportation", sub_expense_type_name: "Car Rental", created_at: "2026-01-01", updated_at: "2026-01-01" },
  { id: "pol-9", mcc_code: "7999", description: "Tourist Attractions", mcc_code_description: "Tourist Attractions", policy_category: "", policy_type: "AUTO_REJECT", threshold_amount: null, currency: "THB", active_flag: true, expense_type_id: "et-4", sub_expense_type_id: null, expense_type_name: "Entertainment", sub_expense_type_name: null, created_at: "2026-01-01", updated_at: "2026-01-01" },
  { id: "pol-10", mcc_code: "8062", description: "Hospitals", mcc_code_description: "Hospitals", policy_category: "", policy_type: "REQUIRES_APPROVAL", threshold_amount: null, currency: "THB", active_flag: true, expense_type_id: "et-5", sub_expense_type_id: null, expense_type_name: "Medical", sub_expense_type_name: null, created_at: "2026-01-01", updated_at: "2026-01-01" },
];

// Document Types
const documentTypesStore: Record<string, unknown>[] = [
  { id: "dt-1", documentName: "Tax Invoice", isSupportDocument: false, ocrVerification: true, active: true, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "dt-2", documentName: "Receipt", isSupportDocument: false, ocrVerification: true, active: true, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "dt-3", documentName: "Boarding Pass", isSupportDocument: true, ocrVerification: false, active: true, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "dt-4", documentName: "Hotel Folio", isSupportDocument: false, ocrVerification: true, active: true, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "dt-5", documentName: "Quotation", isSupportDocument: true, ocrVerification: false, active: true, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "dt-6", documentName: "Approval Form", isSupportDocument: true, ocrVerification: false, active: false, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
];

// Expense Types
const expenseTypesStore: Record<string, unknown>[] = [
  { id: "et-1", expenseType: "Transportation", active: true, subtypes: [
    { id: "set-1", subExpenseType: "Taxi", accountNameEn: "Transport - Taxi", accountCode: "6101", active: true, updatedAt: "2026-01-01", documentTypes: [{ documentType: { id: "dt-1", documentName: "Tax Invoice", isSupportDocument: false } }, { documentType: { id: "dt-2", documentName: "Receipt", isSupportDocument: false } }] },
    { id: "set-6", subExpenseType: "Car Rental", accountNameEn: "Transport - Car Rental", accountCode: "6102", active: true, updatedAt: "2026-01-01", documentTypes: [{ documentType: { id: "dt-1", documentName: "Tax Invoice", isSupportDocument: false } }, { documentType: { id: "dt-2", documentName: "Receipt", isSupportDocument: false } }, { documentType: { id: "dt-5", documentName: "Quotation", isSupportDocument: true } }] },
  ], updatedAt: "2026-01-01" },
  { id: "et-2", expenseType: "Travel", active: true, subtypes: [
    { id: "set-2", subExpenseType: "Accommodation", accountNameEn: "Travel - Accommodation", accountCode: "6201", active: true, updatedAt: "2026-01-01", documentTypes: [{ documentType: { id: "dt-1", documentName: "Tax Invoice", isSupportDocument: false } }, { documentType: { id: "dt-4", documentName: "Hotel Folio", isSupportDocument: false } }] },
    { id: "set-5", subExpenseType: "Air Travel", accountNameEn: "Travel - Air", accountCode: "6202", active: true, updatedAt: "2026-01-01", documentTypes: [{ documentType: { id: "dt-1", documentName: "Tax Invoice", isSupportDocument: false } }, { documentType: { id: "dt-3", documentName: "Boarding Pass", isSupportDocument: true } }] },
  ], updatedAt: "2026-01-01" },
  { id: "et-3", expenseType: "Meals", active: true, subtypes: [
    { id: "set-3", subExpenseType: "Business Meals", accountNameEn: "Meals - Business", accountCode: "6301", active: true, updatedAt: "2026-01-01", documentTypes: [{ documentType: { id: "dt-1", documentName: "Tax Invoice", isSupportDocument: false } }, { documentType: { id: "dt-2", documentName: "Receipt", isSupportDocument: false } }] },
    { id: "set-4", subExpenseType: "Fast Food", accountNameEn: "Meals - Fast Food", accountCode: "6302", active: true, updatedAt: "2026-01-01", documentTypes: [{ documentType: { id: "dt-2", documentName: "Receipt", isSupportDocument: false } }] },
  ], updatedAt: "2026-01-01" },
  { id: "et-4", expenseType: "Entertainment", active: true, subtypes: [], updatedAt: "2026-01-01" },
  { id: "et-5", expenseType: "Medical", active: true, subtypes: [], updatedAt: "2026-01-01" },
  { id: "et-6", expenseType: "Office Supplies", active: true, subtypes: [
    { id: "set-7", subExpenseType: "Stationery", accountNameEn: "Office - Stationery", accountCode: "6501", active: true, updatedAt: "2026-01-01", documentTypes: [{ documentType: { id: "dt-1", documentName: "Tax Invoice", isSupportDocument: false } }, { documentType: { id: "dt-2", documentName: "Receipt", isSupportDocument: false } }] },
  ], updatedAt: "2026-01-01" },
];

// GL Accounts
const glAccountsStore: Record<string, unknown>[] = [
  { id: "gl-1", accountCode: "6101", accountName: "Transport - Taxi", expenseTypeId: "et-1", expenseSubtypeId: "set-1", active: true, updatedAt: "2026-01-01", expenseType: { id: "et-1", expenseType: "Transportation", subtypes: [{ id: "set-1", subExpenseType: "Taxi" }, { id: "set-6", subExpenseType: "Car Rental" }] }, expenseSubtype: { id: "set-1", subExpenseType: "Taxi" } },
  { id: "gl-2", accountCode: "6102", accountName: "Transport - Car Rental", expenseTypeId: "et-1", expenseSubtypeId: "set-6", active: true, updatedAt: "2026-01-01", expenseType: { id: "et-1", expenseType: "Transportation", subtypes: [{ id: "set-1", subExpenseType: "Taxi" }, { id: "set-6", subExpenseType: "Car Rental" }] }, expenseSubtype: { id: "set-6", subExpenseType: "Car Rental" } },
  { id: "gl-3", accountCode: "6201", accountName: "Travel - Accommodation", expenseTypeId: "et-2", expenseSubtypeId: "set-2", active: true, updatedAt: "2026-01-01", expenseType: { id: "et-2", expenseType: "Travel", subtypes: [{ id: "set-2", subExpenseType: "Accommodation" }, { id: "set-5", subExpenseType: "Air Travel" }] }, expenseSubtype: { id: "set-2", subExpenseType: "Accommodation" } },
  { id: "gl-4", accountCode: "6202", accountName: "Travel - Air", expenseTypeId: "et-2", expenseSubtypeId: "set-5", active: true, updatedAt: "2026-01-01", expenseType: { id: "et-2", expenseType: "Travel", subtypes: [{ id: "set-2", subExpenseType: "Accommodation" }, { id: "set-5", subExpenseType: "Air Travel" }] }, expenseSubtype: { id: "set-5", subExpenseType: "Air Travel" } },
  { id: "gl-5", accountCode: "6301", accountName: "Meals - Business", expenseTypeId: "et-3", expenseSubtypeId: "set-3", active: true, updatedAt: "2026-01-01", expenseType: { id: "et-3", expenseType: "Meals", subtypes: [{ id: "set-3", subExpenseType: "Business Meals" }, { id: "set-4", subExpenseType: "Fast Food" }] }, expenseSubtype: { id: "set-3", subExpenseType: "Business Meals" } },
  { id: "gl-6", accountCode: "6302", accountName: "Meals - Fast Food", expenseTypeId: "et-3", expenseSubtypeId: "set-4", active: true, updatedAt: "2026-01-01", expenseType: { id: "et-3", expenseType: "Meals", subtypes: [{ id: "set-3", subExpenseType: "Business Meals" }, { id: "set-4", subExpenseType: "Fast Food" }] }, expenseSubtype: { id: "set-4", subExpenseType: "Fast Food" } },
  { id: "gl-7", accountCode: "6501", accountName: "Office - Stationery", expenseTypeId: "et-6", expenseSubtypeId: "set-7", active: true, updatedAt: "2026-01-01", expenseType: { id: "et-6", expenseType: "Office Supplies", subtypes: [{ id: "set-7", subExpenseType: "Stationery" }] }, expenseSubtype: { id: "set-7", subExpenseType: "Stationery" } },
  { id: "gl-8", accountCode: "9999", accountName: "Miscellaneous", expenseTypeId: null, expenseSubtypeId: null, active: true, updatedAt: "2026-01-01", expenseType: null, expenseSubtype: null },
];

// Entities
const entitiesStore: Record<string, unknown>[] = [
  { id: "ent-1", companyCode: "ABC001", legalNameTh: "บริษัท เอบีซี จำกัด", legalNameEn: "ABC Co., Ltd.", effectiveStartDate: "2026-01-01", effectiveEndDate: "2030-12-31", status: "ACTIVE", lastUpdated: "2026-03-01",
    taxIds: [{ id: "tid-1", taxId: "0105500000001", branchType: "HEAD_OFFICE", branchNo: "00000", isPrimary: true }],
    nameAliases: [{ id: "na-1", alias: "ABC" }],
    addresses: [{ id: "addr-1", language: "TH", addressLine1: "123 ถนนพระรามที่ 4", subdistrict: "คลองเตย", district: "คลองเตย", province: "กรุงเทพมหานคร", postalCode: "10110", country: "Thailand" }, { id: "addr-2", language: "EN", addressLine1: "123 Rama IV Road", subdistrict: "Khlong Toei", district: "Khlong Toei", province: "Bangkok", postalCode: "10110", country: "Thailand" }],
    addressAliases: [] },
  { id: "ent-2", companyCode: "CPA002", legalNameTh: "บริษัท ซีพี แอ็กซ์ตร้า จำกัด (มหาชน)", legalNameEn: "CP Axtra Co., Ltd.", effectiveStartDate: "2026-01-01", effectiveEndDate: "2030-12-31", status: "ACTIVE", lastUpdated: "2026-02-15",
    taxIds: [{ id: "tid-2", taxId: "0105500000002", branchType: "HEAD_OFFICE", branchNo: "00000", isPrimary: true }],
    nameAliases: [{ id: "na-2", alias: "CP Axtra" }, { id: "na-3", alias: "Makro" }],
    addresses: [{ id: "addr-3", language: "TH", addressLine1: "97 ถนนติวานนท์", subdistrict: "บางตลาด", district: "ปากเกร็ด", province: "นนทบุรี", postalCode: "11120", country: "Thailand" }, { id: "addr-4", language: "EN", addressLine1: "97 Tiwanon Road", subdistrict: "Bang Talat", district: "Pak Kret", province: "Nonthaburi", postalCode: "11120", country: "Thailand" }],
    addressAliases: [] },
  { id: "ent-3", companyCode: "DEM003", legalNameTh: "บริษัท เดโม จำกัด", legalNameEn: "Demo Corp Ltd.", effectiveStartDate: "2025-06-01", effectiveEndDate: "2026-12-31", status: "INACTIVE", lastUpdated: "2026-01-01",
    taxIds: [{ id: "tid-3", taxId: "0105500000003", branchType: "HEAD_OFFICE", branchNo: "00000", isPrimary: true }],
    nameAliases: [], addresses: [], addressAliases: [] },
];

// Employees (extends mock-data users with additional fields)
const employeesStore = [
  { id: "u1", employeeCode: "EMP001", name: "Somchai Jaidee", email: "somchai@company.com", roles: ["Cardholder"], branch: "Bangkok", department: "Sales", costCenter: "CC-SALES-01", position: "Sales Executive", telephone: "02-123-4567", active: true, entityId: "ent-1", managerId: "u2", managerName: "Somying Kaewsai", creditCards: [{ id: "cc-1", cardNumber: "4111111111111111", last4: "1111", cardType: "VISA", bank: "Bangkok Bank", expiryDate: "2028-12", active: true }], approvalLevels: [{ level: 1, approverId: "u2", approverName: "Somying Kaewsai" }] },
  { id: "u2", employeeCode: "EMP002", name: "Somying Kaewsai", email: "somying@company.com", roles: ["Cardholder", "Approver"], branch: "Bangkok", department: "Sales", costCenter: "CC-SALES-01", position: "Sales Manager", active: true, entityId: "ent-1", managerId: "u5", managerName: "Thana Pitak", creditCards: [], approvalLevels: [{ level: 1, approverId: "u5", approverName: "Thana Pitak" }] },
  { id: "u3", employeeCode: "EMP003", name: "Wichai Charoen", email: "wichai@company.com", roles: ["Cardholder"], branch: "Chiang Mai", department: "Engineering", costCenter: "CC-ENG-01", position: "Software Engineer", active: true, entityId: "ent-1", managerId: "u5", managerName: "Thana Pitak", creditCards: [{ id: "cc-2", cardNumber: "5200000000001005", last4: "1005", cardType: "MASTERCARD", bank: "Kasikorn Bank", expiryDate: "2027-06", active: true }], approvalLevels: [{ level: 1, approverId: "u5", approverName: "Thana Pitak" }] },
  { id: "u4", employeeCode: "ACC001", name: "Pim Dee", email: "pim@company.com", roles: ["Cardholder"], branch: "Bangkok", department: "Finance", costCenter: "CC-FIN-01", position: "Senior Accountant", active: true, entityId: "ent-2", managerId: null, managerName: null, creditCards: [], approvalLevels: [] },
  { id: "u5", employeeCode: "MGR001", name: "Thana Pitak", email: "thana@company.com", roles: ["Admin"], branch: "Bangkok", department: "Management", costCenter: "CC-MGT-01", position: "Director", active: true, entityId: "ent-2", managerId: null, managerName: null, creditCards: [], approvalLevels: [] },
  { id: "u6", employeeCode: "SUP001", name: "Nattapong Srisuk", email: "nattapong@company.com", roles: ["Admin", "Approver", "Cardholder"], branch: "Bangkok", department: "Management", costCenter: "CC-MGT-01", position: "VP Operations", active: true, entityId: "ent-1", managerId: null, managerName: null, creditCards: [{ id: "cc-3", cardNumber: "4111111111113333", last4: "3333", cardType: "VISA", bank: "Krungthai Bank", expiryDate: "2028-06", active: true }], approvalLevels: [] },
];

// Roles
const rolesStore: Record<string, unknown>[] = [
  { id: "role-1", name: "Cardholder", description: "Can submit and manage own expense claims", isActive: true, isSystem: true, permissions: [
    { id: "p-1", code: "claims:create", name: "Submit Claims", module: "claims", description: "Submit expense claims" },
    { id: "p-2", code: "claims:read", name: "View Own Claims", module: "claims", description: "View own expense claims" },
  ], userCount: 1, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "role-2", name: "Approver", description: "Can approve/reject expense claims", isActive: true, isSystem: true, permissions: [
    { id: "p-1", code: "claims:create", name: "Submit Claims", module: "claims", description: "Submit expense claims" },
    { id: "p-2", code: "claims:read", name: "View Own Claims", module: "claims", description: "View own expense claims" },
    { id: "p-4", code: "claims:approve", name: "Approve Claims", module: "claims", description: "Approve expense claims" },
    { id: "p-8", code: "claims:team-read", name: "View Team Claims", module: "claims", description: "View team expense claims" },
  ], userCount: 1, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: "role-3", name: "Admin", description: "Full system access", isActive: true, isSystem: true, permissions: [
    { id: "p-99", code: "*", name: "Full Access", module: "system", description: "Full system access" },
  ], userCount: 5, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
];

const allPermissions = [
  { id: "p-1", code: "claims:create", name: "Submit Claims", module: "claims", description: "Submit expense claims" },
  { id: "p-2", code: "claims:read", name: "View Own Claims", module: "claims", description: "View own expense claims" },
  { id: "p-4", code: "claims:approve", name: "Approve Claims", module: "claims", description: "Approve expense claims" },
  { id: "p-8", code: "claims:team-read", name: "View Team Claims", module: "claims", description: "View team expense claims" },
  { id: "p-99", code: "*", name: "Full Access", module: "system", description: "Full system access" },
];

// OCR Config
let ocrConfigStore = {
  id: "ocr-1",
  amountToleranceThb: 10,
  amountTolerancePercent: 5,
  dateToleranceDays: 3,
  updatedAt: "2026-01-01",
};

// Notification settings
const notificationSettingsStore = [
  { id: "ns-1", type: "PENDING_DOCUMENTS", enabled: true, daysBefore: 3, emailTemplate: "pending_docs", recipients: "cardholder", updatedAt: "2026-01-01" },
  { id: "ns-2", type: "PENDING_APPROVAL", enabled: true, daysBefore: 2, emailTemplate: "pending_approval", recipients: "approver", updatedAt: "2026-01-01" },
  { id: "ns-3", type: "MONTH_END_REPORT", enabled: false, daysBefore: 5, emailTemplate: "month_end", recipients: "accounting", updatedAt: "2026-01-01" },
];

// Notifications
const notificationsStore = [
  { id: "n-1", userId: "u1", title: "New transaction matched", message: "GRAB TAXI transaction of 1,500 THB has been matched to your card.", read: false, createdAt: "2026-03-01T10:05:00Z", type: "TRANSACTION" },
  { id: "n-2", userId: "u1", title: "Claim auto-approved", message: "Your claim TXN20260227071 (Top) has been auto-approved.", read: false, createdAt: "2026-02-27T14:00:00Z", type: "CLAIM" },
  { id: "n-3", userId: "u1", title: "Document required", message: "Please upload receipt for claim TXN20250129002 (MARRIOTT HOTEL BKK).", read: true, createdAt: "2026-02-28T09:00:00Z", type: "DOCUMENT" },
  { id: "n-4", userId: "u2", title: "New claim for approval", message: "Somchai Jaidee submitted claim TXN20260301001 (THAI AIRWAYS) for your approval.", read: false, createdAt: "2026-03-01T11:00:00Z", type: "APPROVAL" },
];

// Claims store for approval inbox
const claimsStore = [
  // ...imported via mockClaims in mock-data.ts — we reference them by endpoint matching
];

// Documents store
const documentsStore: Record<string, unknown>[] = [];

// ─── Helper functions ───

function delay(ms = 50): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function paginate<T>(items: T[], page = 1, limit = 20): { items: T[]; meta: { total: number; page: number; limit: number; totalPages: number } } {
  const total = items.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const start = (page - 1) * limit;
  return {
    items: items.slice(start, start + limit),
    meta: { total, page, limit, totalPages },
  };
}

// Convert snake_case bank transaction to camelCase (what hooks expect from API)
function bankTxnToCamel(t: CorpBankTxn) {
  return {
    id: t.id, fileId: t.file_id, transactionId: t.transaction_id,
    cardholderEmployeeId: t.cardholder_employee_id, cardholderName: t.cardholder_name,
    transactionDate: t.transaction_date, postingDate: t.posting_date,
    billingAmount: t.billing_amount, billingCurrency: t.billing_currency,
    merchantName: t.merchant_name, merchantCity: t.merchant_city, merchantCountry: t.merchant_country,
    mccCode: t.mcc_code, mccDescription: t.mcc_description, category: t.category ?? '',
    importStatus: t.import_status ?? null, transactionType: t.transaction_type,
    authorizationCode: t.authorization_code, referenceNumber: t.reference_number,
    policyResult: t.policy_result, policyReason: t.policy_reason,
    processingStatus: t.processing_status, createdAt: t.created_at,
    cardNumber: t.card_number ?? null, last4Digit: t.last_4_digit ?? null,
    transactionAmount: t.transaction_amount ?? null, transactionCurrency: t.transaction_currency ?? null,
  };
}

// Convert snake_case MCC policy to camelCase (what hooks expect from API)
function mccPolicyToCamel(p: MccPolicyMaster) {
  return {
    id: p.id, mccCode: p.mcc_code, description: p.description,
    mccCodeDescription: p.mcc_code_description, policyCategory: p.policy_category,
    policyType: p.policy_type, thresholdAmount: p.threshold_amount, currency: p.currency,
    activeFlag: p.active_flag, expenseTypeId: p.expense_type_id, subExpenseTypeId: p.sub_expense_type_id,
    expenseType: p.expense_type_id ? { expenseType: p.expense_type_name } : null,
    expenseSubtype: p.sub_expense_type_id ? { subExpenseType: p.sub_expense_type_name } : null,
    createdAt: p.created_at, updatedAt: p.updated_at,
  };
}

function parseQs(path: string): Record<string, string> {
  const idx = path.indexOf('?');
  if (idx < 0) return {};
  const params: Record<string, string> = {};
  new URLSearchParams(path.slice(idx + 1)).forEach((v, k) => { params[k] = v; });
  return params;
}

function basePath(path: string): string {
  return path.split('?')[0];
}

function matchSearch<T>(items: T[], search: string | undefined, fields: string[]): T[] {
  if (!search) return items;
  const lower = search.toLowerCase();
  return items.filter(item => fields.some(f => String((item as any)[f] ?? '').toLowerCase().includes(lower)));
}

// ─── Route handlers ───

async function handleGet(path: string): Promise<any> {
  await delay();
  const base = basePath(path);
  const qs = parseQs(path);

  // Bank transactions
  if (base === '/bank-transactions') {
    let items = [...bankTransactionsStore];
    if (qs.search) items = matchSearch(items, qs.search, ['cardholder_name', 'merchant_name', 'mcc_code', 'transaction_id']);
    if (qs.dateFrom) items = items.filter(t => t.transaction_date >= qs.dateFrom);
    if (qs.dateTo) items = items.filter(t => t.transaction_date <= qs.dateTo);
    if (qs.cardholder) items = items.filter(t => t.cardholder_employee_id === qs.cardholder);
    if (qs.mccCode) items = items.filter(t => t.mcc_code === qs.mccCode);
    if (qs.policyResult) items = items.filter(t => t.policy_result === qs.policyResult);
    if (qs.processingStatus) items = items.filter(t => t.processing_status === qs.processingStatus);
    const paged = paginate(items, Number(qs.page) || 1, Number(qs.limit) || 50);
    return { items: paged.items.map(bankTxnToCamel), meta: paged.meta };
  }

  if (base === '/bank-transactions/stats') {
    const byPolicyResult: Record<string, number> = {};
    const byProcessingStatus: Record<string, number> = {};
    let totalBillingAmount = 0;
    for (const t of bankTransactionsStore) {
      byPolicyResult[t.policy_result] = (byPolicyResult[t.policy_result] || 0) + 1;
      byProcessingStatus[t.processing_status] = (byProcessingStatus[t.processing_status] || 0) + 1;
      totalBillingAmount += t.billing_amount;
    }
    return { totalTransactions: bankTransactionsStore.length, byPolicyResult, byProcessingStatus, totalBillingAmount, thisMonthBillingAmount: totalBillingAmount };
  }

  if (base === '/bank-transactions/filter-options') {
    const cardholders = [...new Map(bankTransactionsStore.map(t => [t.cardholder_employee_id, { cardholderEmployeeId: t.cardholder_employee_id, cardholderName: t.cardholder_name }])).values()];
    const mccCodes = [...new Map(bankTransactionsStore.map(t => [t.mcc_code, { mccCode: t.mcc_code, mccDescription: t.mcc_description }])).values()];
    return { cardholders, mccCodes, merchantCountries: ["TH", "SG"], merchantCities: ["Bangkok", "Chiang Mai", "Pattaya"], transactionTypes: ["PURCHASE"], billingCurrencies: ["THB"], policyResults: ["AUTO_APPROVED", "AUTO_REJECTED", "REQUIRES_APPROVAL"], processingStatuses: ["NEW", "PENDING_MATCH", "PROCESSED", "ERROR"] };
  }

  if (base.startsWith('/bank-transactions/check-file')) {
    return { exists: false };
  }

  // Corp card transactions
  if (base === '/corp-card-transactions') {
    let items = [...corpCardTransactionsStore];
    if (qs.search) items = matchSearch(items, qs.search, ['merchantName', 'mccDescription', 'cardholderName']);
    // Status filtering: if comma-separated, skip — portal-level filtering is done client-side in MyClaims
    if (qs.status && !qs.status.includes(',')) {
      items = items.filter(t => t.status === qs.status);
    }
    if (qs.employeeId) items = items.filter(t => (t.employeeCode as string) === qs.employeeId || (t.employeeId as string) === qs.employeeId);
    if (qs.dateFrom) items = items.filter(t => (t.transactionDate as string) >= qs.dateFrom);
    if (qs.dateTo) items = items.filter(t => (t.transactionDate as string) <= qs.dateTo);
    const paged = paginate(items, Number(qs.page) || 1, Number(qs.limit) || 20);
    return { data: { items: paged.items, meta: { ...paged.meta, totalAmount: items.reduce((s, t) => s + (t.amount as number), 0) } } };
  }

  if (base === '/corp-card-transactions/stats') {
    let items = [...corpCardTransactionsStore];
    if (qs.employeeId) items = items.filter(t => t.employeeCode === qs.employeeId || t.employeeId === qs.employeeId);
    const total = items.length;
    const totalAmount = items.reduce((s, t) => s + (t.amount as number), 0);
    const rejected = items.filter(t => t.status === 'AUTO_REJECTED');
    return { total, totalAmount, rejectedCount: rejected.length, rejectedAmount: rejected.reduce((s, t) => s + (t.amount as number), 0) };
  }

  // MCC Policies
  if (base === '/mcc-policies') {
    let items = [...mccPoliciesStore];
    if (qs.search) items = matchSearch(items, qs.search, ['description', 'mcc_code', 'mcc_code_description']);
    if (qs.active === 'true') items = items.filter(p => p.active_flag);
    if (qs.active === 'false') items = items.filter(p => !p.active_flag);
    if (qs.expenseTypeId) items = items.filter(p => p.expense_type_id === qs.expenseTypeId);
    if (qs.subExpenseTypeId) items = items.filter(p => p.sub_expense_type_id === qs.subExpenseTypeId);
    const paged = paginate(items, Number(qs.page) || 1, Number(qs.limit) || 20);
    return { items: paged.items.map(mccPolicyToCamel), meta: paged.meta };
  }

  // Document types
  if (base === '/document-types') {
    let items = [...documentTypesStore];
    if (qs.search) items = matchSearch(items, qs.search, ['documentName']);
    if (qs.active === 'true') items = items.filter(d => d.active);
    if (qs.active === 'false') items = items.filter(d => !d.active);
    return paginate(items, Number(qs.page) || 1, Number(qs.limit) || 20);
  }

  // Expense types
  if (base === '/expense-types') {
    if (qs.id) return expenseTypesStore.find(e => e.id === qs.id) ?? null;
    let items = [...expenseTypesStore];
    if (qs.search) items = matchSearch(items, qs.search, ['expenseType']);
    return paginate(items, Number(qs.page) || 1, Number(qs.limit) || 20);
  }

  if (base.match(/^\/expense-types\/[\w-]+$/)) {
    const id = base.split('/')[2];
    return expenseTypesStore.find(e => e.id === id) ?? null;
  }

  // GL Accounts
  if (base === '/gl-accounts') {
    let items = [...glAccountsStore];
    if (qs.search) items = matchSearch(items, qs.search, ['accountCode', 'accountName']);
    return paginate(items, Number(qs.page) || 1, Number(qs.limit) || 20);
  }

  // Admin entities
  if (base === '/admin/entities') {
    let items = [...entitiesStore];
    if (qs.search) items = matchSearch(items, qs.search, ['legalNameEn', 'legalNameTh', 'companyCode']);
    return paginate(items, Number(qs.page) || 1, Number(qs.limit) || 20);
  }

  // Admin employees
  if (base === '/admin/employees') {
    let items = [...employeesStore];
    if (qs.search) items = matchSearch(items, qs.search, ['name', 'email', 'employeeCode']);
    if (qs.role) items = items.filter(e => e.roles.includes(qs.role));
    if (qs.department) items = items.filter(e => e.department === qs.department);
    if (qs.active === 'true') items = items.filter(e => e.active);
    if (qs.active === 'false') items = items.filter(e => !e.active);
    return paginate(items, Number(qs.page) || 1, Number(qs.limit) || 20);
  }

  // Users
  if (base === '/users') {
    let items = [...employeesStore];
    if (qs.role) items = items.filter(e => e.roles.includes(qs.role));
    if (qs.active === 'true') items = items.filter(e => e.active);
    return items;
  }

  if (base.match(/^\/users\/[\w-]+$/)) {
    const id = base.split('/')[2];
    return employeesStore.find(e => e.id === id) ?? null;
  }

  // Roles
  if (base === '/admin/roles') {
    let items = [...rolesStore];
    if (qs.search) items = matchSearch(items, qs.search, ['name', 'description']);
    return paginate(items, Number(qs.page) || 1, Number(qs.limit) || 20);
  }

  if (base === '/admin/roles/stats/overview') {
    return rolesStore.map(r => ({
      id: r.id, name: r.name, description: r.description, isActive: r.isActive, isSystem: r.isSystem,
      permissions: Array.isArray(r.permissions) ? (r.permissions as Record<string, unknown>[]).map(p => p.name) : [],
      userCount: r.userCount,
    }));
  }

  if (base === '/admin/roles/permissions/all') {
    return allPermissions;
  }

  if (base.match(/^\/admin\/roles\/[\w-]+$/)) {
    const id = base.split('/')[3];
    return rolesStore.find(r => r.id === id) ?? null;
  }

  // OCR Config
  if (base === '/ocr-config') {
    return ocrConfigStore;
  }

  // Email / notification settings
  if (base === '/email/notification-settings') {
    return notificationSettingsStore;
  }

  if (base.match(/^\/email\/notification-settings\/\w+$/)) {
    const type = base.split('/')[3];
    return notificationSettingsStore.find(s => s.type === type) ?? null;
  }

  // Notifications — hook expects flat array from get(), with camelCase fields
  if (base === '/notifications') {
    const userId = qs.userId;
    const items = userId ? notificationsStore.filter(n => n.userId === userId) : [...notificationsStore];
    return items.map(n => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      targetTransactionId: "",
      readFlag: n.read,
      createdAt: n.createdAt,
      userId: n.userId,
    }));
  }

  if (base === '/notifications/unread-count') {
    const userId = qs.userId;
    const count = notificationsStore.filter(n => (!userId || n.userId === userId) && !n.read).length;
    return { count };
  }

  if (base.match(/^\/notifications\/[\w-]+\/summary$/)) {
    const userId = base.split('/')[2];
    const items = notificationsStore.filter(n => n.userId === userId);
    return { total: items.length, unread: items.filter(n => !n.read).length };
  }

  // Claims
  if (base === '/claims/approval-inbox') {
    // Return the mockClaims that are "Pending Approval" mapped to ApprovalInboxClaim shape
    const { mockClaims } = await import('./mock-data');
    let filtered = mockClaims.filter(c => c.status === 'Pending Approval');
    if (qs.search) {
      const s = qs.search.toLowerCase();
      filtered = filtered.filter(c => c.requesterName.toLowerCase().includes(s) || c.claimNo.toLowerCase().includes(s) || (c.merchantName ?? '').toLowerCase().includes(s));
    }
    const mapped = filtered.map(c => ({
      id: c.id, claimNo: c.claimNo, requesterId: c.requesterId, requesterName: c.requesterName,
      department: '', purpose: c.purpose ?? '', totalAmount: c.totalAmount, status: c.status,
      statusCode: c.statusCode, submittedDate: c.submittedDate, createdDate: c.createdDate,
      overrideFlag: false, overrideReason: null, documents: [],
      approvalSteps: c.approvalHistory.map((s, i) => ({
        id: `step-${i}`, stepNo: s.stepNo, approverId: s.approverId, approverName: s.approverName,
        action: s.action, comment: s.comment, actionDate: s.actionDate,
      })),
    }));
    return { data: mapped, meta: { total: mapped.length, page: 1, limit: 20, totalPages: 1 } };
  }

  if (base === '/claims/approval-inbox/stats') {
    const { mockClaims } = await import('./mock-data');
    const pending = mockClaims.filter(c => c.status === 'Pending Approval');
    return { pendingCount: pending.length, approvedThisMonth: 2, totalPendingAmount: pending.reduce((s, c) => s + c.totalAmount, 0) };
  }

  if (base.match(/^\/claims\/cardholder\/claims\/[\w-]+$/)) {
    const id = base.split('/').pop();
    // Look up the corp card transaction by bankTransactionId (claim ID = bankTransactionId)
    const txn = corpCardTransactionsStore.find(t => t.bankTransactionId === id);
    if (!txn) return null;
    const bt = bankTransactionsStore.find(b => b.id === txn.bankTransactionId);
    return {
      claim: {
        id: txn.bankTransactionId,
        bankTransactionId: txn.bankTransactionId,
        claimNo: `CLM-${txn.bankTransactionId}`,
        requesterId: txn.employeeId,
        requesterName: txn.cardholderName,
        company: "", branch: "", department: "", costCenter: "",
        purpose: txn.mccDescription || txn.category || "",
        merchantName: txn.merchantName,
        currency: txn.currency || "THB",
        paymentMethod: "CORPORATE_CARD",
        totalAmount: txn.amount,
        totalVat: 0,
        status: txn.status === 'AUTO_APPROVED' ? 'AUTO_APPROVED' : txn.status === 'AUTO_REJECTED' ? 'AUTO_REJECTED' : 'PENDING_DOCUMENTS',
        accountingStatus: "PENDING_REVIEW",
        createdDate: txn.createdAt,
        submittedDate: null,
        lines: [],
        approvalSteps: [],
        comments: [],
        bankTransaction: bt ? {
          cardholderEmployeeId: bt.cardholder_employee_id,
          cardholderName: bt.cardholder_name,
          merchantName: bt.merchant_name,
          mccDescription: bt.mcc_description,
          category: bt.category,
          billingAmount: bt.billing_amount,
          billingCurrency: bt.billing_currency,
          transactionDate: bt.transaction_date,
          transactionId: bt.transaction_id,
        } : null,
      },
      statusCode: txn.status,
      statusDisplay: null,
      statusColor: null,
      bankTransactionId: txn.bankTransactionId,
      bankTransaction: bt ? {
        cardholderEmployeeId: bt.cardholder_employee_id,
        cardholderName: bt.cardholder_name,
        merchantName: bt.merchant_name,
        mccDescription: bt.mcc_description,
        billingAmount: bt.billing_amount,
        billingCurrency: bt.billing_currency,
        transactionDate: bt.transaction_date,
        transactionId: bt.transaction_id,
      } : null,
      corpCardTransaction: {
        documentStatus: txn.documentStatus,
        status: txn.status,
      },
    };
  }

  if (base === '/claims/cardholder/claims') {
    // Return backend-shaped claim data that mapClaimListItem expects
    // Each claim is linked to a corp card transaction via bankTransactionId
    const claimRows = corpCardTransactionsStore.map(txn => ({
      bankTransactionId: txn.bankTransactionId,
      claimNo: `CLM-${txn.bankTransactionId}`,
      claimStatus: (txn as any)._claimStatus ? (txn as any)._claimStatus :
                   txn.status === 'AUTO_APPROVED' ? 'AUTO_APPROVED' :
                   txn.status === 'AUTO_REJECTED' ? 'AUTO_REJECTED' :
                   txn.status === 'REQUIRES_APPROVAL' ? 'PENDING_DOCUMENTS' :
                   txn.status === 'PENDING_DOCUMENTS' ? 'PENDING_DOCUMENTS' :
                   txn.status,
      statusDisplay: null,
      statusColor: null,
      bankTransaction: {
        cardholderEmployeeId: txn.employeeId,
        cardholderName: txn.cardholderName,
        merchantName: txn.merchantName,
        mccDescription: txn.mccDescription,
        category: txn.category,
        billingAmount: txn.amount,
        billingCurrency: txn.currency,
        transactionDate: txn.transactionDate,
      },
      corpCardTransaction: {
        documentStatus: txn.documentStatus,
        status: txn.status,
      },
      corpTxnDocumentStatus: txn.documentStatus,
    }));
    let items = [...claimRows] as Record<string, unknown>[];
    if (qs.search) {
      const s = (qs.search as string).toLowerCase();
      items = items.filter(c => {
        const bt = c.bankTransaction as Record<string, unknown> | undefined;
        return String(c.claimNo ?? '').toLowerCase().includes(s) ||
               String(bt?.cardholderName ?? '').toLowerCase().includes(s) ||
               String(bt?.merchantName ?? '').toLowerCase().includes(s);
      });
    }
    return { data: items, meta: { total: items.length, page: Number(qs.page) || 1, limit: Number(qs.limit) || 20, totalPages: 1 } };
  }

  if (base.match(/^\/claims\/[\w-]+$/)) {
    const id = base.split('/')[2];
    // For approver view: return a mock claim matching the ApprovalInboxClaim shape
    const { mockClaims } = await import('./mock-data');
    const claim = mockClaims.find(c => c.id === id);
    if (claim) {
      return {
        id: claim.id, claimNo: claim.claimNo, requesterId: claim.requesterId,
        requesterName: claim.requesterName, department: '', purpose: claim.purpose ?? '',
        totalAmount: claim.totalAmount, status: claim.status, statusCode: claim.statusCode,
        submittedDate: claim.submittedDate, createdDate: claim.createdDate, overrideFlag: false,
        overrideReason: null, documents: [], approvalSteps: claim.approvalHistory.map((s, i) => ({
          id: `step-${i}`, stepNo: s.stepNo, approverId: s.approverId, approverName: s.approverName,
          action: s.action, comment: s.comment, actionDate: s.actionDate,
        })),
        bankTransactionId: claim.bankTransactionId,
        lines: claim.lines, comments: claim.comments,
        currency: claim.currency, paymentMethod: claim.paymentMethod,
        accountingStatus: claim.accountingStatus,
      };
    }
    return null;
  }

  // Documents
  if (base.match(/^\/documents\/claims\/[\w-]+$/)) {
    const claimId = base.split('/')[3];
    return documentsStore.filter((d: Record<string, unknown>) => d.claimId === claimId);
  }

  if (base.match(/^\/documents\/[\w-]+$/)) {
    const docId = base.split('/')[2];
    return documentsStore.find((d: Record<string, unknown>) => d.id === docId) ?? null;
  }

  // Transaction matching
  if (base === '/transaction-matching/unmatched') {
    return { items: [] };
  }

  // Auth
  if (base === '/auth/me') {
    const savedId = localStorage.getItem('mock_auth_user_id');
    return employeesStore.find(e => e.id === savedId) ?? null;
  }

  return null;
}

async function handleGetRaw(path: string): Promise<unknown> {
  // getRaw returns full JSON (no unwrapping)
  const data = await handleGet(path);
  // If data already has a `data` property, return as-is
  if (data && typeof data === 'object' && 'data' in (data as Record<string, unknown>)) {
    return data;
  }
  return { data };
}

async function handlePost(path: string, body?: unknown): Promise<unknown> {
  await delay();
  const base = basePath(path);

  // Bank transactions import
  if (base === '/bank-transactions/import') {
    const rows = body as CorpBankTxn[];
    if (Array.isArray(rows)) {
      for (const r of rows) { r.id = r.id || uid(); bankTransactionsStore.push(r); }
    }
    return { imported: Array.isArray(rows) ? rows.length : 0, skipped: 0, total: Array.isArray(rows) ? rows.length : 0, autoApproved: 0, requiresApproval: 0, autoRejected: 0 };
  }

  if (base === '/bank-transactions/report-import-failure') {
    return { ok: true };
  }

  // Claims
  if (base === '/claims') {
    const claim = { id: uid(), ...(body as Record<string, unknown>) };
    return claim;
  }

  // Document types
  if (base === '/document-types') {
    const dt = { id: uid(), ...(body as Record<string, unknown>), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    documentTypesStore.push(dt as typeof documentTypesStore[0]);
    return dt;
  }

  if (base === '/document-types/import') {
    const rows = body as Record<string, unknown>[];
    let imported = 0;
    if (Array.isArray(rows)) {
      for (const r of rows) { documentTypesStore.push({ id: uid(), ...r, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as typeof documentTypesStore[0]); imported++; }
    }
    return { imported, errors: [] };
  }

  if (base === '/document-types/bulk') {
    return { affected: 0 };
  }

  // Expense types
  if (base === '/expense-types') {
    const et = { id: uid(), ...(body as Record<string, unknown>), subtypes: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    expenseTypesStore.push(et as typeof expenseTypesStore[0]);
    return et;
  }

  if (base === '/expense-types/import') {
    return { imported: 0, errors: [] };
  }

  if (base === '/expense-types/bulk') {
    return { affected: 0 };
  }

  // GL Accounts
  if (base === '/gl-accounts') {
    const gl = { id: uid(), ...(body as Record<string, unknown>), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    glAccountsStore.push(gl as typeof glAccountsStore[0]);
    return gl;
  }

  if (base === '/gl-accounts/import') {
    return { imported: 0, errors: [] };
  }

  // MCC Policies
  if (base === '/mcc-policies') {
    const pol = { id: uid(), ...(body as Record<string, unknown>), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    mccPoliciesStore.push(pol as MccPolicyMaster);
    return pol;
  }

  if (base === '/mcc-policies/import') {
    return { imported: 0, errors: [] };
  }

  if (base === '/mcc-policies/bulk') {
    return { affected: 0 };
  }

  // Entities
  if (base === '/admin/entities') {
    const ent = { id: uid(), ...(body as Record<string, unknown>), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    entitiesStore.push(ent as typeof entitiesStore[0]);
    return ent;
  }

  if (base === '/admin/entities/bulk') {
    return { affected: 0 };
  }

  // Users
  if (base === '/users') {
    const emp = { id: uid(), ...(body as Record<string, unknown>), active: true, creditCards: [], approvalLevels: [] };
    employeesStore.push(emp as typeof employeesStore[0]);
    return emp;
  }

  if (base === '/users/invite') {
    return { invited: true, status: 'INVITED' };
  }

  if (base === '/users/check-entra') {
    const { emails } = body as { emails: string[] };
    return { found: emails, notFound: [] };
  }

  if (base === '/users/import') {
    return { imported: 0, errors: [] };
  }

  if (base === '/users/bulk') {
    return { affected: 0 };
  }

  // Credit cards
  if (base === '/credit-cards') {
    return { id: uid(), ...(body as Record<string, unknown>) };
  }

  // Roles
  if (base === '/admin/roles') {
    const role = { id: uid(), ...(body as Record<string, unknown>), userCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    rolesStore.push(role as typeof rolesStore[0]);
    return role;
  }

  // Documents
  if (base.match(/^\/documents\/claims\/[\w-]+\/preview-ocr/)) {
    return { extractedFields: [{ field: "vendor", value: "Mock Vendor", confidence: 95 }, { field: "amount", value: "1500.00", confidence: 90 }, { field: "date", value: "2026-03-01", confidence: 88 }] };
  }

  if (base.match(/^\/documents\/claims\/[\w-]+\/upload/)) {
    const docId = uid();
    const doc = { id: docId, claimId: base.split('/')[3], status: 'UPLOADED', createdAt: new Date().toISOString() };
    documentsStore.push(doc);
    return doc;
  }

  if (base.match(/^\/documents\/[\w-]+\/process-ocr$/)) {
    return { status: 'OCR_PROCESSING' };
  }

  if (base.match(/^\/documents\/[\w-]+\/override$/)) {
    return { status: 'VERIFIED' };
  }

  if (base.match(/^\/documents\/[\w-]+\/verify$/)) {
    return { status: 'VERIFIED' };
  }

  return { ok: true };
}

async function handlePatch(path: string, body?: unknown): Promise<unknown> {
  await delay();
  const base = basePath(path);

  // MCC Policies
  if (base.match(/^\/mcc-policies\/[\w-]+$/)) {
    const id = base.split('/')[2];
    const idx = mccPoliciesStore.findIndex(p => p.id === id);
    if (idx >= 0) Object.assign(mccPoliciesStore[idx], body, { updated_at: new Date().toISOString() });
    return idx >= 0 ? mccPoliciesStore[idx] : null;
  }

  // Document types
  if (base.match(/^\/document-types\/[\w-]+$/)) {
    const id = base.split('/')[2];
    const idx = documentTypesStore.findIndex(d => d.id === id);
    if (idx >= 0) Object.assign(documentTypesStore[idx], body, { updatedAt: new Date().toISOString() });
    return idx >= 0 ? documentTypesStore[idx] : null;
  }

  // Expense types
  if (base.match(/^\/expense-types\/[\w-]+$/)) {
    const id = base.split('/')[2];
    const idx = expenseTypesStore.findIndex(e => e.id === id);
    if (idx >= 0) Object.assign(expenseTypesStore[idx], body, { updatedAt: new Date().toISOString() });
    return idx >= 0 ? expenseTypesStore[idx] : null;
  }

  // GL Accounts
  if (base.match(/^\/gl-accounts\/[\w-]+$/)) {
    const id = base.split('/')[2];
    const idx = glAccountsStore.findIndex(g => g.id === id);
    if (idx >= 0) Object.assign(glAccountsStore[idx], body, { updatedAt: new Date().toISOString() });
    return idx >= 0 ? glAccountsStore[idx] : null;
  }

  // Entities
  if (base.match(/^\/admin\/entities\/[\w-]+$/)) {
    const id = base.split('/')[3];
    const idx = entitiesStore.findIndex(e => e.id === id);
    if (idx >= 0) Object.assign(entitiesStore[idx], body, { updatedAt: new Date().toISOString() });
    return idx >= 0 ? entitiesStore[idx] : null;
  }

  // Users
  if (base.match(/^\/users\/[\w-]+$/)) {
    const id = base.split('/')[2];
    const idx = employeesStore.findIndex(e => e.id === id);
    if (idx >= 0) Object.assign(employeesStore[idx], body);
    return idx >= 0 ? employeesStore[idx] : null;
  }

  // Credit cards
  if (base.match(/^\/credit-cards\/[\w-]+$/)) {
    return { ...(body as Record<string, unknown>) };
  }

  // Roles
  if (base.match(/^\/admin\/roles\/[\w-]+$/)) {
    const id = base.split('/')[3];
    const idx = rolesStore.findIndex(r => r.id === id);
    if (idx >= 0) Object.assign(rolesStore[idx], body, { updatedAt: new Date().toISOString() });
    return idx >= 0 ? rolesStore[idx] : null;
  }

  // OCR Config
  if (base === '/ocr-config') {
    Object.assign(ocrConfigStore, body, { updatedAt: new Date().toISOString() });
    return ocrConfigStore;
  }

  // Email notification settings
  if (base.match(/^\/email\/notification-settings\/\w+$/)) {
    const type = base.split('/')[3];
    const idx = notificationSettingsStore.findIndex(s => s.type === type);
    if (idx >= 0) Object.assign(notificationSettingsStore[idx], body, { updatedAt: new Date().toISOString() });
    return idx >= 0 ? notificationSettingsStore[idx] : null;
  }

  // Notifications
  if (base.match(/^\/notifications\/[\w-]+\/read$/)) {
    const id = base.split('/')[2];
    const n = notificationsStore.find(x => x.id === id);
    if (n) n.read = true;
    return n ?? null;
  }

  if (base === '/notifications/read-all') {
    const { userId } = (body ?? {}) as { userId?: string };
    notificationsStore.forEach(n => { if (!userId || n.userId === userId) n.read = true; });
    return { ok: true };
  }

  // Claims status
  if (base.match(/^\/claims\/[\w-]+\/status$/)) {
    return { ok: true };
  }

  if (base.match(/^\/claims\/[\w-]+\/draft$/)) {
    return { ok: true };
  }

  return { ok: true };
}

async function handleDelete(path: string): Promise<unknown> {
  await delay();
  const base = basePath(path);

  if (base.match(/^\/mcc-policies\/[\w-]+$/)) {
    const id = base.split('/')[2];
    const idx = mccPoliciesStore.findIndex(p => p.id === id);
    if (idx >= 0) mccPoliciesStore.splice(idx, 1);
    return undefined;
  }

  if (base.match(/^\/document-types\/[\w-]+$/)) {
    const id = base.split('/')[2];
    const idx = documentTypesStore.findIndex(d => d.id === id);
    if (idx >= 0) documentTypesStore.splice(idx, 1);
    return undefined;
  }

  if (base.match(/^\/expense-types\/[\w-]+$/)) {
    const id = base.split('/')[2];
    const idx = expenseTypesStore.findIndex(e => e.id === id);
    if (idx >= 0) expenseTypesStore.splice(idx, 1);
    return undefined;
  }

  if (base.match(/^\/gl-accounts\/[\w-]+$/)) {
    const id = base.split('/')[2];
    const idx = glAccountsStore.findIndex(g => g.id === id);
    if (idx >= 0) glAccountsStore.splice(idx, 1);
    return undefined;
  }

  if (base.match(/^\/admin\/entities\/[\w-]+$/)) {
    const id = base.split('/')[3];
    const idx = entitiesStore.findIndex(e => e.id === id);
    if (idx >= 0) entitiesStore.splice(idx, 1);
    return undefined;
  }

  if (base.match(/^\/users\/[\w-]+$/)) {
    const id = base.split('/')[2];
    const idx = employeesStore.findIndex(e => e.id === id);
    if (idx >= 0) employeesStore.splice(idx, 1);
    return undefined;
  }

  if (base.match(/^\/admin\/roles\/[\w-]+$/)) {
    const id = base.split('/')[3];
    const idx = rolesStore.findIndex(r => r.id === id);
    if (idx >= 0) rolesStore.splice(idx, 1);
    return undefined;
  }

  if (base.match(/^\/documents\/[\w-]+$/)) {
    const id = base.split('/')[2];
    const idx = documentsStore.findIndex((d: Record<string, unknown>) => d.id === id);
    if (idx >= 0) documentsStore.splice(idx, 1);
    return undefined;
  }

  return undefined;
}

// ─── Exported API client ───

export const apiClient = {
  setTokens(_access: string, _refresh: string) {},

  async devLogin(_email: string) {
    return {};
  },

  async getMe() {
    const savedId = localStorage.getItem('mock_auth_user_id');
    const emp = employeesStore.find(e => e.id === savedId);
    if (!emp) throw new Error('Not authenticated');
    return emp;
  },

  logout() {
    localStorage.removeItem('mock_auth_user_id');
  },

  hasTokens() {
    return !!localStorage.getItem('mock_auth_user_id');
  },

  async get(path: string): Promise<any> {
    return handleGet(path);
  },

  async getRaw(path: string): Promise<any> {
    return handleGetRaw(path);
  },

  async getBlob(_path: string) {
    // Return empty blob for document downloads
    return new Blob(['mock file content'], { type: 'application/octet-stream' });
  },

  async post(path: string, body?: unknown, _options?: { timeoutMs?: number }) {
    return handlePost(path, body);
  },

  async postRaw(path: string, body?: unknown) {
    return handlePost(path, body);
  },

  async postForm(path: string, _formData: FormData, _options?: { timeoutMs?: number }) {
    return handlePost(path, {});
  },

  async patch(path: string, body?: unknown) {
    return handlePatch(path, body);
  },

  async delete(path: string) {
    return handleDelete(path);
  },
};
