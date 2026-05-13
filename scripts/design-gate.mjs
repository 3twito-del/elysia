import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const configPath = path.join(root, "docs", "qa", "design-gate.json");

function readConfig() {
  if (!existsSync(configPath)) {
    throw new Error("Missing docs/qa/design-gate.json.");
  }

  return JSON.parse(readFileSync(configPath, "utf8"));
}

function globToRegExp(glob) {
  let pattern = "";

  for (let index = 0; index < glob.length; index += 1) {
    const char = glob[index];
    const next = glob[index + 1];

    if (char === "*" && next === "*") {
      pattern += ".*";
      index += 1;
      continue;
    }

    if (char === "*") {
      pattern += "[^/]*";
      continue;
    }

    pattern += char.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
  }

  return new RegExp(`^${pattern}$`);
}

function matchesAny(filePath, globs) {
  return globs.some((glob) => globToRegExp(glob).test(filePath));
}

function getChangedPaths() {
  const output = execFileSync("git", ["status", "--porcelain=v1", "-uall"], {
    cwd: root,
    encoding: "utf8",
  });

  return output
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map((line) => {
      const rawPath = line.slice(3);
      const renamedPath = rawPath.includes(" -> ")
        ? rawPath.split(" -> ").at(-1)
        : rawPath;

      return renamedPath.replaceAll("\\", "/");
    });
}

function main() {
  const config = readConfig();

  if (!config.active) {
    console.log("Design gate inactive.");
    return;
  }

  const changedPaths = getChangedPaths();
  const allowedGlobs = config.allowedPathGlobs ?? [];
  const blockedGlobs = config.blockedPathGlobs ?? [];
  const blocked = changedPaths.filter((filePath) => {
    const explicitlyBlocked = matchesAny(filePath, blockedGlobs);
    const explicitlyAllowed = matchesAny(filePath, allowedGlobs);

    return explicitlyBlocked || !explicitlyAllowed;
  });

  if (blocked.length > 0) {
    console.error("Design gate active: non-design changes are blocked.");
    console.error(`Status file: ${config.statusFile}`);
    console.error("Blocked changed paths:");
    for (const filePath of blocked) {
      console.error(`- ${filePath}`);
    }
    process.exit(1);
  }

  console.log(
    `Design gate active: ${changedPaths.length} changed path(s) are within the approved design scope.`,
  );
}

main();
