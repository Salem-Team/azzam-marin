#!/usr/bin/env node
/**
 * Persistent local server: next build + next start, rebuild on src/public save.
 * Writes public/dev-build.json so DevAutoReload refreshes the browser automatically.
 */
import { execSync, spawn } from "node:child_process";
import { existsSync, watch, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const host = process.env.HOST || "127.0.0.1";
const port = process.env.PORT || "3456";
const env = { ...process.env, AZZAM_LIVE: "1" };

let server = null;
let building = false;
let queued = false;
let debounce = null;

function log(msg) {
  console.log(`[live] ${msg}`);
}

function writeBuildStamp() {
  const stamp = { t: Date.now() };
  const out = path.join(root, "public", "dev-build.json");
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(stamp)}\n`);
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: root, stdio: "inherit", env });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} → ${code ?? signal}`));
    });
  });
}

function stopServer() {
  if (!server) return;
  const child = server;
  server = null;
  try {
    child.kill("SIGTERM");
  } catch {
    /* ignore */
  }
  setTimeout(() => {
    try {
      child.kill("SIGKILL");
    } catch {
      /* ignore */
    }
  }, 2000);
}

function freePort() {
  try {
    execSync(`lsof -tiTCP:${port} -sTCP:LISTEN | xargs kill -9 2>/dev/null || true`, {
      stdio: "ignore",
    });
  } catch {
    /* ignore */
  }
}

function startServer() {
  stopServer();
  freePort();
  writeBuildStamp();
  log(`serving http://${host}:${port}`);
  const nextBin = path.join(root, "node_modules/next/dist/bin/next");
  const child = spawn(
    process.execPath,
    [nextBin, "start", "--hostname", host, "--port", String(port)],
    { cwd: root, stdio: "inherit", env },
  );
  server = child;
  child.on("exit", (code, signal) => {
    if (server === child) server = null;
    if (building) return;
    log(`server stopped (${signal || code}) — restarting in 1s`);
    setTimeout(() => {
      if (!building && !server) startServer();
    }, 1000);
  });
}

async function rebuild(reason) {
  if (building) {
    queued = true;
    return;
  }
  building = true;
  queued = false;
  try {
    log(`build (${reason})…`);
    stopServer();
    await run("npm", ["run", "build"]);
    startServer();
    log("ready — browser will auto-refresh");
  } catch (err) {
    log(String(err?.message || err));
    log("will retry on next save");
    // Keep prior build online if possible
    if (!server) startServer();
  } finally {
    building = false;
    if (queued) void rebuild("queued");
  }
}

function onFileChange(file) {
  if (!file) return;
  const name = String(file);
  if (name.includes(".DS_Store") || name.endsWith(".map")) return;
  if (name.includes("dev-build.json")) return;
  clearTimeout(debounce);
  debounce = setTimeout(() => void rebuild(name), 700);
}

for (const dir of ["src", "public"]) {
  try {
    watch(path.join(root, dir), { recursive: true }, (_e, file) =>
      onFileChange(file),
    );
    log(`watching ${dir}/`);
  } catch (err) {
    log(`watch skip ${dir}: ${err?.message || err}`);
  }
}

process.on("SIGINT", () => {
  stopServer();
  process.exit(0);
});
process.on("SIGTERM", () => {
  stopServer();
  process.exit(0);
});

if (existsSync(path.join(root, ".next", "BUILD_ID"))) {
  startServer();
  log("watching for changes…");
} else {
  await rebuild("startup");
}
setInterval(() => {}, 60_000);
