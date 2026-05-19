import type { PublicMandatoryException } from "./public-design-policy";
import { publicBenchmarkCorpus } from "./public-design-policy";

export const HIGH_JEWELRY_REFERENCE_GATE = "HIGH_JEWELRY_REFERENCE_GATE";
export const HIGH_JEWELRY_REFERENCE_SITE_COUNT = 15;
export const HIGH_JEWELRY_SITE_WEIGHT = 1.5;
export const HIGH_JEWELRY_GATE_TOTAL_WEIGHT = 22.5;
export const HIGH_JEWELRY_GATE_PASS_THRESHOLD = 11.25;
export const HIGH_JEWELRY_GATE_MIN_SUPPORTED_SITES = 8;

export type HighJewelryRouteContext =
  | "home"
  | "plp"
  | "pdp"
  | "checkout"
  | "service"
  | "account"
  | "content"
  | "legal"
  | "global-ui";

export type HighJewelryChangeArea =
  | "ui"
  | "ux"
  | "content"
  | "structure"
  | "commerce-control";

export type HighJewelryGateStatus =
  | "supported"
  | "unsupported"
  | "explicit-exception"
  | "mandatory-exception";

export type HighJewelryReferenceSite = {
  name: string;
  sourceUrl: string;
  weight: typeof HIGH_JEWELRY_SITE_WEIGHT;
};

export type HighJewelryExplicitException = {
  approvedByUser: true;
  reason: string;
};

export type HighJewelryGateEvaluationInput = {
  area: HighJewelryChangeArea;
  change: string;
  evidenceUrls: readonly string[];
  explicitException?: HighJewelryExplicitException;
  mandatoryException?: PublicMandatoryException;
  route: HighJewelryRouteContext;
  supportedSiteNames: readonly string[];
};

export type HighJewelryGateEvaluation = HighJewelryGateEvaluationInput & {
  denominator: typeof HIGH_JEWELRY_GATE_TOTAL_WEIGHT;
  implementable: boolean;
  status: HighJewelryGateStatus;
  supportScore: number;
  threshold: typeof HIGH_JEWELRY_GATE_PASS_THRESHOLD;
};

const referenceSiteUrls = {
  Cartier: "https://www.cartier.com/en-us/jewelry/",
  "Tiffany & Co.": "https://www.tiffany.com/",
  "Van Cleef & Arpels":
    "https://www.vancleefarpels.com/us/en/collections/jewelry/couture.html",
  Bulgari: "https://www.bulgari.com/en-us/",
  "Harry Winston": "https://www.harrywinston.com/",
  Graff: "https://www.graff.com/us-en/home/",
  Chopard: "https://www.chopard.com/en-us",
  Boucheron: "https://www.boucheron.com/us/",
  Chaumet: "https://www.chaumet.com/us_en/",
  Piaget: "https://www.piaget.com/us-en",
  Mikimoto: "https://www.mikimoto.com/en/index.html",
  Messika: "https://www.messika.com/us_en/",
  Buccellati: "https://www.buccellati.com/en_us/home",
  "De Beers": "https://www.debeers.com/en-us/home",
  Pomellato: "https://www.pomellato.com/",
} as const;

export const highJewelryReferenceSites: HighJewelryReferenceSite[] =
  publicBenchmarkCorpus
    .filter((site) => site.tier === "luxury-house")
    .map((site) => ({
      name: site.name,
      sourceUrl: referenceSiteUrls[site.name as keyof typeof referenceSiteUrls],
      weight: HIGH_JEWELRY_SITE_WEIGHT,
    }));

const highJewelrySiteByName = new Map(
  highJewelryReferenceSites.map((site) => [site.name, site]),
);

export function calculateHighJewelryGateScore(
  supportedSiteNames: readonly string[],
) {
  return [...new Set(supportedSiteNames)].reduce((score, siteName) => {
    const site = highJewelrySiteByName.get(siteName);

    if (!site) {
      throw new Error(`Unknown high jewelry reference site: ${siteName}`);
    }

    return score + site.weight;
  }, 0);
}

export function evaluateHighJewelryGate(
  input: HighJewelryGateEvaluationInput,
): HighJewelryGateEvaluation {
  assertEvidenceUrls(input.evidenceUrls);

  const supportScore = calculateHighJewelryGateScore(input.supportedSiteNames);
  const isSupported = supportScore >= HIGH_JEWELRY_GATE_PASS_THRESHOLD;
  const hasExplicitException =
    input.explicitException?.approvedByUser === true &&
    input.explicitException.reason.trim().length > 0;

  if (input.mandatoryException) {
    return evaluation(input, supportScore, "mandatory-exception", true);
  }

  if (isSupported) {
    return evaluation(input, supportScore, "supported", true);
  }

  if (hasExplicitException) {
    return evaluation(input, supportScore, "explicit-exception", true);
  }

  return evaluation(input, supportScore, "unsupported", false);
}

function assertEvidenceUrls(evidenceUrls: readonly string[]) {
  if (evidenceUrls.length === 0) {
    throw new Error(
      "High Jewelry Reference Gate evaluations require evidence URLs.",
    );
  }

  const invalidUrl = evidenceUrls.find((url) => !url.startsWith("https://"));

  if (invalidUrl) {
    throw new Error(`Invalid high jewelry evidence URL: ${invalidUrl}`);
  }
}

function evaluation(
  input: HighJewelryGateEvaluationInput,
  supportScore: number,
  status: HighJewelryGateStatus,
  implementable: boolean,
): HighJewelryGateEvaluation {
  return {
    ...input,
    denominator: HIGH_JEWELRY_GATE_TOTAL_WEIGHT,
    implementable,
    status,
    supportScore,
    threshold: HIGH_JEWELRY_GATE_PASS_THRESHOLD,
  };
}
