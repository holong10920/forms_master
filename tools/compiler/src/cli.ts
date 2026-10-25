import { readFileSync, realpathSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { resolve, join } from "node:path";
import { compile, root } from "./build.ts";
const [command, ...args] = process.argv.slice(2);
const output = resolve(root, "var/s2-candidates");
if (command === "build") {
  if (args.length) throw new Error("usage: compiler build");
  const result = await compile(
    JSON.parse(
      readFileSync(join(root, "contracts/fixtures/engine/sports.json"), "utf8"),
    ) as unknown,
    output,
  );
  console.log(
    JSON.stringify(
      {
        candidateId: result.candidateId,
        path: result.directory,
        url: `http://127.0.0.1:4173${result.urlPath}`,
        builderVerification: "VERIFICATION_PENDING",
        chunks: result.chunks.length,
        motionModules: result.chunks.flatMap((c) => c.modules).filter((m) => /motion/iu.test(m.id))
          .length,
      },
      null,
      2,
    ),
  );
} else if (command === "serve") {
  if (args.length) throw new Error("usage: compiler serve");
  const server = createServer((req, res) => {
    const csp =
      "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
    res.setHeader("Content-Security-Policy", csp);
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405);
      res.end();
      return;
    }
    try {
      const path = decodeURIComponent(new URL(req.url ?? "/", "http://127.0.0.1").pathname);
      if (!/^\/r\/dev_[a-z2-7]{26}\/(index\.html|assets\/[a-z0-9.-]+\.(js|css|json))$/u.test(path))
        throw new Error("route");
      const file = realpathSync(join(output, path));
      if (!file.startsWith(realpathSync(join(output, "r")) + "/") || !statSync(file).isFile())
        throw new Error("path");
      const type = file.endsWith(".html")
        ? "text/html; charset=utf-8"
        : file.endsWith(".js")
          ? "text/javascript"
          : file.endsWith(".css")
            ? "text/css"
            : "application/json";
      res.setHeader("Content-Type", type);
      res.setHeader("Cache-Control", "public,max-age=31536000,immutable");
      res.writeHead(200);
      res.end(req.method === "HEAD" ? undefined : readFileSync(file));
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });
  server.listen(4173, "127.0.0.1", () => {
    console.log(
      "Synthetic candidate server: http://127.0.0.1:4173 (immutable /r/dev_.../index.html URLs only)",
    );
  });
} else throw new Error("usage: compiler build | serve");
