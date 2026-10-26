declare const __FB_PREVIEW__: boolean;
import "./style.css";
import { verifiedLoad, type Bindings, type Asset } from "./ports.ts";
import type { StoreModule, StoreOption, MotionModule } from "@platform/sdk-browser";
import {
  assertIR,
  parseNumberInput,
  createSession,
  dispatch,
  snapshot,
  payloadPreview,
  visibleErrors,
  EngineError,
  type Cell,
  type Event,
} from "@fb/form-engine";
import { sha256Hex, type EngineField, type EngineIRV1 } from "@fb/contracts";
interface Pin {
  mode: string;
  partial?: { stops: string[]; blockedFields: string[]; diagnostics: { code: string }[] };
  plugin?: boolean;
  assets?: Asset[];
  groups?: { store: string[]; motion: string[] };
  releaseId: string;
  formId: string;
  siteId: string;
  revision: string;
  ir: { path: string; sha256: string };
}
type Text = { ja?: string; vi?: string } | undefined;
type Locale = "ja" | "vi";
function el<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  return node;
}
export async function start(bindings: Bindings = {}): Promise<void> {
  const host = document.getElementById("app");
  const metadata = document.getElementById("release");
  if (!host || !metadata?.textContent) throw new EngineError("E-BOOTSTRAP");
  const pin = JSON.parse(metadata.textContent) as Pin;
  if (
    !(
      pin.mode === "local-candidate" ||
      pin.mode === "canonical-release" ||
      (__FB_PREVIEW__ && pin.mode === "partial-preview")
    ) ||
    !/^(dev|rel)_[a-z2-7]{26}$/u.test(pin.releaseId) ||
    !/^assets\/form-ir\.[a-f0-9]{64}\.json$/u.test(pin.ir.path)
  )
    throw new EngineError("E-RELEASE-PIN");
  if (!location.pathname.includes(`/r/${pin.releaseId}/`)) throw new EngineError("E-RELEASE-PIN");
  const response = await fetch(new URL(pin.ir.path, location.href), {
    credentials: "omit",
    redirect: "error",
    cache: "no-store",
  });
  if (!response.ok) throw new EngineError("E-IR-LOAD");
  const bytes = new Uint8Array(await response.arrayBuffer());
  if ((await sha256Hex(bytes)) !== pin.ir.sha256) throw new EngineError("E-IR-INTEGRITY");
  const ir = JSON.parse(new TextDecoder().decode(bytes)) as EngineIRV1;
  if (ir.form.formId !== pin.formId || ir.form.siteId !== pin.siteId)
    throw new EngineError("E-RELEASE-PIN");
  assertIR(ir);
  const locales: Locale[] = ir.locale?.supported ?? ["ja"];
  const pick = (v?: string | null) => locales.find((l) => l === v?.slice(0, 2));
  const remember = (value?: Locale) => {
    try {
      if (value) sessionStorage.setItem("fb.locale", value);
      return sessionStorage.getItem("fb.locale");
    } catch {
      return null; // Storage may be blocked; the choice then lasts only for this page.
    }
  };
  let locale = pick(remember()) ?? pick(new URLSearchParams(location.search).get("lang")) ?? "ja";
  const texts = (ir.texts ?? {}) as Record<string, Text>;
  // Active locale first, then ja (default locale), then the built-in ja fallback.
  const text = (t: Text, fallback: string) => t?.[locale] || t?.ja || fallback;
  const tr = <T extends HTMLElement>(node: T, t: Text, fallback: string): T => {
    node.textContent = text(t, fallback);
    if (locale !== "ja" && !t?.[locale]) node.lang = "ja-JP";
    return node;
  };
  // Messages are compiled into the pinned IR (tools/compiler/src/l10n.ts); the key is a last resort.
  const msg = (key: string) => text(texts[key], key);
  const capabilitySteps = Object.fromEntries(
    ir.steps
      .filter((s) =>
        (s.content ?? []).some(
          (c) =>
            "field" in c &&
            ir.nodes.some((f) => c.field === `$local:${f.id}` && f.type === "plugin:storeSel"),
        ),
      )
      .map((s) => [s.id, ["store-browser"]]),
  );
  let state = createSession(
    ir,
    {},
    {
      idempotencyKey: `synthetic-${pin.releaseId}-${crypto.randomUUID()}`,
      capabilities: capabilitySteps,
    },
  );
  let storeModule: StoreModule | undefined,
    storeOptions: StoreOption[] = [];
  let disposeStore: (() => void) | undefined, motion: ReturnType<MotionModule["mount"]> | undefined;
  const viewRoot = el("div");
  host.replaceChildren(viewRoot);
  let previousStep = state.current,
    previousActive = "";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const stopMotion = () => {
    if (motion) {
      motion.unmount();
      motion = undefined;
      host.replaceChildren(viewRoot);
      render();
    }
  };
  reduced.addEventListener("change", (e) => {
    if (e.matches) stopMotion();
    else void enableMotion();
  });
  async function ensureStore() {
    if (storeModule && storeOptions.length) return;
    if (!bindings.loadStore) throw new Error("E-PLUGIN-UNAVAILABLE");
    storeModule = await verifiedLoad(pin.groups?.store ?? [], pin.assets ?? [], bindings.loadStore);
    const r = await fetch(new URL("api/store-list", location.href), {
      credentials: "omit",
      redirect: "error",
    });
    if (!r.ok) throw new Error("E-OPTIONS-UNAVAILABLE");
    const values: unknown = await r.json();
    if (
      !Array.isArray(values) ||
      values.some(
        (v: unknown) =>
          typeof v !== "object" ||
          v === null ||
          !("id" in v) ||
          typeof v.id !== "string" ||
          !/^ST-[0-9]{4}$/u.test(v.id) ||
          !("name" in v) ||
          typeof v.name !== "string",
      )
    )
      throw new Error("E-OPTIONS-SCHEMA");
    storeOptions = values as StoreOption[];
  }
  async function effects(result: ReturnType<typeof dispatch>) {
    for (const e of result.effects)
      if (e.type === "capability") {
        try {
          await ensureStore();
          send({
            type: "asyncResult",
            kind: "capability",
            id: e.id,
            fingerprint: e.fingerprint,
            ok: true,
          });
        } catch {
          send({
            type: "asyncResult",
            kind: "capability",
            id: e.id,
            fingerprint: e.fingerprint,
            ok: false,
          });
        }
      }
  }

  const send = (event: Event) => {
    const result = dispatch(ir, state, event);
    state = result.state;
    render();
    void effects(result);
  };
  const nav = (type: "next" | "back") => {
    if (type === "next") {
      const invalid = viewRoot.querySelector<HTMLInputElement>("input:invalid");
      if (invalid) {
        invalid.reportValidity();
        return;
      }
    }
    send({ type, fromStep: state.current, stateVersion: state.stateVersion });
  };
  function switchLocale(next: Locale) {
    const active = document.activeElement;
    // Commit an in-progress edit before the view is rebuilt (some browsers keep focus on click).
    if (active && viewRoot.contains(active) && !active.closest(".locale"))
      active.dispatchEvent(new Event("change"));
    remember((locale = next));
    render(true);
    viewRoot.querySelector<HTMLElement>(`[data-locale="${next}"]`)?.focus();
  }
  function render(localeOnly = false) {
    if (!host) return;
    disposeStore?.();
    disposeStore = undefined;
    viewRoot.replaceChildren();
    host.dataset.step = state.current;
    host.dataset.release = pin.releaseId;
    host.dataset.locale = locale;
    if (__FB_PREVIEW__ && pin.partial) {
      viewRoot.append(
        el("p", "一部プレビュー：未設定の経路 " + String(pin.partial.stops.length) + "件"),
      );
      if (pin.partial.stops.includes(state.current)) {
        viewRoot.append(el("h2", "この先の経路はまだ設定されていません（プレビューのみ）"));
        const previous = el("button", "前のステップに戻る");
        previous.addEventListener("click", () => {
          nav("back");
        });
        viewRoot.append(previous);
        return;
      }
    }
    document.documentElement.lang = locale === "vi" ? "vi-VN" : "ja-JP";
    if (locales.length > 1) {
      const bar = el("div");
      bar.className = "locale";
      bar.setAttribute("role", "group");
      bar.setAttribute("aria-label", "Language");
      for (const l of locales) {
        const b = el("button", l === "vi" ? "Tiếng Việt" : "日本語");
        b.type = "button";
        b.lang = l === "vi" ? "vi-VN" : "ja-JP";
        b.dataset.locale = l;
        b.setAttribute("aria-pressed", String(l === locale));
        b.addEventListener("click", () => {
          switchLocale(l);
        });
        bar.append(b);
      }
      viewRoot.append(bar);
    }
    for (const key of ["formTitle", "formDescription"])
      if (text(texts[key], "")) {
        const p = tr(el("p"), texts[key], "");
        p.className = key;
        viewRoot.append(p);
      }
    viewRoot.append(
      el(
        "p",
        `${ir.form.formId === "frm_sports" ? "Sports" : ir.form.formId === "frm_pc_reference" ? "PC" : ir.form.formId} · ${msg("syntheticNotice")}`,
      ),
    );
    if (state.status === "complete") {
      viewRoot.append(
        tr(el("h1"), texts.completeTitle, "completeTitle"),
        tr(el("p"), texts.completeBody, "completeBody"),
      );
      return;
    }
    const step = ir.steps.find((s) => s.id === state.current);
    if (!step) throw new EngineError("E-STEP");
    viewRoot.append(
      step.kind === "review"
        ? tr(el("h1"), texts.reviewTitle, "reviewTitle")
        : tr(el("h1"), step.title, step.id.replace("stp_", "")),
    );
    const errors = visibleErrors(ir, state);
    if (errors.length) {
      const summary = el("div");
      summary.setAttribute("role", "alert");
      summary.append(tr(el("p"), texts.errorSummary, "errorSummary"));
      for (const issue of errors) {
        const f = ir.nodes.find((n) => n.id === issue.path);
        const limit = (f as EngineField | undefined)?.validators?.find((v) => v.use === issue.code)
          ?.params?.value;
        summary.append(
          el(
            "p",
            `${text(f?.label, issue.path)}: ${msg(issue.code).replace("{n}", String(limit ?? ""))}`,
          ),
        );
      }
      viewRoot.append(summary);
    }
    if (step.kind === "review") {
      viewRoot.append(
        tr(el("h2"), texts.payloadTitle, "payloadTitle"),
        el("pre", JSON.stringify(payloadPreview(ir, state), null, 2)),
      );
    } else {
      const view = snapshot(ir, state);
      for (const f of ir.nodes) {
        if (
          !view.active.has(f.id) ||
          !(step.content ?? []).some((c) => "field" in c && c.field === `$local:${f.id}`)
        )
          continue;
        if (__FB_PREVIEW__ && pin.partial?.blockedFields.includes(f.id)) {
          viewRoot.append(el("p", "この部品は利用停止中です · " + f.key));
          continue;
        }
        if (f.type === "group") throw new EngineError("E-RUNTIME-UNSUPPORTED", f.id);
        const wrap = el("div");
        wrap.className = "field";
        const label = tr(el("label"), f.label, f.key);
        label.htmlFor = f.id;
        wrap.append(label);
        if (f.type === "plugin:storeSel") {
          if (!storeModule) throw new Error("E-PLUGIN-NOT-READY");
          label.id = `${f.id}-label`;
          const target = el("div");
          wrap.append(target);
          viewRoot.append(wrap);
          disposeStore = storeModule.mount(target, {
            value:
              typeof state.values[f.id] === "string" ? (state.values[f.id] as string) : undefined,
            onChange: (value) => {
              if (snapshot(ir, state).active.has(f.id))
                send({ type: "commit", field: f.id, value });
            },
            onCommit: () => {
              if (snapshot(ir, state).active.has(f.id))
                state = dispatch(ir, state, { type: "blur", field: f.id }).state;
            },
            status: {
              disabled: state.status === "pending",
              invalid: errors.some((e) => e.path === f.id),
            },
            config: f.config ?? {},
            inputs: {},
            options: { state: "ready", value: storeOptions },
            ids: { input: f.id, label: label.id },
          });
          continue;
        }
        if (f.type === "calculated") {
          wrap.append(el("output", JSON.stringify(view.effective[f.id])));
          viewRoot.append(wrap);
          continue;
        }
        const value = state.values[f.id];
        let input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
        if (f.options) {
          const select = el("select");
          select.append(new Option(msg("selectPrompt"), ""));
          for (const option of f.options)
            select.append(new Option(text(option.label, option.value), option.value));
          if (f.type === "choice.checkboxes") {
            select.multiple = true;
            for (const option of select.options)
              option.selected = Array.isArray(value) && value.includes(option.value);
          } else select.value = typeof value === "string" ? value : "";
          input = select;
        } else if (f.type === "textarea") {
          input = el("textarea");
          input.value = typeof value === "string" ? value : "";
        } else {
          const control = el("input");
          control.type =
            f.type === "boolean"
              ? "checkbox"
              : f.type === "email"
                ? "email"
                : f.type === "number"
                  ? "text"
                  : "text";
          if (f.type === "boolean") control.checked = value === true;
          else
            control.value =
              typeof value === "string" || typeof value === "number" ? String(value) : "";
          input = control;
        }
        input.id = f.id;
        input.name = f.key;
        if (f.placeholder && !(input instanceof HTMLSelectElement))
          input.placeholder = text(f.placeholder, "");
        input.setAttribute("aria-required", String(!!f.required || !!f.requiredWhen));
        if (errors.some((e) => e.path === f.id)) input.setAttribute("aria-invalid", "true");
        const numericValue = (): number | undefined => {
          input.setCustomValidity("");
          try {
            return parseNumberInput(input.value);
          } catch {
            input.setCustomValidity(msg("invalidNumber"));
            return undefined;
          }
        };
        input.addEventListener("input", () => {
          input.setCustomValidity("");
        });
        const currentValue = (): Cell | undefined =>
          f.type === "choice.checkboxes"
            ? [...(input as HTMLSelectElement).selectedOptions].map((o) => o.value).filter(Boolean)
            : f.type === "boolean"
              ? (input as HTMLInputElement).checked
              : f.type === "number"
                ? numericValue()
                : input.value;
        input.addEventListener("compositionstart", () => {
          state = dispatch(ir, state, { type: "compositionStart", field: f.id }).state;
        });
        input.addEventListener("compositionend", () => {
          state = dispatch(ir, state, {
            type: "compositionEnd",
            field: f.id,
            value: currentValue(),
          }).state;
        });
        input.addEventListener("change", () => {
          state = dispatch(ir, state, { type: "commit", field: f.id, value: currentValue() }).state;
          if (f.options || f.type === "boolean") render();
        });
        input.addEventListener("blur", () => {
          state = dispatch(ir, state, { type: "blur", field: f.id }).state;
        });
        wrap.append(input);
        if (text(f.help, "")) {
          const help = tr(el("p"), f.help, "");
          help.className = "help";
          help.id = `${f.id}-help`;
          input.setAttribute("aria-describedby", help.id);
          wrap.append(help);
        }
        viewRoot.append(wrap);
      }
    }
    const actions = el("div");
    actions.className = "actions";
    const back = tr(el("button"), texts.back, "back");
    back.type = "button";
    back.disabled = state.current === snapshot(ir, state).path[0] || state.status === "pending";
    back.addEventListener("click", () => {
      nav("back");
    });
    actions.append(back);
    if (__FB_PREVIEW__ && pin.partial && step.kind === "review") {
      viewRoot.append(actions, el("p", "一部プレビューでは送信できません"));
      return;
    }
    const next =
      step.kind === "review"
        ? tr(el("button"), texts.submit, "submit")
        : tr(el("button"), texts.next, "next");
    next.type = "button";
    next.disabled = state.status === "pending";
    next.addEventListener("click", () => {
      if (step.kind !== "review") {
        nav("next");
        return;
      }
      const result = dispatch(ir, state, {
        type: "next",
        fromStep: state.current,
        stateVersion: state.stateVersion,
      });
      state = result.state;
      render();
      const request = state.request;
      if (request?.kind !== "submit") return;
      const payload = payloadPreview(ir, state);
      void fetch(new URL("api/submit", location.href), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "omit",
        redirect: "error",
        body: JSON.stringify({ payload, idempotencyKey: state.ports?.idempotencyKey }),
      })
        .then(async (response) => {
          const outcome = (await response.json()) as {
            ok: boolean;
            errors: { code: string; path: string }[];
          };
          send({
            type: "submitResult",
            id: request.id,
            fingerprint: request.fingerprint,
            ok: response.ok && outcome.ok,
            rejected: response.status === 422,
            issues: outcome.errors,
          });
        })
        .catch(() => {
          send({
            type: "submitResult",
            id: request.id,
            fingerprint: request.fingerprint,
            ok: false,
          });
        });
    });
    actions.append(next);
    viewRoot.append(actions);
    if (localeOnly) return;
    const active = [...snapshot(ir, state).active].sort().join(",");
    const kind =
      state.current !== previousStep
        ? "step"
        : state.errors.length
          ? "validation"
          : active !== previousActive
            ? "reveal"
            : "submit";
    motion?.update({
      sequence: state.stateVersion,
      kind,
      direction: state.current === previousStep ? 0 : 1,
    });
    if (state.current !== previousStep) {
      const heading = viewRoot.querySelector("h1");
      if (heading) {
        heading.tabIndex = -1;
        heading.focus();
      }
    }
    previousStep = state.current;
    previousActive = active;
  }
  render();
  performance.mark("form:visible");
  performance.mark("form:ready");
  const canAnimate = (): boolean => !reduced.matches && !motion;
  async function enableMotion() {
    if (!host) return;
    if (!bindings.loadMotion || !canAnimate()) return;
    try {
      const module = await verifiedLoad(
        pin.groups?.motion ?? [],
        pin.assets ?? [],
        bindings.loadMotion,
      );
      if (!canAnimate()) return;
      const container = el("div");
      host.append(container);
      motion = module.mount(container, viewRoot);
      motion.update({ sequence: state.stateVersion, kind: "step", direction: 1 });
    } catch {
      host.dataset.motion = "unavailable";
      if (!viewRoot.isConnected) host.replaceChildren(viewRoot);
    }
  }
  void enableMotion();
}
export function boot(bindings: Bindings = {}): void {
  void start(bindings).catch(() => {
    const host = document.getElementById("app");
    if (host) {
      host.replaceChildren(
        el("h1", "読み込みを停止しました"),
        el("p", "E-ARTIFACT-BOOTSTRAP — 入力・送信は利用できません。"),
      );
      host.dataset.error = "E-ARTIFACT-BOOTSTRAP";
    }
  });
}
