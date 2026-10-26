import { sha256Hex } from "@fb/contracts";
import type { StoreModule, MotionModule } from "@platform/sdk-browser";
export interface Bindings {
  loadStore?: () => Promise<StoreModule>;
  loadMotion?: () => Promise<MotionModule>;
}
export interface Asset {
  path: string;
  sha256: string;
}
export async function verifiedLoad<T>(
  paths: readonly string[],
  assets: readonly Asset[],
  loader: () => Promise<T>,
): Promise<T> {
  for (const path of paths) {
    const asset = assets.find((a) => a.path === path);
    if (!asset || !/^assets\/[a-z0-9.-]+$/u.test(path)) throw new Error("E-GROUP-ASSET");
    const r = await fetch(new URL(path, location.href), { redirect: "error", credentials: "omit" });
    if (!r.ok || (await sha256Hex(new Uint8Array(await r.arrayBuffer()))) !== asset.sha256)
      throw new Error("E-GROUP-INTEGRITY");
  }
  return loader();
}
