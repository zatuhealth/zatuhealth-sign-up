import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { catalogFor } from "@/lib/vaccines";

const input = z.object({
  image: z.string().max(8_000_000).regex(/^data:image\/(jpeg|png|webp);base64,/),
  kind: z.enum(["human", "pet"]),
  species: z.string().nullable(),
});

export const scanCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => input.parse(d))
  .handler(async ({ data }) => {
    const { scanVaccinationCard } = await import("@/lib/ai/card-scan.server");
    const catalog = catalogFor(data.kind, data.species).map(v => ({ key: v.key, name: `${v.short} — ${v.name}${v.dose ? ` (${v.dose})` : ""}` }));
    try {
      return { entries: await scanVaccinationCard(data.image, catalog), error: "" };
    } catch (e) {
      return { entries: [], error: (e as Error).message };
    }
  });
