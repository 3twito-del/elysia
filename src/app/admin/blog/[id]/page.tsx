import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { AdminBlogPostEditorForm } from "../../_components/admin-blog-actions";
import { AdminShell } from "../../_components/admin-shell";
import {
  AdminDatabaseFallback,
  AdminForbidden,
} from "../../_components/admin-states";
import { getAdminPageAccess } from "../../_lib/access";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { getAdminBlogPostEditor } from "~/server/services/admin-blog";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata = {
  title: "Blog Post | Admin",
};

export const dynamic = "force-dynamic";

type AdminBlogPostPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminBlogPostPage({
  params,
}: AdminBlogPostPageProps) {
  const { id } = await params;
  const access = await getAdminPageAccess("BLOG_READ", `/admin/blog/${id}`);

  if (access.denied) return <AdminForbidden {...access.denied} />;

  const editor = await getAdminBlogPostEditor(id).catch((error: unknown) => {
    if (process.env.NODE_ENV === "development") {
      console.error("[admin] failed to load blog post", error);
    }

    return undefined;
  });

  if (editor === undefined) return <AdminDatabaseFallback />;
  if (!editor) notFound();

  return (
    <AdminShell
      active="blog"
      admin={access.admin}
      description="עריכת תוכן, סטטוס, תזמון, SEO, תגיות ומוצרים קשורים למאמר."
      title={editor.post.title}
    >
      <TRPCReactProvider>
        <div className="mb-4">
          <Button asChild variant="outline">
            <Link href="/admin/blog">
              <ArrowRight aria-hidden="true" className="size-4" />
              חזרה למגזין
            </Link>
          </Button>
        </div>
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle>עריכת מאמר</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminBlogPostEditorForm options={editor} post={editor.post} />
          </CardContent>
        </Card>
      </TRPCReactProvider>
    </AdminShell>
  );
}
