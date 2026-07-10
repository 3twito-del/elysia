import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "~/lib/utils";

const markdownComponents: Components = {
  a({ children, href }) {
    if (!href) return <span>{children}</span>;

    if (href.startsWith("/")) {
      return (
        <Link className="underline underline-offset-4" href={href}>
          {children}
        </Link>
      );
    }

    return (
      <a
        className="underline underline-offset-4"
        href={href}
        rel="noreferrer"
        target="_blank"
      >
        {children}
      </a>
    );
  },
  blockquote({ children }) {
    return (
      <blockquote className="border-s-2 border-[var(--glass-border-strong)] ps-4 text-muted-foreground italic">
        {children}
      </blockquote>
    );
  },
  strong({ children }) {
    return <strong className="text-foreground font-semibold">{children}</strong>;
  },
  img() {
    return null;
  },
};

export function BlogMarkdown({
  className,
  markdown,
}: {
  className?: string;
  markdown: string;
}) {
  return (
    <div
      className={cn(
        "blog-markdown grid gap-5 text-base leading-8 sm:text-lg sm:leading-9",
        className,
      )}
    >
      <ReactMarkdown
        components={markdownComponents}
        remarkPlugins={[remarkGfm]}
        skipHtml
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
