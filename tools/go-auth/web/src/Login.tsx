import { useState } from "react";
import type { Copy, Locale } from "./i18n";
import { destination } from "./api";
export function Login({ t, message, locale }: { t: Copy; message: string; locale: Locale }) {
  const [opening, setOpening] = useState(false);
  return (
    <main className="login-grid">
      <section className="story">
        <span className="eyebrow">FORM MASTER / STUDIO</span>
        <h1>{t.welcome}</h1>
        <p>{t.description}</p>
        <div className="form-art" aria-hidden="true">
          <div className="art-tag">YOUR NEXT FORM</div>
          <div className="art-title">
            Make room
            <br />
            for possibilities.
          </div>
          <div className="art-line" />
          <div className="art-line short" />
          <div className="art-options">
            <span>01</span>
            <span>02</span>
            <span>03</span>
          </div>
          <div className="art-footer">
            FORM MASTER <span>↗</span>
          </div>
        </div>
        <span className="story-foot">THOUGHTFULLY BUILT. READY FOR WHAT’S NEXT.</span>
      </section>
      <section className="login-panel">
        <div className="w-full max-w-md">
          <span className="step-label">01 / ACCESS</span>
          <h2>{t.signIn}</h2>
          <p className="muted mb-8">{t.signInDescription}</p>
          {message ? (
            <p role="alert" className="notice mb-6">
              {message}
            </p>
          ) : null}
          <a
            className="primary w-full"
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
          <p className="local-label">{t.local}</p>
          <div className="security-note">
            <span className="security-icon" aria-hidden="true">
              ✓
            </span>
            <div>
              <strong>{t.secure}</strong>
              <p>{t.secureDescription}</p>
            </div>
          </div>
        </div>
        <span className="login-bottom">FORM MASTER © 2026</span>
      </section>
    </main>
  );
}
