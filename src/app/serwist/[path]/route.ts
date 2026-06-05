import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";

type SerwistRoute = {
  dynamic: "auto" | "force-dynamic" | "error" | "force-static";
  dynamicParams: boolean;
  revalidate: false | number;
  generateStaticParams: () =>
    | Array<{ path: string | string[] }>
    | Promise<Array<{ path: string | string[] }>>;
  GET: (
    request: Request,
    context: { params: Promise<{ path: string }> },
  ) => Promise<Response> | Response;
};

export const knownSerwistAssetPaths = ["sw.js"] as const;
const missingSerwistAssetStatus = 404;
const serwistPrecacheIgnores = [
  "**/node_modules/**/*",
  "public/brand/elysia-aqua*.png",
  "public/brand/cinematic/*.png",
] as const;

const serwistRoute =
  process.env.NODE_ENV === "production"
    ? await createProductionSerwistRoute()
    : createDevelopmentSerwistRoute();

export const { dynamic, dynamicParams, revalidate, generateStaticParams, GET } =
  serwistRoute;

async function createProductionSerwistRoute(): Promise<SerwistRoute> {
  const { createSerwistRoute } = await import("@serwist/turbopack");
  const revision =
    spawnSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf-8",
    }).stdout?.trim() || randomUUID();

  return createSerwistRoute({
    additionalPrecacheEntries: [{ url: "/offline", revision }],
    globIgnores: [...serwistPrecacheIgnores],
    swSrc: "src/app/sw.ts",
    useNativeEsbuild: true,
  });
}

function createDevelopmentSerwistRoute(): SerwistRoute {
  return {
    dynamic: "force-dynamic",
    dynamicParams: true,
    revalidate: 0,
    generateStaticParams: () => [],
    GET: () =>
      new Response(null, {
        headers: {
          "Cache-Control": "no-store",
        },
        status: missingSerwistAssetStatus,
      }),
  };
}
