import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { CARD_MASTER_ROWS } from "../../card-master-mock-data";
import { jsonResult, matches, requireAuth } from "../util";

export default defineTool({
  name: "list_cards",
  title: "List cards",
  description: "List sample Card Management records (Corporate Credit and Fleet Cards), masked to last 4 digits.",
  inputSchema: {
    cardType: z.enum(["corporate", "fleet"]).optional().describe("Filter by card type."),
    query: z.string().optional().describe("Text to match against card ID or cardholder."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ cardType, query }, ctx) => {
    requireAuth(ctx);
    const rows = CARD_MASTER_ROWS
      .filter((r) => (!cardType || r.kind === cardType) && matches([r.cardId, r.cardholderName, r.employeeId], query))
      .map((r) => ({
        cardId: r.cardId, cardType: r.kind, bank: r.bankTh, last4: r.last4,
        cardholder: r.cardholderName ?? "Unassigned", employeeId: r.employeeId ?? null,
        creditLimit: r.creditLimit, expiry: r.expiry, status: r.status, company: r.company,
      }));
    return jsonResult(`${rows.length} card(s)`, rows);
  },
});
