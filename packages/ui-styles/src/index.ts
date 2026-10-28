/** Small recipe composition for explicit Tailwind properties. No DOM, class generation or CSS
 * evaluation. Complete utility strings remain visible to Tailwind's source scanner. */
const groups: Readonly<Record<string, string>> = {
  flex: "display",
  grid: "display",
  block: "display",
  hidden: "display",
  "inline-flex": "display",
  "inline-block": "display",
  relative: "position",
  absolute: "position",
  fixed: "position",
  sticky: "position",
  "items-center": "align-items",
  "items-stretch": "align-items",
  "items-start": "align-items",
  "justify-center": "justify-content",
  "justify-between": "justify-content",
  "justify-start": "justify-content",
  "justify-end": "justify-content",
  "flex-col": "flex-direction",
  "flex-row": "flex-direction",
  "flex-wrap": "flex-wrap",
  "flex-nowrap": "flex-wrap",
  "min-w-0": "min-width",
  "min-h-0": "min-height",
  "box-border": "box-sizing",
  "font-normal": "font-weight",
  "font-medium": "font-weight",
  "font-semibold": "font-weight",
  "font-bold": "font-weight",
  "whitespace-nowrap": "white-space",
  "overflow-hidden": "overflow",
  "overflow-auto": "overflow",
  "overflow-x-auto": "overflow-x",
  "overflow-y-auto": "overflow-y",
  "cursor-pointer": "cursor",
  "cursor-not-allowed": "cursor",
  "text-left": "text-align",
  "text-center": "text-align",
  "border-collapse": "border-collapse",
  "border-separate": "border-collapse",
  "flex-none": "flex",
  isolate: "isolation",
};
export function mergeUtilities(...values: string[]): string {
  const result = new Map<string, string>();
  for (const token of values.join(" ").split(/\s+/).filter(Boolean)) {
    let depth = 0,
      split = -1;
    for (let i = 0; i < token.length; i++) {
      if (token[i] === "[") depth++;
      else if (token[i] === "]") depth--;
      else if (token[i] === ":" && depth === 0) split = i;
    }
    const utility = token.slice(split + 1).replace(/!$/, "");
    const property = /^\[([^:]+):/.exec(utility)?.[1] ?? groups[utility];
    const key = property
      ? token.slice(0, split + 1) + (token.endsWith("!") ? "!" : "") + property
      : token;
    result.delete(key);
    result.set(key, token);
  }
  return [...result.values()].join(" ");
}
