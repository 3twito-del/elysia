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
    }).stdout.trim() || randomUUID();

  const route = createSerwistRoute({
    additionalPrecacheEntries: [{ url: "/offline", revision }],
    swSrc: "src/app/sw.ts",
    useNativeEsbuild: true,
  });

  return {
    ...route,
    // Vercel prebuilt packaging can miss static route-handler bodies for
    // generated extension routes like /serwist/sw.js. Serving the Serwist
    // output through a normal lambda keeps the artifact deployable.
    dynamic: "force-dynamic",
    dynamicParams: true,
    generateStaticParams: () => [],
    revalidate: 0,
  };
}

function createDevelopmentSerwistRoute(): SerwistRoute {
  return {
    dynamic: "force-dynamic",
    dynamicParams: true,
    revalidate: 0,
    generateStaticParams: () => [],
    GET: () => new Response(null, { status: 404 }),
  };
}
