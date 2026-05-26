"use client";

import dynamic from "next/dynamic";

import { LoadingState } from "~/components/ui/loading-state";

const LazyAiGiftPanel = dynamic(
  () => import("./ai-gift-panel").then((mod) => mod.AiGiftPanel),
  {
    loading: () => (
      <div className="brand-surface grid min-h-[420px] place-items-center p-5">
        <LoadingState label="שאלון המתנה מתעדכן" />
      </div>
    ),
    ssr: false,
  },
);

export function DeferredAiGiftPanel() {
  return <LazyAiGiftPanel />;
}
