import "./style.css";
import {
  assertIR,
  createSession,
  dispatch,
  snapshot,
  validation,
  payloadPreview,
  visibleErrors,
  EngineError,
  type Cell,
  type Event,
} from "@fb/form-engine";
import { sha256Hex, type EngineIRV1 } from "@fb/contracts";
interface Pin {
  mode: string;
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
};
function el<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  return node;
}
export async function start(): Promise<void> {
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
  let state = createSession(ir, {}, { idempotencyKey: `synthetic-${pin.releaseId}` });
  const send = (event: Event) => {
    const result = dispatch(ir, state, event);
    state = result.state;
    render();
  };
  const nav = (type: "next" | "back") => {
    send({ type, fromStep: state.current, stateVersion: state.stateVersion });
  };
  function render() {
    if (!host) return;
    host.replaceChildren();
    host.append(el("p", `Sports · synthetic only · ${pin.releaseId}`));
    if (state.status === "complete") {
      host.append(
        el("h1", "ローカル模擬受付完了"),
        el("p", "実際の申込・外部送信は行っていません。"),
      );
      return;
    }
    const step = ir.steps.find((s) => s.id === state.current);
    if (!step) throw new EngineError("E-STEP");
    host.append(el("h1", step.kind === "review" ? "入力内容の確認" : step.id.replace("stp_", "")));
    const errors = visibleErrors(ir, state);
    if (errors.length) {
      const summary = el("div");
      summary.setAttribute("role", "alert");
      summary.append(el("p", "入力内容を確認してください。"));
      for (const issue of errors)
        summary.append(el("p", `${titles[issue.path] ?? issue.path}: ${issue.code}`));
      host.append(summary);
    }
    if (step.kind === "review") {
      host.append(
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
        const label = el("label", titles[f.id] ?? f.key);
        label.htmlFor = f.id;
        wrap.append(label);
        if (f.type === "calculated") {
          wrap.append(el("output", JSON.stringify(view.effective[f.id])));
          host.append(wrap);
          continue;
        }
        const value = state.values[f.id];
        let input: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
        if (f.options) {
          const select = el("select");
          select.append(new Option("選択してください", ""));
          for (const option of f.options)
            select.append(new Option(labels[option.value] ?? option.value, option.value));
          select.value = typeof value === "string" ? value : "";
          input = select;
        } else if (f.type === "textarea") {
          input = el("textarea");
          input.value = typeof value === "string" ? value : "";
        } else {
          const control = el("input");
          control.type = f.type === "boolean" ? "checkbox" : f.type === "email" ? "email" : "text";
          if (f.type === "boolean") control.checked = value === true;
          else control.value = typeof value === "string" ? value : "";
          input = control;
        }
        input.id = f.id;
        input.name = f.key;
        input.setAttribute("aria-required", String(!!f.required || !!f.requiredWhen));
        if (errors.some((e) => e.path === f.id)) input.setAttribute("aria-invalid", "true");
        const currentValue = (): Cell =>
          f.type === "boolean" ? (input as HTMLInputElement).checked : input.value;
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
        host.append(wrap);
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
      if (validation(ir, state, step.kind === "review").length || step.kind !== "review") {
        nav("next");
        return;
      }
      const result = dispatch(ir, state, {
        type: "next",
        fromStep: state.current,
        stateVersion: state.stateVersion,
      });
      state = result.state;
      const request = state.request;
      if (request?.kind === "submit")
        state = dispatch(ir, state, {
          type: "submitResult",
          id: request.id,
          fingerprint: request.fingerprint,
          ok: true,
        }).state;
      render();
    });
    actions.append(next);
    host.append(actions);
    host.dataset.step = state.current;
    host.dataset.release = pin.releaseId;
  }
  render();
  performance.mark("form:visible");
  performance.mark("form:ready");
}
export function boot(): void {
  void start().catch(() => {
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
