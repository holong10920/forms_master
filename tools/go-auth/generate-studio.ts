// Derive the working P0 editor from its single source. The generated bundle is
// mounted in a scoped React subtree, never an iframe or an executable plugin host.
import { build } from "vite";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { root } from "../compiler/src/build.ts";
const source = join(root, "tools/go-auth/studio");
const output = join(root, "tools/go-auth/web/public/studio");
mkdirSync(output, { recursive: true });
const register = `
bridge.register({
 dirty:isDirty,
 beforeLeave:async()=>{if(isDirty()){try{await save()}catch(e){notice(errorText(e));return false}}resetPreview();return true},
 recover:()=>{if(!isDirty()||!S.session)return;try{window.sessionStorage.setItem(RECOVERY_KEY,JSON.stringify({user:S.session.user,draft:S.draft,version:S.version,title:$("form-title").value,currentStep:S.currentStep,selected:S.selected,baseDocument:persistence.baseDocument,editSeq:persistence.editSeq,savedSeq:persistence.savedSeq}));}catch{}},
 navigate:async(path)=>{const match=/^\\/studio\\/sites\\/(site_[a-z0-9_]+)\\/forms\\/(frm_[a-z0-9_]+)$/.exec(path);if(match){if(S.draft?.siteId===match[1]&&S.draft?.formId===match[2]){setMode("build");return;}if(isDirty())await save();if(!S.session.sites.some(s=>s.id===match[1]))return;$("site").value=match[1];await adoptDraft(await api("get",{site:match[1],form:match[2]}));setMode("build");await refreshForms()}else if(path==="/studio"&&S.draft){if(isDirty())await save();closeDraft()}}
});`;
const bundled = await build({
  configFile: false,
  logLevel: "silent",
  build: {
    write: false,
    minify: false,
    lib: { entry: join(source, "admin.js"), name: "FormStudio", formats: ["iife"] },
  },
  plugins: [
    {
      name: "workspace-studio",
      transform(code, id) {
        if (!id.startsWith(source)) return;
        if (id.endsWith("/admin.js")) {
          code = code.replace(
            'const response = await api("login", { user, target });\n  window.location.assign(response.authorizeUrl);',
            'window.location.assign("/api/v1/auth/login?return_to="+encodeURIComponent(bridge.studioPath())+"&lang="+bridge.locale);',
          );
          const start = code.indexOf("function syncUrl() {");
          const end = code.indexOf("// Puts a server copy", start);
          if (start < 0 || end <= start) throw Error("E-STUDIO-ROUTE-SEAM");
          code =
            code.slice(0, start) +
            `function syncUrl(){const prefix="/studio";const url=S.draft?prefix+"/sites/"+encodeURIComponent(site())+"/forms/"+encodeURIComponent(S.draft.formId):prefix;const full=url+"?lang="+bridge.locale;if(window.location.pathname+window.location.search!==full)window.history.pushState(null,"",full);}\n\n` +
            code.slice(end);
          code = code.replace(
            'const siteId = q.get("site"),\n    formId = q.get("form");',
            'const deep=/^\\/studio\\/sites\\/(site_[a-z0-9_]+)\\/forms\\/(frm_[a-z0-9_]+)$/.exec(window.location.pathname); const siteId=deep?.[1]??q.get("site"), formId=deep?.[2]??q.get("form");',
          );
          code = code.replace('if (q.get("login") === "complete") {', "if (true) {");
          if (code.includes('const response = await api("login"') || !code.includes("const deep="))
            throw Error("E-STUDIO-AUTH-OR-DEEP-LINK-SEAM");
          code += "\n" + register;
        }
        if (id.endsWith("/workflow.js"))
          code = code
            .replaceAll("http://127.0.0.1:4175", "http://127.0.0.1:4185")
            .replaceAll("http://127.0.0.1:4173", "http://127.0.0.1:4183");
        if (id.endsWith("/localization.js"))
          code = code.replace(
            'locale = window.sessionStorage.getItem(storageKey) === "vi" ? "vi" : "ja";',
            "locale = bridge.locale;",
          );
        return { code, map: null };
      },
    },
  ],
});
const result = Array.isArray(bundled) ? bundled[0] : bundled;
if (!result || !("output" in result)) throw Error("E-STUDIO-BUNDLE");
const js = result.output.find((o) => o.type === "chunk");
if (!js) throw Error("E-STUDIO-BUNDLE");
writeFileSync(
  join(output, "studio.js"),
  "export function mount(bridge){const window=bridge.window,document=bridge.document,fetch=bridge.fetch;\n" +
    js.code +
    "\n}\n",
);
const html = readFileSync(join(source, "index.html"), "utf8")
  .split("<body>")[1]
  ?.split("</body>")[0]
  ?.replace(/<script[^>]*>[\s\S]*?<\/script>/g, "");
if (!html) throw Error("E-STUDIO-TEMPLATE");
writeFileSync(join(output, "template.html"), html);
// Studio recipes are compiled by the Workspace Tailwind build.
console.log("Derived Studio bundle from existing editor sources");
