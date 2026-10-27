import { useEffect, useRef, useState } from "react";
import { ApiError, request, type Session, destination } from "./api";
import { messages, type Locale } from "./i18n";
import { Login } from "./Login";
import { Studio, type StudioController } from "./Studio";

type AuthState =
  | { kind: "loading" }
  | { kind: "anonymous"; reason: "expired" | "error" | "" }
  | { kind: "error" }
  | { kind: "authenticated"; session: Session };
export function App() {
  const [locale, setLocale] = useState<Locale>(
    new URLSearchParams(location.search).get("lang") === "vi" ? "vi" : "ja",
  );
  const t = messages[locale];
  const [state, setState] = useState<AuthState>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [path, setPath] = useState(destination(location.pathname));
  const [studioOpened, setStudioOpened] = useState(location.pathname.startsWith("/studio"));
  const studioRef = useRef<StudioController>({
    dirty: () => false,
    beforeLeave: () => Promise.resolve(true),
    recover: () => undefined,
    navigate: () => Promise.resolve(),
  });
  const studioPath = path.startsWith("/studio");
  const [page, setPage] = useState<"loading" | "ready" | "denied" | "error">("loading");
  const sessionEpoch = useRef(0);
  const [busy, setBusy] = useState(false);
  const [logoutError, setLogoutError] = useState(false);
  useEffect(() => {
    document.documentElement.lang = locale;
    const u = new URL(location.href);
    u.searchParams.set("lang", locale);
    history.replaceState(null, "", u);
  }, [locale]);
  useEffect(() => {
    const abort = new AbortController();
    void request<Session>("/api/v1/auth/me", { signal: abort.signal })
      .then((session) => {
        setState({ kind: "authenticated", session });
      })
      .catch((e: unknown) => {
        if (abort.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) {
          setState({
            kind: "anonymous",
            reason: new URLSearchParams(location.search).has("error") ? "error" : "",
          });
        } else setState({ kind: "error" });
      });
    return () => {
      abort.abort();
    };
  }, [attempt]);
  useEffect(() => {
    const route = () => {
      const next = destination(location.pathname);
      setPath(next);
      if (next.startsWith("/studio")) setStudioOpened(true);
    };
    const pop = () => {
      void (async () => {
        if (studioPath && !(await studioRef.current.beforeLeave())) {
          history.replaceState(null, "", path + "?lang=" + locale);
          return;
        }
        route();
      })();
    };
    window.addEventListener("popstate", pop);
    window.addEventListener("master:route", route);
    return () => {
      window.removeEventListener("popstate", pop);
      window.removeEventListener("master:route", route);
    };
  }, [path, locale, studioPath]);
  useEffect(() => {
    if (state.kind === "anonymous" && location.pathname !== "/login") {
      const next = destination(location.pathname);
      history.replaceState(
        null,
        "",
        "/login?return_to=" + encodeURIComponent(next) + "&lang=" + locale,
      );
    } else if (state.kind === "authenticated" && location.pathname === "/login") {
      const next = destination(
        new URLSearchParams(location.search).get("return_to") ?? "/dashboard",
      );
      history.replaceState(null, "", next + "?lang=" + locale);
      setPath(next);
    }
  }, [state.kind, locale]);
  const session = state.kind === "authenticated" ? state.session : null;
  useEffect(() => {
    if (!session) return;
    let alive = true;
    const epoch = sessionEpoch.current;
    const abort = new AbortController();
    const load = async () => {
      try {
        // Refresh role/status from the authoritative server as well as the protected resource.
        const current = await request<Session>("/api/v1/auth/me", { signal: abort.signal });
        if (alive && epoch === sessionEpoch.current)
          setState({ kind: "authenticated", session: current });
        await request(path === "/admin" ? "/api/v1/admin/overview" : "/api/v1/dashboard", {
          signal: abort.signal,
        });
        if (alive && epoch === sessionEpoch.current) {
          setPage("ready");
          setState({ kind: "authenticated", session: current });
        }
      } catch (e) {
        if (!alive || epoch !== sessionEpoch.current) return;
        if (e instanceof ApiError && e.status === 401) {
          studioRef.current.recover();
          setState({ kind: "anonymous", reason: "expired" });
        } else if (e instanceof ApiError && e.status === 403) setPage("denied");
        else setPage("error");
      }
    };
    setPage("loading");
    void load();
    const timer = window.setInterval(() => void load(), 15000);
    return () => {
      alive = false;
      abort.abort();
      window.clearInterval(timer);
    };
  }, [path, session?.user.id, attempt]);
  async function navigate(next: string) {
    if (studioPath && !(await studioRef.current.beforeLeave())) return;
    if (next.startsWith("/studio")) setStudioOpened(true);
    history.pushState(null, "", next + "?lang=" + locale);
    setPath(next);
  }
  async function logout() {
    if (!session) return;
    if (studioPath && !(await studioRef.current.beforeLeave())) return;
    setBusy(true);
    setLogoutError(false);
    try {
      await request("/api/v1/auth/logout", {
        method: "POST",
        headers: { "X-CSRF-Token": session.csrf_token },
      });
      sessionEpoch.current++;
      setState({ kind: "anonymous", reason: "" });
      history.replaceState(null, "", "/login?lang=" + locale);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401)
        setState({ kind: "anonymous", reason: "expired" });
      else setLogoutError(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      className={
        state.kind === "authenticated" && studioPath ? "app-layout app-layout-studio" : "app-layout"
      }
    >
      <header className="brand-header">
        <a href="/dashboard" className="brand">
          <span className="brand-mark" aria-hidden="true">
            f.
          </span>
          Form Master
          <span className="brand-divider" /> <span className="brand-sub">{t.workspace}</span>
        </a>
        <label className="locale">
          <span className="sr-only">Language / 言語 / Ngôn ngữ</span>
          <select
            value={locale}
            onChange={(e) => {
              setLocale(e.target.value === "vi" ? "vi" : "ja");
            }}
          >
            <option value="ja">日本語</option>
            <option value="vi">Tiếng Việt</option>
          </select>
        </label>
      </header>
      {state.kind === "loading" ? (
        <main className="center-state" aria-busy="true">
          <span className="loader" />
          <p role="status">{t.loading}</p>
        </main>
      ) : state.kind === "error" ? (
        <main className="center-state">
          <p role="alert">{t.network}</p>
          <button
            className="primary"
            onClick={() => {
              setAttempt((a) => a + 1);
            }}
          >
            {t.retry}
          </button>
        </main>
      ) : state.kind === "anonymous" ? (
        <Login
          locale={locale}
          t={t}
          message={state.reason === "expired" ? t.expired : state.reason === "error" ? t.error : ""}
        />
      ) : (
        <div className="shell">
          <aside>
            <div>
              <p className="eyebrow mb-5">WORKSPACE</p>
              <nav aria-label={t.workspace}>
                {[
                  "/dashboard",
                  "/studio",
                  ...(session?.user.role === "admin" ? ["/admin"] : []),
                  "/settings/profile",
                ].map((item) => (
                  <a
                    key={item}
                    className={
                      path === item || (item === "/studio" && studioPath)
                        ? "nav-item selected"
                        : "nav-item"
                    }
                    aria-current={
                      path === item || (item === "/studio" && studioPath) ? "page" : undefined
                    }
                    href={item}
                    onClick={(e) => {
                      e.preventDefault();
                      void navigate(item);
                    }}
                  >
                    <span aria-hidden="true">
                      {item === "/dashboard" ? "◫" : item === "/admin" ? "◇" : "○"}
                    </span>
                    <span className="nav-label">
                      {item === "/dashboard"
                        ? t.dashboard
                        : item === "/studio"
                          ? locale === "vi"
                            ? "Trình tạo biểu mẫu"
                            : "フォームビルダー"
                          : item === "/admin"
                            ? t.admin
                            : t.profile}
                    </span>
                  </a>
                ))}
              </nav>
            </div>
            <div className="aside-footer">
              <p className="text-sm font-semibold">{session?.user.display_name}</p>
              <p className="muted text-xs mt-1 mb-4">{session?.user.role.toUpperCase()}</p>
              <button className="quiet-button" disabled={busy} onClick={() => void logout()}>
                <span className="logout-label">{busy ? t.signOutBusy : t.logout}</span>{" "}
                <span aria-hidden="true">↗</span>
              </button>
              {logoutError ? <p role="alert">{t.network}</p> : null}
            </div>
          </aside>
          <div className="workspace-content">
            <main className="workspace-main" hidden={studioPath}>
              <div className="page-heading">
                <div>
                  <p className="eyebrow mb-3">
                    FORM MASTER /{" "}
                    {path === "/admin"
                      ? "ADMIN"
                      : path === "/profile" || path === "/settings/profile"
                        ? "PROFILE"
                        : "OVERVIEW"}
                  </p>
                  <h1>
                    {path === "/admin"
                      ? t.admin
                      : path === "/profile" || path === "/settings/profile"
                        ? t.profile
                        : t.dashboard}
                  </h1>
                </div>
                <span className="status-badge">
                  <i />
                  {t.active}
                </span>
              </div>
              {page === "loading" ? (
                <div className="content-card" role="status" aria-busy="true">
                  {t.checking}
                </div>
              ) : page === "denied" ? (
                <div className="content-card notice" role="alert">
                  {t.denied}
                </div>
              ) : page === "error" ? (
                <div className="content-card" role="alert">
                  <p>{t.network}</p>
                  <button
                    className="quiet-button"
                    onClick={() => {
                      setAttempt((a) => a + 1);
                    }}
                  >
                    {t.retry}
                  </button>
                </div>
              ) : path === "/profile" || path === "/settings/profile" ? (
                <section className="content-card">
                  <h2>{t.account}</h2>
                  <dl className="profile-grid">
                    <dt>{t.identity}</dt>
                    <dd>{session?.user.display_name}</dd>
                    <dt>{t.email}</dt>
                    <dd>{session?.user.email}</dd>
                    <dt>{t.role}</dt>
                    <dd>{session?.user.role.toUpperCase()}</dd>
                    <dt>{t.status}</dt>
                    <dd>{t.active}</dd>
                  </dl>
                </section>
              ) : path === "/admin" ? (
                <section className="content-card">
                  <span className="eyebrow">ADMIN ONLY</span>
                  <h2 className="mt-5">{t.admin}</h2>
                  <p className="muted">{t.adminDescription}</p>
                </section>
              ) : (
                <>
                  <section className="welcome-card">
                    <div>
                      <span className="eyebrow">A NEW CHAPTER</span>
                      <h2>{t.greeting}</h2>
                      <p>{t.phase}</p>
                      <a
                        href="/settings/profile"
                        className="primary"
                        onClick={(e) => {
                          e.preventDefault();
                          void navigate("/settings/profile");
                        }}
                      >
                        {t.viewProfile}
                        <span aria-hidden="true">↗</span>
                      </a>
                    </div>
                    <div className="welcome-art" aria-hidden="true">
                      f<span>+</span>
                    </div>
                  </section>
                  <div className="summary-grid">
                    <section className="content-card">
                      <p className="eyebrow">01 / {t.role}</p>
                      <h2>{session?.user.role === "admin" ? t.adminRole : t.member}</h2>
                      <p className="muted text-sm">{session?.user.role.toUpperCase()}</p>
                    </section>
                    <section className="content-card">
                      <p className="eyebrow">02 / {t.workspace}</p>
                      <h2>{t.overview}</h2>
                      <p className="muted text-sm">{t.phaseDescription}</p>
                    </section>
                  </div>
                </>
              )}
              <footer className="workspace-footer">
                FORM MASTER <span>PHASE 01 / ACCESS & IDENTITY</span>
              </footer>
            </main>
            {studioOpened ? (
              <section className="studio-panel" hidden={!studioPath}>
                <Studio
                  locale={locale}
                  path={path}
                  controller={studioRef}
                  onExpired={() => {
                    studioRef.current.recover();
                    setState({ kind: "anonymous", reason: "expired" });
                  }}
                />
              </section>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
