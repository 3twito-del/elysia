"use client";

import { AiGiftRecommender } from "./ai-gift-recommender";
import { TRPCReactProvider } from "~/trpc/react";

export function AiGiftPanel() {
  return (
    <TRPCReactProvider>
      <AiGiftRecommender />
    </TRPCReactProvider>
  );
}
