import { createHash } from "node:crypto";

import { google } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { cosineSimilarity, embed, embedMany, type EmbeddingModel } from "ai";
import type { Prisma } from "@prisma/client";

import { env } from "~/env";
import { DEFAULT_CLOUDFLARE_EMBEDDING_MODEL } from "~/server/ai/constants";
import {
  isAiProviderQuotaError,
  recordAiProviderUsage,
} from "~/server/ai/model";
import { db } from "~/server/db";
import type { CatalogProduct } from "~/server/services/catalog";

export const DEFAULT_SEARCH_EMBEDDING_MODEL = `cloudflare:${DEFAULT_CLOUDFLARE_EMBEDDING_MODEL}`;
export const DEFAULT_SEARCH_EMBEDDING_DIMENSIONS = 1024;
const QUERY_EMBEDDING_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export type SearchEmbeddingConfig = {
  accountId?: string;
  apiToken?: string;
  dimension: number;
  enabled: boolean;
  model: string;
  provider: "cloudflare" | "google" | "none";
  providerReady: boolean;
};

export type ProductSearchEmbeddingIndex = {
  embedded: number;
  embeddingsBySlug: Map<string, number[]>;
  model: string;
  dimension: number;
  providerReady: boolean;
  skipped: number;
};

type ProductIdentity = {
  id: string;
  slug: string;
  sourceHash: string | null;
  vector: Prisma.JsonValue | null;
};

const queryEmbeddingCache = new Map<
  string,
  { expiresAt: number; vector: number[] }
>();

export function getSearchEmbeddingConfig(
  config: {
    AI_EMBEDDING_DIMENSIONS?: number;
    AI_EMBEDDING_MODEL?: string;
    AI_SEMANTIC_SEARCH_ENABLED?: string;
    CLOUDFLARE_ACCOUNT_ID?: string;
    CLOUDFLARE_AI_API_TOKEN?: string;
    CLOUDFLARE_EMBEDDING_MODEL?: string;
    GOOGLE_GENERATIVE_AI_API_KEY?: string;
  } = {
    AI_EMBEDDING_DIMENSIONS: env.AI_EMBEDDING_DIMENSIONS,
    AI_EMBEDDING_MODEL: env.AI_EMBEDDING_MODEL,
    AI_SEMANTIC_SEARCH_ENABLED: env.AI_SEMANTIC_SEARCH_ENABLED,
    CLOUDFLARE_ACCOUNT_ID: env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_AI_API_TOKEN: env.CLOUDFLARE_AI_API_TOKEN,
    CLOUDFLARE_EMBEDDING_MODEL: env.CLOUDFLARE_EMBEDDING_MODEL,
    GOOGLE_GENERATIVE_AI_API_KEY: env.GOOGLE_GENERATIVE_AI_API_KEY,
  },
): SearchEmbeddingConfig {
  const enabled =
    config.AI_SEMANTIC_SEARCH_ENABLED !== "0" &&
    config.AI_SEMANTIC_SEARCH_ENABLED !== "false";
  const model =
    config.AI_EMBEDDING_MODEL?.trim() ??
    `cloudflare:${
      config.CLOUDFLARE_EMBEDDING_MODEL?.trim() ??
      DEFAULT_CLOUDFLARE_EMBEDDING_MODEL
    }`;
  const dimension =
    config.AI_EMBEDDING_DIMENSIONS ?? DEFAULT_SEARCH_EMBEDDING_DIMENSIONS;
  const provider = getEmbeddingProvider(model);
  const providerReady =
    enabled &&
    ((provider === "cloudflare" &&
      Boolean(
        config.CLOUDFLARE_ACCOUNT_ID?.trim() &&
        config.CLOUDFLARE_AI_API_TOKEN?.trim(),
      )) ||
      (provider === "google" &&
        Boolean(config.GOOGLE_GENERATIVE_AI_API_KEY?.trim())));

  return {
    accountId: config.CLOUDFLARE_ACCOUNT_ID?.trim(),
    apiToken: config.CLOUDFLARE_AI_API_TOKEN?.trim(),
    dimension,
    enabled,
    model,
    provider,
    providerReady,
  };
}

export function buildProductEmbeddingText(product: CatalogProduct) {
  return [
    `שם: ${product.name}`,
    `קטגוריה: ${product.categoryName}`,
    `תיאור קצר: ${product.shortDescription}`,
    `תיאור: ${product.description}`,
    `חומר: ${product.material}`,
    product.stone ? `אבן: ${product.stone}` : undefined,
    `קולקציה: ${product.collection}`,
    product.collections.length > 0
      ? `קולקציות: ${product.collections.join(", ")}`
      : undefined,
    product.tags.length > 0 ? `תגיות: ${product.tags.join(", ")}` : undefined,
    product.metalColors.length > 0
      ? `צבעי מתכת: ${product.metalColors.join(", ")}`
      : undefined,
    product.sizes.length > 0 ? `מידות: ${product.sizes.join(", ")}` : undefined,
    `מחיר: ${product.price}`,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");
}

export function createProductEmbeddingSourceHash(product: CatalogProduct) {
  return createHash("sha256")
    .update(buildProductEmbeddingText(product))
    .digest("hex");
}

export async function ensureProductSearchEmbeddings(
  products: CatalogProduct[],
): Promise<ProductSearchEmbeddingIndex> {
  const config = getSearchEmbeddingConfig();
  const identities = await loadProductEmbeddingIdentities(products, config);
  const embeddingsBySlug = new Map<string, number[]>();
  const pending: Array<{
    identity: ProductIdentity;
    product: CatalogProduct;
    sourceHash: string;
    text: string;
  }> = [];

  for (const product of products) {
    const identity = identities.get(product.slug);
    if (!identity) continue;

    const text = buildProductEmbeddingText(product);
    const sourceHash = createHash("sha256").update(text).digest("hex");
    const existingVector = coerceEmbeddingVector(
      identity.vector,
      config.dimension,
    );

    if (existingVector && identity.sourceHash === sourceHash) {
      embeddingsBySlug.set(product.slug, existingVector);
      continue;
    }

    if (config.providerReady) {
      pending.push({ identity, product, sourceHash, text });
    } else if (existingVector) {
      embeddingsBySlug.set(product.slug, existingVector);
    }
  }

  if (pending.length === 0 || !config.providerReady) {
    return {
      embedded: 0,
      embeddingsBySlug,
      model: config.model,
      dimension: config.dimension,
      providerReady: config.providerReady,
      skipped: products.length - embeddingsBySlug.size,
    };
  }

  const providerOptions = createEmbeddingProviderOptions(config);
  let embeddings: number[][];

  try {
    const result = await embedMany({
      abortSignal: AbortSignal.timeout(20_000),
      maxParallelCalls: 2,
      maxRetries: 1,
      model: createEmbeddingModel(config),
      ...(providerOptions ? { providerOptions } : {}),
      values: pending.map((item) => item.text),
    });

    embeddings = result.embeddings;
    await recordAiProviderUsage({
      provider: config.provider,
      model: config.model,
      purpose: "embedding",
      status: "succeeded",
      usage: result.usage,
      metadata: {
        embeddedValues: pending.length,
      },
    });
  } catch (error) {
    await recordAiProviderUsage({
      provider: config.provider,
      model: config.model,
      purpose: "embedding",
      status: isAiProviderQuotaError(error) ? "quota_exhausted" : "failed",
      metadata: {
        embeddedValues: pending.length,
        error: error instanceof Error ? error.message : String(error),
      },
    });

    return {
      embedded: 0,
      embeddingsBySlug,
      model: config.model,
      dimension: config.dimension,
      providerReady: false,
      skipped: products.length - embeddingsBySlug.size,
    };
  }

  await Promise.all(
    pending.map(async (item, index) => {
      const vector = coerceEmbeddingVector(embeddings[index], config.dimension);
      if (!vector) return;

      await upsertProductSearchEmbedding({
        dimension: config.dimension,
        model: config.model,
        productId: item.identity.id,
        sourceHash: item.sourceHash,
        vector,
      });
      embeddingsBySlug.set(item.product.slug, vector);
    }),
  );

  return {
    embedded: pending.length,
    embeddingsBySlug,
    model: config.model,
    dimension: config.dimension,
    providerReady: config.providerReady,
    skipped: products.length - embeddingsBySlug.size,
  };
}

export async function loadStoredProductSearchEmbeddings(
  products: CatalogProduct[],
) {
  const config = getSearchEmbeddingConfig();
  const identities = await loadProductEmbeddingIdentities(
    products,
    config,
  ).catch((error: unknown) => {
    if (isMissingEmbeddingTableError(error)) {
      return new Map<string, ProductIdentity>();
    }

    throw error;
  });
  const embeddingsBySlug = new Map<string, number[]>();

  for (const [slug, identity] of identities) {
    const vector = coerceEmbeddingVector(identity.vector, config.dimension);
    if (vector) embeddingsBySlug.set(slug, vector);
  }

  return {
    embeddingsBySlug,
    model: config.model,
    dimension: config.dimension,
    providerReady: config.providerReady,
  };
}

export async function embedSearchQuery(value: string | undefined) {
  const query = value?.trim();
  if (!query) return undefined;

  const config = getSearchEmbeddingConfig();
  if (!config.providerReady) return undefined;

  const cacheKey = `${config.model}:${config.dimension}:${query}`;
  const cached = queryEmbeddingCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.vector;
  if (cached) queryEmbeddingCache.delete(cacheKey);

  const providerOptions = createEmbeddingProviderOptions(config);
  let embedding: number[];

  try {
    const result = await embed({
      abortSignal: AbortSignal.timeout(3_000),
      maxRetries: 1,
      model: createEmbeddingModel(config),
      ...(providerOptions ? { providerOptions } : {}),
      value: query,
    });

    embedding = result.embedding;
    await recordAiProviderUsage({
      provider: config.provider,
      model: config.model,
      purpose: "embedding",
      status: "succeeded",
      usage: result.usage,
      metadata: {
        cached: false,
        queryLength: query.length,
      },
    });
  } catch (error) {
    await recordAiProviderUsage({
      provider: config.provider,
      model: config.model,
      purpose: "embedding",
      status: isAiProviderQuotaError(error) ? "quota_exhausted" : "failed",
      metadata: {
        error: error instanceof Error ? error.message : String(error),
        queryLength: query.length,
      },
    });

    return undefined;
  }

  const vector = coerceEmbeddingVector(embedding, config.dimension);

  if (vector) {
    queryEmbeddingCache.set(cacheKey, {
      vector,
      expiresAt: Date.now() + QUERY_EMBEDDING_CACHE_TTL_MS,
    });
  }

  return vector;
}

export function calculateEmbeddingSimilarity(
  first: number[] | undefined,
  second: number[] | undefined,
) {
  if (!first?.length || !second?.length || first.length !== second.length) {
    return 0;
  }

  return Math.max(0, Math.min(1, cosineSimilarity(first, second)));
}

function createEmbeddingModel(config: SearchEmbeddingConfig): EmbeddingModel {
  if (config.provider === "cloudflare") {
    const provider = createOpenAICompatible({
      name: "cloudflare",
      apiKey: config.apiToken,
      baseURL: `https://api.cloudflare.com/client/v4/accounts/${
        config.accountId ?? "missing-account"
      }/ai/v1`,
    });

    return provider.embeddingModel(stripCloudflareModelPrefix(config.model));
  }

  return google.embedding(stripGoogleModelPrefix(config.model));
}

function createEmbeddingProviderOptions(config: SearchEmbeddingConfig) {
  if (config.provider !== "google") return undefined;

  return {
    google: {
      outputDimensionality: config.dimension,
      taskType: "SEMANTIC_SIMILARITY",
    },
  };
}

function stripGoogleModelPrefix(model: string) {
  if (model.startsWith("google/")) return model.slice("google/".length);
  if (model.startsWith("google:")) return model.slice("google:".length);

  return model;
}

function stripCloudflareModelPrefix(model: string) {
  if (model.startsWith("cloudflare:")) {
    return model.slice("cloudflare:".length);
  }

  return model;
}

function getEmbeddingProvider(
  model: string,
): SearchEmbeddingConfig["provider"] {
  if (model.startsWith("cloudflare:")) return "cloudflare";
  if (model.startsWith("google/") || model.startsWith("google:")) {
    return "google";
  }

  return "none";
}

async function loadProductEmbeddingIdentities(
  products: CatalogProduct[],
  config: SearchEmbeddingConfig,
) {
  const slugs = products.map((product) => product.slug);
  if (slugs.length === 0) return new Map<string, ProductIdentity>();
  const records = await db.product.findMany({
    where: { slug: { in: slugs } },
    select: {
      id: true,
      slug: true,
      searchEmbeddings: {
        where: {
          dimension: config.dimension,
          model: config.model,
        },
        select: {
          sourceHash: true,
          vector: true,
        },
        take: 1,
      },
    },
  });

  return new Map(
    records.map((record) => {
      const embedding = record.searchEmbeddings[0];

      return [
        record.slug,
        {
          id: record.id,
          slug: record.slug,
          sourceHash: embedding?.sourceHash ?? null,
          vector: embedding?.vector ?? null,
        },
      ] as const;
    }),
  );
}

async function upsertProductSearchEmbedding(input: {
  dimension: number;
  model: string;
  productId: string;
  sourceHash: string;
  vector: number[];
}) {
  await db.productSearchEmbedding.upsert({
    where: {
      productId_model_dimension: {
        dimension: input.dimension,
        model: input.model,
        productId: input.productId,
      },
    },
    create: {
      dimension: input.dimension,
      model: input.model,
      productId: input.productId,
      sourceHash: input.sourceHash,
      vector: input.vector,
    },
    update: {
      sourceHash: input.sourceHash,
      vector: input.vector,
    },
  });
}

function coerceEmbeddingVector(value: unknown, dimension: number) {
  if (!Array.isArray(value)) return undefined;
  if (value.length !== dimension) return undefined;
  if (
    !value.every((item) => typeof item === "number" && Number.isFinite(item))
  ) {
    return undefined;
  }

  return value.map((item) => Number(item));
}

function isMissingEmbeddingTableError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const message = "message" in error ? String(error.message) : "";

  return (
    message.includes('relation "ProductSearchEmbedding" does not exist') ||
    message.includes("The table `ProductSearchEmbedding` does not exist") ||
    ("code" in error && error.code === "P2021") ||
    message.includes("42P01")
  );
}
