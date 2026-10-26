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
import { sha256Hex, type EngineIRV1 } from "@fb/contracts";
interface Pin {
  mode: string;
  plugin?: boolean;
  assets?: Asset[];
  groups?: { store: string[]; motion: string[] };
  releaseId: string;
  formId: string;
  siteId: string;
  revision: string;
  ir: { path: string; sha256: string };
}
const titles: Record<string, string> = {
  fld_category: "カテゴリ",
  fld_club: "ゴルフクラブ",
  fld_racket: "ラケット",
  fld_condition: "商品の状態",
  fld_damage: "故障の説明",
  fld_method: "買取方法",
  fld_customer: "お名前（合成データのみ）",
  fld_email: "メール（合成データのみ）",
  fld_consent: "確認事項に同意",
  fld_device: "機種カテゴリ",
  fld_battery: "バッテリー状態",
  fld_defects: "不具合",
  fld_store: "店舗",
  fld_kit: "梱包キット",
};
const labels: Record<string, string> = {
  golf: "ゴルフ",
  racket: "ラケット",
  driver: "ドライバー",
  iron: "アイアン",
  tennis: "テニス",
  badminton: "バドミントン",
  used: "中古",
  junk: "Junk / 故障あり",
  shuccho: "出張",
  store: "店頭",
  takuhai: "宅配",
  desktop: "デスクトップ",
  laptop: "ノート",
  tablet: "タブレット",
  peripheral: "周辺機器",
  good: "良好",
  poor: "劣化あり",
  none: "なし",
  screen: "画面割れ",
  yes: "必要",
  no: "不要",
};
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
    pin.mode !== "local-candidate" ||
    !/^dev_[a-z2-7]{26}$/u.test(pin.releaseId) ||
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
  function render() {
    if (!host) return;
    disposeStore?.();
    disposeStore = undefined;
    viewRoot.replaceChildren();
    host.dataset.step = state.current;
    host.dataset.release = pin.releaseId;
    viewRoot.append(
      el(
        "p",
        `${ir.form.formId === "frm_sports" ? "Sports" : ir.form.formId === "frm_pc_reference" ? "PC" : ir.form.formId} · 合成データのみ`,
      ),
    );
    if (state.status === "complete") {
      viewRoot.append(
        el("h1", "ローカル模擬受付完了"),
        el("p", "実際の申込・外部送信は行っていません。"),
      );
      return;
    }
    const step = ir.steps.find((s) => s.id === state.current);
    if (!step) throw new EngineError("E-STEP");
    viewRoot.append(
      el(
        "h1",
        step.kind === "review" ? "入力内容の確認" : (step.title?.ja ?? step.id.replace("stp_", "")),
      ),
    );
    const errors = visibleErrors(ir, state);
    if (errors.length) {
      const summary = el("div");
      summary.setAttribute("role", "alert");
      summary.append(el("p", "入力内容を確認してください。"));
      for (const issue of errors)
        summary.append(el("p", `${titles[issue.path] ?? issue.path}: ${issue.code}`));
      viewRoot.append(summary);
    }
    if (step.kind === "review") {
      viewRoot.append(
        el("h2", "送信プレビュー（合成データ）"),
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
        if (f.type === "group") throw new EngineError("E-RUNTIME-UNSUPPORTED", f.id);
        const wrap = el("div");
        wrap.className = "field";
        const label = el("label", f.label?.ja ?? titles[f.id] ?? f.key);
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
          select.append(new Option("選択してください", ""));
          for (const option of f.options)
            select.append(
              new Option(option.label?.ja ?? labels[option.value] ?? option.value, option.value),
            );
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
        input.setAttribute("aria-required", String(!!f.required || !!f.requiredWhen));
        if (errors.some((e) => e.path === f.id)) input.setAttribute("aria-invalid", "true");
        const numericValue = (): number | undefined => {
          input.setCustomValidity("");
          try {
            return parseNumberInput(input.value);
          } catch {
            input.setCustomValidity("安全な整数を入力してください");
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
        viewRoot.append(wrap);
      }
    }
    const actions = el("div");
    actions.className = "actions";
    const back = el("button", "戻る");
    back.type = "button";
    back.disabled = state.current === snapshot(ir, state).path[0] || state.status === "pending";
    back.addEventListener("click", () => {
      nav("back");
    });
    actions.append(back);
    const next = el("button", step.kind === "review" ? "ローカル模擬受付" : "次へ");
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
