import { existsSync } from "node:fs";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  utimes,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import sharp from "sharp";
import { afterEach, describe, expect, it } from "vitest";

import { convertPublicImagesToAvif } from "./convert-public-images-to-avif.mjs";

const tempRoots = [];
const quiet = () => {};

describe("public image AVIF conversion", () => {
  afterEach(async () => {
    await Promise.all(
      tempRoots
        .splice(0)
        .map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("fails check mode without mutating pending asset and reference repairs", async () => {
    const cwd = await createImageFixture();
    const sourceFile = path.join(cwd, "src", "page.ts");
    const before = await readFile(sourceFile, "utf8");

    const result = await convertPublicImagesToAvif({
      check: true,
      cwd,
      error: quiet,
      logger: quiet,
      warn: quiet,
    });

    expect(result.ok).toBe(false);
    expect(result.summary.staleAssets).toBe(1);
    expect(result.summary.staleReferences).toBe(1);
    expect(existsSync(path.join(cwd, "public", "hero.avif"))).toBe(false);
    expect(await readFile(sourceFile, "utf8")).toBe(before);
  });

  it("passes check mode after write mode repairs assets and references", async () => {
    const cwd = await createImageFixture();
    const sourceFile = path.join(cwd, "src", "page.ts");

    const writeResult = await convertPublicImagesToAvif({
      cwd,
      error: quiet,
      logger: quiet,
      warn: quiet,
    });

    expect(writeResult.ok).toBe(true);
    expect(existsSync(path.join(cwd, "public", "hero.avif"))).toBe(true);
    expect(await readFile(sourceFile, "utf8")).toContain('"/hero.avif"');

    const checkResult = await convertPublicImagesToAvif({
      check: true,
      cwd,
      error: quiet,
      logger: quiet,
      warn: quiet,
    });

    expect(checkResult.ok).toBe(true);
    expect(checkResult.summary.staleAssets).toBe(0);
    expect(checkResult.summary.staleReferences).toBe(0);
  });

  it("does not treat checkout mtimes as AVIF drift in check mode", async () => {
    const cwd = await createImageFixture();

    await convertPublicImagesToAvif({
      cwd,
      error: quiet,
      logger: quiet,
      warn: quiet,
    });

    const avifFile = path.join(cwd, "public", "hero.avif");
    const checkoutLikeTime = new Date("2020-01-01T00:00:00.000Z");

    await utimes(avifFile, checkoutLikeTime, checkoutLikeTime);

    const checkResult = await convertPublicImagesToAvif({
      check: true,
      cwd,
      error: quiet,
      logger: quiet,
      warn: quiet,
    });

    expect(checkResult.ok).toBe(true);
    expect(checkResult.summary.current).toBe(1);
    expect(checkResult.summary.staleAssets).toBe(0);
  });

  it("keeps AVIF drift detection wired into the production build gate", async () => {
    const [packageJsonSource, scriptSource] = await Promise.all([
      readFile(path.join(process.cwd(), "package.json"), "utf8"),
      readFile(
        path.join(process.cwd(), "scripts/convert-public-images-to-avif.mjs"),
        "utf8",
      ),
    ]);
    const packageJson = JSON.parse(packageJsonSource);

    expect(packageJson.scripts.prebuild).toContain(
      "node scripts/convert-public-images-to-avif.mjs --check",
    );
    expect(packageJson.scripts["images:avif"]).toBe(
      "node scripts/convert-public-images-to-avif.mjs",
    );
    expect(scriptSource).toContain("const sourceExtensions = new Set");
    expect(scriptSource).toContain('const referenceRoots = ["src", "docs"]');
    expect(scriptSource).toContain("stale-assets=");
    expect(scriptSource).toContain("stale-references=");
    expect(scriptSource).toContain("[images:avif] check failed");
  });
});

async function createImageFixture() {
  const cwd = await mkdtemp(path.join(os.tmpdir(), "elysia-avif-"));

  tempRoots.push(cwd);
  await mkdir(path.join(cwd, "public"), { recursive: true });
  await mkdir(path.join(cwd, "src"), { recursive: true });
  await createNoisyPng(path.join(cwd, "public", "hero.png"));
  await writeFile(
    path.join(cwd, "src", "page.ts"),
    'export const heroImage = "/hero.png";\n',
    "utf8",
  );

  return cwd;
}

async function createNoisyPng(filePath) {
  const width = 128;
  const height = 128;
  const channels = 3;
  const data = Buffer.alloc(width * height * channels);

  for (let index = 0; index < data.length; index += 1) {
    data[index] = (index * 37 + Math.floor(index / channels) * 17) % 256;
  }

  await sharp(data, {
    raw: { channels, height, width },
  })
    .png()
    .toFile(filePath);
}
