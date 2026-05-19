import type { ReactNode } from "react";

import {
  CommercePageHero,
  type CommercePageHeroDensity,
  type CommercePageHeroIntent,
  type CommercePageHeroMetric,
  type CommercePageHeroMetricsMode,
} from "~/components/commerce-page-hero";

type CompactPageIntroMetric = CommercePageHeroMetric;

type CompactPageIntroProps = {
  actions?: ReactNode;
  className?: string;
  density?: CommercePageHeroDensity;
  description?: ReactNode;
  eyebrow?: ReactNode;
  id?: string;
  intent?: CommercePageHeroIntent;
  metrics?: CompactPageIntroMetric[];
  metricsMode?: CommercePageHeroMetricsMode;
  title: ReactNode;
};

export function CompactPageIntro({
  actions,
  className,
  density,
  description,
  eyebrow,
  id,
  intent,
  metrics,
  metricsMode,
  title,
}: CompactPageIntroProps) {
  return (
    <CommercePageHero
      actions={actions}
      className={className}
      density={density}
      description={description}
      eyebrow={eyebrow}
      id={id}
      intent={intent}
      metrics={metrics}
      metricsMode={metricsMode}
      title={title}
      variant="content"
    />
  );
}
