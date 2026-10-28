import { classes } from "./recipes";
import { useState } from "react";
import type { Copy, Locale } from "./i18n";
import { destination } from "./api";
export function Login({ t, message, locale }: { t: Copy; message: string; locale: Locale }) {
  const [opening, setOpening] = useState(false);
  return (
    <main className={classes("login-grid")}>
      <section className={classes("story")}>
        <span className={classes("eyebrow")}>FORM MASTER / STUDIO</span>
        <h1>{t.welcome}</h1>
        <p>{t.description}</p>
        <div className={classes("form-art")} aria-hidden="true">
          <div className={classes("art-tag")}>YOUR NEXT FORM</div>
          <div className={classes("art-title")}>
            Make room
            <br />
            for possibilities.
          </div>
          <div className={classes("art-line")} />
          <div className={classes("art-line short")} />
          <div className={classes("art-options")}>
            <span>01</span>
            <span>02</span>
            <span>03</span>
          </div>
          <div className={classes("art-footer")}>
            FORM MASTER <span>↗</span>
          </div>
        </div>
        <span className={classes("story-foot")}>THOUGHTFULLY BUILT. READY FOR WHAT’S NEXT.</span>
      </section>
      <section className={classes("login-panel")}>
        <div className={classes("w-full max-w-md")}>
          <span className={classes("step-label")}>01 / ACCESS</span>
          <h2>{t.signIn}</h2>
          <p className={classes("muted mb-8")}>{t.signInDescription}</p>
          {message ? (
            <p role="alert" className={classes("notice mb-6")}>
              {message}
            </p>
          ) : null}
          <a
            className={classes("primary w-full")}
            aria-disabled={opening}
            href={
              "/api/v1/auth/login?return_to=" +
              encodeURIComponent(
                destination(
                  new URLSearchParams(location.search).get("return_to") ?? location.pathname,
                ),
              ) +
              "&lang=" +
              locale
            }
            onClick={(e) => {
              if (opening) e.preventDefault();
              else setOpening(true);
            }}
          >
            {opening ? t.opening : t.continue}
            <span aria-hidden="true">↗</span>
          </a>
          <p className={classes("local-label")}>{t.local}</p>
          <div className={classes("security-note")}>
            <span className={classes("security-icon")} aria-hidden="true">
              ✓
            </span>
            <div>
              <strong>{t.secure}</strong>
              <p>{t.secureDescription}</p>
            </div>
          </div>
        </div>
        <span className={classes("login-bottom")}>FORM MASTER © 2026</span>
      </section>
    </main>
  );
}
