import { defineTool } from "@lovable.dev/mcp-js";
import { jsonResult, requireAuth } from "../util";

const OVERVIEW = {
  app: "Card Expense Management (Corporate Credit Card & Fleet Card)",
  design: {
    colors: "White and red corporate palette; blue (#306FC7) for links/Created status",
    font: "Inter / sans-serif; Thai text uses a Thai-capable font",
    language: "English-only UI; Thai only for names, addresses, invoice content",
    dates: "DD/MM/YYYY in Buddhist Era (CE + 543)",
    currency: "฿ / THB with thousand separators",
  },
  roles: {
    Cardholder: "My Expense, Card Requests, Notifications",
    Approver: "My Expense, Card Requests, Approval Inbox",
    Admin: "All modules incl. Accounting Review, Bank Transactions, Admin settings",
  },
  pages: [
    "/claims — My Expense list (Credit/Fleet filters, summary bar, approval/document badges)",
    "/claims/:id — Claim detail (receipt upload, OCR validation, VAT/GL entry, audit trail)",
    "/approvals — Approval Inbox (batch actions, request more info)",
    "/accounting — Accounting Review (Fleet Card = Auto Approved, ERP sync vs exceptions)",
    "/bank-transactions — Bank file import and transactions",
    "/card-requests — HR card request list and form",
    "/admin — Admin settings: Card Management, Data Scope, Roles & Permissions, Expense Types, GL Accounts, Projects, Policy, Notifications, HRIS Sync Exceptions, Input VAT Report, Upload Fleet Card E Tax Invoice",
  ],
  cardStatuses: ["Created", "Handed Over", "Received", "Pending Activation", "Active", "Reassigned", "Rejected"],
  rules: [
    "One receipt PDF per expense line; OCR validation required before submit",
    "Corporate cards masked to last 4 digits",
    "Data Scope limits which card types a role sees in Card Management; Admin sees all",
    "Fleet Card transactions always show Approval Status 'Auto Approved'",
  ],
  note: "All data in this app is sample data.",
};

export default defineTool({
  name: "get_app_overview",
  title: "Get app overview",
  description: "Describe the app's modules, pages, roles, statuses, business rules and design conventions.",
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: (_args, ctx) => {
    requireAuth(ctx);
    return jsonResult("App overview", OVERVIEW);
  },
});
