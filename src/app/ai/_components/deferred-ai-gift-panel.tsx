"use client";

import dynamic from "next/dynamic";

import { LoadingState } from "~/components/ui/loading-state";

const LazyAiGiftPanel = dynamic(
  () => import("./ai-gift-panel").then((mod) => mod.AiGiftPanel),
  {
    loading: () => (
      <div className="glass-panel grid min-h-[420px] place-items-center rounded-md border p-5">
        <LoadingState label="טוענים את שאלון המתנה" />
      </div>
    ),
    ssr: false,
  },
);

export function DeferredAiGiftPanel() {
  return <LazyAiGiftPanel />;
}
