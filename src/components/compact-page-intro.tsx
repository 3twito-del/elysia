import type { ReactNode } from "react";

import {
  CommercePageHero,
  type CommercePageHeroMetric,
} from "~/components/commerce-page-hero";

type CompactPageIntroMetric = CommercePageHeroMetric;

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
  return (
    <CommercePageHero
      actions={actions}
      className={className}
      description={description}
      eyebrow={eyebrow}
      id={id}
      metrics={metrics}
      title={title}
      variant="content"
    />
  );
}
