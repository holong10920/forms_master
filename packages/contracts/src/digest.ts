import { canonicalJsonBytes } from "./jcs.ts";

const SHA256_HEX = /^[0-9a-f]{64}$/;

/** Lowercase hex SHA-256. Uses WebCrypto so the package stays browser-safe (no `node:crypto`). */
export async function sha256Hex(data: Uint8Array<ArrayBuffer>): Promise<string> {
  const digest = new Uint8Array(await globalThis.crypto.subtle.digest("SHA-256", data));
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function jcsSha256Hex(value: unknown): Promise<string> {
  return sha256Hex(canonicalJsonBytes(value));
}

export function isSha256Hex(s: string): boolean {
  return SHA256_HEX.test(s);
}
