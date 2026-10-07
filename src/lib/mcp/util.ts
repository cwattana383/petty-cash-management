import type { ToolContext } from "@lovable.dev/mcp-js";

export function requireAuth(ctx: ToolContext) {
  if (!ctx.isAuthenticated()) throw new Error("Authenticated caller required");
}

export function jsonResult(label: string, data: unknown) {
  return { content: [{ type: "text" as const, text: `${label}\n${JSON.stringify(data, null, 2)}` }] };
}

export function matches(haystack: unknown[], q?: string) {
  if (!q) return true;
  const needle = q.toLowerCase();
  return haystack.some((v) => String(v ?? "").toLowerCase().includes(needle));
}
