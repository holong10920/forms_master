import { createElement } from "react";
import type { FieldProps, StoreConfig, FieldTypeBrowser } from "@platform/sdk-browser";
function StoreInput(p: FieldProps<string, StoreConfig, { prefecture: string }>) {
  const ready = p.options?.state === "ready" ? p.options.value : [];
  return createElement(
    "select",
    {
      id: p.ids.input,
      "aria-labelledby": p.ids.label,
      "aria-invalid": p.status.invalid,
      disabled: p.status.disabled || p.options?.state !== "ready",
      value: p.value ?? "",
      onChange: (event: React.ChangeEvent<HTMLSelectElement>) => {
        p.onChange(event.target.value || undefined);
      },
      onBlur: () => {
        p.onCommit();
      },
    },
    [
      createElement(
        "option",
        { key: "empty", value: "" },
        p.config.placeholder ?? "店舗を選択してください",
      ),
      ...ready.map((option) =>
        createElement("option", { key: option.id, value: option.id }, option.name),
      ),
    ],
  );
}
export function StoreSelectorSummary(p: { value: string | undefined }) {
  return createElement("span", null, p.value ?? "未選択");
}

export const StoreSelectorField: FieldTypeBrowser<string, StoreConfig, { prefecture: string }> = {
  Component: StoreInput,
  Summary: StoreSelectorSummary,
};
