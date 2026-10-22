export type QuoteService = "home" | "renovation" | "office" | "special";

export const QUOTE_SERVICES: { id: QuoteService; icon: string; label: string; hint: string; catalog: string[]; rate: number }[] = [
  { id: "home", icon: "🏠", label: "Dom / Mieszkanie", hint: "Standardowe lub po najemcach", catalog: ["Mieszkania", "Sprzątanie generalne"], rate: 5 },
  { id: "renovation", icon: "🏗️", label: "Po remoncie / budowie", hint: "Pył gipsowy, okna, farba", catalog: ["Po remoncie"], rate: 10 },
  { id: "office", icon: "🏢", label: "Biuro / Lokal firmowy", hint: "Stała obsługa, faktura VAT", catalog: ["Biura"], rate: 4 },
  { id: "special", icon: "🧽", label: "Tapicerka lub okna", hint: "Usługi specjalistyczne", catalog: ["Pranie tapicerki", "Mycie okien"], rate: 3 },
];

export const EXTRAS: { id: string; label: string; price: number }[] = [
  { id: "windows", label: "Mycie okien (z obu stron)", price: 150 },
  { id: "oven", label: "Czyszczenie piekarnika / AGD w środku", price: 80 },
  { id: "sofa", label: "Pranie narożnika / kanapy", price: 180 },
];

/** Współczynnik miasta; nieznane miasta = 1.0 */
export const CITY_FACTOR: Record<string, number> = {
  Warszawa: 1.3, Kraków: 1.2, Wrocław: 1.15, Gdańsk: 1.15, Poznań: 1.1,
};

export const BATHROOM_PRICE = 100; // każda dodatkowa łazienka
export const MIN_PRICE = 150;

export type Frequency = "once" | "weekly" | "biweekly" | "monthly" | "custom";

export const FREQUENCIES: { id: Frequency; icon: string; label: string; hint: string; badge?: string; discount: number; visitsPerMonth: number }[] = [
  { id: "once", icon: "⚡", label: "Jednorazowo", hint: "Idealne po remoncie, przed wyprowadzką lub na wiosenne porządki.", discount: 0, visitsPerMonth: 0 },
  { id: "weekly", icon: "🔄", label: "Co tydzień", hint: "Dom zawsze lśni czystością. Stała, zaufana ekipa.", badge: "Najwyższy standard", discount: 0.15, visitsPerMonth: 4 },
  { id: "biweekly", icon: "🗓️", label: "Co 2 tygodnie", hint: "Idealny złoty środek dla domów i mieszkań.", badge: "Najpopularniejszy", discount: 0.1, visitsPerMonth: 2 },
  { id: "monthly", icon: "🏢", label: "Abonament miesięczny / B2B", hint: "Dla biur, gabinetów i lokali usługowych (z fakturą VAT).", discount: 0.15, visitsPerMonth: 4 },
  { id: "custom", icon: "✏️", label: "Własny harmonogram", hint: "Sam ustal, ile wizyt w miesiącu potrzebujesz.", discount: 0.1, visitsPerMonth: 0 },
];

/** Własny harmonogram: rabat 10% od 2 wizyt w miesiącu, przy 1 wizycie brak rabatu. */
export function frequencyTerms(frequency: Frequency, customVisits = 1) {
  const f = FREQUENCIES.find((x) => x.id === frequency)!;
  if (frequency !== "custom") return { discount: f.discount, visitsPerMonth: f.visitsPerMonth };
  const v = Math.min(30, Math.max(1, Math.round(customVisits)));
  return { discount: v >= 2 ? f.discount : 0, visitsPerMonth: v };
}

/** Cena za wizytę (z rabatem) oraz, dla stałej współpracy, miesięcznie. */
export function estimate(service: QuoteService, area: number, bathrooms: number, extraIds: string[], city: string, frequency: Frequency = "once", customVisits = 1) {
  const t = frequencyTerms(frequency, customVisits);
  const v = visitEstimate(service, area, bathrooms, extraIds, city, 1 - t.discount);
  return { ...v, monthMin: v.min * t.visitsPerMonth, monthMax: v.max * t.visitsPerMonth };
}

function visitEstimate(service: QuoteService, area: number, bathrooms: number, extraIds: string[], city: string, mult: number) {
  const rate = QUOTE_SERVICES.find((s) => s.id === service)!.rate;
  const factor = CITY_FACTOR[city] ?? 1;
  const extras = EXTRAS.filter((e) => extraIds.includes(e.id)).reduce((a, e) => a + e.price, 0);
  const base = mult * Math.max(MIN_PRICE, area * rate * factor + Math.max(0, bathrooms - 1) * BATHROOM_PRICE + extras);
  const round = (n: number) => Math.round(n / 10) * 10;
  return { min: round(base * 0.85), max: round(base * 1.15) };
}
