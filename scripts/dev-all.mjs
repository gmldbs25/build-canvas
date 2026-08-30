import { spawn } from "node:child_process";
import process from "node:process";

const build = spawn("bash", ["scripts/build-pages.sh"], {
  stdio: "inherit",
  env: process.env,
});

const stop = (signal) => {
  if (!build.killed) build.kill(signal);
};

process.on("SIGINT", () => stop("SIGINT"));
process.on("SIGTERM", () => stop("SIGTERM"));

build.on("exit", (code, signal) => {
  if (signal || code !== 0) {
    process.exitCode = code ?? 1;
    return;
  }

  const server = spawn(process.execPath, ["scripts/serve-pages.mjs", ...process.argv.slice(2)], {
    stdio: "inherit",
    env: process.env,
  });

  const forward = (signalName) => {
    if (!server.killed) server.kill(signalName);
  };
  process.on("SIGINT", () => forward("SIGINT"));
  process.on("SIGTERM", () => forward("SIGTERM"));
  server.on("exit", (serverCode, serverSignal) => {
    process.exitCode = serverCode ?? (serverSignal ? 1 : 0);
  });
});
