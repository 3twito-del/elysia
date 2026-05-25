import {
  mkdir,
  readdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import sharp from "sharp";

const sourceExtensions = new Set([".jpeg", ".jpg", ".png", ".webp"]);
const referenceFileExtensions = new Set([
  ".css",
  ".js",
  ".jsx",
  ".md",
  ".mdx",
  ".mjs",
  ".ts",
  ".tsx",
]);
const referenceRoots = ["src", "docs"];
const avifQuality = 58;
const avifEffort = 5;

export async function convertPublicImagesToAvif({
  check = false,
  cwd = process.cwd(),
  error = console.error,
  force = false,
  logger = console.log,
  warn = console.warn,
} = {}) {
  const publicDir = path.join(cwd, "public");
  const sourceImages = await findSourceImages(publicDir);
  const usableAvifBySourceUrl = new Map();
  const summary = {
    converted: 0,
    current: 0,
    failed: 0,
    referenceFilesUpdated: 0,
    referencesUpdated: 0,
    skippedLarger: 0,
    sourceBytes: 0,
    staleAssets: 0,
    staleReferences: 0,
    avifBytes: 0,
  };

  for (const sourcePath of sourceImages) {
    await processSourceImage({
      check,
      force,
      publicDir,
      sourcePath,
      summary,
      usableAvifBySourceUrl,
      warn,
    });
  }

  await updateSourceReferences(usableAvifBySourceUrl, summary, {
    cwd,
    write: !check,
  });

  if (check) {
    summary.staleReferences = summary.referencesUpdated;
  }

  logger(formatSummary(summary, check, sourceImages.length));

  const ok =
    summary.failed === 0 &&
    (!check || (summary.staleAssets === 0 && summary.staleReferences === 0));

  if (!ok && check) {
    error(
      "[images:avif] check failed. Run node scripts/convert-public-images-to-avif.mjs to repair assets and references.",
    );
  }

  return { ok, summary };
}

async function processSourceImage({
  check,
  force,
  publicDir,
  sourcePath,
  summary,
  usableAvifBySourceUrl,
  warn,
}) {
  const avifPath = getAvifPath(sourcePath);
  const sourceStats = await stat(sourcePath);

  summary.sourceBytes += sourceStats.size;

  const existingAvifStats = await statIfExists(avifPath);
  const hasUsableExistingAvif =
    existingAvifStats && existingAvifStats.size < sourceStats.size;
  const isCurrent =
    hasUsableExistingAvif &&
    existingAvifStats.mtimeMs >= sourceStats.mtimeMs;

  if (!force && (isCurrent || (check && hasUsableExistingAvif))) {
    summary.current += 1;
    summary.avifBytes += existingAvifStats.size;
    usableAvifBySourceUrl.set(
      toPublicUrl(sourcePath, publicDir),
      toPublicUrl(avifPath, publicDir),
    );
    return;
  }

  try {
    if (check) {
      await checkSourceImage({
        avifPath,
        existingAvifStats,
        publicDir,
        sourcePath,
        sourceStats,
        summary,
        usableAvifBySourceUrl,
      });
      return;
    }

    await convertSourceImage({
      avifPath,
      existingAvifStats,
      publicDir,
      sourcePath,
      sourceStats,
      summary,
      usableAvifBySourceUrl,
    });
  } catch (caughtError) {
    summary.failed += 1;
    warn(
      `[images:avif] Failed to convert ${path.relative(
        process.cwd(),
        sourcePath,
      )}: ${caughtError instanceof Error ? caughtError.message : String(caughtError)}`,
    );
  }
}

async function checkSourceImage({
  avifPath,
  publicDir,
  sourcePath,
  sourceStats,
  summary,
  usableAvifBySourceUrl,
}) {
  const generatedAvif = await sharp(sourcePath)
    .rotate()
    .avif({
      effort: avifEffort,
      quality: avifQuality,
    })
    .toBuffer();

  if (generatedAvif.length >= sourceStats.size) {
    summary.skippedLarger += 1;
    return;
  }

  summary.staleAssets += 1;
  summary.avifBytes += generatedAvif.length;
  usableAvifBySourceUrl.set(
    toPublicUrl(sourcePath, publicDir),
    toPublicUrl(avifPath, publicDir),
  );
}

async function convertSourceImage({
  avifPath,
  existingAvifStats,
  publicDir,
  sourcePath,
  sourceStats,
  summary,
  usableAvifBySourceUrl,
}) {
  const tempPath = `${avifPath}.tmp-${process.pid}`;

  await mkdir(path.dirname(avifPath), { recursive: true });
  await sharp(sourcePath)
    .rotate()
    .avif({
      effort: avifEffort,
      quality: avifQuality,
    })
    .toFile(tempPath);

  const avifStats = await stat(tempPath).catch(() => null);

  if (!avifStats || avifStats.size >= sourceStats.size) {
    await rm(tempPath, { force: true });

    if (
      existingAvifStats &&
      existingAvifStats.mtimeMs >= sourceStats.mtimeMs &&
      existingAvifStats.size < sourceStats.size
    ) {
      summary.current += 1;
      summary.avifBytes += existingAvifStats.size;
      usableAvifBySourceUrl.set(
        toPublicUrl(sourcePath, publicDir),
        toPublicUrl(avifPath, publicDir),
      );
    } else {
      summary.skippedLarger += 1;
    }

    return;
  }

  await rename(tempPath, avifPath);

  summary.converted += 1;
  summary.avifBytes += avifStats.size;
  usableAvifBySourceUrl.set(
    toPublicUrl(sourcePath, publicDir),
    toPublicUrl(avifPath, publicDir),
  );
}

function formatSummary(summary, check, scanned) {
  return [
    `[images:avif] scanned=${scanned}`,
    `converted=${summary.converted}`,
    `current=${summary.current}`,
    `skipped-larger=${summary.skippedLarger}`,
    `failed=${summary.failed}`,
    `references=${summary.referencesUpdated}`,
    `stale-assets=${summary.staleAssets}`,
    `stale-references=${summary.staleReferences}`,
    `mode=${check ? "check" : "write"}`,
    `saved=${formatBytes(summary.sourceBytes - summary.avifBytes)}`,
  ].join(" ");
}

async function findSourceImages(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const images = [];

  for (const entry of entries) {
    const entryPath = path.join(root, entry.name);

    if (entry.isDirectory()) {
      images.push(...(await findSourceImages(entryPath)));
      continue;
    }

    if (!entry.isFile()) continue;

    const extension = path.extname(entry.name).toLowerCase();
    if (sourceExtensions.has(extension)) {
      images.push(entryPath);
    }
  }

  return images;
}

async function updateSourceReferences(
  avifBySourceUrl,
  summary,
  { cwd, write },
) {
  const referenceFiles = [];

  for (const root of referenceRoots) {
    referenceFiles.push(...(await findReferenceFiles(path.join(cwd, root))));
  }

  for (const filePath of referenceFiles) {
    const source = await readFile(filePath, "utf8");
    let updatedReferencesInFile = 0;
    const nextSource = source.replace(
      /(["'`])(?<url>\/[^"'`\s)]+?\.(?:jpeg|jpg|png|webp))\1/g,
      (match, quote, url) => {
        if (shouldKeepSourceReference(url)) return match;

        const avifUrl = avifBySourceUrl.get(url);

        if (!avifUrl) return match;

        updatedReferencesInFile += 1;
        return `${quote}${avifUrl}${quote}`;
      },
    );

    if (updatedReferencesInFile === 0 || nextSource === source) continue;

    if (write) {
      await writeFile(filePath, nextSource, "utf8");
    }

    summary.referenceFilesUpdated += 1;
    summary.referencesUpdated += updatedReferencesInFile;
  }
}

function shouldKeepSourceReference(url) {
  return (
    url === "/apple-touch-icon.png" ||
    url.startsWith("/pwa/icons/") ||
    url.startsWith("/pwa/screenshots/")
  );
}

async function findReferenceFiles(root) {
  const rootStats = await statIfExists(root);
  if (!rootStats?.isDirectory()) return [];

  const entries = await readdir(root, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(root, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === ".next" || entry.name === "node_modules") continue;
      files.push(...(await findReferenceFiles(entryPath)));
      continue;
    }

    if (!entry.isFile()) continue;

    if (referenceFileExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(entryPath);
    }
  }

  return files;
}

async function statIfExists(filePath) {
  try {
    return await stat(filePath);
  } catch (caughtError) {
    if (
      caughtError &&
      typeof caughtError === "object" &&
      "code" in caughtError
    ) {
      if (caughtError.code === "ENOENT") return null;
    }

    throw caughtError;
  }
}

function getAvifPath(sourcePath) {
  const extension = path.extname(sourcePath);

  return `${sourcePath.slice(0, -extension.length)}.avif`;
}

function toPublicUrl(filePath, publicDir) {
  const relativePath = path.relative(publicDir, filePath);

  return `/${relativePath.split(path.sep).join("/")}`;
}

function formatBytes(bytes) {
  const absoluteBytes = Math.max(0, bytes);
  if (absoluteBytes < 1024) return `${absoluteBytes}B`;
  if (absoluteBytes < 1024 * 1024)
    return `${(absoluteBytes / 1024).toFixed(1)}KB`;

  return `${(absoluteBytes / 1024 / 1024).toFixed(2)}MB`;
}

if (isDirectExecution()) {
  const result = await convertPublicImagesToAvif({
    check: process.argv.includes("--check"),
    force: process.argv.includes("--force"),
  });

  if (!result.ok) {
    process.exitCode = 1;
  }
}

function isDirectExecution() {
  const entry = process.argv[1];

  return Boolean(entry) && import.meta.url === pathToFileURL(entry).href;
}
