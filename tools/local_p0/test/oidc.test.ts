import { mkdtempSync, rmSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, test } from "vitest";
import {
  challenge,
  encryptTokens,
  issueToken,
  loadKeys,
  LocalOidc,
  validateToken,
} from "../oidc.ts";
const dirs: string[] = [];
function keys() {
  const dir = mkdtempSync(join(tmpdir(), "fb-oidc-"));
  dirs.push(dir);
  return { dir, keys: loadKeys(dir) };
}
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});
test("S256 follows the PKCE vector and signing keys persist with restrictive permissions", () => {
  expect(challenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).toBe(
    "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
  );
  const k = keys();
  expect(loadKeys(k.dir).publicKey).toBe(k.keys.publicKey);
  chmodSync(join(k.dir, "oidc-keys.json"), 0o644);
  expect(() => loadKeys(k.dir)).toThrow("OIDC_KEY_PERMISSIONS");
});
test("ID token signature, exact nonce and expiry are mandatory; envelopes expose no token", () => {
  const a = keys().keys,
    b = keys().keys,
    token = issueToken(a, "synthetic-editor", "synthetic-nonce", 100);
  expect(validateToken(a, token, "synthetic-nonce", 110)).toBe("synthetic-editor");
  expect(() => validateToken(b, token, "synthetic-nonce", 110)).toThrow("OIDC_SIGNATURE");
  expect(() => validateToken(a, token, "wrong", 110)).toThrow("OIDC_CLAIMS");
  expect(() => validateToken(a, token, "synthetic-nonce", 400)).toThrow("OIDC_CLAIMS");
  expect(() => validateToken(a, token.replace(/.$/u, "!"), "synthetic-nonce", 110)).toThrow();
  const envelope = encryptTokens(a, "synthetic-editor", { id_token: token });
  expect(envelope).not.toContain(token);
  expect(encryptTokens(a, "synthetic-editor", { id_token: token })).not.toBe(envelope);
});
test("BFF fixes issuer/client/redirect, requires cookie-bound state and rejects arbitrary return URLs", async () => {
  const store: unknown[] = [];
  const a = new LocalOidc(keys().keys, (_op, body) => {
    store.push(body);
    return Promise.resolve({ status: 200, body: {} });
  });
  const start = await a.begin("synthetic-editor", "", "https://evil.invalid/");
  const url = new URL(start.authorizeUrl);
  expect(url.origin).toBe("http://127.0.0.1:4176");
  expect(url.searchParams.get("redirect_uri")).toBe("http://localhost:4174/auth/callback");
  expect(url.searchParams.get("code_challenge_method")).toBe("S256");
  expect(store[0]).toMatchObject({ target: "/" });
  await expect(
    a.callback(
      new URL("http://localhost:4174/auth/callback?state=" + start.state + "&code=synthetic"),
      "different-cookie",
    ),
  ).rejects.toThrow("OIDC_STATE");
});
