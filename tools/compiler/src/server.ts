import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";
import { root, candidateIdFor, type Candidate } from "./build.ts";
import { publication } from "./publish.ts";
const exec = promisify(execFile);
const candidateRoot = join(root, "var/s2-candidates"),
  publishedRoot = join(root, "var/s2-publication/objects/releases");
const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
export function findCandidate(id: string, publishedOnly = false): string {
  if (!/^dev_[a-z2-7]{26}$/u.test(id)) throw new Error("E-PATH");
  if (publishedOnly && !existsSync(join(publishedRoot, id))) throw new Error("E-NOT-PUBLISHED");
  return existsSync(join(publishedRoot, id))
    ? join(publishedRoot, id)
    : join(candidateRoot, "r", id);
}
export function checkedFile(id: string, path: string, publishedOnly = false): Buffer {
  const dir = findCandidate(id, publishedOnly);
  const metadata = existsSync(join(dir, "_private"))
    ? join(dir, "_private")
    : join(candidateRoot, "private", id);
  const manifest = JSON.parse(
    readFileSync(join(metadata, "candidate-manifest.json"), "utf8"),
  ) as Candidate["manifest"];
  if (candidateIdFor(manifest) !== id) throw new Error("E-MANIFEST-INTEGRITY");
  const file = realpathSync(join(dir, path));
  if (!file.startsWith(realpathSync(dir) + "/") || !statSync(file).isFile())
    throw new Error("E-PATH");
  const raw = readFileSync(file);
  if (path === "index.html") {
    if (existsSync(join(metadata, "local-integrity.json"))) {
      const seal = JSON.parse(readFileSync(join(metadata, "local-integrity.json"), "utf8")) as {
        indexHtmlDigest: string;
      };
      if (hash(raw) !== seal.indexHtmlDigest) throw new Error("E-INDEX-INTEGRITY");
    }
  } else if (manifest.inventory.find((a) => a.path === path)?.sha256 !== `sha256:${hash(raw)}`)
    throw new Error("E-ASSET-INTEGRITY");
  return raw;
}
export function startServer(options: { publishedOnly?: boolean } = {}) {
  const handler = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    let path: string;
    try {
      path = decodeURIComponent(new URL(req.url ?? "/", "http://127.0.0.1").pathname);
    } catch {
      res.writeHead(404);
      res.end();
      return;
    }
    const active = /^\/forms\/(site_[a-z0-9_]+)\/(frm_[a-z0-9_]+)\/$/u.exec(path);
    if (active && req.method === "GET") {
      try {
        const pointer = publication("active", { site: active[1], form: active[2] });
        if (!pointer.candidateId) throw new Error("missing");
        res.writeHead(302, {
          Location: `/r/${pointer.candidateId}/index.html`,
          "Cache-Control": "no-store",
        });
        res.end();
      } catch {
        res.writeHead(404);
        res.end();
      }
      return;
    }
    const api = /^\/r\/(dev_[a-z2-7]{26})\/api\/(store-list|submit)$/u.exec(path);
    if (api) {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Cache-Control", "no-store");
      if (
        (api[2] === "store-list" && req.method !== "GET") ||
        (api[2] === "submit" && req.method !== "POST")
      ) {
        res.writeHead(405);
        res.end("{}");
        return;
      }
      if (req.headers.origin && req.headers.origin !== "http://127.0.0.1:4173") {
        res.writeHead(403);
        res.end("{}");
        return;
      }
      try {
        let body = "";
        for await (const part of req) {
          body += String(part);
          if (Buffer.byteLength(body) > 65536) throw new Error("E-BODY-LIMIT");
        }
        const request = api[2] === "submit" ? (JSON.parse(body) as unknown) : {};
        const child = exec(
          "uv",
          [
            "run",
            "--locked",
            "--offline",
            "python",
            "-m",
            "tools.compiler.server_adapter",
            "--candidate",
            findCandidate(api[1] ?? "", options.publishedOnly),
            "--action",
            api[2] ?? "",
          ],
          { cwd: root, timeout: 3000, maxBuffer: 1024 * 1024 },
        );
        child.child.stdin?.end(JSON.stringify(request));
        const output = await child;
        const result = JSON.parse(output.stdout) as
          { ok?: boolean; httpStatus?: number } | unknown[];
        res.writeHead(
          !Array.isArray(result) && result.ok === false ? (result.httpStatus ?? 422) : 200,
        );
        res.end(output.stdout);
      } catch {
        res.writeHead(503);
        res.end(
          JSON.stringify({ ok: false, errors: [{ code: "E-VALIDATION-UNAVAILABLE", path: "" }] }),
        );
      }
      return;
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405);
      res.end();
      return;
    }
    try {
      const match =
        /^\/r\/(dev_[a-z2-7]{26})\/(index\.html|assets\/[a-z0-9.-]+\.(?:js|css|json))$/u.exec(path);
      if (!match?.[1] || !match[2]) throw new Error("path");
      const raw = checkedFile(match[1], match[2], options.publishedOnly);
      const type = path.endsWith(".html")
        ? "text/html; charset=utf-8"
        : path.endsWith(".js")
          ? "text/javascript"
          : path.endsWith(".css")
            ? "text/css"
            : "application/json";
      res.writeHead(200, {
        "Content-Type": type,
        "Cache-Control": "public,max-age=31536000,immutable",
      });
      res.end(req.method === "HEAD" ? undefined : raw);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  };
  const server = createServer((req, res) => {
    void handler(req, res).catch(() => {
      if (!res.headersSent) res.writeHead(500);
      res.end();
    });
  });
  server.listen(4173, "127.0.0.1", () => {
    console.log("Synthetic compiler server http://127.0.0.1:4173");
  });
  return server;
}
