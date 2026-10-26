/** Finite trusted local themes: data only, site-scoped and revision pinned. */
export const themes = [
  {
    id: "theme_sports@1",
    site: "site_sports_synthetic",
    label: "Sports · 標準",
    accent: "#0f766e",
    background: "#f1f5f9",
    foreground: "#1e293b",
  },
  {
    id: "theme_sports_contrast@1",
    site: "site_sports_synthetic",
    label: "Sports · 高コントラスト",
    accent: "#164e63",
    background: "#ffffff",
    foreground: "#111827",
  },
  {
    id: "theme_pc@1",
    site: "site_pc_synthetic",
    label: "PC · 標準",
    accent: "#1e40af",
    background: "#eff6ff",
    foreground: "#1e293b",
  },
  {
    id: "theme_pc_contrast@1",
    site: "site_pc_synthetic",
    label: "PC · 高コントラスト",
    accent: "#1e3a8a",
    background: "#ffffff",
    foreground: "#111827",
  },
] as const;
export function resolveTheme(site: string, pin?: string) {
  const entry = themes.find((t) => t.site === site && (!pin || t.id === pin));
  if (!entry) throw Error("E-THEME-NOT-APPROVED");
  return {
    ...entry,
    css: `:root{--form-accent:${entry.accent};--form-background:${entry.background};--form-foreground:${entry.foreground}}`,
  };
}
