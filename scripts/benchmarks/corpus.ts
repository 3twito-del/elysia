import { highJewelryReferenceSites } from "../../src/lib/high-jewelry-reference-gate";

export type BenchmarkCorpusSite = {
  name: string;
  role: "canonical" | "local" | "reserve";
  sourceUrl: string;
  weight: number;
};

export const canonicalBenchmarkSites: BenchmarkCorpusSite[] =
  highJewelryReferenceSites.map((site) => ({
    name: site.name,
    role: "canonical",
    sourceUrl: site.sourceUrl,
    weight: site.weight,
  }));

export const reserveBenchmarkSites: BenchmarkCorpusSite[] = [
  {
    name: "David Yurman",
    role: "reserve",
    sourceUrl: "https://www.davidyurman.com/",
    weight: 1,
  },
  {
    name: "Swarovski",
    role: "reserve",
    sourceUrl: "https://www.swarovski.com/en-US/",
    weight: 1,
  },
  {
    name: "Mejuri",
    role: "reserve",
    sourceUrl: "https://mejuri.com/",
    weight: 1,
  },
  {
    name: "Brilliant Earth",
    role: "reserve",
    sourceUrl: "https://www.brilliantearth.com/",
    weight: 1,
  },
  {
    name: "Blue Nile",
    role: "reserve",
    sourceUrl: "https://www.bluenile.com/",
    weight: 1,
  },
  {
    name: "VRAI",
    role: "reserve",
    sourceUrl: "https://www.vrai.com/",
    weight: 1,
  },
  {
    name: "Monica Vinader",
    role: "reserve",
    sourceUrl: "https://www.monicavinader.com/",
    weight: 1,
  },
  {
    name: "Pandora US",
    role: "reserve",
    sourceUrl: "https://us.pandora.net/",
    weight: 1,
  },
  {
    name: "Aurate",
    role: "reserve",
    sourceUrl: "https://auratenewyork.com/",
    weight: 1,
  },
  {
    name: "Kendra Scott",
    role: "reserve",
    sourceUrl: "https://www.kendrascott.com/",
    weight: 1,
  },
];
