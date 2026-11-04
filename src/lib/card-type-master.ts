import { z } from "zod";

export const cardTypeMasterSchema = z.array(z.object({
  id: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(100),
  active: z.boolean(),
}));

export type CardTypeMasterEntry = z.infer<typeof cardTypeMasterSchema>[number];

// Mock master boundary: replace this reader with the Card Type master API when available.
const mockCardTypeMaster: CardTypeMasterEntry[] = [
  { id: "corporate-credit-card", name: "Corporate Credit Card", active: true },
  { id: "fleet-card", name: "Fleet Card", active: true },
  { id: "ev-fleet-card", name: "EV Fleet Card", active: true },
];

export function readCardTypeMaster(): CardTypeMasterEntry[] {
  const stored = localStorage.getItem("card-type-master");
  if (!stored) return mockCardTypeMaster.map((type) => ({ ...type }));
  try {
    const parsed = cardTypeMasterSchema.safeParse(JSON.parse(stored));
    return parsed.success ? parsed.data : mockCardTypeMaster.map((type) => ({ ...type }));
  } catch {
    return mockCardTypeMaster.map((type) => ({ ...type }));
  }
}