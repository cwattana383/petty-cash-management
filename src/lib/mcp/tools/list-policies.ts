import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { EXPENSE_TYPE_CONFIG } from "../../expense-type-config";
import { jsonResult, matches, requireAuth } from "../util";

export default defineTool({
  name: "list_expense_policies",
  title: "List expense policies",
  description: "List expense types with policy rule, threshold, GL code and required documents.",
  inputSchema: { query: z.string().optional().describe("Text to match against expense type names.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ query }, ctx) => {
    requireAuth(ctx);
    const rows = EXPENSE_TYPE_CONFIG.filter((e) => matches([e.level1, e.level2], query));
    return jsonResult(`${rows.length} expense type(s)`, rows);
  },
});
