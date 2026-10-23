import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Porównywanie miast bez względu na wielkość liter i spacje na brzegach. */
export const normalizeCity = (c: string) => c.trim().toLowerCase();

export type PanelRequest = {
  id: string;
  created_at: string;
  service: string;
  city: string;
  area: number;
  bathrooms: number;
  extras: string[];
  price_min: number;
  price_max: number;
  phone: string;
  timing: string;
  frequency: string;
  status: string;
};

export type PanelData =
  | { ok: true; fullName: string | null; phone: string | null; city: string | null; requests: PanelRequest[] }
  | { ok: false; reason: "not_company" | "no_profile" };

async function getCompanyProfile(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, account_type, city")
    .eq("id", userId)
    .maybeSingle();
  return profile as { full_name: string | null; phone: string | null; account_type: string; city: string | null } | null;
}

export const getCompanyPanel = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PanelData> => {
    const { supabase, userId } = context;
    const profile = await getCompanyProfile(supabase, userId);
    if (!profile) return { ok: false, reason: "no_profile" };
    if (profile.account_type !== "company") return { ok: false, reason: "not_company" };

    if (!profile.city) {
      return { ok: true, fullName: profile.full_name, phone: profile.phone, city: null, requests: [] };
    }

    // Filtrowanie po stronie serwera, znormalizowane (trim + małe litery)
    const { data: rows, error } = await supabase
      .from("quote_requests")
      .select("id, created_at, service, city, area, bathrooms, extras, price_min, price_max, phone, timing, frequency, status")
      .order("created_at", { ascending: false });
    if (error) throw new Error("Nie udało się pobrać zapytań.");

    const city = normalizeCity(profile.city);
    const requests = ((rows ?? []) as PanelRequest[]).filter((r) => normalizeCity(r.city) === city);
    return { ok: true, fullName: profile.full_name, phone: profile.phone, city: profile.city, requests };
  });

export const updateCompanyCity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ city: z.string().trim().min(2).max(60) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const profile = await getCompanyProfile(supabase, userId);
    if (profile?.account_type !== "company") throw new Error("Forbidden");
    const { error } = await supabase.from("profiles").update({ city: data.city }).eq("id", userId);
    if (error) throw new Error("Nie udało się zapisać miasta.");
    return { ok: true as const };
  });

export const updateQuoteStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["new", "accepted", "rejected"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const profile = await getCompanyProfile(supabase, userId);
    if (profile?.account_type !== "company" || !profile.city) throw new Error("Forbidden");
    // RLS ogranicza aktualizację do zapytań z miasta firmy
    const { error } = await supabase.from("quote_requests").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error("Nie udało się zmienić statusu.");
    return { ok: true as const };
  });
