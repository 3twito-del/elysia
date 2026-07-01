import { db } from "~/server/db";

/**
 * On-site A/B testing (CMS-003): weighted variant assignment + conversion
 * tracking. Assignment, conversion rate and winner selection are pure + tested.
 */

export type VariantRule = { key: string; weight: number };

/** Deterministically picks a variant by weight for a 0..1 seed. Pure. */
export function pickVariant(variants: VariantRule[], seed: number): string | null {
  const active = variants.filter((variant) => variant.weight > 0);
  if (active.length === 0) return null;
  const total = active.reduce((sum, variant) => sum + variant.weight, 0);
  let threshold = Math.min(Math.max(seed, 0), 0.999999) * total;
  for (const variant of active) {
    threshold -= variant.weight;
    if (threshold < 0) return variant.key;
  }
  return active[active.length - 1]!.key;
}

/** Conversion rate as a percentage. Pure. */
export function conversionRate(impressions: number, conversions: number): number {
  if (impressions <= 0) return 0;
  return Math.round((conversions / impressions) * 1000) / 10;
}

/**
 * Picks the leading variant by conversion rate once each has a minimum sample.
 * Returns null while under-powered. Pure.
 */
export function chooseWinner(
  variants: Array<{ key: string; impressions: number; conversions: number }>,
  minImpressions = 100,
): string | null {
  const eligible = variants.filter((variant) => variant.impressions >= minImpressions);
  if (eligible.length < 2) return null;
  return [...eligible]
    .sort(
      (a, b) =>
        conversionRate(b.impressions, b.conversions) -
        conversionRate(a.impressions, a.conversions),
    )[0]!.key;
}

function slugKey(input: string): string {
  return (
    input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "exp"
  );
}

export async function createExperiment(input: { name: string }) {
  if (!input.name.trim()) throw new Error("שם הניסוי הוא שדה חובה.");
  let key = slugKey(input.name);
  let suffix = 1;
  while (await db.experiment.findUnique({ where: { key } })) {
    suffix += 1;
    key = `${slugKey(input.name)}-${suffix}`;
  }
  return db.experiment.create({
    data: {
      key,
      name: input.name.trim(),
      variants: {
        create: [
          { key: "A", weight: 50 },
          { key: "B", weight: 50 },
        ],
      },
    },
  });
}

export async function setExperimentStatus(input: {
  experimentId: string;
  status: string;
}) {
  const status = ["RUNNING", "PAUSED", "CONCLUDED"].includes(input.status)
    ? input.status
    : "PAUSED";
  return db.experiment.update({
    where: { id: input.experimentId },
    data: { status },
  });
}

export async function recordExperimentEvent(input: {
  experimentId: string;
  variantKey: string;
  event: "impression" | "conversion";
}) {
  return db.experimentVariant.updateMany({
    where: { experimentId: input.experimentId, key: input.variantKey },
    data:
      input.event === "conversion"
        ? { conversions: { increment: 1 } }
        : { impressions: { increment: 1 } },
  });
}

export async function listExperiments(limit = 30) {
  const experiments = await db.experiment.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { variants: { orderBy: { key: "asc" } } },
  });
  return experiments.map((experiment) => ({
    id: experiment.id,
    key: experiment.key,
    name: experiment.name,
    status: experiment.status,
    winner: chooseWinner(experiment.variants),
    variants: experiment.variants.map((variant) => ({
      id: variant.id,
      key: variant.key,
      weight: variant.weight,
      impressions: variant.impressions,
      conversions: variant.conversions,
      rate: conversionRate(variant.impressions, variant.conversions),
    })),
  }));
}

export async function getExperimentsSummary() {
  const [total, running] = await Promise.all([
    db.experiment.count(),
    db.experiment.count({ where: { status: "RUNNING" } }),
  ]);
  return { total, running };
}
