import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";

const serverStatePath = path.join(
  process.cwd(),
  ".tmp",
  "playwright-web-server.json",
);

export default async function globalTeardown() {
  if (!existsSync(serverStatePath)) return;

  const state = readServerState();

  try {
    if (state?.pid) {
      await stopProcessTree(state.pid);
    }
  } finally {
    rmSync(serverStatePath, { force: true });
  }
}

function readServerState() {
  try {
    const parsed = JSON.parse(readFileSync(serverStatePath, "utf8")) as {
      pid?: unknown;
    };

    return typeof parsed.pid === "number" ? { pid: parsed.pid } : null;
  } catch {
    return null;
  }
}

async function stopProcessTree(pid: number) {
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(pid), "/t", "/f"], {
      shell: false,
      stdio: "ignore",
      windowsHide: true,
    });
    return;
  }

  try {
    process.kill(-pid, "SIGTERM");
  } catch {
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, 1_000));

  try {
    process.kill(-pid, "SIGKILL");
  } catch {
    // Process already exited.
  }
}
