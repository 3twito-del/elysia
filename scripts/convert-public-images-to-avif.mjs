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
const publicDir = path.join(process.cwd(), "public");
const avifQuality = 58;
const avifEffort = 5;
const force = process.argv.includes("--force");
const dryRun = process.argv.includes("--check");

const sourceImages = await findSourceImages(publicDir);
const usableAvifBySourceUrl = new Map();
const summary = {
  converted: 0,
  current: 0,
  skippedLarger: 0,
  failed: 0,
  referenceFilesUpdated: 0,
  referencesUpdated: 0,
  sourceBytes: 0,
  avifBytes: 0,
};

for (const sourcePath of sourceImages) {
  const avifPath = getAvifPath(sourcePath);
  const sourceStats = await stat(sourcePath);
  summary.sourceBytes += sourceStats.size;

  const existingAvifStats = await statIfExists(avifPath);
  const isCurrent =
    existingAvifStats &&
    existingAvifStats.mtimeMs >= sourceStats.mtimeMs &&
    existingAvifStats.size < sourceStats.size;

  if (!force && isCurrent) {
    summary.current += 1;
    summary.avifBytes += existingAvifStats.size;
    usableAvifBySourceUrl.set(toPublicUrl(sourcePath), toPublicUrl(avifPath));
    continue;
  }

  try {
    const tempPath = `${avifPath}.tmp-${process.pid}`;

    if (!dryRun) {
      await mkdir(path.dirname(avifPath), { recursive: true });
      await sharp(sourcePath)
        .rotate()
        .avif({
          effort: avifEffort,
          quality: avifQuality,
        })
        .toFile(tempPath);
    }

    const avifStats = dryRun
      ? existingAvifStats
      : await stat(tempPath).catch(() => null);

    if (!avifStats || avifStats.size >= sourceStats.size) {
      if (!dryRun) {
        await rm(tempPath, { force: true });
      }

      if (existingAvifStats && existingAvifStats.size < sourceStats.size) {
        summary.current += 1;
        summary.avifBytes += existingAvifStats.size;
        usableAvifBySourceUrl.set(
          toPublicUrl(sourcePath),
          toPublicUrl(avifPath),
        );
      } else {
        summary.skippedLarger += 1;
      }

      continue;
    }

    if (!dryRun) {
      await rename(tempPath, avifPath);
    }

    summary.converted += 1;
    summary.avifBytes += avifStats.size;
    usableAvifBySourceUrl.set(toPublicUrl(sourcePath), toPublicUrl(avifPath));
  } catch (error) {
    summary.failed += 1;
    console.warn(
      `[images:avif] Failed to convert ${path.relative(process.cwd(), sourcePath)}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

if (!dryRun) {
  await updateSourceReferences(usableAvifBySourceUrl, summary);
}

console.log(
  [
    `[images:avif] scanned=${sourceImages.length}`,
    `converted=${summary.converted}`,
    `current=${summary.current}`,
    `skipped-larger=${summary.skippedLarger}`,
    `failed=${summary.failed}`,
    `references=${summary.referencesUpdated}`,
    `saved=${formatBytes(summary.sourceBytes - summary.avifBytes)}`,
  ].join(" "),
);

if (summary.failed > 0) {
  process.exitCode = 1;
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

async function updateSourceReferences(avifBySourceUrl, summary) {
  const referenceFiles = [];

  for (const root of referenceRoots) {
    referenceFiles.push(
      ...(await findReferenceFiles(path.join(process.cwd(), root))),
    );
  }

  for (const filePath of referenceFiles) {
    const source = await readFile(filePath, "utf8");
    let updatedReferencesInFile = 0;
    const nextSource = source.replace(
      /(["'`])(?<url>\/[^"'`\s)]+?\.(?:jpeg|jpg|png|webp))\1/g,
      (match, quote, url) => {
        const avifUrl = avifBySourceUrl.get(url);

        if (!avifUrl) return match;

        updatedReferencesInFile += 1;
        return `${quote}${avifUrl}${quote}`;
      },
    );

    if (updatedReferencesInFile === 0 || nextSource === source) continue;

    await writeFile(filePath, nextSource, "utf8");
    summary.referenceFilesUpdated += 1;
    summary.referencesUpdated += updatedReferencesInFile;
  }
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
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "ENOENT") return null;
    }

    throw error;
  }
}

function getAvifPath(sourcePath) {
  const extension = path.extname(sourcePath);

  return `${sourcePath.slice(0, -extension.length)}.avif`;
}

function toPublicUrl(filePath) {
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
