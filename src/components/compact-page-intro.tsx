import type { ReactNode } from "react";

import {
  CommercePageHero,
  type CommercePageHeroDensity,
  type CommercePageHeroIntent,
  type CommercePageHeroMetric,
  type CommercePageHeroMetricsMode,
  type CommercePageHeroVariant,
} from "~/components/commerce-page-hero";
import { cn } from "~/lib/utils";

type CompactPageIntroMetric = CommercePageHeroMetric;

type CompactPageIntroProps = {
  actions?: ReactNode;
  className?: string;
  density?: CommercePageHeroDensity;
  description?: ReactNode;
  descriptionClassName?: string;
  eyebrow?: ReactNode;
  id?: string;
  intent?: CommercePageHeroIntent;
  metrics?: CompactPageIntroMetric[];
  metricsMode?: CommercePageHeroMetricsMode;
  title: ReactNode;
  variant?: CommercePageHeroVariant;
};

export function CompactPageIntro({
  actions,
  className,
  density,
  description,
  descriptionClassName,
  eyebrow,
  id,
  intent,
  metrics,
  metricsMode,
  title,
  variant = "content",
}: CompactPageIntroProps) {
  return (
    <CommercePageHero
      actions={actions}
      className={cn("task-first-page-intro", className)}
      density={density}
      description={description}
      descriptionClassName={descriptionClassName}
      eyebrow={eyebrow}
      id={id}
      intent={intent}
      metrics={metrics}
      metricsMode={metricsMode}
      title={title}
      variant={variant}
    />
  );
}
