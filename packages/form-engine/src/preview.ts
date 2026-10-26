import type { FormDefinitionV1 } from "@fb/contracts";
/** Pure preview-only projection. Never edits the draft or authorizes a release. */
export function projectPreview(input: FormDefinitionV1, blocked = false) {
  const definition = structuredClone(input),
    stops: string[] = [],
    blockedFields: string[] = [];
  const diagnostics: { code: string; gate: "workflow" | "review"; step?: string }[] = [];
  if (definition.steps.some((s) => s.id.startsWith("stp_preview_")))
    throw Error("E-PREVIEW-RESERVED-ID");
  const ids = new Set(definition.steps.map((s) => s.id));
  const sentinel = (step: string, review = false) => {
    const id = "stp_preview_unconfigured_" + String(stops.length);
    stops.push(id);
    definition.steps.push(
      review
        ? { id, kind: "complete" }
        : { id, kind: "form", content: [], transitions: [{ default: "stp_preview_review" }] },
    );
    diagnostics.push({ code: "PREVIEW_ONLY_UNCONFIGURED_PATH", gate: "workflow", step });
    return id;
  };
  for (const step of [...definition.steps]) {
    if (step.kind === "complete") continue;
    const transitions = step.transitions ?? [];
    step.transitions = transitions.map((t) => {
      if ("default" in t)
        return {
          default:
            t.default && ids.has(t.default) ? t.default : sentinel(step.id, step.kind === "review"),
        };
      return { ...t, to: t.to && ids.has(t.to) ? t.to : sentinel(step.id, step.kind === "review") };
    });
    if (!step.transitions.some((t) => "default" in t))
      step.transitions.push({ default: sentinel(step.id, step.kind === "review") });
  }
  if (stops.length) {
    definition.steps.push(
      {
        id: "stp_preview_review",
        kind: "review",
        transitions: [{ default: "stp_preview_complete" }],
      },
      { id: "stp_preview_complete", kind: "complete" },
    );
    // Incomplete graphs may contain disconnected future steps; preview only the reachable fragment.
    const reachable = new Set<string>();
    const visit = (id: string) => {
      if (reachable.has(id)) return;
      reachable.add(id);
      for (const t of definition.steps.find((s) => s.id === id)?.transitions ?? [])
        visit("default" in t ? t.default : t.to);
    };
    visit(definition.steps[0].id);
    definition.steps.splice(
      0,
      definition.steps.length,
      ...definition.steps.filter((s) => reachable.has(s.id)),
    );
    const refs = new Set(
      definition.steps.flatMap((s) =>
        (s.content ?? []).flatMap((c) => ("field" in c ? [c.field] : [])),
      ),
    );
    definition.fields = definition.fields.filter((f) => refs.has("$local:" + f.id));
    const blocks = new Set(
      definition.steps.flatMap((s) =>
        (s.content ?? []).flatMap((c) => ("block" in c ? [c.block] : [])),
      ),
    );
    if (definition.blockInstances)
      definition.blockInstances = definition.blockInstances.filter((i) => blocks.has(i.id));
  }
  if (blocked) {
    definition.fields = definition.fields.map((f) => {
      if (f.type !== "plugin:storeSel") return f;
      blockedFields.push(f.id);
      const rest = { ...f };
      delete rest.config;
      return { ...rest, type: "text", classification: "personal", required: false, validators: [] };
    });
    if (definition.dependencies) delete definition.dependencies.capabilities;
    diagnostics.push({ code: "PREVIEW_CAPABILITY_BLOCKED", gate: "review" });
  }
  return { definition, stops, blockedFields, diagnostics };
}
