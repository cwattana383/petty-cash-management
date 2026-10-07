import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { mockBankTransactions } from "../../corporate-card-mock-data";
import { jsonResult, matches, requireAuth } from "../util";

export default defineTool({
  name: "list_card_transactions",
  title: "List card transactions",
  description: "List and search sample corporate card transactions by merchant, cardholder or ID.",
  inputSchema: {
    query: z.string().optional().describe("Text to match against merchant, cardholder or transaction ID."),
    limit: z.number().int().min(1).max(200).optional().describe("Max rows (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ query, limit }, ctx) => {
    requireAuth(ctx);
    const rows = (mockBankTransactions as any[]).filter((t) =>
      matches([t.transaction_id, t.merchant_name, t.cardholder_name, t.cardholder_employee_id], query),
    );
    return jsonResult(`${rows.length} transaction(s)`, rows.slice(0, limit ?? 50));
  },
});
