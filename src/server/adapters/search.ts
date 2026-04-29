import { Client } from "typesense";
import type { CollectionCreateSchema } from "typesense";

import { env } from "~/env";
import {
  getCatalogCategories,
  getCatalogFacets,
  listCatalogProducts,
  searchCatalogProducts,
  type CatalogProduct,
} from "~/server/services/catalog";

const PRODUCTS_COLLECTION = "products";

export type ProductSearchInput = {
  query?: string;
  category?: string;
  branch?: string;
  material?: string;
  stone?: string;
  collection?: string;
  maxPrice?: number;
  availableOnly?: boolean;
  sort?: "relevance" | "price-asc" | "price-desc" | "newest" | "popular";
};

export type SearchFacet = {
  field: string;
  values: Array<{ value: string; count: number }>;
};

export type ProductSearchResult = {
  hits: CatalogProduct[];
  facets: SearchFacet[];
  engine: "typesense" | "local";
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
};

export interface SearchProvider {
  searchProducts(input: ProductSearchInput): Promise<ProductSearchResult>;
  indexProducts(): Promise<{ indexed: number; engine: "typesense" | "local" }>;
}

class TypesenseSearchProvider implements SearchProvider {
  async searchProducts(
    input: ProductSearchInput,
  ): Promise<ProductSearchResult> {
    const client = getTypesenseClient();

    if (!client) {
      assertLocalSearchAllowed();
      return searchLocalProducts(input);
    }

    await ensureProductsCollection(client);

    const query = normalizeTypesenseQuery(input.query);
    const response = await client
      .collections<ProductSearchDocument>(PRODUCTS_COLLECTION)
      .documents()
      .search({
        q: query,
        query_by: "name,shortDescription,category,material,stone,tags",
        filter_by: buildTypesenseFilter(input),
        facet_by: "category,material,stone,collection,availableBranches",
        sort_by: buildTypesenseSort(input, query),
        per_page: 24,
      });
    const slugs =
      response.hits?.map((hit) => hit.document.slug).filter(Boolean) ?? [];
    const products = await listCatalogProducts();
    const productsBySlug = new Map(
      products.map((product) => [product.slug, product] as const),
    );

    return {
      hits: slugs
        .map((slug) => productsBySlug.get(slug))
        .filter((product): product is CatalogProduct => Boolean(product)),
      engine: "typesense",
      facets: mapTypesenseFacets(response.facet_counts ?? []),
    };
  }

  async indexProducts() {
    const client = getTypesenseClient();
    const products = await listCatalogProducts();

    if (!client) {
      assertLocalSearchAllowed();

      return {
        indexed: products.length,
        engine: "local" as const,
      };
    }

    await ensureProductsCollection(client);

    if (products.length > 0) {
      await client
        .collections<ProductSearchDocument>(PRODUCTS_COLLECTION)
        .documents()
        .import(products.map(toTypesenseDocument), { action: "upsert" });
    }

    return {
      indexed: products.length,
      engine: "typesense" as const,
    };
  }
}

export const searchProvider: SearchProvider = new TypesenseSearchProvider();

let typesenseClient: Client | null = null;

function getTypesenseClient() {
  if (!env.TYPESENSE_HOST || !env.TYPESENSE_API_KEY) return null;

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

async function searchLocalProducts(input: ProductSearchInput) {
  const [hits, facets] = await Promise.all([
    searchCatalogProducts(input),
    buildLocalFacets(input),
  ]);

  return {
    hits: sortLocalHits(hits, input.sort),
    engine: "local" as const,
    facets,
  };
}

function assertLocalSearchAllowed() {
  if (env.NODE_ENV === "production") {
    throw new Error(
      "Typesense is required in production. Configure TYPESENSE_HOST and TYPESENSE_API_KEY.",
    );
  }
}

function sortLocalHits(
  hits: CatalogProduct[],
  sort: ProductSearchInput["sort"] = "relevance",
) {
  const sorted = [...hits];

  if (sort === "price-asc") return sorted.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") return sorted.sort((a, b) => b.price - a.price);
  if (sort === "newest") return sorted;
  if (sort === "popular") {
    return sorted.sort(
      (a, b) =>
        Object.values(b.inventory).reduce((sum, value) => sum + value, 0) -
        Object.values(a.inventory).reduce((sum, value) => sum + value, 0),
    );
  }

  return sorted;
}

async function ensureProductsCollection(client: Client) {
  const collection =
    client.collections<ProductSearchDocument>(PRODUCTS_COLLECTION);
  const exists = await collection.exists();

  if (exists) return;

  await client.collections().create(productsCollectionSchema);
}

function toTypesenseDocument(product: CatalogProduct): ProductSearchDocument {
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
    popularityScore: 0,
    createdAt: Math.floor(Date.now() / 1000),
  };
}

function buildTypesenseFilter(input: ProductSearchInput) {
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
  ].filter(Boolean);

  return filters.length > 0 ? filters.join(" && ") : undefined;
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
  ] satisfies SearchFacet[];
}

const productsCollectionSchema = {
  name: PRODUCTS_COLLECTION,
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
  ],
  default_sorting_field: "popularityScore",
} satisfies CollectionCreateSchema;
