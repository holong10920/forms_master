import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { createSession, loadDefinition } from "@fb/form-engine";
import { answerSummary, fieldText, maskText } from "../src/summary.ts";

const fixture = (name: string) =>
  loadDefinition(
    JSON.parse(
      readFileSync(
        new URL(`../../../contracts/fixtures/engine/${name}.json`, import.meta.url),
        "utf8",
      ),
    ),
  );
const text = (t: { ja?: string } | undefined, fallback: string) => t?.ja ?? fallback;

test("confirmation summary groups answers by visited input step with option labels and masked secrets", () => {
  const ir = fixture("pc");
  const kit = ir.nodes.find((n) => n.id === "fld_kit");
  const kitOption = kit && kit.type !== "group" ? kit.options?.[0] : undefined;
  const state = {
    ...createSession(ir, {
      fld_method: "takuhai",
      fld_kit: kitOption?.value ?? "",
      fld_token: "abcd1234",
    }),
    current: "stp_review",
  };
  const sections = answerSummary(ir, state, text);
  expect(sections.map((s) => s.stepId)).toEqual(["stp_method", "stp_takuhai"]);
  const rows = sections.flatMap((s) => s.rows.map((r) => [r.fieldId, r.value]));
  expect(rows).toContainEqual(["fld_method", "宅配"]);
  expect(rows).toContainEqual(["fld_kit", kitOption?.label?.ja ?? kitOption?.value]);
  expect(rows).toContainEqual(["fld_token", "＊＊＊＊"]);
  expect(JSON.stringify(sections)).not.toContain("abcd1234");
});

test("repeatable group answers become a product list with readable cells", () => {
  const ir = fixture("multi-product");
  const state = {
    ...createSession(ir, {
      grp_products: {
        order: ["itm_a"],
        items: {
          itm_a: { fld_product_family: "laundry", fld_title: "洗濯機", fld_condition: "used" },
        },
      },
      fld_agree_policy: true,
    }),
    current: "stp_review",
  };
  const sections = answerSummary(ir, state, text);
  const products = sections.find((s) => s.stepId === "stp_products");
  expect(products?.groups[0]?.items).toHaveLength(1);
  const cells = products?.groups[0]?.items[0]?.map((r) => r.value) ?? [];
  expect(cells[0]).toMatch(/^洗濯機/);
  expect(cells).not.toContain("laundry");
  const customer = sections.find((s) => s.stepId === "stp_customer");
  expect(customer?.rows.find((r) => r.fieldId === "fld_agree_policy")?.value).toBe("はい");
  expect(customer?.rows.find((r) => r.fieldId === "fld_email")?.value).toBe("未入力");
});

test("masking keeps at most the last two characters", () => {
  expect(maskText("09012345678", "partial")).toBe("＊＊＊＊＊＊＊＊＊78");
  expect(maskText("ab", "partial")).toBe("＊＊");
  expect(maskText("secret", "full")).toBe("＊＊＊＊");
  expect(maskText("visible", "none")).toBe("visible");
});

test("checkbox answers list their option labels", () => {
  const field = {
    id: "fld_c",
    key: "c",
    type: "choice.checkboxes" as const,
    classification: "public" as const,
    options: [
      { value: "a", label: { ja: "エー" } },
      { value: "b", label: { ja: "ビー" } },
    ],
  };
  expect(fieldText(field, ["a", "b"], text)).toBe("エー、ビー");
});
