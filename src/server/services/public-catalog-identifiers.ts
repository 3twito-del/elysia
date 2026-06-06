import { createHash } from "node:crypto";

const privateIdentifierPattern = /shopify|supplier|dropship/iu;

export function getPublicCatalogSku(sku: string) {
  if (!privateIdentifierPattern.test(sku)) return sku;

  return `ELYSIA-${createHash("sha256")
    .update(sku)
    .digest("hex")
    .slice(0, 10)
    .toUpperCase()}`;
}
