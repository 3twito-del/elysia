import { db } from "~/server/db";

/**
 * Carriers and shipping rate cards (LOG / TMS, §4.T).
 *
 * Each carrier has zone/weight rates; selectShippingRate picks the cheapest rate
 * that covers a given zone and weight. The selection is pure and tested.
 */

export type ShippingRateLite = {
  carrierId: string;
  carrierName: string;
  zone: string;
  maxWeightKg: number;
  price: number;
};

/** Cheapest rate that covers the zone and weight, or null. Pure. */
export function selectShippingRate(
  rates: ShippingRateLite[],
  input: { zone: string; weightKg: number },
): ShippingRateLite | null {
  const eligible = rates.filter(
    (rate) => rate.zone === input.zone && input.weightKg <= rate.maxWeightKg,
  );
  if (eligible.length === 0) return null;

  return eligible.reduce((cheapest, rate) =>
    rate.price < cheapest.price ? rate : cheapest,
  );
}

/** Creates a carrier. */
export async function createCarrier(input: { name: string }) {
  if (!input.name.trim()) throw new Error("שם המוביל הוא שדה חובה.");
  return db.carrier.create({ data: { name: input.name.trim() } });
}

/** Adds a rate card to a carrier. */
export async function createShippingRate(input: {
  carrierId: string;
  zone: string;
  maxWeightKg: number;
  price: number;
}) {
  if (!input.zone.trim()) throw new Error("אזור הוא שדה חובה.");
  if (input.maxWeightKg <= 0) throw new Error("משקל מרבי חייב להיות חיובי.");
  if (input.price < 0) throw new Error("מחיר לא יכול להיות שלילי.");

  return db.shippingRate.create({
    data: {
      carrierId: input.carrierId,
      zone: input.zone.trim(),
      maxWeightKg: input.maxWeightKg,
      price: input.price,
    },
  });
}

/** Active carriers for selects. */
export async function listCarriers() {
  return db.carrier.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

/** All rate cards with their carrier name. */
export async function listShippingRates(limit = 50) {
  const rates = await db.shippingRate.findMany({
    orderBy: [{ zone: "asc" }, { maxWeightKg: "asc" }],
    take: limit,
    select: {
      id: true,
      zone: true,
      maxWeightKg: true,
      price: true,
      carrier: { select: { id: true, name: true } },
    },
  });

  return rates.map((rate) => ({
    id: rate.id,
    carrierId: rate.carrier.id,
    carrierName: rate.carrier.name,
    zone: rate.zone,
    maxWeightKg: Number(rate.maxWeightKg),
    price: Number(rate.price),
  }));
}

/** Cheapest shipping quote for a zone and weight across active carriers. */
export async function quoteShipping(input: { zone: string; weightKg: number }) {
  const rates = await db.shippingRate.findMany({
    where: { carrier: { isActive: true } },
    select: {
      zone: true,
      maxWeightKg: true,
      price: true,
      carrier: { select: { id: true, name: true } },
    },
  });

  return selectShippingRate(
    rates.map((rate) => ({
      carrierId: rate.carrier.id,
      carrierName: rate.carrier.name,
      zone: rate.zone,
      maxWeightKg: Number(rate.maxWeightKg),
      price: Number(rate.price),
    })),
    input,
  );
}
