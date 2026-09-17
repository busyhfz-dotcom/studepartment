import { describe, expect, it } from "vitest";
import { currentResearcher, opportunities } from "../demo-data";
import { explainDeterministicMatch, sharedTopics } from "./scoring";

describe("explainable matching", () => {
  it("detects shared research topics", () => {
    expect(sharedTopics(currentResearcher, opportunities[0])).toEqual([
      "Tumor immunology",
      "Biomarkers",
    ]);
  });

  it("returns a strong alignment when multiple scientific topics overlap", () => {
    const result = explainDeterministicMatch(currentResearcher, opportunities[0]);
    expect(result.verdict).toBe("Strong alignment");
    expect(result.signals.some((signal) => signal.label === "Research context")).toBe(true);
  });

  it("always communicates decision-support limits", () => {
    const result = explainDeterministicMatch(currentResearcher, opportunities[2]);
    expect(result.caution).toContain("decision support");
  });
});
