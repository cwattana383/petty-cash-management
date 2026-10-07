import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { mockClaims } from "../../mock-data";
import { jsonResult, requireAuth } from "../util";

export default defineTool({
  name: "get_expense_claim",
  title: "Get expense claim",
  description: "Get full details of one sample expense claim, including lines and approval steps.",
  inputSchema: { id: z.string().min(1).describe("Claim ID or claim number.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ id }, ctx) => {
    requireAuth(ctx);
    const claim = mockClaims.find((c) => c.id === id || c.claimNo === id);
    if (!claim) throw new ToolError(`Claim ${id} not found`);
    return jsonResult(`Claim ${claim.claimNo}`, claim);
  },
});
