import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { companies } from "@/data/companies";

export const Route = createFileRoute("/firma/$slug")({
  loader: ({ params }) => {
    const company = companies.find((c) => c.slug === params.slug);
    if (!company) throw notFound();
    return { company };
  },
  head: ({ loaderData }) => {
    const t = loaderData ? `${loaderData.company.name} — firma sprzątająca, ${loaderData.company.city}` : "Firma nie znaleziona";
    const d = loaderData?.company.description ?? "Firma sprzątająca w katalogu CzystaLista.";
    return {
      meta: [
        { title: t },
        { name: "description", content: d },
        { property: "og:title", content: t },
        { property: "og:description", content: d },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: CompanyPage,
});

function CompanyPage() {
  const { company: c } = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-hero">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link to="/" className="text-sm text-primary hover:underline">← Wróć do listy</Link>
        <div className="mt-6 rounded-2xl bg-card p-8 shadow-card">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-bold">{c.name}</h1>
            {c.verified && <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">Zweryfikowana</span>}
          </div>
          <p className="mt-2 text-muted-foreground">📍 {c.city} · ★ {c.rating} ({c.reviews} opinii) · od {c.priceFrom} zł</p>
          <p className="mt-6 text-lg">{c.description}</p>
          <h2 className="mt-8 text-xl font-semibold">Usługi</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {c.services.map((s) => <span key={s} className="rounded-full bg-secondary px-3 py-1.5 text-sm text-secondary-foreground">{s}</span>)}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={`tel:${c.phone}`} className="rounded-xl bg-primary px-5 py-3 font-medium text-primary-foreground hover:opacity-90">Zadzwoń: {c.phone}</a>
            <a href={`mailto:${c.email}`} className="rounded-xl border px-5 py-3 font-medium hover:bg-muted">Napisz e-mail</a>
          </div>
        </div>
      </div>
    </div>
  );
}
