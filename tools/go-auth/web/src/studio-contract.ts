import type { Locale } from "./i18n";
export interface StudioController {
  dirty(): boolean;
  beforeLeave(): Promise<boolean>;
  recover(): void;
  navigate(path: string): Promise<void>;
}
export interface Bridge {
  window: Window;
  document: Document;
  fetch: typeof fetch;
  readonly locale: Locale;
  studioPath(): string;
  register(controller: StudioController): void;
}
export interface StudioModule {
  mount(bridge: Bridge): void;
}
