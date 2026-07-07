import { filterCatalogProducts } from "~/server/services/catalog";
import type {
  CatalogProduct,
  CatalogSearchInput,
} from "~/server/services/catalog-types";

/**
 * Deterministic search-quality evaluation (E-02, lexical path).
 *
 * This measures the repository's deterministic retrieval — `filterCatalogProducts`,
 * the pure filter behind local (non-Typesense, non-AI) search — against a labeled
 * query corpus, producing precision / recall / zero-result metrics. It is
 * intentionally free of any database, Typesense, or AI-provider dependency so it
 * runs as a plain unit evaluation and can later be pointed at `listCatalogProducts()`
 * output (real catalog) or extended to score the semantic/AI path.
 */

export type SearchEvaluationCase = {
  /** Human-readable case name for reports. */
  label: string;
  /** The search input under test (query and/or facet filters). */
  input: CatalogSearchInput;
  /** Slugs that should be retrieved. Ignored when `expectZeroResults` is set. */
  relevantSlugs?: readonly string[];
  /** True when the query is a no-match intent that should retrieve nothing. */
  expectZeroResults?: boolean;
};

export type SearchCaseResult = {
  label: string;
  retrievedSlugs: string[];
  relevantSlugs: string[];
  /** |retrieved ∩ relevant| / |retrieved| (1 when nothing is expected or retrieved). */
  precision: number;
  /** |retrieved ∩ relevant| / |relevant| (1 when nothing is expected). */
  recall: number;
  /** Whether a no-match case correctly retrieved nothing; null for scored cases. */
  zeroResultCorrect: boolean | null;
};

export type SearchEvaluationReport = {
  cases: SearchCaseResult[];
  /** Mean precision over scored (non-zero-result) cases; 1 when there are none. */
  meanPrecision: number;
  /** Mean recall over scored cases; 1 when there are none. */
  meanRecall: number;
  /** Share of no-match cases that correctly returned nothing; 1 when there are none. */
  zeroResultAccuracy: number;
};

export function evaluateLexicalRetrieval(
  products: readonly CatalogProduct[],
  cases: readonly SearchEvaluationCase[],
): SearchEvaluationReport {
  const results = cases.map((testCase) => evaluateCase(products, testCase));

  const scored = results.filter((result) => result.zeroResultCorrect === null);
  const zeroResult = results.filter(
    (result) => result.zeroResultCorrect !== null,
  );

  return {
    cases: results,
    meanPrecision: mean(scored.map((result) => result.precision)),
    meanRecall: mean(scored.map((result) => result.recall)),
    zeroResultAccuracy: mean(
      zeroResult.map((result) => (result.zeroResultCorrect ? 1 : 0)),
    ),
  };
}

function evaluateCase(
  products: readonly CatalogProduct[],
  testCase: SearchEvaluationCase,
): SearchCaseResult {
  const retrievedSlugs = filterCatalogProducts([...products], testCase.input)
    .map((product) => product.slug)
    .sort();

  if (testCase.expectZeroResults) {
    return {
      label: testCase.label,
      retrievedSlugs,
      relevantSlugs: [],
      precision: retrievedSlugs.length === 0 ? 1 : 0,
      recall: 1,
      zeroResultCorrect: retrievedSlugs.length === 0,
    };
  }

  const relevantSlugs = [...(testCase.relevantSlugs ?? [])].sort();
  const relevant = new Set(relevantSlugs);
  const hitCount = retrievedSlugs.filter((slug) => relevant.has(slug)).length;

  return {
    label: testCase.label,
    retrievedSlugs,
    relevantSlugs,
    precision:
      retrievedSlugs.length === 0 ? 1 : hitCount / retrievedSlugs.length,
    recall: relevant.size === 0 ? 1 : hitCount / relevant.size,
    zeroResultCorrect: null,
  };
}

function mean(values: number[]): number {
  if (values.length === 0) return 1;

  return values.reduce((total, value) => total + value, 0) / values.length;
}
