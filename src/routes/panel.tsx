import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { companies } from "@/data/companies";
import { QUOTE_SERVICES, FREQUENCIES, EXTRAS } from "@/lib/quote";

export const Route = createFileRoute("/panel")({
  head: () => ({
    meta: [
      { title: "Panel firmy — CzystaLista" },
      { name: "description", content: "Zarządzaj zapytaniami ofertowymi w panelu firmy." },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/logowanie" });
  },
  component: Panel,
});

type QuoteRow = {
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
  const [profile, setProfile] = useState<{ full_name: string | null; phone: string | null; account_type: string; city: string | null } | null>(null);
  const [requests, setRequests] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCity, setEditingCity] = useState(false);
  const [cityInput, setCityInput] = useState("");
  const [savingCity, setSavingCity] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [error, setError] = useState("");

  async function loadAll() {
    setLoading(true);
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: prof, error: profErr } = await supabase
      .from("profiles").select("full_name, phone, account_type, city").eq("id", user.id).maybeSingle();
    if (profErr) { setError("Nie udało się pobrać profilu."); setLoading(false); return; }
    setProfile(prof);
    setCityInput(prof?.city ?? "");

    if (prof?.account_type !== "company") {
      setLoading(false);
      return;
    }

    const { data: reqs, error: reqErr } = await supabase
      .from("quote_requests")
      .select("id, created_at, service, city, area, bathrooms, extras, price_min, price_max, phone, timing, frequency, status")
      .eq("city", prof.city ?? "")
      .order("created_at", { ascending: false });
    if (reqErr) { setError("Nie udało się pobrać zapytań."); setLoading(false); return; }
    setRequests(reqs ?? []);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  async function saveCity() {
    setSavingCity(true);
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error: updErr } = await supabase
      .from("profiles").update({ city: cityInput.trim() }).eq("id", user.id);
    setSavingCity(false);
    if (updErr) { setError("Nie udało się zapisać miasta."); return; }
    setEditingCity(false);
    loadAll();
  }

  async function updateStatus(id: string, status: string) {
    const { error: updErr } = await supabase
      .from("quote_requests").update({ status }).eq("id", id);
    if (updErr) return;
    setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-hero">
        <p className="text-muted-foreground">Ładowanie panelu…</p>
      </div>
    );
  }

  if (profile?.account_type !== "company") {
    return (
      <div className="min-h-screen bg-hero">
        <div className="mx-auto max-w-md px-4 pt-20 text-center">
          <div className="rounded-2xl bg-card p-8 shadow-card">
            <p className="text-5xl">🔒</p>
            <h1 className="mt-4 text-2xl font-bold">Panel dostępny tylko dla firm</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              To konto klienta. Załóż konto firmowe, aby otrzymywać zapytenia ofertowe.
            </p>
            <Link to="/" className="mt-6 inline-block rounded-xl bg-primary px-5 py-3 font-medium text-primary-foreground hover:opacity-90">
              Wróć na stronę główną
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const city = profile.city;
  const filtered = filterStatus === "all" ? requests : requests.filter((r) => r.status === filterStatus);
  const stats = {
    total: requests.length,
    new: requests.filter((r) => r.status === "new").length,
    accepted: requests.filter((r) => r.status === "accepted").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  return (
    <div className="min-h-screen bg-hero">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link to="/" className="font-display text-2xl font-bold text-primary">CzystaLista</Link>
        <button
          onClick={async () => { await supabase.auth.signOut(); window.location.assign("/"); }}
          className="rounded-xl border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Wyloguj
        </button>
      </nav>

      <div className="mx-auto max-w-5xl px-6 pb-16">
        <div className="rounded-2xl bg-card p-6 shadow-card md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{profile.full_name ?? "Panel firmy"}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{profile.phone}</p>
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

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Wszystkie", value: stats.total, color: "bg-muted text-foreground" },
            { label: "Nowe", value: stats.new, color: "bg-primary/10 text-primary" },
            { label: "Zaakceptowane", value: stats.accepted, color: "bg-green-100 text-green-700" },
            { label: "Odrzucone", value: stats.rejected, color: "bg-red-100 text-red-700" },
          ].map((s) => (
            <div key={s.label} className={`rounded-2xl p-4 ${s.color}`}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { id: "all", label: "Wszystkie" },
            { id: "new", label: "Nowe" },
            { id: "accepted", label: "Zaakceptowane" },
            { id: "rejected", label: "Odrzucone" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                filterStatus === f.id ? "bg-primary text-primary-foreground" : "bg-muted hover:shadow-card"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {filtered.length === 0 && (
            <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">
              {city ? "Brak zapytań w Twoim mieście. Nowe oferty pojawią się tutaj automatycznie." : "Ustaw najpierw miasto działania."}
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
