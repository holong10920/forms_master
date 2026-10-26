import { expect, test } from "vitest";
import { themes, resolveTheme } from "../src/themes.ts";
test("themes are finite, site-scoped, revision pinned and contain data-only CSS", () => {
  expect(themes).toHaveLength(4);
  for (const theme of themes) {
    const resolved = resolveTheme(theme.site, theme.id);
    expect(resolved.css).toContain(`--form-accent:${theme.accent}`);
    expect(resolved.css).not.toMatch(/url\(|@import|javascript|expression/iu);
    expect(() =>
      resolveTheme(
        theme.site === "site_pc_synthetic" ? "site_sports_synthetic" : "site_pc_synthetic",
        theme.id,
      ),
    ).toThrow("E-THEME-NOT-APPROVED");
  }
  expect(() => resolveTheme("site_unknown", "theme_pc@1")).toThrow("E-THEME-NOT-APPROVED");
});
