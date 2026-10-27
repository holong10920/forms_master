import type { StudioModule } from "./studio-contract";
// This URL is a fixed generated artifact from the approved editor sources.
export function loadStudioBundle(): Promise<StudioModule> {
  return import(
    /* @vite-ignore */ new URL("/studio/studio.js", location.origin).href
  ) as Promise<StudioModule>;
}
