import { describe, expect, it } from "vitest";
import { estimate } from "@/lib/quote";

describe("estimate", () => {
  it("renovation 50 m² in a 1.0 city: 500 zł base → 85%–115%", () => {
    expect(estimate("renovation", 50, 1, [], "Bydgoszcz")).toMatchObject({ min: 430, max: 580 });
  });
  it("applies Warsaw factor 1.3", () => {
    expect(estimate("renovation", 50, 1, [], "Warszawa")).toMatchObject({ min: 550, max: 750 });
  });
  it("adds 100 zł per extra bathroom and 150 zł for windows", () => {
    expect(estimate("renovation", 50, 2, ["windows"], "Bydgoszcz")).toMatchObject({ min: 640, max: 860 });
  });
  it("biweekly gives -10% per visit and 2 visits/month", () => {
    expect(estimate("renovation", 50, 1, [], "Bydgoszcz", "biweekly")).toMatchObject({ min: 380, max: 520, monthMin: 760, monthMax: 1040 });
  });
  it("weekly gives -15% per visit", () => {
    expect(estimate("renovation", 50, 1, [], "Bydgoszcz", "weekly")).toMatchObject({ min: 360, max: 490 });
  });
});
