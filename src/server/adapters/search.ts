import { Client } from "typesense";
import type { CollectionCreateSchema } from "typesense";

import { env } from "~/env";
import {
  createSemanticMatchReason,
  productMatchesSemanticExclusions,
  type SearchMode,
  type SemanticSearchIntent,
} from "~/lib/semantic-search-intent";
import { getPublicProductCommerceStatus } from "~/lib/commerce-labels";
import { formatInlinePrice } from "~/lib/format";
import { resolveSemanticSearchIntent } from "~/server/ai/search-intent";
import {
  filterCatalogProducts,
  getCatalogCategories,
  getCatalogFacets,
  listCatalogProducts,
  searchCatalogProducts,
  type CatalogProduct,
} from "~/server/services/catalog";
import {
  calculateEmbeddingSimilarity,
  embedSearchQuery,
  ensureProductSearchEmbeddings,
  getSearchEmbeddingConfig,
  loadStoredProductSearchEmbeddings,
} from "~/server/services/search-embeddings";
import {
  createSearchResultMeta,
  getProductsCollectionName,
  hasTypesenseConfig,
  normalizeSearchPagination,
  paginateSearchHits,
  shouldFallbackToLocalSearchPage,
} from "./search-utils";

export {
  DEFAULT_SEARCH_PER_PAGE,
  getProductsCollectionName,
  normalizeSearchPagination,
  paginateSearchHits,
  shouldFallbackToLocalSearchPage,
  shouldUseLocalSearchFallback,
} from "./search-utils";

const TEXT_QUERY_FIELDS = "name,shortDescription,category,material,stone,tags";
const SEMANTIC_VECTOR_K = 200;

export type ProductSearchInput = {
  query?: string;
  category?: string;
  branch?: string;
  material?: string;
  stone?: string;
  style?: string;
  gift?: string;
  color?: string;
  collection?: string;
  maxPrice?: number;
  availableOnly?: boolean;
  page?: number;
  perPage?: number;
  sort?: "relevance" | "price-asc" | "price-desc" | "newest" | "popular";
  mode?: SearchMode;
  semanticIntent?: SemanticSearchIntent;
};

export type ProductSearchHitMeta = {
  keywordScore?: number;
  matchReason?: string;
  semanticScore?: number;
  totalScore?: number;
  vectorDistance?: number;
};

export type SearchFacet = {
  field: string;
  values: Array<{ value: string; count: number }>;
};

export type ProductSearchResult = {
  hits: CatalogProduct[];
  facets: SearchFacet[];
  engine: "typesense" | "local";
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  mode: SearchMode;
  interpretedQuery?: string;
  activeSemanticSignals: string[];
  hitMetaBySlug: Record<string, ProductSearchHitMeta>;
};

export type SearchIndexResult = {
  indexed: number;
  engine: "typesense" | "local";
  embedded?: number;
  embeddingDimension?: number;
  embeddingModel?: string;
  semantic?: boolean;
};

type ProductSearchDocument = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  category: string;
  categorySlug: string;
  material: string;
  stone?: string;
  collection: string;
  price: number;
  tags: string[];
  availableBranches: string[];
  popularityScore: number;
  createdAt: number;
  embedding?: number[];
};

type SemanticSearchContext = {
  effectiveInput: ProductSearchInput;
  intent: SemanticSearchIntent;
  queryVector?: number[];
};

type ScoredSemanticHit = {
  keywordScore: number;
  product: CatalogProduct;
  semanticScore: number;
  totalScore: number;
};

export interface SearchProvider {
  searchProducts(input: ProductSearchInput): Promise<ProductSearchResult>;
  indexProducts(): Promise<SearchIndexResult>;
}

class TypesenseSearchProvider implements SearchProvider {
  async searchProducts(
    input: ProductSearchInput,
  ): Promise<ProductSearchResult> {
    const client = getTypesenseClient();

    if (hasDerivedFacetFilter(input)) {
      if (
        (input.mode ?? "semantic") === "semantic" &&
        (input.query?.trim() || input.semanticIntent)
      ) {
        return searchLocalSemanticProducts(
          await createSemanticSearchContext(input),
        );
      }

      return searchLocalProducts({ ...input, mode: "classic" });
    }

    if ((input.mode ?? "semantic") === "semantic") {
      const semanticResult = await searchSemanticProducts(input, client);
      if (semanticResult) return semanticResult;
    }

    if (!client) {
      return searchLocalProducts({ ...input, mode: "classic" });
    }

    try {
      return await searchTypesenseKeywordProducts(client, {
        ...input,
        mode: "classic",
      });
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[search:typesense-keyword]", error);
      }

      return searchLocalProducts({ ...input, mode: "classic" });
    }
  }

  async indexProducts(): Promise<SearchIndexResult> {
    const client = getTypesenseClient();
    const products = await listCatalogProducts();
    const embeddingIndex = await ensureProductSearchEmbeddings(products);

    if (!client) {
      return {
        indexed: products.length,
        engine: "local" as const,
        embedded: embeddingIndex.embedded,
        embeddingDimension: embeddingIndex.dimension,
        embeddingModel: embeddingIndex.model,
        semantic: embeddingIndex.embeddingsBySlug.size > 0,
      };
    }

    const collectionName = getProductsCollectionName(
      embeddingIndex.model,
      embeddingIndex.dimension,
    );
    await ensureProductsCollection(
      client,
      collectionName,
      embeddingIndex.dimension,
    );

    if (products.length > 0) {
      await client
        .collections<ProductSearchDocument>(collectionName)
        .documents()
        .import(
          products.map((product) =>
            toTypesenseDocument(
              product,
              embeddingIndex.embeddingsBySlug.get(product.slug),
            ),
          ),
          { action: "upsert" },
        );
    }

    return {
      indexed: products.length,
      engine: "typesense" as const,
      embedded: embeddingIndex.embedded,
      embeddingDimension: embeddingIndex.dimension,
      embeddingModel: embeddingIndex.model,
      semantic: embeddingIndex.embeddingsBySlug.size > 0,
    };
  }
}

export const searchProvider: SearchProvider = new TypesenseSearchProvider();

let typesenseClient: Client | null = null;

function getTypesenseClient() {
  if (!hasTypesenseConfig(env)) return null;

  typesenseClient ??= new Client({
    nodes: [
      {
        host: env.TYPESENSE_HOST,
        port: env.TYPESENSE_PORT ?? 443,
        protocol: env.TYPESENSE_PROTOCOL ?? "https",
      },
    ],
    apiKey: env.TYPESENSE_API_KEY,
    connectionTimeoutSeconds: 3,
  });

  return typesenseClient;
}

async function searchSemanticProducts(
  input: ProductSearchInput,
  client: Client | null,
) {
  if (!input.query?.trim() && !input.semanticIntent) return undefined;

  const context = await createSemanticSearchContext(input);

  if (client && context.queryVector) {
    try {
      return await searchTypesenseSemanticProducts(client, context);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("[search:typesense-semantic]", error);
      }

      return searchLocalSemanticProducts(context);
    }
  }

  return searchLocalSemanticProducts(context);
}

async function createSemanticSearchContext(
  input: ProductSearchInput,
): Promise<SemanticSearchContext> {
  const [categories, facets] = await Promise.all([
    getCatalogCategories(),
    getCatalogFacets(),
  ]);
  const intent =
    input.semanticIntent ??
    (await resolveSemanticSearchIntent(
      {
        category: input.category,
        material: input.material,
        maxPrice: input.maxPrice,
        query: input.query,
        stone: input.stone,
      },
      { categories, facets },
    ));
  const effectiveInput: ProductSearchInput = {
    ...input,
    category: input.category ?? intent.hardFilters.category,
    material: input.material ?? intent.hardFilters.material,
    maxPrice: input.maxPrice ?? intent.hardFilters.maxPrice,
    mode: "semantic",
    query: intent.lexicalQuery ?? input.query,
    stone: input.stone ?? intent.hardFilters.stone,
  };
  const queryVector = await embedSearchQuery(
    intent.semanticQuery ?? intent.lexicalQuery ?? input.query,
  );

  return {
    effectiveInput,
    intent,
    queryVector,
  };
}

async function searchTypesenseKeywordProducts(
  client: Client,
  input: ProductSearchInput,
): Promise<ProductSearchResult> {
  const embeddingConfig = getSearchEmbeddingConfig();
  const collectionName = getProductsCollectionName(
    embeddingConfig.model,
    embeddingConfig.dimension,
  );
  await ensureProductsCollection(
    client,
    collectionName,
    embeddingConfig.dimension,
  );

  const pagination = normalizeSearchPagination(input);
  const query = normalizeTypesenseQuery(input.query);
  const response = await client
    .collections<ProductSearchDocument>(collectionName)
    .documents()
    .search({
      q: query,
      query_by: TEXT_QUERY_FIELDS,
      filter_by: buildTypesenseFilter(input),
      facet_by: "category,material,stone,collection,availableBranches",
      sort_by: buildTypesenseSort(input, query),
      page: pagination.page,
      per_page: pagination.perPage,
    });
  const slugs =
    response.hits?.map((hit) => hit.document.slug).filter(Boolean) ?? [];
  const products = await listCatalogProducts();
  const productsBySlug = new Map(
    products.map((product) => [product.slug, product] as const),
  );
  const hits = slugs
    .map((slug) => productsBySlug.get(slug))
    .filter((product): product is CatalogProduct => Boolean(product));
  const found =
    typeof response.found === "number" ? response.found : slugs.length;

  if (
    shouldFallbackToLocalSearchPage({
      found,
      indexedHits: slugs.length,
      page: pagination.page,
      perPage: pagination.perPage,
      resolvedHits: hits.length,
    })
  ) {
    return searchLocalProducts({ ...input, mode: "classic" });
  }

  return {
    hits,
    engine: "typesense",
    facets: mapTypesenseFacets(response.facet_counts ?? []),
    hitMetaBySlug: {},
    activeSemanticSignals: [],
    mode: "classic",
    ...createSearchResultMeta(found, pagination),
  };
}

async function searchTypesenseSemanticProducts(
  client: Client,
  context: SemanticSearchContext,
): Promise<ProductSearchResult> {
  const embeddingConfig = getSearchEmbeddingConfig();
  const collectionName = getProductsCollectionName(
    embeddingConfig.model,
    embeddingConfig.dimension,
  );
  await ensureProductsCollection(
    client,
    collectionName,
    embeddingConfig.dimension,
  );

  const { effectiveInput, intent, queryVector } = context;
  const pagination = normalizeSearchPagination(effectiveInput);
  const query = normalizeTypesenseQuery(
    intent.lexicalQuery ?? effectiveInput.query ?? intent.semanticQuery,
  );
  const vectorQuery = queryVector
    ? `embedding:([${queryVector.join(",")}], k:${SEMANTIC_VECTOR_K}, alpha:0.65)`
    : undefined;
  const response = await client.multiSearch
    .perform<[ProductSearchDocument]>({
      searches: [
        {
          collection: collectionName,
          q: query,
          query_by: TEXT_QUERY_FIELDS,
          ...(vectorQuery ? { vector_query: vectorQuery } : {}),
          exclude_fields: "embedding",
          drop_tokens_threshold: 0,
          filter_by: buildTypesenseFilter(effectiveInput, intent),
          facet_by: "category,material,stone,collection,availableBranches",
          sort_by: buildTypesenseSort(effectiveInput, query),
          page: pagination.page,
          per_page: pagination.perPage,
        },
      ],
    })
    .then((result) => result.results[0]);
  if (response?.error) {
    throw new Error(`Typesense semantic search failed: ${response.error}`);
  }

  const products = await listCatalogProducts();
  const productsBySlug = new Map(
    products.map((product) => [product.slug, product] as const),
  );
  const responseHits = response.hits ?? [];
  const indexedHits = responseHits
    .map((hit) => {
      const product = productsBySlug.get(hit.document.slug);
      if (!product) return undefined;

      return { hit, product };
    })
    .filter(
      (
        item,
      ): item is {
        hit: (typeof responseHits)[number];
        product: CatalogProduct;
      } => Boolean(item),
    );
  const found =
    typeof response.found === "number" ? response.found : responseHits.length;

  if (
    shouldFallbackToLocalSearchPage({
      found,
      indexedHits: responseHits.length,
      page: pagination.page,
      perPage: pagination.perPage,
      resolvedHits: indexedHits.length,
    })
  ) {
    return searchLocalSemanticProducts(context);
  }

  const hits = indexedHits.filter(({ product }) =>
    productMatchesSemanticExclusions(product, intent.excludedTerms),
  );
  const hitMetaBySlug = Object.fromEntries(
    hits.map(({ hit, product }) => {
      const vectorDistance = getTypesenseVectorDistance(hit);

      return [
        product.slug,
        {
          matchReason: createSemanticMatchReason(product, intent),
          vectorDistance,
          semanticScore:
            typeof vectorDistance === "number"
              ? 1 - Math.min(2, vectorDistance) / 2
              : undefined,
        } satisfies ProductSearchHitMeta,
      ];
    }),
  );

  return {
    hits: hits.map(({ product }) => product),
    engine: "typesense",
    facets: mapTypesenseFacets(response.facet_counts ?? []),
    hitMetaBySlug,
    activeSemanticSignals: getActiveSemanticSignals(intent),
    interpretedQuery: intent.semanticQuery,
    mode: "semantic",
    ...createSearchResultMeta(found, pagination),
  };
}

async function searchLocalProducts(
  input: ProductSearchInput,
): Promise<ProductSearchResult> {
  const pagination = normalizeSearchPagination(input);
  const [hits, facets] = await Promise.all([
    searchCatalogProducts(input),
    buildLocalFacets(input),
  ]);
  const sortedHits = sortLocalHits(hits, input);
  const paginatedHits = paginateSearchHits(sortedHits, pagination);

  return {
    hits: paginatedHits,
    engine: "local" as const,
    facets,
    hitMetaBySlug: {},
    activeSemanticSignals: [],
    mode: "classic",
    ...createSearchResultMeta(sortedHits.length, pagination),
  };
}

async function searchLocalSemanticProducts(
  context: SemanticSearchContext,
): Promise<ProductSearchResult> {
  const { effectiveInput, intent, queryVector } = context;
  const pagination = normalizeSearchPagination(effectiveInput);
  const [candidateHits, facets] = await Promise.all([
    searchCatalogProducts({ ...effectiveInput, query: undefined }),
    buildLocalFacets(effectiveInput),
  ]);
  const embeddings = queryVector
    ? await loadStoredProductSearchEmbeddings(candidateHits)
    : undefined;
  const scoredHits: ScoredSemanticHit[] = candidateHits
    .filter((product) =>
      productMatchesSemanticExclusions(product, intent.excludedTerms),
    )
    .map((product) => {
      const keywordScore = getKeywordScore(
        product,
        intent.lexicalQuery ?? effectiveInput.query,
      );
      const semanticScore = calculateEmbeddingSimilarity(
        queryVector,
        embeddings?.embeddingsBySlug.get(product.slug),
      );
      const softSignalScore = getSoftSignalScore(product, intent);
      const availabilityScore = Object.values(product.inventory).some(
        (quantity) => quantity > 0,
      )
        ? 1
        : 0;
      const popularityScore = Math.min((product.popularityScore ?? 0) / 25, 1);
      const totalScore =
        semanticScore * 0.55 +
        keywordScore * 0.24 +
        softSignalScore * 0.13 +
        availabilityScore * 0.04 +
        popularityScore * 0.04;

      return {
        keywordScore,
        product,
        semanticScore,
        totalScore,
      };
    });
  const sortedHits = sortSemanticHits(scoredHits, effectiveInput);
  const paginatedHits = paginateSearchHits(sortedHits, pagination);
  const hitMetaBySlug = Object.fromEntries(
    sortedHits.map((hit) => [
      hit.product.slug,
      {
        keywordScore: hit.keywordScore,
        matchReason: createSemanticMatchReason(hit.product, intent),
        semanticScore: hit.semanticScore,
        totalScore: hit.totalScore,
      } satisfies ProductSearchHitMeta,
    ]),
  );

  return {
    hits: paginatedHits.map((hit) => hit.product),
    engine: "local" as const,
    facets,
    hitMetaBySlug,
    activeSemanticSignals: getActiveSemanticSignals(intent),
    interpretedQuery: intent.semanticQuery,
    mode: "semantic",
    ...createSearchResultMeta(sortedHits.length, pagination),
  };
}

function sortLocalHits(hits: CatalogProduct[], input: ProductSearchInput) {
  const sort = input.sort ?? "relevance";
  const sorted = [...hits];

  if (sort === "price-asc") return sorted.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") return sorted.sort((a, b) => b.price - a.price);
  if (sort === "newest") {
    return sorted.sort(
      (a, b) => getProductCreatedAtTime(b) - getProductCreatedAtTime(a),
    );
  }
  if (sort === "popular") {
    return sorted.sort(
      (a, b) =>
        (b.popularityScore ?? 0) - (a.popularityScore ?? 0) ||
        getProductCreatedAtTime(b) - getProductCreatedAtTime(a),
    );
  }

  if (isDefaultCatalogBrowse(input)) {
    return interleaveProductsByCategory(sorted);
  }

  const normalizedQuery = input.query?.trim().toLowerCase() ?? "";

  return sorted.sort(
    (a, b) =>
      computeLocalRelevanceScore(b, normalizedQuery) -
        computeLocalRelevanceScore(a, normalizedQuery) ||
      (b.popularityScore ?? 0) - (a.popularityScore ?? 0) ||
      getProductCreatedAtTime(b) - getProductCreatedAtTime(a),
  );
}

// E-03 (docs/TASKS.md): blends text-match strength (exact intent wins) with
// real availability for the local/degraded search path (Typesense down or
// E2E_CATALOG_FIXTURES). Every hit reaching this function already matched
// the query somewhere (`matchesCatalogSearch` in catalog.ts), so the score
// only decides ordering, not inclusion. Deliberately does not blend
// "collection priority" -- there is no real manual-rank data model for
// that yet (C-05, blocked on A-05); fabricating one here would conflict
// with whatever C-05 eventually builds.
export const LOCAL_RELEVANCE_WEIGHTS = {
  nameExact: 100,
  nameStartsWith: 60,
  nameContains: 40,
  facetMatch: 15,
  descriptionMatch: 5,
  available: 10,
} as const;

export function computeLocalRelevanceScore(
  product: CatalogProduct,
  normalizedQuery: string,
) {
  let score = 0;

  if (normalizedQuery) {
    const name = product.name.toLowerCase();

    if (name === normalizedQuery) {
      score += LOCAL_RELEVANCE_WEIGHTS.nameExact;
    } else if (name.startsWith(normalizedQuery)) {
      score += LOCAL_RELEVANCE_WEIGHTS.nameStartsWith;
    } else if (name.includes(normalizedQuery)) {
      score += LOCAL_RELEVANCE_WEIGHTS.nameContains;
    } else if (
      [product.material, product.stone, product.collection, ...product.tags]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(normalizedQuery))
    ) {
      score += LOCAL_RELEVANCE_WEIGHTS.facetMatch;
    } else if (
      [product.shortDescription, product.description].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      )
    ) {
      score += LOCAL_RELEVANCE_WEIGHTS.descriptionMatch;
    }
  }

  const availableQuantity = Object.values(product.inventory).reduce(
    (sum, quantity) => sum + quantity,
    0,
  );
  // Only a genuine sold-out ready-to-order item is "unavailable" here --
  // made-to-order/consultation items are legitimately purchasable through a
  // different path and should not be penalized as if they were out of stock.
  const isSoldOut =
    getPublicProductCommerceStatus({
      availabilityMode: product.availabilityMode,
      availableQuantity,
    }).serviceReason === "availability";

  if (!isSoldOut) score += LOCAL_RELEVANCE_WEIGHTS.available;

  return score;
}

function sortSemanticHits(
  hits: ScoredSemanticHit[],
  input: ProductSearchInput,
) {
  const sorted = [...hits];

  if (input.sort === "price-asc") {
    return sorted.sort((a, b) => a.product.price - b.product.price);
  }
  if (input.sort === "price-desc") {
    return sorted.sort((a, b) => b.product.price - a.product.price);
  }
  if (input.sort === "newest") {
    return sorted.sort(
      (a, b) =>
        getProductCreatedAtTime(b.product) - getProductCreatedAtTime(a.product),
    );
  }
  if (input.sort === "popular") {
    return sorted.sort(
      (a, b) =>
        (b.product.popularityScore ?? 0) - (a.product.popularityScore ?? 0) ||
        getProductCreatedAtTime(b.product) - getProductCreatedAtTime(a.product),
    );
  }

  return sorted.sort(
    (a, b) =>
      b.totalScore - a.totalScore ||
      (b.product.popularityScore ?? 0) - (a.product.popularityScore ?? 0),
  );
}

function isDefaultCatalogBrowse(input: ProductSearchInput) {
  return (
    !input.query &&
    !input.category &&
    !input.branch &&
    !input.material &&
    !input.stone &&
    !input.style &&
    !input.gift &&
    !input.color &&
    !input.collection &&
    !input.maxPrice &&
    !input.availableOnly
  );
}

function interleaveProductsByCategory(products: CatalogProduct[]) {
  const buckets = new Map<string, CatalogProduct[]>();

  for (const product of products) {
    const bucket = buckets.get(product.categorySlug) ?? [];
    bucket.push(product);
    buckets.set(product.categorySlug, bucket);
  }

  const orderedBuckets = Array.from(buckets.values()).map((bucket) =>
    bucket.sort(
      (a, b) =>
        (b.popularityScore ?? 0) - (a.popularityScore ?? 0) ||
        getProductCreatedAtTime(b) - getProductCreatedAtTime(a),
    ),
  );
  const interleaved: CatalogProduct[] = [];
  let index = 0;

  while (interleaved.length < products.length) {
    for (const bucket of orderedBuckets) {
      const product = bucket[index];
      if (product) interleaved.push(product);
    }

    index += 1;
  }

  return interleaved;
}

function getProductCreatedAtTime(product: CatalogProduct) {
  if (product.createdAt instanceof Date) return product.createdAt.getTime();
  if (typeof product.createdAt === "string") {
    const parsed = Date.parse(product.createdAt);

    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

async function ensureProductsCollection(
  client: Client,
  collectionName: string,
  dimension: number,
) {
  const collection = client.collections<ProductSearchDocument>(collectionName);
  const exists = await collection.exists();

  if (exists) return;

  await client
    .collections()
    .create(createProductsCollectionSchema(collectionName, dimension));
}

function toTypesenseDocument(
  product: CatalogProduct,
  embedding?: number[],
): ProductSearchDocument {
  return {
    id: product.slug,
    slug: product.slug,
    name: product.name,
    shortDescription: product.shortDescription,
    category: product.categoryName,
    categorySlug: product.categorySlug,
    material: product.material,
    stone: product.stone,
    collection: product.collection,
    price: product.price,
    tags: product.tags,
    availableBranches: Object.entries(product.inventory)
      .filter(([, quantity]) => quantity > 0)
      .map(([branch]) => branch),
    popularityScore: product.popularityScore ?? 0,
    createdAt: Math.floor(getProductCreatedAtTime(product) / 1000),
    ...(embedding ? { embedding } : {}),
  };
}

function buildTypesenseFilter(
  input: ProductSearchInput,
  intent?: SemanticSearchIntent,
) {
  const filters = [
    input.category
      ? `categorySlug:=${escapeTypesenseValue(input.category)}`
      : null,
    input.material ? `material:=${escapeTypesenseValue(input.material)}` : null,
    input.stone ? `stone:=${escapeTypesenseValue(input.stone)}` : null,
    input.collection
      ? `collection:=${escapeTypesenseValue(input.collection)}`
      : null,
    input.branch
      ? `availableBranches:=${escapeTypesenseValue(input.branch)}`
      : null,
    input.availableOnly ? "availableBranches:!=[]" : null,
    input.maxPrice ? `price:<=${input.maxPrice}` : null,
    ...buildTypesenseExclusionFilters(intent),
  ].filter(Boolean);

  return filters.length > 0 ? filters.join(" && ") : undefined;
}

function buildTypesenseExclusionFilters(intent?: SemanticSearchIntent) {
  if (!intent?.excludedTerms.length) return [];

  return intent.excludedTerms
    .map((term) => {
      const escaped = escapeTypesenseValue(term);

      return [`stone:!=${escaped}`, `material:!=${escaped}`].join(" && ");
    })
    .map((filter) => `(${filter})`);
}

function buildTypesenseSort(input: ProductSearchInput, query: string) {
  if (input.sort === "price-asc") return "price:asc";
  if (input.sort === "price-desc") return "price:desc";
  if (input.sort === "newest") return "createdAt:desc";
  if (input.sort === "popular") return "popularityScore:desc";

  return query !== "*"
    ? "_text_match:desc,popularityScore:desc"
    : "popularityScore:desc,createdAt:desc";
}

function escapeTypesenseValue(value: string) {
  return `\`${value.replaceAll("`", "\\`")}\``;
}

function normalizeTypesenseQuery(query?: string) {
  const normalized = query?.trim();

  if (normalized) return normalized;

  return "*";
}

function mapTypesenseFacets(
  facetCounts: Array<{
    field_name: keyof ProductSearchDocument;
    counts: Array<{ value: string; count: number }>;
  }>,
) {
  return facetCounts.map((facet) => ({
    field: String(facet.field_name),
    values: facet.counts.map((count) => ({
      value: count.value,
      count: count.count,
    })),
  }));
}

async function buildLocalFacets(input: ProductSearchInput) {
  const [categories, products, facets] = await Promise.all([
    getCatalogCategories(),
    searchCatalogProducts({ ...input, category: undefined }),
    getCatalogFacets(),
  ]);

  return [
    {
      field: "category",
      values: categories.map((category) => ({
        value: category.name,
        count: products.filter(
          (product) => product.categorySlug === category.slug,
        ).length,
      })),
    },
    {
      field: "material",
      values: facets.materials.map((material) => ({
        value: material,
        count: products.filter((product) => product.material === material)
          .length,
      })),
    },
    {
      field: "stone",
      values: facets.stones.map((stone) => ({
        value: stone,
        count: products.filter((product) => product.stone === stone).length,
      })),
    },
    {
      field: "collection",
      values: facets.collections.map((collection) => ({
        value: collection,
        count: products.filter((product) => product.collection === collection)
          .length,
      })),
    },
    {
      field: "style",
      values: facets.styles.map((style) => ({
        value: style,
        count: products.filter((product) => product.collections.includes(style))
          .length,
      })),
    },
    {
      field: "gift",
      values: facets.giftTags.map((gift) => ({
        value: gift,
        count: products.filter(
          (product) => filterCatalogProducts([product], { gift }).length > 0,
        ).length,
      })),
    },
    {
      field: "color",
      values: facets.colors.map((color) => ({
        value: color,
        count: products.filter((product) =>
          [
            ...product.metalColors,
            ...product.variants.flatMap((variant) => [
              variant.metalColor,
              variant.stoneColor,
            ]),
          ].includes(color),
        ).length,
      })),
    },
  ] satisfies SearchFacet[];
}

function hasDerivedFacetFilter(input: ProductSearchInput) {
  return [input.style, input.gift, input.color].some((value) => Boolean(value));
}

function getKeywordScore(product: CatalogProduct, query?: string) {
  const tokens = query
    ?.toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1);
  if (!tokens?.length) return 0;

  const searchable = [
    product.name,
    product.shortDescription,
    product.description,
    product.material,
    product.stone,
    product.collection,
    product.categoryName,
    ...product.tags,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const matched = tokens.filter((token) => searchable.includes(token)).length;

  return matched / tokens.length;
}

function getSoftSignalScore(
  product: CatalogProduct,
  intent: SemanticSearchIntent,
) {
  if (intent.softSignals.length === 0) return 0;

  const searchable = [
    product.name,
    product.shortDescription,
    product.description,
    product.collection,
    product.categoryName,
    ...product.tags,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const matched = intent.softSignals.filter((signal) =>
    searchable.includes(signal.toLowerCase()),
  ).length;

  return Math.min(1, matched / Math.max(1, intent.softSignals.length));
}

function getTypesenseVectorDistance(hit: unknown) {
  if (!hit || typeof hit !== "object") return undefined;
  const value = (hit as { vector_distance?: unknown }).vector_distance;

  return typeof value === "number" ? value : undefined;
}

function getActiveSemanticSignals(intent: SemanticSearchIntent) {
  return [
    intent.semanticQuery ? `פירוש: ${intent.semanticQuery}` : null,
    intent.hardFilters.category ? "קטגוריה מזוהה" : null,
    intent.hardFilters.material ? `חומר: ${intent.hardFilters.material}` : null,
    intent.hardFilters.stone ? `אבן: ${intent.hardFilters.stone}` : null,
    intent.hardFilters.maxPrice
      ? `מחיר עד ${formatInlinePrice(intent.hardFilters.maxPrice)}`
      : null,
    intent.recipient ? `למי: ${intent.recipient}` : null,
    intent.occasion ? `אירוע: ${intent.occasion}` : null,
    ...intent.softSignals.map((signal) => `סגנון: ${signal}`),
    ...intent.excludedTerms.map((term) => `בלי ${term}`),
  ].filter((signal): signal is string => Boolean(signal));
}

function createProductsCollectionSchema(
  collectionName: string,
  dimension: number,
) {
  return {
    name: collectionName,
    fields: [
      { name: "slug", type: "string" },
      { name: "name", type: "string" },
      { name: "shortDescription", type: "string" },
      { name: "category", type: "string", facet: true },
      { name: "categorySlug", type: "string", facet: true },
      { name: "material", type: "string", facet: true },
      { name: "stone", type: "string", facet: true, optional: true },
      { name: "collection", type: "string", facet: true },
      { name: "price", type: "float", facet: true, sort: true },
      { name: "tags", type: "string[]" },
      { name: "availableBranches", type: "string[]", facet: true },
      { name: "popularityScore", type: "int32", sort: true },
      { name: "createdAt", type: "int64", sort: true },
      {
        name: "embedding",
        type: "float[]",
        num_dim: dimension,
        optional: true,
      },
    ],
    default_sorting_field: "popularityScore",
  } satisfies CollectionCreateSchema;
}
