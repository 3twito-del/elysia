"use client";

import { StylistChat } from "./stylist-chat";

type DeferredStylistChatProps = {
  compact?: boolean;
};

export function DeferredStylistChat({
  compact = false,
}: DeferredStylistChatProps) {
  return <StylistChat compact={compact} />;
}
