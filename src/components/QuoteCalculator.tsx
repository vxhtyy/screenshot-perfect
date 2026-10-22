import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { companies } from "@/data/companies";
import { EXTRAS, QUOTE_SERVICES, estimate, type QuoteService } from "@/lib/quote";
import { submitQuoteRequest } from "@/lib/quote.functions";

const TIMINGS = [
  { id: "now", label: "Na już / w tym tygodniu" },
  { id: "next_week", label: "W przyszłym tygodniu" },
  { id: "planning", label: "Dopiero planuję" },
] as const;

export function QuoteCalculator() {
  const cities = [...new Set(companies.map((c) => c.city))].sort();
  const submit = useServerFn(submitQuoteRequest);
  const [step, setStep] = useState(1);
  const [service, setService] = useState<QuoteService>("home");
  const [city, setCity] = useState<string>(cities[0] ?? "");
  const [area, setArea] = useState(60);
  const [bathrooms, setBathrooms] = useState(1);
  const [extras, setExtras] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [phone, setPhone] = useState("");
  const [timing, setTiming] = useState<(typeof TIMINGS)[number]["id"]>("now");
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const svc = QUOTE_SERVICES.find((s) => s.id === service)!;
  const q = estimate(service, area, bathrooms, extras, city);
  const local = companies.filter((c) => c.city === city);
  const matches = local.filter((c) => c.services.some((s) => svc.catalog.includes(s)));

  useEffect(() => {
    if (!analyzing) return;
    const t = setTimeout(() => { setAnalyzing(false); setStep(3); }, 1500);
    return () => clearTimeout(t);
  }, [analyzing]);

  const toggle = (id: string) => setExtras((x) => (x.includes(id) ? x.filter((e) => e !== id) : [...x, id]));
  const digits = phone.replace(/\D/g, "");

  async function send() {
    setError("");
    if (digits.length !== 9) return setError("Podaj poprawny 9-cyfrowy numer telefonu.");
    if (!consent) return setError("Zaznacz zgodę na przekazanie danych.");
    setSending(true);
    try {
      const r = await submit({ data: { service, city, area, bathrooms, extras, phone: digits, timing, consent: true } });
      if (r.ok) setDone(true); else setError(r.error);
    } catch { setError("Nie udało się wysłać zapytania. Spróbuj ponownie."); }
    finally { setSending(false); }
  }

  const bigBtn = "w-full rounded-2xl bg-primary px-6 py-4 text-lg font-bold text-primary-foreground shadow-card transition hover:opacity-90 disabled:opacity-60";

  return (
    <section id="kalkulator" className="mx-auto w-full max-w-[680px] rounded-3xl bg-card p-5 shadow-card md:p-8">
      {!done && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-muted-foreground">Krok {step} z 4</span>
            {step > 1 && !analyzing && <button type="button" onClick={() => setStep(step - 1)} className="text-primary hover:underline">← Wstecz</button>}
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${step * 25}%` }} />
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <h2 className="text-2xl font-bold">W czym możemy Ci pomóc?</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {QUOTE_SERVICES.map((s) => (
              <button key={s.id} type="button" onClick={() => { setService(s.id); setStep(2); }}
                className={`flex min-h-24 items-start gap-3 rounded-2xl border-2 p-4 text-left transition hover:border-primary ${service === s.id ? "border-primary bg-secondary" : "border-border bg-muted"}`}>
                <span className="text-3xl" aria-hidden>{s.icon}</span>
                <span><span className="block font-semibold">{s.label}</span><span className="text-sm text-muted-foreground">{s.hint}</span></span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && !analyzing && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">{svc.icon} {svc.label}</h2>
          <div>
            <label className="font-semibold" htmlFor="city">Miasto</label>
            <select id="city" value={city} onChange={(e) => setCity(e.target.value)} className="mt-2 w-full rounded-xl bg-muted px-4 py-3 outline-none focus:ring-2 focus:ring-ring">
              {cities.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between gap-3">
              <label className="font-semibold" htmlFor="area">Metraż lokalu</label>
              <div className="flex items-center gap-1">
                <input type="number" min={30} max={300} value={area} aria-label="Metraż w m²"
                  onChange={(e) => setArea(Math.min(1000, Math.max(0, +e.target.value || 0)))}
                  className="w-20 rounded-lg bg-muted px-2 py-1 text-right font-bold text-primary outline-none focus:ring-2 focus:ring-ring" />
                <span className="font-bold text-primary">m²</span>
              </div>
            </div>
            <input id="area" type="range" min={30} max={300} step={5} value={Math.min(300, Math.max(30, area))} onChange={(e) => setArea(+e.target.value)}
              className="mt-3 h-3 w-full cursor-pointer accent-primary" />
          </div>
          {service !== "special" && (
            <div>
              <p className="font-semibold">Liczba łazienek</p>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((n) => (
                  <button key={n} type="button" onClick={() => setBathrooms(n)}
                    className={`rounded-xl py-3 text-lg font-bold ${bathrooms === n ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    {n === 4 ? "4+" : n}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="font-semibold">Dodatkowe opcje</p>
            <div className="mt-2 space-y-2">
              {EXTRAS.map((e) => (
                <label key={e.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 ${extras.includes(e.id) ? "border-primary bg-secondary" : "border-border"}`}>
                  <input type="checkbox" checked={extras.includes(e.id)} onChange={() => toggle(e.id)} className="h-5 w-5 accent-primary" />
                  <span>{e.label}</span>
                </label>
              ))}
            </div>
          </div>
          <button type="button" disabled={area < 10} onClick={() => setAnalyzing(true)} className={bigBtn}>Oblicz wstępną wycenę ➔</button>
        </div>
      )}

      {analyzing && (
        <div className="flex flex-col items-center py-12 text-center">
          <div className="relative h-20 w-20">
            <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
            <span className="absolute inset-3 flex items-center justify-center rounded-full bg-primary text-2xl text-primary-foreground">📡</span>
          </div>
          <p className="mt-6 text-lg font-semibold">Analizujemy stawki w Twojej okolicy…</p>
          <p className="mt-1 text-muted-foreground">Sprawdzamy dostępność firm w mieście {city}</p>
        </div>
      )}

      {step === 3 && (
        <div className="text-center">
          <p className="text-muted-foreground">Szacowany koszt</p>
          <p className="mt-1 font-display text-4xl font-bold text-primary md:text-5xl">{q.min} zł – {q.max} zł <span className="text-xl">brutto</span></p>
          <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
            Cena bazuje na stawkach firm sprzątających w Twojej okolicy. Wprowadź numer, aby wysłać zapytanie i otrzymać dokładne oferty od wykonawców z miasta {city}.
          </p>
          <button type="button" onClick={() => setStep(4)} className={`${bigBtn} mt-6`}>Chcę dokładne oferty ➔</button>
        </div>
      )}

      {step === 4 && !done && (
        <div className="space-y-5">
          <h2 className="text-2xl font-bold">Gdzie wysłać oferty?</h2>
          <div>
            <label className="font-semibold" htmlFor="phone">Numer telefonu</label>
            <div className="mt-2 flex overflow-hidden rounded-xl bg-muted focus-within:ring-2 focus-within:ring-ring">
              <span className="border-r border-border px-4 py-3 font-semibold">+48</span>
              <input id="phone" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={11} value={phone}
                onChange={(e) => setPhone(e.target.value)} placeholder="Wpisz numer telefonu"
                className="w-full bg-transparent px-4 py-3 text-lg outline-none" />
            </div>
          </div>
          <div>
            <p className="font-semibold">Kiedy potrzebujesz usługi?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {TIMINGS.map((t) => (
                <button key={t.id} type="button" onClick={() => setTiming(t.id)}
                  className={`rounded-full px-4 py-2.5 text-sm font-medium ${timing === t.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{t.label}</button>
              ))}
            </div>
          </div>
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-primary" />
            <span>Wyrażam zgodę na przekazanie mojego numeru telefonu i szczegółów zlecenia maksymalnie 3 firmom sprzątającym z mojego miasta w celu przygotowania oferty.</span>
          </label>
          {error && <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
          <button type="button" onClick={send} disabled={sending} className={bigBtn}>{sending ? "Wysyłanie…" : "Odbierz darmowe oferty od 3 firm"}</button>
          <p className="text-center text-xs text-muted-foreground">🔒 Bez spamu. Twoje dane trafiają wyłącznie do sprawdzonych ekip z Twojego miasta w celu przygotowania oferty.</p>
        </div>
      )}

      {done && (
        <div className="py-6 text-center">
          <p className="text-5xl">✅</p>
          <h2 className="mt-3 text-2xl font-bold">Zapytanie wysłane!</h2>
          <p className="mt-2 text-muted-foreground">Firmy z miasta {city} skontaktują się z Tobą telefonicznie.</p>
          {matches.length > 0 && (
            <ul className="mt-6 space-y-2 text-left">
              {matches.slice(0, 3).map((c) => (
                <li key={c.slug}>
                  <Link to="/firma/$slug" params={{ slug: c.slug }} className="flex items-center justify-between rounded-xl bg-muted px-4 py-3 hover:shadow-card">
                    <span className="font-medium">{c.name}</span><span>★ {c.rating}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
