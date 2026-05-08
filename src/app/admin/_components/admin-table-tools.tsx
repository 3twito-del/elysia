import Link from "next/link";

import { Button } from "~/components/ui/button";
import type { AdminPageInfo } from "~/server/services/admin-operations";

export function AdminTableScrollHint() {
  return (
    <p className="text-muted-foreground mb-3 text-xs sm:hidden">
      אפשר לגרור את הטבלה לצדדים במסכים צרים.
    </p>
  );
}

export function AdminPagination({
  basePath,
  pageInfo,
  searchParams,
}: {
  basePath: string;
  pageInfo: AdminPageInfo;
  searchParams?: Record<string, string | undefined>;
}) {
  const previous = Math.max(1, pageInfo.page - 1);
  const next = Math.min(pageInfo.totalPages, pageInfo.page + 1);

  return (
    <nav
      aria-label="עמודי תוצאות"
      className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row"
    >
      <p className="text-muted-foreground text-sm">
        עמוד {pageInfo.page} מתוך {pageInfo.totalPages} · {pageInfo.totalItems}{" "}
        רשומות
      </p>
      <div className="flex items-center gap-2">
        <Button
          asChild={pageInfo.hasPreviousPage}
          disabled={!pageInfo.hasPreviousPage}
          size="sm"
          variant="outline"
        >
          {pageInfo.hasPreviousPage ? (
            <Link href={createPageHref(basePath, searchParams, previous)}>
              הקודם
            </Link>
          ) : (
            <span>הקודם</span>
          )}
        </Button>
        <Button
          asChild={pageInfo.hasNextPage}
          disabled={!pageInfo.hasNextPage}
          size="sm"
          variant="outline"
        >
          {pageInfo.hasNextPage ? (
            <Link href={createPageHref(basePath, searchParams, next)}>הבא</Link>
          ) : (
            <span>הבא</span>
          )}
        </Button>
      </div>
    </nav>
  );
}

function createPageHref(
  basePath: string,
  searchParams: Record<string, string | undefined> = {},
  page: number,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (value && key !== "page") params.set(key, value);
  }

  if (page > 1) params.set("page", String(page));

  const query = params.toString();

  return query ? `${basePath}?${query}` : basePath;
}
