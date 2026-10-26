// Version 1 structured-field canonicalization, spec #1 §7.6.5. No free-text NFKC.
export function canonical(value: string, kind: string): string {
  if (kind.startsWith("choice.") || kind.startsWith("plugin:")) return value;
  let text = value.trim();
  if (kind === "textarea") text = text.replaceAll("\r\n", "\n");
  if (kind === "email")
    text = text.replace(/[\uff01-\uff5e]/gu, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
  if (kind === "tel" || kind === "postal")
    text = text
      .replace(/[\uff10-\uff19]/gu, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
      .replace(/[\s\-\uff0d\u30fc\u2010]/gu, "");
  if (kind === "katakana") text = text.replace(/[\uff61-\uff9f]+/gu, (c) => c.normalize("NFKC"));
  return text;
}
// The field adapter parses numeric text before entering the typed evaluator.
export function parseNumberInput(text: string): number | undefined {
  const value = text
    .trim()
    .replace(/[\uff10-\uff19\uff0c\uff0d]/gu, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replaceAll(",", "");
  if (!value) return undefined;
  if (!/^-?[0-9]+$/u.test(value)) throw new Error("E-TYPE");
  const result = Number(value);
  if (!Number.isSafeInteger(result)) throw new Error("E-NUM-RANGE");
  return Object.is(result, -0) ? 0 : result;
}
