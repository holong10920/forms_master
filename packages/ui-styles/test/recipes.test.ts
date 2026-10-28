import { expect, test } from "vitest";
import { mergeUtilities } from "../src/index.ts";
test("later component variants override base properties without growing repeated renders", () => {
  const value = mergeUtilities(
    "btn [padding:0_12px] [color:#344054]",
    "btn-icon [padding:0] [color:#fff]",
  );
  expect(value).toBe("btn btn-icon [padding:0] [color:#fff]");
  expect(mergeUtilities(value, "btn-icon [padding:0] [color:#fff]")).toBe(value);
  expect(mergeUtilities("block", "flex")).toBe("flex");
});
test("responsive, state, important, nested selectors and typed variables remain independent", () => {
  const value = mergeUtilities(
    "[color:var(--fb-color,_#fff)] max-[640px]:hidden",
    "hover:[color:red] max-[640px]:flex [color:var(--fb-color,_#000)] [&_[aria-expanded=true]]:block [color:blue]!",
  );
  expect(value).not.toContain("[color:var(--fb-color,_#fff)]");
  expect(value).toContain("[color:var(--fb-color,_#000)]");
  expect(value).toContain("hover:[color:red]");
  expect(value).toContain("max-[640px]:flex");
  expect(value).toContain("[&_[aria-expanded=true]]:block");
  expect(value).toContain("[color:blue]!");
});
