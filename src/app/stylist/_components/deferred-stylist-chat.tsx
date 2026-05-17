"use client";

import dynamic from "next/dynamic";

import { LoadingState } from "~/components/ui/loading-state";

const LazyCompactStylistChat = dynamic(
  () =>
    import("./stylist-chat").then((mod) => {
      const CompactStylistChat = () => <mod.StylistChat compact />;
      CompactStylistChat.displayName = "CompactStylistChat";
      return CompactStylistChat;
    }),
  {
    loading: () => <StylistChatLoading compact />,
    ssr: false,
  },
);

const LazyStylistChat = dynamic(
  () =>
    import("./stylist-chat").then((mod) => {
      const FullStylistChat = () => <mod.StylistChat />;
      FullStylistChat.displayName = "FullStylistChat";
      return FullStylistChat;
    }),
  {
    loading: () => <StylistChatLoading />,
    ssr: false,
  },
);

type DeferredStylistChatProps = {
  compact?: boolean;
};

export function DeferredStylistChat({
  compact = false,
}: DeferredStylistChatProps) {
  return compact ? <LazyCompactStylistChat /> : <LazyStylistChat />;
}

function StylistChatLoading({ compact = false }: DeferredStylistChatProps) {
  return (
    <div
      className={
        compact
          ? "glass-panel grid min-h-[520px] place-items-center rounded-md border p-5"
          : "glass-panel grid min-h-[640px] place-items-center rounded-md border p-5"
      }
    >
      <LoadingState label="טוענים את הסטייליסט" />
    </div>
  );
}
