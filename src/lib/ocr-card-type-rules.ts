import { z } from "zod";

export const DEFAULT_OCR_KEY = "default";
export const ocrToleranceSchema = z.object({
  amountToleranceThb: z.number().finite().min(0, "Enter a number greater than or equal to 0"),
  amountTolerancePct: z.number().finite().min(0, "Enter a number greater than or equal to 0").max(100, "Enter a percentage no greater than 100"),
  dateToleranceDays: z.number().finite().min(0, "Enter a number greater than or equal to 0").int("Enter a whole number of days"),
});
export type OcrTolerance = z.infer<typeof ocrToleranceSchema>;
const ruleSchema = ocrToleranceSchema.extend({
  updatedAt: z.string().datetime(),
  updatedBy: z.string().trim().min(1).max(100),
});
export type OcrCardRule = z.infer<typeof ruleSchema>;
const rulesSchema = z.record(z.string().min(1).max(100), ruleSchema).refine((rules) => Boolean(rules[DEFAULT_OCR_KEY]));
export type OcrCardRules = Record<string, OcrCardRule>;
const STORAGE_KEY = "ocr-card-type-rules";
const sampleMetadata = { updatedAt: "2026-10-22T11:30:20+07:00", updatedBy: "Shivkumar Singh" };
export function initialOcrCardRules(): OcrCardRules {
  const standard = { amountToleranceThb: 1, amountTolerancePct: 1, dateToleranceDays: 0, ...sampleMetadata };
  return {
    default: { ...standard },
    "corporate-credit-card": { ...standard },
    "fleet-card": { amountToleranceThb: 0, amountTolerancePct: 0, dateToleranceDays: 0, ...sampleMetadata },
  };
}

export function resolveOcrCardRule(rules: OcrCardRules, key: string): OcrCardRule {
  const rule = rules[key] ?? rules[DEFAULT_OCR_KEY];
  return rule ?? initialOcrCardRules().default;
}

export function readOcrCardRules(): OcrCardRules {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return initialOcrCardRules();
    const result = rulesSchema.safeParse(JSON.parse(stored));
    return result.success ? result.data : initialOcrCardRules();
  } catch {
    return initialOcrCardRules();
  }
}

// Validate again at the mock persistence boundary; production API must enforce the same schema.
export function saveOcrCardRule(rules: OcrCardRules, key: string, input: unknown, user: string): OcrCardRules {
  const rule = ruleSchema.parse({ ...ocrToleranceSchema.parse(input), updatedAt: new Date().toISOString(), updatedBy: user });
  const next = rulesSchema.parse({ ...rules, [key]: rule });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function resetOcrCardRule(rules: OcrCardRules, key: string): OcrCardRules {
  if (key === DEFAULT_OCR_KEY) return rules;
  const next = { ...rules };
  delete next[key];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rulesSchema.parse(next)));
  return next;
}