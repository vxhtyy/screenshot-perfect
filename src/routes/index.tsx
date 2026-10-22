import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { companies, SERVICES } from "@/data/companies";
import { QuoteCalculator } from "@/components/QuoteCalculator";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CzystaLista — katalog firm sprzątających" },
      { name: "description", content: "Znajdź sprawdzoną firmę sprzątającą w swoim mieście. Porównaj usługi, ceny i opinie." },
      { property: "og:title", content: "CzystaLista — katalog firm sprzątających" },
      { property: "og:description", content: "Porównaj firmy sprzątające: usługi, ceny i opinie w jednym miejscu." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [service, setService] = useState("");
  const cities = [...new Set(companies.map((c) => c.city))].sort();

  const list = useMemo(
    () =>
      companies.filter(
        (c) =>
          c.name.toLowerCase().includes(q.toLowerCase()) &&
          (!city || c.city === city) &&
          (!service || c.services.includes(service)),
      ),
    [q, city, service],
  );

  return (
    <div className="min-h-screen">
      <header className="bg-hero">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="font-display text-2xl font-bold text-primary">CzystaLista</span>
          <span className="text-sm text-muted-foreground">{companies.length} firm w katalogu</span>
        </nav>
        <div className="mx-auto max-w-6xl px-6 pb-16 pt-10">
          <h1 className="max-w-2xl text-5xl font-bold leading-tight md:text-6xl">
            Znajdź firmę, która posprząta <span className="text-primary">za Ciebie</span>.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            Porównaj firmy sprzątające w Twoim mieście — usługi, ceny i opinie w jednym miejscu.
          </p>
          <div className="mt-8 grid gap-3 rounded-2xl bg-card p-3 shadow-card md:grid-cols-[1fr_200px_220px]">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Szukaj po nazwie…" className="rounded-xl bg-muted px-4 py-3 outline-none focus:ring-2 focus:ring-ring" />
            <select value={city} onChange={(e) => setCity(e.target.value)} className="rounded-xl bg-muted px-4 py-3 outline-none">
              <option value="">Wszystkie miasta</option>
              {cities.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select value={service} onChange={(e) => setService(e.target.value)} className="rounded-xl bg-muted px-4 py-3 outline-none">
              <option value="">Wszystkie usługi</option>
              {SERVICES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </header>

      <div className="mx-auto -mt-6 max-w-6xl px-4 md:px-6">
        <h2 className="mb-4 text-center text-3xl font-bold">Sprawdź, ile zapłacisz</h2>
        <QuoteCalculator />
      </div>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="mb-6 text-sm text-muted-foreground">Znaleziono: {list.length}</p>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <Link key={c.slug} to="/firma/$slug" params={{ slug: c.slug }} className="group flex flex-col rounded-2xl border bg-card p-6 transition hover:-translate-y-1 hover:shadow-card">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-xl font-semibold group-hover:text-primary">{c.name}</h2>
                {c.verified && <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">Zweryfikowana</span>}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">📍 {c.city}</p>
              <p className="mt-3 line-clamp-2 text-sm">{c.description}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {c.services.map((s) => <span key={s} className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">{s}</span>)}
              </div>
              <div className="mt-auto flex items-center justify-between pt-5 text-sm">
                <span>★ <b>{c.rating}</b> <span className="text-muted-foreground">({c.reviews})</span></span>
                <span>od <b>{c.priceFrom} zł</b></span>
              </div>
            </Link>
          ))}
        </div>
        {list.length === 0 && <p className="py-16 text-center text-muted-foreground">Brak firm spełniających kryteria.</p>}
      </main>
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">© 2026 CzystaLista</footer>
    </div>
  );
}
