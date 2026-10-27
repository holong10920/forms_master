import { useEffect, useRef, useState } from "react";
import type { Locale } from "./i18n";
import { loadStudioBundle } from "./studio-bundle";
import type { Bridge, StudioController } from "./studio-contract";
export type { Bridge, StudioController, StudioModule } from "./studio-contract";
const noop: StudioController = {
  dirty: () => false,
  beforeLeave: () => Promise.resolve(true),
  recover: () => undefined,
  navigate: () => Promise.resolve(),
};
export function Studio({
  locale,
  path,
  controller,
  onExpired,
}: {
  locale: Locale;
  path: string;
  controller: { current: StudioController };
  onExpired: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const current = useRef({ locale, path, onExpired });
  current.current = { locale, path, onExpired };
  const [error, setError] = useState(false);
  useEffect(() => {
    const root = host.current;
    if (!root) return;
    const abort = new AbortController();
    const timers = new Set<number>();
    const observers: { disconnect(): void }[] = [];
    const overlay = new Map<PropertyKey, unknown>();
    let disposed = false;
    const realWindow = globalThis.window;
    const realDocument = globalThis.document;
    function listen(
      target: EventTarget,
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions,
    ) {
      const opts = typeof options === "boolean" ? { capture: options } : options;
      target.addEventListener(type, listener, { ...opts, signal: abort.signal });
    }
    const doc = new Proxy({} as Document, {
      get(_target, key) {
        if (key === "body" || key === "documentElement") return root;
        if (key === "getElementById")
          return (id: string) => root.querySelector("#" + CSS.escape(id));
        if (key === "querySelector") return (selector: string) => root.querySelector(selector);
        if (key === "querySelectorAll")
          return (selector: string) => root.querySelectorAll(selector);
        if (key === "addEventListener")
          return (
            type: string,
            listener: EventListenerOrEventListenerObject,
            options?: boolean | AddEventListenerOptions,
          ) => {
            listen(root, type, listener, options);
          };
        const value: unknown = Reflect.get(realDocument, key, realDocument);
        return typeof value === "function"
          ? (value as (...args: unknown[]) => unknown).bind(realDocument)
          : value;
      },
    });
    const win = new Proxy({} as Window, {
      get(_target, key) {
        if (overlay.has(key)) return overlay.get(key);
        if (key === "document") return doc;
        if (key === "addEventListener")
          return (
            type: string,
            listener: EventListenerOrEventListenerObject,
            options?: boolean | AddEventListenerOptions,
          ) => {
            listen(realWindow, type, listener, options);
          };
        if (key === "setInterval" || key === "setTimeout")
          return (callback: () => void, delay: number) => {
            if (disposed) return 0;
            const id =
              key === "setInterval"
                ? realWindow.setInterval(callback, delay)
                : realWindow.setTimeout(callback, delay);
            timers.add(id);
            return id;
          };
        if (key === "MutationObserver")
          return class extends MutationObserver {
            constructor(callback: MutationCallback) {
              super(callback);
              observers.push(this);
            }
          };
        if (key === "ResizeObserver")
          return class extends ResizeObserver {
            constructor(callback: ResizeObserverCallback) {
              super(callback);
              observers.push(this);
            }
          };
        if (key === "history")
          return new Proxy(realWindow.history, {
            get(target, property) {
              if (property === "replaceState" || property === "pushState")
                return (data: unknown, unused: string, url?: string | URL | null) => {
                  target[property](data, unused, url);
                  realWindow.dispatchEvent(new Event("master:route"));
                };
              const value: unknown = Reflect.get(target, property, target);
              return typeof value === "function"
                ? (value as (...args: unknown[]) => unknown).bind(target)
                : value;
            },
          });
        const value: unknown = Reflect.get(realWindow, key, realWindow);
        return typeof value === "function" && typeof key === "string" && /^[a-z]/.test(key)
          ? (value as (...args: unknown[]) => unknown).bind(realWindow)
          : value;
      },
      set(_target, key, value: unknown) {
        overlay.set(key, value);
        return true;
      },
    });
    const bridge: Bridge = {
      window: win,
      document: doc,
      fetch: (input, init) => {
        const url = new URL(
          typeof input === "string" ? input : input instanceof URL ? input.href : input.url,
          location.origin,
        );
        if (url.origin !== location.origin || !url.pathname.startsWith("/api/"))
          return Promise.reject(new Error("E-STUDIO-NETWORK"));
        return globalThis
          .fetch(input, {
            ...init,
            credentials: "same-origin",
            redirect: "error",
            signal: AbortSignal.any([abort.signal, AbortSignal.timeout(120000)]),
          })
          .then((response) => {
            if (response.status === 401) current.current.onExpired();
            return response;
          });
      },
      get locale() {
        return current.current.locale;
      },
      studioPath: () => current.current.path,
      register(value) {
        controller.current = value;
      },
    };
    void Promise.all([
      fetch("/studio/template.html", { signal: abort.signal }).then((r) => {
        if (!r.ok) throw new Error("Template unavailable");
        return r.text();
      }),
      loadStudioBundle(),
    ])
      .then(([template, module]) => {
        if (disposed) return;
        const parsed = new DOMParser().parseFromString(template, "text/html");
        root.replaceChildren(...Array.from(parsed.body.childNodes));
        module.mount(bridge);
      })
      .catch(() => {
        if (!disposed) setError(true);
      });
    return () => {
      disposed = true;
      abort.abort();
      for (const id of timers) {
        realWindow.clearInterval(id);
        realWindow.clearTimeout(id);
      }
      for (const observer of observers) observer.disconnect();
      controller.current = noop;
    };
  }, [controller]);
  useEffect(() => {
    const picker = host.current?.querySelector<HTMLSelectElement>("#admin-locale");
    if (picker && picker.value !== locale) {
      picker.value = locale;
      picker.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }, [locale]);
  useEffect(() => {
    void controller.current.navigate(path).catch(() => {
      setError(true);
    });
  }, [path, controller]);
  return (
    <>
      <link rel="stylesheet" href="/studio/studio.css" />
      {error ? (
        <p role="alert">
          {locale === "vi"
            ? "Không thể tải Form Studio. Vui lòng tải lại."
            : "Form Studio を読み込めませんでした。再読み込みしてください。"}
        </p>
      ) : null}
      <div ref={host} className="studio-root" aria-label="Form Studio" />
    </>
  );
}
