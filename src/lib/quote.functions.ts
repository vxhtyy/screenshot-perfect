import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { estimate, EXTRAS } from "@/lib/quote";

const schema = z.object({
  service: z.enum(["home", "renovation", "office", "special"]),
  city: z.string().trim().min(2).max(60),
  area: z.number().int().min(10).max(1000),
  bathrooms: z.number().int().min(1).max(4),
  extras: z.array(z.enum(EXTRAS.map((e) => e.id) as [string, ...string[]])).max(10),
  phone: z.string().regex(/^\d{9}$/, "Podaj 9-cyfrowy numer"),
  timing: z.enum(["now", "next_week", "planning"]),
  consent: z.literal(true),
  frequency: z.enum(["once", "weekly", "biweekly", "monthly"]),
});

export const submitQuoteRequest = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("quote_requests").select("id", { count: "exact", head: true })
      .eq("phone", data.phone).gte("created_at", since);
    if ((count ?? 0) >= 2) return { ok: false as const, error: "Zapytanie z tego numeru zostało już wysłane. Spróbuj później." };

    const p = estimate(data.service, data.area, data.bathrooms, data.extras, data.city, data.frequency);
    const { error } = await supabaseAdmin.from("quote_requests").insert({
      ...data, price_min: p.min, price_max: p.max,
    });
    if (error) return { ok: false as const, error: "Nie udało się wysłać zapytania. Spróbuj ponownie." };
    return { ok: true as const };
  });
