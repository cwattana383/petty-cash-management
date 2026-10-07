import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { mockClaims } from "../../mock-data";
import { jsonResult, matches, requireAuth } from "../util";

export default defineTool({
  name: "list_expense_claims",
  title: "List expense claims",
  description: "List sample expense claims with status and totals; optionally filter by text or status.",
  inputSchema: {
    query: z.string().optional().describe("Text to match against claim no., requester or purpose."),
    status: z.string().optional().describe("Exact claim status to filter by."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ query, status }, ctx) => {
    requireAuth(ctx);
    const rows = mockClaims
      .filter((c) => (!status || c.status === status) && matches([c.id, c.claimNo, c.requesterName, c.purpose], query))
      .map((c) => ({
        id: c.id, claimNo: c.claimNo, requester: c.requesterName, department: c.department,
        purpose: c.purpose, status: c.status, totalAmount: c.totalAmount, currency: c.currency,
        createdDate: c.createdDate, lineCount: c.lines.length,
      }));
    return jsonResult(`${rows.length} claim(s)`, rows);
  },
});
