import { spawn } from "node:child_process";
import path from "node:path";

const isWindows = process.platform === "win32";
const nextCli = path.join(
  process.cwd(),
  "node_modules",
  "next",
  "dist",
  "bin",
  "next",
);
const port = process.env.PORT ?? "3000";

let serverProcess;
let stopping = false;

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(signal, () => stopServer(signalExitCode(signal)));
}

try {
  await runNextCommand(["build"]);

  serverProcess = spawn(process.execPath, [nextCli, "start", "-p", port], {
    detached: !isWindows,
    env: process.env,
    shell: false,
    stdio: "inherit",
  });

  serverProcess.on("error", (error) => {
    console.error(error);
    process.exit(1);
  });

  serverProcess.on("exit", (code, signal) => {
    process.exit(code ?? signalExitCode(signal));
  });
} catch (error) {
  console.error(error);
  process.exit(1);
}

function runNextCommand(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [nextCli, ...args], {
      env: process.env,
      shell: false,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `next ${args.join(" ")} exited with ${describeExit(code, signal)}`,
        ),
      );
    });
  });
}

function stopServer(exitCode = 0) {
  if (stopping) return;

  stopping = true;

  if (!serverProcess?.pid) {
    process.exit(exitCode);
    return;
  }

  if (isWindows) {
    const killer = spawn(
      "taskkill",
      ["/pid", String(serverProcess.pid), "/t", "/f"],
      {
        shell: false,
        stdio: "ignore",
      },
    );

    killer.on("exit", () => process.exit(exitCode));
    killer.on("error", () => process.exit(exitCode));
    setTimeout(() => process.exit(exitCode), 3_000).unref();
    return;
  }

  try {
    process.kill(-serverProcess.pid, "SIGTERM");
  } catch {
    serverProcess.kill("SIGTERM");
  }

  setTimeout(() => process.exit(exitCode), 3_000).unref();
}

function signalExitCode(signal) {
  if (signal === "SIGINT") return 130;
  if (signal === "SIGTERM") return 143;
  if (signal === "SIGHUP") return 129;

  return signal ? 1 : 0;
}

function describeExit(code, signal) {
  if (code !== null && code !== undefined) return `code ${code}`;
  if (signal) return `signal ${signal}`;

  return "unknown status";
}
