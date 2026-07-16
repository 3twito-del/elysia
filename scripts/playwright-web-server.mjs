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
  // --webpack: matches scripts/build.mjs's real production build. Turbopack
  // (this Next.js version's default) has a known nonce-propagation bug for
  // dynamically-loaded script/RSC chunks (vercel/next.js#64037,
  // docs/QA_EVIDENCE.md -> g-11-turbopack-csp-nonce-incident) that this
  // script was silently exempt from fixing -- e2e was building its own
  // server with `next build` directly, bypassing build.mjs's --webpack
  // fix entirely, so e2e has been validating a different, buggier bundler
  // than what's actually deployed. Found via a real, reproducible failure:
  // any Server Action + revalidatePath round trip on /admin/crm (a heavy
  // page needing many client chunks) aborted client-side after the server
  // had already committed the mutation -- silent under Turbopack, gone
  // under webpack.
  await runNextCommand(["build", "--webpack"]);

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
