const adminOrigin = "http://localhost:4174";
let started = false;
window.addEventListener("message", async (event) => {
  if (
    event.origin !== adminOrigin ||
    event.source !== parent ||
    event.data?.type !== "session.start" ||
    started
  )
    return;
  started = true;
  const token = event.data.previewSessionId;
  if (typeof token !== "string") return;
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input, init = {}) => {
    const url = new URL(
      typeof input === "string" ? input : input instanceof URL ? input.href : input.url,
      location.href,
    );
    if (url.origin !== location.origin) return Promise.reject(Error("PREVIEW_NETWORK"));
    const headers = new Headers(init.headers);
    headers.set("X-Preview-Session", token);
    return nativeFetch(input, { ...init, headers, credentials: "omit", redirect: "error" });
  };
  try {
    const r = await fetch("/api/preview/bootstrap");
    if (!r.ok) throw Error("PREVIEW_SESSION_EXPIRED");
    const doc = new DOMParser().parseFromString(await r.text(), "text/html");
    const release = doc.querySelector("#release");
    const pin = JSON.parse(release.textContent);
    if (/^(ja|vi)$/.test(event.data.locale ?? ""))
      try {
        window.sessionStorage.setItem("fb.locale", event.data.locale);
      } catch {
        // Storage blocked: the runtime starts in Japanese and its own switcher still works.
      }
    history.replaceState(null, "", `/r/${pin.releaseId}/index.html`);
    const metadata = document.createElement("script");
    metadata.type = "application/json";
    metadata.id = "release";
    metadata.textContent = release.textContent;
    document.body.append(metadata);
    for (const css of doc.querySelectorAll('link[rel="stylesheet"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = new URL(css.getAttribute("href"), location.href);
      link.integrity = css.integrity;
      link.crossOrigin = "anonymous";
      document.head.append(link);
    }
    const script = doc.querySelector('script[type="module"]');
    await import(new URL(script.getAttribute("src"), location.href).href);
    parent.postMessage({ type: "preview.ready" }, adminOrigin);
  } catch {
    document.querySelector("#app").textContent = "プレビューを更新してください";
  }
});
parent.postMessage({ type: "preview.hello" }, adminOrigin);
