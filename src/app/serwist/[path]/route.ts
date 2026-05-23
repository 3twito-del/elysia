import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createSerwistRoute } from "@serwist/turbopack";

const revision =
  spawnSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf-8",
  }).stdout.trim() || randomUUID();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  createSerwistRoute({
    additionalPrecacheEntries: [
      { url: "/offline", revision },
      { url: "/pwa/icons/icon-192.avif", revision },
      { url: "/pwa/icons/icon-512.avif", revision },
      { url: "/pwa/icons/maskable-512.avif", revision },
    ],
    swSrc: "src/app/sw.ts",
    useNativeEsbuild: true,
  });
