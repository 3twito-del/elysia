import { notFound } from "next/navigation";

import { SiteHeader } from "~/components/site-header";
import { Button } from "~/components/ui/button";
import { getPublishedPageBySlug } from "~/server/services/landing-pages";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const page = await getPublishedPageBySlug(slug).catch(() => null);
  return { title: page?.title ?? "עמוד" };
}

export default async function LandingPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getPublishedPageBySlug(slug).catch(() => null);

  if (!page) notFound();

  return (
    <main className="elysia-page">
      <SiteHeader />
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {page.blocks.map((block) => {
          if (block.type === "HERO") {
            return (
              <header className="mb-10 text-center" key={block.id}>
                {block.heading ? (
                  <h1 className="text-4xl font-semibold sm:text-5xl">{block.heading}</h1>
                ) : null}
                {block.body ? (
                  <p className="text-muted-foreground mt-4 text-lg">{block.body}</p>
                ) : null}
              </header>
            );
          }
          if (block.type === "IMAGE" && block.imageUrl) {
            return (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={block.heading ?? ""}
                className="my-6 w-full rounded-md"
                key={block.id}
                src={block.imageUrl}
              />
            );
          }
          if (block.type === "CTA") {
            return (
              <div className="my-8 text-center" key={block.id}>
                {block.body ? <p className="mb-3">{block.body}</p> : null}
                {block.linkUrl ? (
                  <Button asChild>
                    <a href={block.linkUrl}>{block.heading ?? "להמשך"}</a>
                  </Button>
                ) : null}
              </div>
            );
          }
          return (
            <section className="my-6" key={block.id}>
              {block.heading ? (
                <h2 className="mb-2 text-2xl font-semibold">{block.heading}</h2>
              ) : null}
              {block.body ? (
                <p className="text-muted-foreground leading-7">{block.body}</p>
              ) : null}
            </section>
          );
        })}
      </article>
    </main>
  );
}
