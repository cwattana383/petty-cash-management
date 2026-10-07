import { auth, defineMcp } from "@lovable.dev/mcp-js";
import overview from "./tools/app-overview";
import listTx from "./tools/list-card-transactions";
import listClaims from "./tools/list-claims";
import getClaim from "./tools/get-claim";
import listCards from "./tools/list-cards";
import listPolicies from "./tools/list-policies";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "corporate-credit-card",
  title: "Corporate Credit Card",
  version: "0.1.0",
  instructions:
    "Read-only tools for the Card Expense Management app. Start with `get_app_overview` to understand modules, roles, rules and design conventions, then use the list/get tools to look up sample transactions, claims, cards and expense policies.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [overview, listTx, listClaims, getClaim, listCards, listPolicies],
});
