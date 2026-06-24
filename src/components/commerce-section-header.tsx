import type { ReactNode } from "react";

import { getTextDirection } from "~/lib/text-direction";
import { cn } from "~/lib/utils";

type CommerceSectionHeaderProps = {
  action?: ReactNode;
  className?: string;
  description?: ReactNode;
  eyebrow?: ReactNode;
  id?: string;
  title: ReactNode;
};

export function CommerceSectionHeader({
  action,
  className,
  description,
  eyebrow,
  id,
  title,
}: CommerceSectionHeaderProps) {
  // Policy: a heading follows its content language — English titles read LTR
  // (and sit on the left), Hebrew titles read RTL (right). Non-string titles
  // inherit the page direction.
  const titleDirection =
    typeof title === "string" ? getTextDirection(title) : undefined;

  return (
    <div
      className={cn(
        "elysia-section-heading commerce-section-header",
        className,
      )}
      data-title-direction={titleDirection}
      dir={titleDirection}
    >
      <div className="commerce-section-header-copy">
        {eyebrow ? (
          <p className="commerce-section-header-eyebrow">{eyebrow}</p>
        ) : null}
        <h2 className="commerce-section-header-title" id={id}>
          {title}
        </h2>
        {description ? (
          <p className="commerce-section-header-description">{description}</p>
        ) : null}
      </div>
      {action ? (
        <div className="commerce-section-header-action">{action}</div>
      ) : null}
    </div>
  );
}
