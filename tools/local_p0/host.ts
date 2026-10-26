import { compileRelease } from "../compiler/src/release.ts";
import { LocalOidc, loadKeys } from "./oidc.ts";
import { themes } from "../compiler/src/themes.ts";
import { systemTexts } from "../compiler/src/l10n.ts";
import { expandBlocks, blockCatalog } from "../compiler/src/blocks.ts";
import { syntheticOnly } from "./guard.ts";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import { compile, root } from "../compiler/src/build.ts";
import { checkedFile, startServer } from "../compiler/src/server.ts";
import { canonicalJson } from "../../packages/contracts/src/jcs.ts";
import { loadDefinition } from "../../packages/form-engine/src/definition.ts";
import { projectPreview } from "../../packages/form-engine/src/preview.ts";
const exec = promisify(execFile);
const ADMIN = "http://localhost:4174",
  PREVIEW = "http://127.0.0.1:4175";
interface Reply {
  status: number;
  body: Record<string, unknown>;
}
async function rpc(op: string, body: unknown = {}, token = "", csrf = ""): Promise<Reply> {
  const child = exec("uv", ["run", "--locked", "--offline", "python", "-m", "tools.local_p0.rpc"], {
    cwd: root,
    env: { ...process.env, FB_OIDC_REQUIRED: "1" },
    timeout: 15000,
    maxBuffer: 4 * 1024 * 1024,
  });
  child.child.stdin?.end(JSON.stringify({ op, body, token, csrf }));
  return JSON.parse((await child).stdout) as Reply;
}
const sha = (value: unknown) => createHash("sha256").update(canonicalJson(value)).digest("hex");
async function body(req: IncomingMessage): Promise<Record<string, unknown>> {
  const parts: Buffer[] = [];
  let size = 0;
  for await (const p of req) {
    const part = Buffer.from(p as Uint8Array);
    size += part.length;
    if (size > 2_000_000) throw Error("DEFINITION_TOO_LARGE");
    parts.push(part);
  }
  return JSON.parse(Buffer.concat(parts).toString() || "{}") as Record<string, unknown>;
}
function send(res: ServerResponse, status: number, value: unknown) {
  res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  return res.end(JSON.stringify(value));
}
function headers(res: ServerResponse, preview = false) {
  res.setHeader(
    "Content-Security-Policy",
    `default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; ${preview ? `frame-ancestors ${ADMIN}` : `frame-src ${PREVIEW}; frame-ancestors 'none'`}`,
  );
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  res.setHeader("Cache-Control", "no-store");
}
const allowed = new Set([
  "contract",
  "translate",
  "review.get",
  "list",
  "get",
  "save",
  "clone",
  "delete",
  "review",
  "approve",
  "publication.get",
  "publication.cancel",
  "policy.ledger",
  "deployment.get",
  "deployment.change",
  "hold.get",
  "hold.change",
  "reject",
  "recheck",
  "history",
  "rollback",
  "policy.get",
  "policy.change",
  "policy.repair",
  "logout",
  "preview",
  "preview.status",
  "validate",
  "publish",
]);
async function admin(req: IncomingMessage, res: ServerResponse) {
  headers(res);
  if (req.headers.host !== "localhost:4174") return send(res, 403, { code: "HOST" });
  const path = new URL(req.url ?? "/", ADMIN).pathname;
  const token =
    /(?:^|; )__Host-session=([a-zA-Z0-9_-]+)/u.exec(req.headers.cookie ?? "")?.[1] ?? "";
  if (path === "/auth/callback" && req.method === "GET") {
    const stateCookie =
      /(?:^|; )__Host-oidc-state=([a-zA-Z0-9_-]+)/u.exec(req.headers.cookie ?? "")?.[1] ?? "";
    try {
      const result = await oidc.callback(new URL(req.url ?? "/", ADMIN), stateCookie);
      res.setHeader("Set-Cookie", [
        `__Host-session=${result.token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`,
        "__Host-oidc-state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0",
      ]);
      const target = new URL(result.target, ADMIN);
      target.searchParams.set("login", "complete");
      res.writeHead(303, { Location: target.pathname + target.search });
      res.end();
      return;
    } catch {
      res.setHeader(
        "Set-Cookie",
        "__Host-oidc-state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0",
      );
      return send(res, 401, { code: "OIDC_CALLBACK_REJECTED" });
    }
  }
  if (path === "/api/session" && req.method === "GET") {
    const r = await rpc("session", {}, token);
    return send(res, r.status, r.body);
  }
  if (path === "/api/schema" && req.method === "GET") {
    const r = await rpc("session", {}, token);
    return send(
      res,
      r.status,
      r.status === 200
        ? JSON.parse(
            readFileSync(join(root, "contracts/schemas/form-definition/v1.schema.json"), "utf8"),
          )
        : r.body,
    );
  }
  if (path === "/api/catalog" && req.method === "GET") {
    const r = await rpc("catalog", {}, token);
    if (r.status !== 200) return send(res, r.status, r.body);
    const statuses = r.body.statuses as {
      pin: string;
      digest: string;
      state: string;
      version: number;
    }[];
    return send(res, 200, {
      themes,
      texts: systemTexts,
      blocks: blockCatalog().map((b) => {
        const state = statuses.find((s) => s.pin === b.pin && s.digest === b.digest);
        return { ...b, state: state?.state ?? "unknown", version: state?.version ?? 0 };
      }),
    });
  }
  if (path.startsWith("/api/") && req.method === "POST") {
    if (req.headers.origin !== ADMIN || req.headers["sec-fetch-site"] !== "same-origin")
      return send(res, 403, { code: "ORIGIN" });
    const b = await body(req);
    const op = path.slice(5);
    const csrf = String(req.headers["x-csrf-token"] ?? "");
    if (op === "login") {
      const result = await oidc.begin(b.user, token, b.target);
      res.setHeader(
        "Set-Cookie",
        `__Host-oidc-state=${result.state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=300`,
      );
      return send(res, 200, { authorizeUrl: result.authorizeUrl });
    }
    if (!allowed.has(op)) return send(res, 404, { code: "NOT_FOUND" });
    if (["preview", "validate", "review", "publish", "recheck"].includes(op)) {
      const draft = await rpc(
        op === "publish" || op === "recheck" || (op === "preview" && b.id) ? "review.get" : "get",
        b,
        token,
        csrf,
      );
      if (draft.status !== 200) return send(res, draft.status, draft.body);
      let previewOptions: import("../compiler/src/build.ts").PreviewOptions | undefined;
      let compileDefinition = draft.body.definition;
      if (op === "preview" && !b.id) {
        const policy = await rpc("preview.policy", b, token, csrf);
        if (policy.status !== 200) return send(res, policy.status, policy.body);
        const projected = projectPreview(
          draft.body
            .definition as import("../../packages/contracts/src/generated/form-definition.v1.ts").FormDefinitionV1,
          policy.body.blocked === true,
        );
        if (projected.stops.length || projected.blockedFields.length) {
          compileDefinition = projected.definition;
          previewOptions = {
            sourceDigest: sha(draft.body.definition),
            stops: projected.stops,
            blockedFields: projected.blockedFields,
            diagnostics: projected.diagnostics,
          };
        }
      }
      try {
        loadDefinition(expandBlocks(compileDefinition).definition);
      } catch (e) {
        return send(res, 422, {
          code: "DEFINITION_INVALID",
          diagnostics: [e instanceof Error ? e.message : "E-DEFINITION"],
        });
      }
      if (op === "validate") return send(res, 200, { diagnostics: [] });
      if (op === "review" && draft.body.version !== b.version)
        return send(res, 409, { code: "VERSION_CONFLICT" });
      // Verify permission before spending build resources, then recheck scope/CAS at commit.
      const permission = await rpc("session", {}, token);
      const sites = permission.body.sites as { id: string; roles: string[] }[] | undefined;
      const wanted =
        op === "publish" ? "publisher" : b.id || op === "recheck" ? "reviewer" : "editor";
      const site = op === "publish" || op === "recheck" || b.id ? draft.body.site : b.site;
      if (!sites?.some((s) => s.id === site && s.roles.includes(wanted)))
        return send(res, 403, { code: "FORBIDDEN" });
      let operation: Record<string, unknown> | undefined;
      if (op === "publish") {
        const started = await rpc("publication.begin", { id: b.id }, token, csrf);
        if (started.status !== 200) return send(res, started.status, started.body);
        operation = started.body;
        if (operation.state === "ACTIVATED")
          return send(res, 200, {
            ...operation,
            url: `http://127.0.0.1:4173/r/${String(operation.candidateId)}/index.html`,
          });
      }
      try {
        const c =
          op === "publish"
            ? await compileRelease(compileDefinition, join(root, "var/s2-candidates"))
            : await compile(compileDefinition, join(root, "var/s2-candidates"), previewOptions);
        if (operation) {
          const built = await rpc(
            "publication.built",
            { operation: operation.id, fence: operation.fence, candidateId: c.candidateId },
            token,
            csrf,
          );
          if (built.status !== 200) {
            await rpc(
              "publication.fail",
              {
                operation: operation.id,
                fence: operation.fence,
                code: typeof built.body.code === "string" ? built.body.code : "BUILD_FAILED",
              },
              token,
              csrf,
            );
            return send(res, built.status, built.body);
          }
          operation = built.body;
        }
        const r = await rpc(
          op === "publish"
            ? "activate"
            : op === "review"
              ? "review"
              : op === "recheck"
                ? "recheck"
                : "preview.register",
          {
            ...b,
            partial: !!previewOptions,
            version: draft.body.version,
            candidateId: c.candidateId,
            snapshotHash: sha(draft.body.definition),
            ...(operation ? { operation: operation.id, fence: operation.fence } : {}),
          },
          token,
          csrf,
        );
        if (operation && r.status !== 200)
          await rpc(
            "publication.fail",
            {
              operation: operation.id,
              fence: operation.fence,
              code: typeof r.body.code === "string" ? r.body.code : "VERIFICATION_FAILED",
            },
            token,
            csrf,
          );
        return send(res, r.status, {
          ...r.body,
          ...(previewOptions ? { diagnostics: previewOptions.diagnostics, mode: "partial" } : {}),
          ...(r.status === 200 && op === "publish"
            ? { url: `http://127.0.0.1:4173/r/${c.candidateId}/index.html` }
            : {}),
        });
      } catch (e) {
        if (operation)
          await rpc(
            "publication.fail",
            { operation: operation.id, fence: operation.fence, code: "BUILD_FAILED" },
            token,
            csrf,
          );
        return send(res, 422, {
          code: "BUILD_FAILED",
          diagnostics: [e instanceof Error ? e.message : "E-BUILD"],
        });
      }
    }
    const r = await rpc(op, b, token, csrf);
    if (op === "logout" && r.status === 200) {
      res.setHeader(
        "Set-Cookie",
        "__Host-session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0",
      );
      await oidc.endSession();
    }
    return send(res, r.status, r.body);
  }
  const file = path === "/" ? "index.html" : path.slice(1);
  if (req.method !== "GET" || !["index.html", "admin.js", "i18n.js", "style.css"].includes(file))
    return send(res, 404, { code: "NOT_FOUND" });
  res.setHeader(
    "Content-Type",
    file.endsWith("js")
      ? "text/javascript"
      : file.endsWith("css")
        ? "text/css"
        : "text/html; charset=utf-8",
  );
  res.end(readFileSync(join(root, "tools/local_p0/web", file)));
}
async function preview(req: IncomingMessage, res: ServerResponse) {
  headers(res, true);
  if (req.headers.host !== "127.0.0.1:4175") return send(res, 403, { code: "HOST" });
  const path = new URL(req.url ?? "/", PREVIEW).pathname;
  if (req.method === "GET" && ["/", "/preview.js"].includes(path)) {
    res.setHeader("Content-Type", path === "/" ? "text/html; charset=utf-8" : "text/javascript");
    return res.end(
      path === "/"
        ? '<!doctype html><html lang="ja"><head><meta charset="utf-8"><title>Isolated synthetic preview</title></head><body><main id="app">プレビュー接続中…</main><script type="module" src="/preview.js"></script></body></html>'
        : readFileSync(join(root, "tools/local_p0/web/preview.js")),
    );
  }
  const token = String(req.headers["x-preview-session"] ?? "");
  const asset = /^\/r\/(dev_[a-z2-7]{26})\/(assets\/[a-z0-9.-]+\.(?:js|css))$/u.exec(path);
  if (asset?.[1] && asset[2] && req.method === "GET") {
    res.setHeader("Content-Type", asset[2].endsWith("js") ? "text/javascript" : "text/css");
    return res.end(checkedFile(asset[1], asset[2]));
  }
  if (req.headers.origin && req.headers.origin !== PREVIEW)
    return send(res, 403, { code: "ORIGIN" });
  if (req.headers["sec-fetch-site"] !== "same-origin") return send(res, 403, { code: "ORIGIN" });
  const auth = await rpc("preview.check", {}, token);
  if (auth.status !== 200) return send(res, auth.status, auth.body);
  const id = String(auth.body.candidateId);
  if (path === "/api/preview/bootstrap" && req.method === "GET") {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end(checkedFile(id, "index.html"));
  }
  if (path.startsWith(`/r/${id}/assets/`) && path.endsWith(".json") && req.method === "GET") {
    res.setHeader("Content-Type", "application/json");
    return res.end(checkedFile(id, path.slice(`/r/${id}/`.length)));
  }
  const action =
    path === `/r/${id}/api/store-list` && req.method === "GET"
      ? "store-list"
      : path === `/r/${id}/api/submit` && req.method === "POST"
        ? "submit"
        : null;
  if (!action) return send(res, 404, { code: "NOT_FOUND" });
  if (action === "submit" && auth.body.partial === true)
    return send(res, 403, { code: "PREVIEW_ONLY" });
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
      join(root, "var/s2-candidates/r", id),
      "--action",
      action,
    ],
    { cwd: root, timeout: 5000 },
  );
  child.child.stdin?.end(JSON.stringify(action === "submit" ? await body(req) : {}));
  const result = JSON.parse((await child).stdout) as { ok?: boolean };
  send(res, result.ok === false ? 422 : 200, result);
}
function serve(
  port: number,
  host: string,
  handler: (req: IncomingMessage, res: ServerResponse) => Promise<unknown>,
) {
  createServer((req, res) => {
    void handler(req, res).catch(() => {
      if (!res.headersSent) send(res, 503, { code: "SERVICE_UNAVAILABLE" });
      else res.end();
    });
  }).listen(port, host, () => {
    console.log(`Local synthetic host ${host}:${String(port)}`);
  });
}
syntheticOnly();
if (process.env.FB_NETWORK_SANDBOX !== "required") throw Error("E-USE-GUARDED-LAUNCHER");
const oidc = new LocalOidc(loadKeys(join(root, "var/s2-publication/auth")), rpc);
oidc.provider();
serve(4174, "localhost", admin);
serve(4175, "127.0.0.1", preview);
startServer({ publishedOnly: true });
setInterval(() => {
  void rpc("worker").catch(() => undefined);
}, 1000).unref();
