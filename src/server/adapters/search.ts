import { categories, products, searchProducts } from "~/lib/catalog";

export type ProductSearchInput = {
  query?: string;
  category?: string;
  branch?: string;
  maxPrice?: number;
};

export type SearchFacet = {
  field: string;
  values: Array<{ value: string; count: number }>;
};

export type ProductSearchResult = {
  hits: typeof products;
  facets: SearchFacet[];
  engine: "typesense" | "local";
};

export interface SearchProvider {
  searchProducts(input: ProductSearchInput): Promise<ProductSearchResult>;
  indexProducts(): Promise<{ indexed: number; engine: "typesense" | "local" }>;
}

class TypesenseSearchProvider implements SearchProvider {
  async searchProducts(
    input: ProductSearchInput,
  ): Promise<ProductSearchResult> {
    const hits = searchProducts(input);

    return {
      hits,
      engine: "local",
      facets: [
        {
          field: "category",
          values: categories.map((category) => ({
            value: category.name,
            count: hits.filter(
              (product) => product.categorySlug === category.slug,
            ).length,
          })),
        },
        {
          field: "material",
          values: [...new Set(products.map((product) => product.material))].map(
            (material) => ({
              value: material,
              count: hits.filter((product) => product.material === material)
                .length,
            }),
          ),
        },
      ],
    };
  }

  async indexProducts() {
    return {
      indexed: products.length,
      engine: "local" as const,
    };
  }
}

export const searchProvider: SearchProvider = new TypesenseSearchProvider();
