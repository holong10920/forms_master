/** Host-owned data-to-CSS-variable mapping. Never accepts CSS text, URLs or selectors. */
export type Appearance = Partial<
  Record<
    | "maxWidth"
    | "padding"
    | "margin"
    | "gap"
    | "columns"
    | "fontSize"
    | "fontWeight"
    | "radius"
    | "borderWidth",
    number
  > &
    Record<"align" | "color" | "background" | "borderColor" | "shadow", string>
> & { mobile?: Appearance };
const keys: Record<string, string> = {
  maxWidth: "max-width",
  padding: "padding",
  margin: "margin",
  gap: "gap",
  columns: "columns",
  fontSize: "font-size",
  fontWeight: "font-weight",
  radius: "radius",
  borderWidth: "border-width",
  align: "align",
  color: "color",
  background: "background",
  borderColor: "border-color",
  shadow: "shadow",
};
export function appearanceVariables(
  value?: Appearance,
  scope: "" | "field-" = "",
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [prefix, values] of [
    ["", value],
    ["mobile-", value?.mobile],
  ] as const)
    for (const [key, v] of Object.entries(values ?? {})) {
      if (!keys[key]) continue;
      if (typeof v === "number" && Number.isSafeInteger(v) && v >= 0 && v <= 960)
        out[`--fb-${scope}${prefix}${keys[key]}`] =
          `${String(v)}${["columns", "fontWeight"].includes(key) ? "" : "px"}`;
      else if (
        typeof v === "string" &&
        (/^#[a-fA-F0-9]{6}$/.test(v) || ["left", "center", "right", "none", "soft"].includes(v))
      )
        out[`--fb-${scope}${prefix}${keys[key]}`] =
          key === "shadow" ? (v === "soft" ? "0 8px 24px #0f172a18" : "none") : v;
    }
  return out;
}
export function applyAppearance(node: HTMLElement, value?: Appearance, scope?: "field"): void {
  for (const [key, v] of Object.entries(appearanceVariables(value, scope ? "field-" : "")))
    node.style.setProperty(key, v);
}

export type SiteAppearance = Appearance & {
  primaryColor?: string;
  secondaryColor?: string;
  requiredColor?: string;
  inputBorderColor?: string;
  focusColor?: string;
  fontFamily?: "system" | "hiragino" | "noto";
  headerLogo?: "none" | "instrument-local";
  headerText?: string;
  progressStyle?: "circles" | "bar";
  requiredBadge?: "solid" | "outline";
};
/** All values come from bounded schema tokens. No URL/CSS/script input. */
export function siteAppearance(host: HTMLElement, appearance?: SiteAppearance): void {
  for (const [key, variable] of Object.entries({
    primaryColor: "--form-accent",
    secondaryColor: "--fb-secondary",
    requiredColor: "--fb-required",
    inputBorderColor: "--fb-input-border",
    focusColor: "--fb-focus",
  })) {
    const v = appearance?.[key as keyof SiteAppearance];
    if (typeof v === "string" && /^#[a-fA-F0-9]{6}$/.test(v)) host.style.setProperty(variable, v);
  }
  if (appearance?.requiredColor) host.style.setProperty("--fb-required-text", "#ffffff");
  const fonts = {
    system: "system-ui, sans-serif",
    hiragino: '"Hiragino Kaku Gothic ProN", "Yu Gothic", Meiryo, sans-serif',
    noto: '"Noto Sans JP", sans-serif',
  };
  if (appearance?.fontFamily) host.style.fontFamily = fonts[appearance.fontFamily];
  host.dataset.requiredBadge = appearance?.requiredBadge ?? "solid";
  host.dataset.progressStyle = appearance?.progressStyle ?? "circles";
}
