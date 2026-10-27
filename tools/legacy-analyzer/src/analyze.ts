import postcss from "postcss";
import ts from "typescript";
import { createHash } from "node:crypto";
import {
  readdirSync,
  readFileSync,
  realpathSync,
  statSync,
  mkdirSync,
  writeFileSync,
  existsSync,
  openSync,
  fstatSync,
  ftruncateSync,
  closeSync,
  constants,
} from "node:fs";
import { resolve, relative, dirname } from "node:path";
import { loadDefinition } from "../../../packages/form-engine/src/definition.ts";

export interface Evidence {
  file: string;
  line: number;
  component: string;
  props: Record<string, unknown>;
  propNames: string[];
  dynamic: string[];
}
const allowed = new Set([
  "name",
  "className",
  "path",
  "type",
  "label",
  "placeholder",
  "options",
  "isRequired",
  "required",
  "multiple",
  "value",
  "maxLength",
  "min",
  "max",
]);
function literal(n: ts.Node): unknown {
  if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n))
    return /^(https?|wss?):/i.test(n.text) ? "MANUAL_URL_MAPPING" : n.text.slice(0, 200);
  if (ts.isNumericLiteral(n)) return Number(n.text);
  if (n.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (n.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isArrayLiteralExpression(n)) return n.elements.slice(0, 100).map(literal);
  if (ts.isObjectLiteralExpression(n))
    return Object.fromEntries(
      n.properties.filter(ts.isPropertyAssignment).flatMap((p) => {
        const key = p.name.getText().replace(/^['"]|['"]$/g, "");
        return ["label", "value"].includes(key) ? [[key, literal(p.initializer)]] : [];
      }),
    );
  return undefined;
}
export function inspectSource(file: string, source: string): Evidence[] {
  const ast = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const result: Evidence[] = [];
  function visit(n: ts.Node) {
    if (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) {
      const props: Record<string, unknown> = {};
      const dynamic: string[] = [];
      for (const p of n.attributes.properties)
        if (ts.isJsxAttribute(p) && allowed.has(p.name.getText(ast))) {
          const key = p.name.getText(ast);
          const init = p.initializer;
          const value = !init
            ? true
            : ts.isJsxExpression(init)
              ? init.expression
                ? literal(init.expression)
                : undefined
              : literal(init);
          if (value === undefined) dynamic.push(key);
          else props[key] = value;
        }
      if (
        props.type === "password" ||
        (typeof props.name === "string" &&
          /(token|secret|password|authorization|api_key)/i.test(props.name))
      )
        for (const key of Object.keys(props))
          if (key !== "name" && key !== "type") props[key] = "REDACTED_SENSITIVE";
      const component = n.tagName.getText(ast);
      if (
        Object.keys(props).length ||
        dynamic.length ||
        /^[A-Z]/.test(component) ||
        ["input", "select", "textarea", "button"].includes(component)
      )
        result.push({
          file,
          line: ast.getLineAndCharacterOfPosition(n.getStart(ast)).line + 1,
          component,
          propNames: n.attributes.properties.map((p) =>
            ts.isJsxAttribute(p) ? p.name.getText(ast) : "...spread",
          ),
          props,
          dynamic,
        });
    }
    ts.forEachChild(n, visit);
  }
  visit(ast);
  return result;
}
export function candidate(records: Evidence[]) {
  const fields: Record<string, unknown>[] = [];
  const diagnostics: string[] = [
    "WORKFLOW_MANUAL_MAPPING: generated single-input-step graph; legacy route semantics are not imported.",
    "API_MANUAL_MAPPING: callbacks, remote data and outbound payload transforms require human mapping.",
  ];
  for (const r of records) {
    if (typeof r.props.name !== "string") {
      if (r.dynamic.includes("name") || /^[A-Z]/.test(r.component))
        diagnostics.push(
          `${r.file}:${String(r.line)}: ${r.component}: custom component/binding requires manual mapping`,
        );
      continue;
    }
    if (JSON.stringify(r.props).includes("MANUAL_URL_MAPPING")) {
      diagnostics.push(
        `${r.file}:${String(r.line)}: URL-bearing value requires an approved mapping`,
      );
      continue;
    }
    const key = r.props.name;
    if (
      /(token|secret|password|authorization|api_key)/i.test(key) ||
      ["file", "password", "hidden"].includes(String(r.props.type))
    ) {
      diagnostics.push(`${r.file}:${String(r.line)}: unsupported sensitive/upload/hidden input`);
      continue;
    }
    if (!/^[a-z][a-z0-9_]{0,59}$/i.test(key)) {
      diagnostics.push(`${r.file}:${String(r.line)}: manual nested/repeated identity`);
      continue;
    }
    if (fields.some((f) => f.key === key)) {
      diagnostics.push(
        `${r.file}:${String(r.line)}: repeated field identity; review route/group scope`,
      );
      continue;
    }
    const component = r.component.toLowerCase();
    const inputTypes: Record<string, string> = {
      number: "number",
      email: "email",
      tel: "tel",
      date: "date",
      checkbox: "boolean",
    };
    const type =
      component.includes("radio") || r.props.type === "radio"
        ? "choice.radio"
        : component.includes("check")
          ? Array.isArray(r.props.options)
            ? "choice.checkboxes"
            : "boolean"
          : component.includes("select")
            ? "choice.select"
            : component.includes("textarea") || component === "textarea"
              ? "textarea"
              : (inputTypes[String(r.props.type)] ?? "text");
    if (
      type.startsWith("choice.") &&
      (!Array.isArray(r.props.options) ||
        r.props.options.some((o) => !o || typeof o !== "object" || !("value" in o)))
    ) {
      diagnostics.push(
        `${r.file}:${String(r.line)}: ${key}: dynamic options require manual mapping`,
      );
      continue;
    }
    fields.push({
      id: `fld_${key}`,
      key,
      type,
      classification: "personal",
      persist: "never",
      label: { ja: typeof r.props.label === "string" ? r.props.label : key },
      required: r.props.required === true || r.props.isRequired === true,
      ...(Array.isArray(r.props.options)
        ? {
            options: r.props.options.map((o) => {
              const v = o as Record<string, unknown>;
              return { value: String(v.value), label: { ja: String(v.label ?? v.value) } };
            }),
          }
        : {}),
      ...(typeof r.props.placeholder === "string"
        ? { placeholder: { ja: r.props.placeholder } }
        : {}),
    });
    diagnostics.push(
      `${r.file}:${String(r.line)}: ${key}: review label, validation, classification and workflow; JSX callbacks are not converted`,
    );
  }
  const definition = {
    schemaVersion: "1.0.0",
    kind: "form",
    formId: "frm_legacy_candidate",
    siteId: "site_pc_synthetic",
    fields,
    steps: [
      {
        id: "stp_input",
        kind: "form",
        title: { ja: "取込候補 — 要確認" },
        content: fields.map((f) => ({ field: `$local:${String(f.id)}` })),
        transitions: [{ default: "stp_review" }],
      },
      { id: "stp_review", kind: "review", transitions: [{ default: "stp_complete" }] },
      { id: "stp_complete", kind: "complete" },
    ],
  };
  loadDefinition(definition);
  return { definition, diagnostics, reviewRequired: true, publishable: false };
}
export function styleInventory(file: string, source: string) {
  const result: {
    file: string;
    line: number;
    selector: string;
    property: string;
    value: string;
  }[] = [];
  const ast = postcss.parse(source, { from: undefined });
  const properties = new Set([
    "display",
    "width",
    "max-width",
    "min-width",
    "height",
    "position",
    "top",
    "margin",
    "padding",
    "gap",
    "grid-template-columns",
    "flex-direction",
    "align-items",
    "justify-content",
    "font-family",
    "font-size",
    "font-weight",
    "color",
    "background",
    "background-color",
    "border",
    "border-radius",
    "box-shadow",
    "animation",
    "transition",
  ]);
  ast.walkDecls((d) => {
    if (!properties.has(d.prop)) return;
    const parent = d.parent;
    const selector =
      parent && "selector" in parent
        ? parent.selector
        : parent && "name" in parent
          ? "@" + parent.name
          : "";
    result.push({
      file,
      line: d.source?.start?.line ?? 1,
      selector: selector.slice(0, 200),
      property: d.prop,
      value: /url\(/i.test(d.value) ? "MANUAL_ASSET_MAPPING" : d.value.slice(0, 160),
    });
  });
  return result;
}
export function routeInventory(file: string, source: string) {
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const mappings: { file: string; line: number; route: string; module: string }[] = [];
  function walk(n: ts.Node) {
    if (ts.isPropertyAssignment(n) && ts.isStringLiteral(n.name) && n.name.text.includes(".")) {
      const route = n.name.text;
      function imports(child: ts.Node) {
        if (
          ts.isCallExpression(child) &&
          child.expression.kind === ts.SyntaxKind.ImportKeyword &&
          child.arguments[0] &&
          ts.isStringLiteral(child.arguments[0])
        )
          mappings.push({
            file,
            line: ast.getLineAndCharacterOfPosition(n.getStart(ast)).line + 1,
            route,
            module: child.arguments[0].text,
          });
        ts.forEachChild(child, imports);
      }
      imports(n.initializer);
    } else ts.forEachChild(n, walk);
  }
  walk(ast);
  return mappings;
}
export function contractInventory(file: string, source: string) {
  const ast = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const contracts: {
    file: string;
    line: number;
    name: string;
    properties: { name: string; type: string; required: boolean }[];
  }[] = [];
  function walk(n: ts.Node) {
    const members = ts.isInterfaceDeclaration(n)
      ? n.members
      : ts.isTypeAliasDeclaration(n) && ts.isTypeLiteralNode(n.type)
        ? n.type.members
        : undefined;
    if (
      members &&
      (ts.isInterfaceDeclaration(n) || ts.isTypeAliasDeclaration(n)) &&
      /Props$/.test(n.name.text)
    )
      contracts.push({
        file,
        line: ast.getLineAndCharacterOfPosition(n.getStart(ast)).line + 1,
        name: n.name.text,
        properties: members.filter(ts.isPropertySignature).map((p) => ({
          name: p.name.getText(ast),
          type: p.type ? ts.SyntaxKind[p.type.kind] : "unknown",
          required: !p.questionToken,
        })),
      });
    ts.forEachChild(n, walk);
  }
  walk(ast);
  return contracts;
}
export function analyze(rootInput: string, component?: string) {
  const root = realpathSync(rootInput);
  const files: string[] = [];
  let bytes = 0;
  function walk(dir: string) {
    for (const d of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name, "en"),
    )) {
      if (d.isSymbolicLink()) continue;
      const p = resolve(dir, d.name);
      if (d.isDirectory()) walk(p);
      else if (/\.(tsx?|css)$/.test(d.name)) {
        bytes += statSync(p).size;
        if (files.length >= 5000 || bytes > 32_000_000) throw Error("source budget exceeded");
        files.push(p);
      }
    }
  }
  for (const app of ["apply", "add", "entry", "raiten"]) walk(resolve(root, app, "src"));
  const components: Evidence[] = [];
  const sources = [];
  const dependencies = [];
  const propContracts = [];
  const styles = [];
  const routes = [];
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    const name = relative(root, file);
    sources.push({ file: name, sha256: createHash("sha256").update(source).digest("hex") });
    if (!file.endsWith(".css")) {
      components.push(...inspectSource(name, source));
      propContracts.push(...contractInventory(name, source));
      routes.push(...routeInventory(name, source));
    } else styles.push(...styleInventory(name, source));
    for (const feature of [
      "sessionStorage",
      "localStorage",
      "URLSearchParams",
      "useSearchParams",
      "framer-motion",
      "gsap",
      "axios",
      "fetch(",
      "useZipCodeAutoFill",
      "useEmailValidation",
    ])
      if (source.includes(feature))
        dependencies.push({
          file: name,
          feature,
          classification:
            feature === "axios" || feature === "fetch("
              ? "REQUIRES_APPROVED_ADAPTER"
              : "LOCAL_STATIC",
        });
  }
  let draft;
  if (component) {
    const p = realpathSync(resolve(root, component));
    if (relative(root, p).startsWith("..")) throw Error("component outside source");
    draft = candidate(components.filter((c) => c.file === relative(root, p)));
  }
  return {
    format: 1,
    apps: ["apply", "add", "entry", "raiten"],
    sourceCount: files.length,
    sources,
    components,
    dependencies,
    styles,
    routes,
    propContracts,
    draft,
    limitations: [
      "Static JSX literals only; no execution or credential/environment-file reads.",
      "Route conditions, callbacks, custom components, API payload transforms and CSS require human mapping.",
      "No automatic import or publication. Generated candidate is schema validated and review-only.",
    ],
  };
}
export function writeResult(path: string, value: unknown, sourceRoot: string): void {
  const source = realpathSync(sourceRoot);
  let parent = dirname(resolve(path));
  while (!existsSync(parent)) parent = dirname(parent);
  const output = resolve(realpathSync(parent), relative(parent, resolve(path)));
  const rel = relative(source, output);
  if (rel === "" || (!rel.startsWith("../") && rel !== ".."))
    throw Error("output must be outside read-only source");
  mkdirSync(dirname(output), { recursive: true });
  const fd = openSync(output, constants.O_WRONLY | constants.O_CREAT | constants.O_NOFOLLOW, 0o600);
  try {
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.nlink !== 1) throw Error("output must be a regular unlinked file");
    ftruncateSync(fd, 0);
    writeFileSync(fd, JSON.stringify(value, null, 2) + "\n");
  } finally {
    closeSync(fd);
  }
}
if (import.meta.main) {
  const args = process.argv.slice(2);
  const get = (k: string) => {
    const value = args[args.indexOf(k) + 1];
    if (!value || value.startsWith("--")) throw Error("missing argument");
    return value;
  };
  if (!args.includes("--source") || !args.includes("--out"))
    throw Error("--source and --out required");
  const out = resolve(get("--out"));
  const result = analyze(
    get("--source"),
    args.includes("--component") ? get("--component") : undefined,
  );
  writeResult(out, result, get("--source"));
  if (result.draft)
    writeResult(resolve(dirname(out), "candidate.json"), result.draft, get("--source"));
  console.log(
    `Analyzed ${String(result.sourceCount)} source files; ${String(result.components.length)} JSX records. No reference writes.`,
  );
}
