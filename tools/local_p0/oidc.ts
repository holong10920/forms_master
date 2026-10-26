import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import {
  createHash,
  randomBytes,
  generateKeyPairSync,
  createPrivateKey,
  createPublicKey,
  sign,
  verify,
  timingSafeEqual,
  createCipheriv,
} from "node:crypto";
import {
  constants,
  openSync,
  readFileSync,
  writeFileSync,
  closeSync,
  fstatSync,
  mkdirSync,
} from "node:fs";
import { join } from "node:path";
const ADMIN = "http://localhost:4174",
  ISSUER = "http://127.0.0.1:4176",
  CLIENT = "local-p0-admin",
  REDIRECT = ADMIN + "/auth/callback";
const random = () => randomBytes(32).toString("base64url");
export const challenge = (verifier: string) =>
  createHash("sha256").update(verifier).digest("base64url");
const equal = (a: string, b: string) =>
  a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
interface Keys {
  privateKey: string;
  publicKey: string;
  clientSecret: string;
  encryption: string;
}
export function loadKeys(directory: string): Keys {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const file = join(directory, "oidc-keys.json");
  try {
    const fd = openSync(file, constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
      if ((fstatSync(fd).mode & 0o077) !== 0) throw Error("OIDC_KEY_PERMISSIONS");
      return JSON.parse(readFileSync(fd, "utf8")) as Keys;
    } finally {
      closeSync(fd);
    }
  } catch (e) {
    if (!(e instanceof Error && "code" in e && e.code === "ENOENT")) throw e;
    const pair = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
    const keys = { ...pair, clientSecret: random(), encryption: randomBytes(32).toString("hex") };
    writeFileSync(file, JSON.stringify(keys), { flag: "wx", mode: 0o600 });
    return keys;
  }
}
export function issueToken(
  keys: Keys,
  user: string,
  nonce: string,
  now = Math.floor(Date.now() / 1000),
) {
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ iss: ISSUER, aud: CLIENT, sub: user, nonce, iat: now, exp: now + 300 }),
  ).toString("base64url");
  const input = header + "." + payload;
  return (
    input +
    "." +
    sign("RSA-SHA256", Buffer.from(input), createPrivateKey(keys.privateKey)).toString("base64url")
  );
}
export function validateToken(
  keys: Keys,
  token: string,
  nonce: string,
  now = Math.floor(Date.now() / 1000),
): string {
  const parts = token.split(".");
  if (parts.length !== 3) throw Error("OIDC_TOKEN");
  const [h, p, s] = parts as [string, string, string];
  const header = JSON.parse(Buffer.from(h, "base64url").toString()) as {
    alg?: string;
    typ?: string;
  };
  if (
    header.alg !== "RS256" ||
    header.typ !== "JWT" ||
    !verify(
      "RSA-SHA256",
      Buffer.from(h + "." + p),
      createPublicKey(keys.publicKey),
      Buffer.from(s, "base64url"),
    )
  )
    throw Error("OIDC_SIGNATURE");
  const claims = JSON.parse(Buffer.from(p, "base64url").toString()) as {
    iss?: string;
    aud?: string;
    sub?: string;
    nonce?: string;
    iat?: number;
    exp?: number;
  };
  if (
    claims.iss !== ISSUER ||
    claims.aud !== CLIENT ||
    claims.nonce !== nonce ||
    !claims.sub ||
    typeof claims.exp !== "number" ||
    typeof claims.iat !== "number" ||
    !Number.isInteger(claims.exp) ||
    !Number.isInteger(claims.iat) ||
    claims.exp <= now ||
    claims.iat > now + 30 ||
    claims.exp - claims.iat > 300
  )
    throw Error("OIDC_CLAIMS");
  return claims.sub;
}
export function encryptTokens(keys: Keys, user: string, tokens: unknown): string {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", Buffer.from(keys.encryption, "hex"), iv);
  cipher.setAAD(Buffer.from(ISSUER + "|" + user));
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(tokens)), cipher.final()]);
  return JSON.stringify({
    v: 1,
    iv: iv.toString("base64url"),
    tag: cipher.getAuthTag().toString("base64url"),
    data: encrypted.toString("base64url"),
  });
}
type Rpc = (
  op: string,
  body?: unknown,
  token?: string,
  csrf?: string,
) => Promise<{ status: number; body: Record<string, unknown> }>;
export class LocalOidc {
  private keys: Keys;
  private rpc: Rpc;
  constructor(keys: Keys, rpc: Rpc) {
    this.keys = keys;
    this.rpc = rpc;
  }
  async call(op: string, body: unknown, token = "") {
    const r = await this.rpc(op, body, token);
    if (r.status !== 200) throw Error(typeof r.body.code === "string" ? r.body.code : "OIDC_STORE");
    return r.body;
  }
  async begin(user: unknown, token: string, target: unknown) {
    if (typeof user !== "string" || !/^synthetic-[a-z]+$/u.test(user)) throw Error("OIDC_SUBJECT");
    const state = random(),
      nonce = random(),
      verifier = random();
    const route =
      typeof target === "string" && /^\/?\?site=site_[a-z0-9_]+&form=frm_[a-z0-9_]+$/u.test(target)
        ? target
        : "/";
    await this.call("oidc.start", { state, nonce, verifier, target: route }, token);
    const url = new URL(ISSUER + "/authorize");
    for (const [k, v] of Object.entries({
      response_type: "code",
      client_id: CLIENT,
      redirect_uri: REDIRECT,
      scope: "openid",
      state,
      nonce,
      code_challenge: challenge(verifier),
      code_challenge_method: "S256",
      user,
    }))
      url.searchParams.set(k, v);
    return { state, authorizeUrl: url.href };
  }
  async callback(url: URL, cookie: string) {
    const state = url.searchParams.get("state") ?? "",
      code = url.searchParams.get("code") ?? "";
    if (!/^[a-zA-Z0-9_-]{43}$/u.test(state) || !equal(state, cookie) || !code)
      throw Error("OIDC_STATE");
    const stored = await this.call("oidc.state", { state });
    const response = await fetch(ISSUER + "/token", {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(8000),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " + Buffer.from(CLIENT + ":" + this.keys.clientSecret).toString("base64"),
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT,
        code_verifier: String(stored.verifier),
      }),
    });
    if (!response.ok) throw Error("OIDC_EXCHANGE");
    const tokens = (await response.json()) as { id_token: string };
    const user = validateToken(this.keys, tokens.id_token, String(stored.nonce));
    const session = await this.call(
      "oidc.complete",
      { user, envelope: encryptTokens(this.keys, user, tokens) },
      String(stored.previous),
    );
    return { token: String(session.token), target: String(stored.target) };
  }
  async endSession() {
    const response = await fetch(ISSUER + "/end-session", {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(8000),
      headers: {
        Authorization:
          "Basic " + Buffer.from(CLIENT + ":" + this.keys.clientSecret).toString("base64"),
      },
    });
    if (response.status !== 204) throw Error("OIDC_END_SESSION");
  }
  provider() {
    return createServer((req, res) => {
      void this.providerRequest(req, res).catch(() => {
        res.writeHead(400, { "Content-Type": "application/json", "Cache-Control": "no-store" });
        res.end('{"error":"invalid_request"}');
      });
    }).listen(4176, "127.0.0.1");
  }
  async providerRequest(req: IncomingMessage, res: ServerResponse) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
    if (req.headers.host !== "127.0.0.1:4176") throw Error("OIDC_HOST");
    const url = new URL(req.url ?? "/", ISSUER),
      q = url.searchParams;
    if (req.method === "GET" && url.pathname === "/authorize") {
      if (
        q.get("client_id") !== CLIENT ||
        q.get("redirect_uri") !== REDIRECT ||
        q.get("response_type") !== "code" ||
        q.get("scope") !== "openid" ||
        q.get("code_challenge_method") !== "S256" ||
        !["state", "nonce", "code_challenge"].every((k) =>
          /^[a-zA-Z0-9_-]{43}$/u.test(q.get(k) ?? ""),
        )
      )
        throw Error("OIDC_REQUEST");
      const result = await this.call("oidc.issue", {
        user: q.get("user"),
        nonce: q.get("nonce"),
        challenge: q.get("code_challenge"),
        redirect: REDIRECT,
      });
      const callback = new URL(REDIRECT);
      callback.searchParams.set("code", String(result.code));
      callback.searchParams.set("state", String(q.get("state")));
      res.writeHead(302, { Location: callback.href });
      res.end();
      return;
    }
    if (req.method === "POST" && url.pathname === "/end-session") {
      const expected =
        "Basic " + Buffer.from(CLIENT + ":" + this.keys.clientSecret).toString("base64");
      if (!equal(req.headers.authorization ?? "", expected)) throw Error("OIDC_CLIENT");
      res.writeHead(204);
      res.end();
      return;
    }
    if (req.method === "POST" && url.pathname === "/token") {
      const expected =
        "Basic " + Buffer.from(CLIENT + ":" + this.keys.clientSecret).toString("base64");
      if (!equal(req.headers.authorization ?? "", expected)) throw Error("OIDC_CLIENT");
      const parts: Buffer[] = [];
      let length = 0;
      for await (const p of req) {
        const part = Buffer.from(p as Uint8Array);
        length += part.length;
        if (length > 8192) throw Error("OIDC_BODY");
        parts.push(part);
      }
      const b = new URLSearchParams(Buffer.concat(parts).toString());
      if (
        b.get("grant_type") !== "authorization_code" ||
        b.get("redirect_uri") !== REDIRECT ||
        !/^[a-zA-Z0-9_-]{43}$/u.test(b.get("code_verifier") ?? "")
      )
        throw Error("OIDC_REQUEST");
      const result = await this.call("oidc.exchange", {
        code: b.get("code"),
        verifier: b.get("code_verifier"),
        redirect: REDIRECT,
      });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          id_token: issueToken(this.keys, String(result.user), String(result.nonce)),
          access_token: random(),
          token_type: "Bearer",
          expires_in: 300,
        }),
      );
      return;
    }
    res.writeHead(404);
    res.end();
  }
}
