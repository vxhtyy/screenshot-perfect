import { describe, it, expect } from "vitest";
import { normalizeCity } from "@/lib/panel.functions";

// Reguła panelu: firma widzi tylko zapytania ze swojego miasta,
// porównywane bez względu na wielkość liter i spacje na brzegach.
describe("widoczność zapytań wg miasta firmy", () => {
  const requests = [
    { id: "1", city: "Warszawa" },
    { id: "2", city: "Kraków" },
    { id: "3", city: " kraków " },
  ];
  const visibleFor = (companyCity: string) =>
    requests.filter((r) => normalizeCity(r.city) === normalizeCity(companyCity)).map((r) => r.id);

  it("firma z Krakowa nie widzi zapytań z Warszawy", () => {
    expect(visibleFor("Kraków")).toEqual(["2", "3"]);
    expect(visibleFor("Kraków")).not.toContain("1");
  });

  it("wielkość liter i spacje nie mają znaczenia", () => {
    expect(visibleFor(" KRAKÓW ")).toEqual(["2", "3"]);
    expect(visibleFor("warszawa")).toEqual(["1"]);
  });
});
