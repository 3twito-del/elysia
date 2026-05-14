import type { ReactNode } from "react";

import { cn } from "~/lib/utils";

type CompactPageIntroMetric = {
  label: ReactNode;
  value: ReactNode;
};

type CompactPageIntroProps = {
  actions?: ReactNode;
  className?: string;
  description?: ReactNode;
  eyebrow?: ReactNode;
  id?: string;
  metrics?: CompactPageIntroMetric[];
  title: ReactNode;
};

export function CompactPageIntro({
  actions,
  className,
  description,
  eyebrow,
  id,
  metrics,
  title,
}: CompactPageIntroProps) {
  const hasActions = actions !== undefined && actions !== null;
  const hasMetrics = (metrics?.length ?? 0) > 0;
  const hasAside = hasActions || hasMetrics;

  return (
    <section
      className={cn("compact-page-intro", className)}
      data-has-aside={hasAside ? "true" : "false"}
      dir="rtl"
      id={id}
    >
      <div className="compact-page-intro-copy">
        {eyebrow ? (
          <p className="compact-page-intro-eyebrow">{eyebrow}</p>
        ) : null}
        <h1 className="compact-page-intro-title">{title}</h1>
        {description ? (
          <p className="compact-page-intro-description">{description}</p>
        ) : null}
      </div>

      {hasAside ? (
        <div className="compact-page-intro-aside">
          {hasMetrics ? (
            <dl className="compact-page-intro-metrics">
              {metrics?.map((metric, index) => (
                <div className="compact-page-intro-metric" key={index}>
                  <dt>{metric.label}</dt>
                  <dd>{metric.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {hasActions ? (
            <div className="compact-page-intro-actions">{actions}</div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
