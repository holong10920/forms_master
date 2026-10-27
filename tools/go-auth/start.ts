import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../../", import.meta.url));
const cwd = join(root, "tools/go-auth");
const bin = join(root, "var/go-auth");
const ports = [4180, 4181, 4182, 4183, 4185];
for (const port of ports)
  await new Promise<void>((resolve, reject) => {
    const s = createServer();
    s.once("error", () => {
      reject(
        Error(
          "Port " +
            String(port) +
            " is busy; stop the owning local service before starting Form Master.",
        ),
      );
    });
    s.listen(port, "localhost", () =>
      s.close(() => {
        resolve();
      }),
    );
  });
// Also check IPv4 listeners: macOS localhost may resolve only to ::1.
for (const port of ports)
  await new Promise<void>((resolve, reject) => {
    const s = createServer();
    s.once("error", () => {
      reject(Error("IPv4 port " + String(port) + " is busy."));
    });
    s.listen(port, "127.0.0.1", () =>
      s.close(() => {
        resolve();
      }),
    );
  });
if (process.platform !== "darwin" || !existsSync("/usr/bin/sandbox-exec"))
  throw Error("Verified local kernel network sandbox required; no bypass.");
mkdirSync(bin, { recursive: true, mode: 0o700 });
const build = (args: string[]) => {
  const r = spawnSync(join(cwd, "go-local.sh"), args, { cwd, stdio: "inherit" });
  if (r.status !== 0) throw Error("Go preparation failed");
};
build(["build", "-o", join(bin, "engine-oracle"), "./cmd/engine-oracle"]);
build(["build", "-o", join(bin, "master-api"), "./cmd/api"]);
build(["build", "-o", join(bin, "local-idp"), "./cmd/local-idp"]);
if (!existsSync(join(root, "var/master/active.sqlite3"))) build(["run", "./cmd/migrate"]);
const generated = spawnSync(process.execPath, [join(cwd, "generate-studio.ts")], {
  cwd: root,
  stdio: "inherit",
});
if (generated.status !== 0) throw Error("Studio preparation failed");
const env = {
  PATH: process.env.PATH ?? "",
  HOME: process.env.HOME ?? "",
  TMPDIR: process.env.TMPDIR ?? "/tmp",
  LANG: "en_US.UTF-8",
  FM_LOCAL_HTTP: "1",
  FM_MASTER: "1",
  FM_DATABASE: join(bin, "auth.sqlite3"),
  FM_MASTER_DATA: join(root, "var/master"),
  FB_DATA_MODE: "synthetic",
};
const children: ChildProcess[] = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.pid)
      try {
        process.kill(-child.pid, "SIGTERM");
      } catch {
        /* already exited */
      }
  }
  setTimeout(() => {
    for (const child of children) {
      if (child.pid)
        try {
          process.kill(-child.pid, "SIGKILL");
        } catch {
          /* already exited */
        }
    }
    process.exit(code);
  }, 2000).unref();
}
process.on("SIGINT", () => {
  stop();
});
process.on("SIGTERM", () => {
  stop();
});
function launch(command: string, args: string[], directory: string) {
  const child = spawn("/usr/bin/sandbox-exec", ["-f", join(cwd, "network.sb"), command, ...args], {
    cwd: directory,
    env,
    stdio: "inherit",
    detached: true,
  });
  children.push(child);
  child.once("error", () => {
    console.error("Local service could not start");
    stop(1);
  });
  child.once("exit", (code) => {
    if (!stopping) {
      console.error("Local service exited:", code);
      stop(1);
    }
  });
}
async function health(url: string, expected: number) {
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(1000), redirect: "manual" });
      if (r.status === expected) return;
    } catch {
      /* not ready */
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw Error("Health check failed: " + url);
}
try {
  launch(join(bin, "local-idp"), [], cwd);
  await health("http://127.0.0.1:4182/.well-known/openid-configuration", 200);
  launch(join(bin, "master-api"), [], cwd);
  launch(
    process.execPath,
    [
      join(cwd, "web/node_modules/vite/bin/vite.js"),
      "--host",
      "localhost",
      "--port",
      "4180",
      "--strictPort",
    ],
    join(cwd, "web"),
  );
  await health("http://localhost:4180/healthz", 200);
  await health("http://localhost:4180/api/v1/auth/me", 401);
  await health("http://127.0.0.1:4185/", 200);
  await health("http://127.0.0.1:4183/", 404);
  console.log(
    "\nForm Master ready: http://localhost:4180/\nGo API/BFF: 127.0.0.1:4181\nSynthetic OIDC: 127.0.0.1:4182\nCustomer: http://127.0.0.1:4183/\nIsolated Preview: http://127.0.0.1:4185/\nBusiness backend + mock worker: Go. Ctrl+C stops owned services.",
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : "Local startup failed");
  stop(1);
}
