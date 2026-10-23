import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { companies } from "@/data/companies";
import { QUOTE_SERVICES, FREQUENCIES, EXTRAS } from "@/lib/quote";
import { getCompanyPanel, updateCompanyCity, updateQuoteStatus, type PanelRequest } from "@/lib/panel.functions";

export const Route = createFileRoute("/panel")({
  head: () => ({
    meta: [
      { title: "Panel firmy — CzystaLista" },
      { name: "description", content: "Zarządzaj zapytaniami ofertowymi w panelu firmy." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Panel,
});

const TIMING_LABELS: Record<string, string> = {
  now: "Na już / w tym tygodniu",
  next_week: "W przyszłym tygodniu",
  planning: "Dopiero planuję",
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pl-PL", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function Panel() {
  const navigate = useNavigate();
  const fetchPanel = useServerFn(getCompanyPanel);
  const saveCityFn = useServerFn(updateCompanyCity);
  const setStatusFn = useServerFn(updateQuoteStatus);

  const [profile, setProfile] = useState<{ full_name: string | null; phone: string | null; city: string | null } | null>(null);
  const [requests, setRequests] = useState<PanelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCity, setEditingCity] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const [savingCity, setSavingCity] = useState(false);
  const [filterService, setFilterService] = useState<string>("all");
  const [filterTiming, setFilterTiming] = useState<string>("all");
  const [error, setError] = useState("");

  async function loadAll() {
    setLoading(true);
    setError("");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate({ to: "/logowanie", search: { info: "Zaloguj się na konto firmowe, aby zobaczyć panel." } });
      return;
    }
    try {
      const data = await fetchPanel();
      if (!data.ok) {
        navigate({ to: "/logowanie", search: { info: "Panel jest dostępny tylko dla kont firmowych. Zaloguj się na konto firmy." } });
        return;
      }
      setProfile({ full_name: data.fullName, phone: data.phone, city: data.city });
      setCityInput(data.city ?? "");
      setRequests(data.requests);
    } catch {
      setError("Nie udało się pobrać danych panelu.");
    }
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  async function saveCity() {
    setSavingCity(true);
    setError("");
    try {
      await saveCityFn({ data: { city: cityInput.trim() } });
      setEditingCity(false);
      await loadAll();
    } catch {
      setError("Nie udało się zapisać miasta.");
    }
    setSavingCity(false);
  }

  async function updateStatus(id: string, status: "accepted" | "rejected") {
    try {
      await setStatusFn({ data: { id, status } });
      setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch {
      setError("Nie udało się zmienić statusu.");
    }
  }

  const filtered = useMemo(
    () =>
      requests.filter(
        (r) =>
          (filterService === "all" || r.service === filterService) &&
          (filterTiming === "all" || r.timing === filterTiming),
      ),
    [requests, filterService, filterTiming],
  );

  const newLast7Days = useMemo(() => {
    const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return requests.filter((r) => r.status === "new" && new Date(r.created_at).getTime() >= since).length;
  }, [requests]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-hero">
        <p className="text-muted-foreground">Ładowanie panelu…</p>
      </div>
    );
  }

  const city = profile?.city ?? null;

  return (
    <div className="min-h-screen bg-hero">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link to="/" className="font-display text-2xl font-bold text-primary">CzystaLista</Link>
        <button
          onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/", replace: true }); }}
          className="rounded-xl border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Wyloguj
        </button>
      </nav>

      <div className="mx-auto max-w-5xl px-6 pb-16">
        <div className="rounded-2xl bg-card p-6 shadow-card md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{profile?.full_name ?? "Panel firmy"}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{profile?.phone}</p>
            </div>
            <div className="flex items-center gap-2">
              {!editingCity ? (
                <button
                  onClick={() => setEditingCity(true)}
                  className="flex items-center gap-2 rounded-xl bg-muted px-4 py-2.5 text-sm font-medium hover:shadow-card"
                >
                  📍 {city ?? "Ustaw miasto"}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <select
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    className="rounded-xl bg-muted px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">— wybierz —</option>
                    {[...new Set(companies.map((c) => c.city))].sort().map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                  <button
                    onClick={saveCity}
                    disabled={savingCity || !cityInput.trim()}
                    className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
                  >
                    {savingCity ? "…" : "Zapisz"}
                  </button>
                  <button
                    onClick={() => { setEditingCity(false); setCityInput(city ?? ""); }}
                    className="rounded-xl border px-3 py-2.5 text-sm hover:bg-muted"
                  >
                    Anuluj
                  </button>
                </div>
              )}
            </div>
          </div>

          {!city && (
            <div className="mt-4 rounded-xl bg-accent/20 px-4 py-3 text-sm">
              Ustaw miasto, w którym działasz, aby otrzymywać zapytania ofertowe od klientów z Twojej okolicy.
            </div>
          )}
        </div>

        {error && <p className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-muted p-4">
            <p className="text-2xl font-bold">{requests.length}</p>
            <p className="text-xs font-medium">Wszystkie zapytania</p>
          </div>
          <div className="rounded-2xl bg-primary/10 p-4 text-primary">
            <p className="text-2xl font-bold">{newLast7Days}</p>
            <p className="text-xs font-medium">Nowe w ostatnich 7 dniach</p>
          </div>
          <div className="rounded-2xl bg-muted p-4">
            <p className="text-2xl font-bold">{filtered.length}</p>
            <p className="text-xs font-medium">Po filtrach</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Usługa:</span>
          {[{ id: "all", label: "Wszystkie" }, ...QUOTE_SERVICES.map((s) => ({ id: s.id, label: s.label }))].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterService(f.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                filterService === f.id ? "bg-primary text-primary-foreground" : "bg-muted hover:shadow-card"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Termin:</span>
          {[{ id: "all", label: "Wszystkie" }, ...Object.entries(TIMING_LABELS).map(([id, label]) => ({ id, label }))].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterTiming(f.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                filterTiming === f.id ? "bg-primary text-primary-foreground" : "bg-muted hover:shadow-card"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {filtered.length === 0 && (
            <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
              {city
                ? "Brak zapytań spełniających wybrane filtry. Nowe oferty pojawią się tutaj automatycznie."
                : "Ustaw najpierw miasto działania, aby zobaczyć zapytania."}
            </div>
          )}
          {filtered.map((r) => {
            const svc = QUOTE_SERVICES.find((s) => s.id === r.service);
            const freq = FREQUENCIES.find((f) => f.id === r.frequency || r.frequency.startsWith("custom_"));
            return (
              <div key={r.id} className="rounded-2xl border bg-card p-5 shadow-card transition hover:-translate-y-0.5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{svc?.icon ?? "📋"}</span>
                    <div>
                      <h3 className="font-semibold">{svc?.label ?? r.service}</h3>
                      <p className="text-xs text-muted-foreground">{fmtDate(r.created_at)}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                    r.status === "new" ? "bg-primary/10 text-primary" :
                    r.status === "accepted" ? "bg-green-100 text-green-700" :
                    r.status === "rejected" ? "bg-red-100 text-red-700" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {r.status === "new" ? "Nowe" : r.status === "accepted" ? "Zaakceptowane" : r.status === "rejected" ? "Odrzucone" : r.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                  <div>
                    <p className="text-muted-foreground">Miasto</p>
                    <p className="font-medium">📍 {r.city}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Metraż</p>
                    <p className="font-medium">{r.area} m²</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Łazienki</p>
                    <p className="font-medium">{r.bathrooms}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Częstotliwość</p>
                    <p className="font-medium">{freq?.label ?? r.frequency}</p>
                  </div>
                </div>

                {r.extras.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {r.extras.map((e) => {
                      const ex = EXTRAS.find((x) => x.id === e);
                      return <span key={e} className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground">{ex?.label ?? e}</span>;
                    })}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Szacowana cena</p>
                      <p className="font-bold text-primary">{r.price_min} – {r.price_max} zł</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Termin</p>
                      <p className="font-medium">{TIMING_LABELS[r.timing] ?? r.timing}</p>
                    </div>
                  </div>
                  <a
                    href={`tel:+48${r.phone}`}
                    className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
                  >
                    📞 Zadzwoń: +48 {r.phone}
                  </a>
                </div>

                {r.status === "new" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => updateStatus(r.id, "accepted")}
                      className="flex-1 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
                    >
                      Przyjmij zlecenie
                    </button>
                    <button
                      onClick={() => updateStatus(r.id, "rejected")}
                      className="flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium hover:bg-muted"
                    >
                      Odrzuć
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
