import { describe, expect, it } from "vitest";

import { publicBenchmarkCorpus } from "./public-design-policy";
import {
  calculateHighJewelryGateScore,
  evaluateHighJewelryGate,
  HIGH_JEWELRY_GATE_MIN_SUPPORTED_SITES,
  HIGH_JEWELRY_GATE_PASS_THRESHOLD,
  HIGH_JEWELRY_GATE_TOTAL_WEIGHT,
  HIGH_JEWELRY_REFERENCE_GATE,
  HIGH_JEWELRY_REFERENCE_SITE_COUNT,
  highJewelryReferenceSites,
} from "./high-jewelry-reference-gate";

describe("high jewelry reference gate", () => {
  it("locks the 15-site Tier A high jewelry reference gate", () => {
    expect(HIGH_JEWELRY_REFERENCE_GATE).toBe("HIGH_JEWELRY_REFERENCE_GATE");
    expect(highJewelryReferenceSites).toHaveLength(
      HIGH_JEWELRY_REFERENCE_SITE_COUNT,
    );
    expect(highJewelryReferenceSites.map((site) => site.name)).toEqual(
      publicBenchmarkCorpus.slice(0, 15).map((site) => site.name),
    );
    expect(
      highJewelryReferenceSites.every(
        (site) => site.weight === 1.5 && site.sourceUrl.startsWith("https://"),
      ),
    ).toBe(true);
    expect(
      highJewelryReferenceSites.reduce((total, site) => total + site.weight, 0),
    ).toBe(HIGH_JEWELRY_GATE_TOTAL_WEIGHT);
    expect(HIGH_JEWELRY_GATE_PASS_THRESHOLD).toBe(11.25);
    expect(HIGH_JEWELRY_GATE_MIN_SUPPORTED_SITES).toBe(8);
  });

  it("requires at least 8 of 15 Tier A sites for direct implementation", () => {
    const supportedSites = highJewelryReferenceSites
      .slice(0, HIGH_JEWELRY_GATE_MIN_SUPPORTED_SITES)
      .map((site) => site.name);
    const evaluation = evaluateHighJewelryGate({
      area: "content",
      change: "Reduce the public About page copy density.",
      evidenceUrls: highJewelryReferenceSites
        .slice(0, HIGH_JEWELRY_GATE_MIN_SUPPORTED_SITES)
        .map((site) => site.sourceUrl),
      route: "content",
      supportedSiteNames: supportedSites,
    });

    expect(evaluation.supportScore).toBe(12);
    expect(evaluation.status).toBe("supported");
    expect(evaluation.implementable).toBe(true);
  });

  it("blocks unsupported public changes until an explicit exception is recorded", () => {
    const supportedSiteNames = highJewelryReferenceSites
      .slice(0, HIGH_JEWELRY_GATE_MIN_SUPPORTED_SITES - 1)
      .map((site) => site.name);
    const blocked = evaluateHighJewelryGate({
      area: "ui",
      change: "Introduce a boxed dashboard-style public navigation state.",
      evidenceUrls: highJewelryReferenceSites
        .slice(0, HIGH_JEWELRY_GATE_MIN_SUPPORTED_SITES - 1)
        .map((site) => site.sourceUrl),
      route: "global-ui",
      supportedSiteNames,
    });

    expect(blocked.supportScore).toBe(10.5);
    expect(blocked.status).toBe("unsupported");
    expect(blocked.implementable).toBe(false);

    const explicitException = evaluateHighJewelryGate({
      ...blocked,
      explicitException: {
        approvedByUser: true,
        reason: "User approved a one-off brand exception after gate failure.",
      },
    });

    expect(explicitException.status).toBe("explicit-exception");
    expect(explicitException.implementable).toBe(true);
  });

  it("keeps mandatory legal accessibility payment and backend exceptions explicit", () => {
    const evaluation = evaluateHighJewelryGate({
      area: "commerce-control",
      change: "Keep a mandatory cookie control visible.",
      evidenceUrls: ["https://www.w3.org/WAI/standards-guidelines/wcag/"],
      mandatoryException: "accessibility",
      route: "global-ui",
      supportedSiteNames: [],
    });

    expect(evaluation.status).toBe("mandatory-exception");
    expect(evaluation.implementable).toBe(true);
  });

  it("rejects invented benchmark site names", () => {
    expect(() => calculateHighJewelryGateScore(["Invented Maison"])).toThrow(
      "Unknown high jewelry reference site",
    );
  });

  it("requires evidence URLs for every gate evaluation", () => {
    expect(() =>
      evaluateHighJewelryGate({
        area: "content",
        change: "Reduce the public About page copy density.",
        evidenceUrls: [],
        route: "content",
        supportedSiteNames: highJewelryReferenceSites
          .slice(0, HIGH_JEWELRY_GATE_MIN_SUPPORTED_SITES)
          .map((site) => site.name),
      }),
    ).toThrow("require evidence URLs");
  });
});
