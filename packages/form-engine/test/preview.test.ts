import { expect, test } from "vitest";
import { projectPreview, loadDefinition, createSession, dispatch } from "../src/index.ts";
import type { FormDefinitionV1 } from "@fb/contracts";
const draft = (): FormDefinitionV1 => ({
  schemaVersion: "1.0.0",
  kind: "form",
  formId: "frm_partial",
  siteId: "site_sports_synthetic",
  fields: [{ id: "fld_name", key: "name", type: "text", classification: "personal" }],
  steps: [
    {
      id: "stp_input",
      kind: "form",
      content: [{ field: "$local:fld_name" }],
      transitions: [{ default: "" }],
    },
    { id: "stp_review", kind: "review", transitions: [{ default: "stp_complete" }] },
    { id: "stp_complete", kind: "complete" },
  ],
});
test("unfinished paths become preview-only stops without editing the source or using a second engine", () => {
  const original = draft(),
    copy = JSON.stringify(original),
    projection = projectPreview(original),
    ir = loadDefinition(projection.definition);
  expect(JSON.stringify(original)).toBe(copy);
  expect(projection.diagnostics[0]?.code).toBe("PREVIEW_ONLY_UNCONFIGURED_PATH");
  let state = createSession(ir);
  state = dispatch(ir, state, {
    type: "next",
    fromStep: state.current,
    stateVersion: state.stateVersion,
  }).state;
  expect(projection.stops).toContain(state.current);
  expect(state.status).toBe("editing");
  expect(() => loadDefinition(original)).toThrow();
});
test("revoked plugin projects to a core placeholder and loses all executable dependencies", () => {
  const d = draft();
  d.steps[0].transitions = [{ default: "stp_review" }];
  d.fields = [
    {
      id: "fld_name",
      key: "store",
      type: "plugin:storeSel",
      classification: "personal",
      required: true,
    },
  ];
  d.dependencies = {
    capabilities: {
      storeSel: {
        plugin: "@platform/store-selector",
        version: "1.0.0",
        kind: "fieldType",
        capability: "storeSelector",
      },
    },
  };
  const p = projectPreview(d, true);
  expect(p.blockedFields).toEqual(["fld_name"]);
  expect(p.definition.dependencies?.capabilities).toBeUndefined();
  expect(loadDefinition(p.definition).capabilities).toEqual({});
});
test("partial projection does not hide cyclic or unsafe expression errors", () => {
  const d = draft();
  d.steps[0].transitions = [{ default: "stp_input" }];
  expect(() => loadDefinition(projectPreview(d).definition)).toThrow();
});
