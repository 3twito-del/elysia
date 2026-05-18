import type { ReactNode } from "react";

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
  return (
    <div className={cn("commerce-section-header", className)}>
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
