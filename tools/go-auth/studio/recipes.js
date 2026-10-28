import { mergeUtilities } from "../../../packages/ui-styles/src/index.ts";
// Tailwind component recipes. Semantic hooks are retained for DOM queries and state.
// Keep complete, statically detectable utilities; never interpolate user-provided classes.
export const rootUtilities = mergeUtilities(
  '[--font:-apple-system,_BlinkMacSystemFont,_"Segoe_UI",_"Hiragino_Sans",_"Hiragino_Kaku_Gothic_ProN",_"Noto_Sans_JP",_"Noto_Sans",_"Yu_Gothic_UI",_Meiryo,_Roboto,_"Helvetica_Neue",_Arial,_sans-serif] [--mono:ui-monospace,_"SF_Mono",_Menlo,_Consolas,_"Liberation_Mono",_monospace] [--bg:#f4f5f7] [--surface:#ffffff] [--surface-2:#f9fafb] [--surface-3:#f2f4f7] [--border:#e4e7ec] [--border-strong:#d0d5dd] [--text:#101828] [--text-2:#344054] [--text-3:#5d6679] [--accent:#4f46e5] [--accent-hover:#4338ca] [--accent-soft:#eef2ff] [--accent-border:#c7d2fe] [--success:#067647] [--success-soft:#ecfdf3] [--success-border:#abefc6] [--warning:#b54708] [--warning-soft:#fffaeb] [--warning-border:#fedf89] [--danger:#c4320a] [--danger-strong:#b42318] [--danger-soft:#fef3f2] [--danger-border:#fecdca] [--info:#175cd3] [--info-soft:#eff8ff] [--radius-s:6px] [--radius:8px] [--radius-l:12px] [--shadow-xs:0_1px_2px_rgb(16_24_40_/_5%)] [--shadow-s:0_1px_3px_rgb(16_24_40_/_8%),_0_1px_2px_rgb(16_24_40_/_4%)] [--shadow-m:0_12px_24px_-6px_rgb(16_24_40_/_14%),_0_4px_8px_-2px_rgb(16_24_40_/_6%)] [--shadow-l:0_24px_48px_-12px_rgb(16_24_40_/_22%)] [--ring:0_0_0_3px_rgb(79_70_229_/_28%)] [--topbar-h:56px] [--ease:cubic-bezier(0.2,_0,_0,_1)] [--form-accent:#0f766e] [--form-background:#f1f5f9] [--form-foreground:#1e293b] [:where(&)_*]:box-border [:where(&)_*::before]:box-border [:where(&)_*::after]:box-border [:where(&)_[hidden]]:hidden! [-webkit-text-size-adjust:100%] [margin:0] [font-family:var(--font)] [font-size:14px] [line-height:1.55] [color:var(--text)] [background:var(--bg)] [-webkit-font-smoothing:antialiased] [text-rendering:optimizeLegibility] [:where(&)_:lang(ja)]:[line-break:strict] [:where(&)_h1]:[margin:0] [:where(&)_h2]:[margin:0] [:where(&)_h3]:[margin:0] [:where(&)_h4]:[margin:0] [:where(&)_p]:[margin:0] [:where(&)_button]:[font:inherit] [:where(&)_button]:[color:inherit] [:where(&)_input]:[font:inherit] [:where(&)_input]:[color:inherit] [:where(&)_select]:[font:inherit] [:where(&)_select]:[color:inherit] [:where(&)_textarea]:[font:inherit] [:where(&)_textarea]:[color:inherit] [:where(&)_a]:[color:var(--accent)] [:where(&)_:focus-visible]:[outline:2px_solid_var(--accent)] [:where(&)_:focus-visible]:[outline-offset:2px] [:where(&)_[data-drop="before"]]:[box-shadow:inset_0_2px_0_var(--accent)] [:where(&)_[data-drop="after"]]:[box-shadow:inset_0_-2px_0_var(--accent)] [:where(&)_[data-drop="into"]]:[outline:2px_dashed_var(--accent)] [:where(&)_[data-drop="into"]]:[outline-offset:-2px] [@media((prefers-reduced-motion:_reduce))]:[:where(&)_*]:[animation-duration:1ms]! [@media((prefers-reduced-motion:_reduce))]:[:where(&)_*]:[animation-iteration-count:1]! [@media((prefers-reduced-motion:_reduce))]:[:where(&)_*]:[transition-duration:1ms]! [@media((prefers-reduced-motion:_reduce))]:[:where(&)_*::before]:[animation-duration:1ms]! [@media((prefers-reduced-motion:_reduce))]:[:where(&)_*::before]:[animation-iteration-count:1]! [@media((prefers-reduced-motion:_reduce))]:[:where(&)_*::before]:[transition-duration:1ms]! [@media((prefers-reduced-motion:_reduce))]:[:where(&)_*::after]:[animation-duration:1ms]! [@media((prefers-reduced-motion:_reduce))]:[:where(&)_*::after]:[animation-iteration-count:1]! [@media((prefers-reduced-motion:_reduce))]:[:where(&)_*::after]:[transition-duration:1ms]!',
);
const recipes = {
  ".sr-only":
    "absolute [width:1px] [height:1px] [padding:0] [margin:-1px] overflow-hidden [clip:rect(0_0_0_0)] whitespace-nowrap [border-width:0px] [border-style:none] [border-color:currentColor]",
  ".mono": "[font-family:var(--mono)] [font-size:12px]",
  ".muted": "[color:var(--text-3)]",
  ".small": "[font-size:12.5px]",
  ".icon":
    "[width:16px] [height:16px] flex-none [stroke:currentColor] [fill:none] [stroke-width:1.8] [stroke-linecap:round] [stroke-linejoin:round]",
  ".icon-lg": "[width:20px] [height:20px]",
  ".btn":
    'inline-flex items-center justify-center [gap:6px] [height:34px] [padding:0_12px] [border-width:1px] [border-style:solid] [border-color:var(--border-strong)] [border-radius:var(--radius)] [background:var(--surface)] [color:var(--text-2)] font-semibold [font-size:13.5px] whitespace-nowrap cursor-pointer [box-shadow:var(--shadow-xs)] [transition:background-color_120ms_var(--ease),_border-color_120ms_var(--ease),_color_120ms_var(--ease),_box-shadow_120ms_var(--ease)] [&:where(.btn):hover]:[background:var(--surface-2)] [&:where(.btn):hover]:[color:var(--text)] [&:where(.btn):focus-visible]:[outline:none] [&:where(.btn):focus-visible]:[box-shadow:var(--ring)] [&:where(.btn):disabled]:[opacity:0.5] [&:where(.btn):disabled]:cursor-not-allowed [&:where(.btn)[aria-disabled="true"]]:[opacity:0.5] [&:where(.btn)[aria-disabled="true"]]:cursor-not-allowed',
  ".btn-primary":
    "[background:var(--accent)] [border-color:var(--accent)] [color:#fff] [&:where(.btn-primary):hover]:[background:var(--accent-hover)] [&:where(.btn-primary):hover]:[border-color:var(--accent-hover)] [&:where(.btn-primary):hover]:[color:#fff]",
  ".btn-ghost":
    "[background:transparent] [border-color:transparent] [box-shadow:none] [color:var(--text-2)] [&:where(.btn-ghost):hover]:[background:var(--surface-3)]",
  ".btn-danger":
    "[color:var(--danger-strong)] [border-color:var(--danger-border)] [&:where(.btn-danger):hover]:[background:var(--danger-soft)] [&:where(.btn-danger):hover]:[color:var(--danger-strong)]",
  ".btn-danger-solid":
    "[background:var(--danger-strong)] [border-color:var(--danger-strong)] [color:#fff] [&:where(.btn-danger-solid):hover]:[background:#912018] [&:where(.btn-danger-solid):hover]:[color:#fff]",
  ".btn-sm":
    "[height:28px] [padding:0_9px] [font-size:12.5px] [gap:5px] [&:where(.btn-sm).btn-icon]:[width:28px]",
  ".btn-icon": "[width:34px] [padding:0]",
  ".btn-block": "[width:100%]",
  ".btn-link":
    "[border-width:0px] [border-style:none] [border-color:currentColor] [background:none] [padding:0] [color:var(--accent)] font-semibold cursor-pointer [&:where(.btn-link):hover]:[text-decoration:underline]",
  ".field":
    "grid [gap:6px] [margin:0_0_14px] [&:where(.field)_>_.field-label]:[font-size:12.5px] [&:where(.field)_>_.field-label]:font-semibold [&:where(.field)_>_.field-label]:[color:var(--text-2)] [&:where(.field)_>_.field-label]:flex [&:where(.field)_>_.field-label]:items-center [&:where(.field)_>_.field-label]:[gap:6px]",
  ".field-label":
    "[font-size:12.5px] font-semibold [color:var(--text-2)] flex items-center [gap:6px]",
  ".field-hint": "[font-size:12px] [color:var(--text-3)]",
  ".field-error": "[font-size:12px] [color:var(--danger-strong)]",
  ".input":
    '[width:100%] [min-height:34px] [padding:6px_10px] [border-width:1px] [border-style:solid] [border-color:var(--border-strong)] [border-radius:var(--radius)] [background:var(--surface)] [color:var(--text)] [box-shadow:var(--shadow-xs)] [transition:border-color_120ms_var(--ease),_box-shadow_120ms_var(--ease)] [&:where(.input)::placeholder]:[color:#98a2b3] [&:where(.input):focus]:[outline:none] [&:where(.input):focus]:[border-color:var(--accent)] [&:where(.input):focus]:[box-shadow:var(--ring)] [&:where(.input):disabled]:[background:var(--surface-3)] [&:where(.input):disabled]:[color:var(--text-3)] [&:where(.input)[aria-invalid="true"]]:[border-color:var(--danger-strong)] [&:where(.input).mono]:[font-size:12.5px]',
  ".select":
    "[width:100%] [min-height:34px] [padding:6px_10px] [border-width:1px] [border-style:solid] [border-color:var(--border-strong)] [border-radius:var(--radius)] [background:var(--surface)] [color:var(--text)] [box-shadow:var(--shadow-xs)] [transition:border-color_120ms_var(--ease),_box-shadow_120ms_var(--ease)] [&:where(.select):focus]:[outline:none] [&:where(.select):focus]:[border-color:var(--accent)] [&:where(.select):focus]:[box-shadow:var(--ring)] [&:where(.select):disabled]:[background:var(--surface-3)] [&:where(.select):disabled]:[color:var(--text-3)] [appearance:none] [padding-right:30px] cursor-pointer [background-image:linear-gradient(45deg,_transparent_50%,_var(--text-3)_50%),_linear-gradient(135deg,_var(--text-3)_50%,_transparent_50%)] [background-position:calc(100%_-_15px)_52%,_calc(100%_-_10px)_52%] [background-size:5px_5px,_5px_5px] [background-repeat:no-repeat] [&:where(.select)[multiple]]:[background-image:none] [&:where(.select)[multiple]]:[padding-right:10px] [&:where(.select)[multiple]]:[min-height:84px]",
  ".textarea":
    '[width:100%] [min-height:34px] [padding:6px_10px] [border-width:1px] [border-style:solid] [border-color:var(--border-strong)] [border-radius:var(--radius)] [background:var(--surface)] [color:var(--text)] [box-shadow:var(--shadow-xs)] [transition:border-color_120ms_var(--ease),_box-shadow_120ms_var(--ease)] [min-height:84px] [resize:vertical] [line-height:1.5] [&:where(.textarea)::placeholder]:[color:#98a2b3] [&:where(.textarea):focus]:[outline:none] [&:where(.textarea):focus]:[border-color:var(--accent)] [&:where(.textarea):focus]:[box-shadow:var(--ring)] [&:where(.textarea):disabled]:[background:var(--surface-3)] [&:where(.textarea):disabled]:[color:var(--text-3)] [&:where(.textarea)[aria-invalid="true"]]:[border-color:var(--danger-strong)]',
  ".select-sm": "[min-height:28px] [padding-top:3px] [padding-bottom:3px] [font-size:13px]",
  ".input-sm": "[min-height:28px] [padding-top:3px] [padding-bottom:3px] [font-size:13px]",
  ".inline-input":
    "[border-width:1px] [border-style:solid] [border-color:transparent] [background:transparent] [border-radius:var(--radius-s)] [padding:2px_6px] [box-shadow:none] [&:where(.inline-input):hover]:[border-color:var(--border)] [&:where(.inline-input):focus]:[outline:none] [&:where(.inline-input):focus]:[border-color:var(--accent)] [&:where(.inline-input):focus]:[box-shadow:var(--ring)] [&:where(.inline-input):focus]:[background:var(--surface)]",
  ".row": "flex items-center [gap:8px]",
  ".row-wrap": "flex-wrap",
  ".spacer": "[flex:1]",
  ".grid-2": "grid [grid-template-columns:1fr_1fr] [gap:10px]",
  ".switch":
    "flex items-center [gap:10px] cursor-pointer [user-select:none] [min-height:30px] [&:where(.switch)_input]:absolute [&:where(.switch)_input]:[opacity:0] [&:where(.switch)_input]:[width:1px] [&:where(.switch)_input]:[height:1px] [&:where(.switch)_input:checked_+_.switch-track]:[background:var(--accent)] [&:where(.switch)_input:checked_+_.switch-track::after]:[transform:translateX(14px)] [&:where(.switch)_input:focus-visible_+_.switch-track]:[box-shadow:var(--ring)] [&:where(.switch)_input:disabled_+_.switch-track]:[opacity:0.5]",
  ".switch-track":
    'relative [width:34px] [height:20px] flex-none [border-radius:999px] [background:#d0d5dd] [transition:background-color_140ms_var(--ease)] [&:where(.switch-track)::after]:[content:""] [&:where(.switch-track)::after]:absolute [&:where(.switch-track)::after]:[top:2px] [&:where(.switch-track)::after]:[left:2px] [&:where(.switch-track)::after]:[width:16px] [&:where(.switch-track)::after]:[height:16px] [&:where(.switch-track)::after]:[border-radius:50%] [&:where(.switch-track)::after]:[background:#fff] [&:where(.switch-track)::after]:[box-shadow:0_1px_2px_rgb(16_24_40_/_25%)] [&:where(.switch-track)::after]:[transition:transform_140ms_var(--ease)]',
  ".switch-text":
    "grid [gap:1px] [&:where(.switch-text)_b]:font-semibold [&:where(.switch-text)_b]:[font-size:13.5px] [&:where(.switch-text)_b]:[color:var(--text)] [&:where(.switch-text)_small]:[font-size:12px] [&:where(.switch-text)_small]:[color:var(--text-3)]",
  ".segmented":
    "inline-flex [padding:3px] [gap:2px] [border-radius:var(--radius)] [background:var(--surface-3)] [border-width:1px] [border-style:solid] [border-color:var(--border)] [&:where(.segmented)_label]:relative [&:where(.segmented)_label]:inline-flex [&:where(.segmented)_label]:items-center [&:where(.segmented)_label]:[gap:6px] [&:where(.segmented)_label]:[height:28px] [&:where(.segmented)_label]:[padding:0_12px] [&:where(.segmented)_label]:[border-radius:6px] [&:where(.segmented)_label]:[font-size:13px] [&:where(.segmented)_label]:font-semibold [&:where(.segmented)_label]:[color:var(--text-3)] [&:where(.segmented)_label]:cursor-pointer [&:where(.segmented)_label]:whitespace-nowrap [&:where(.segmented)_input]:absolute [&:where(.segmented)_input]:[opacity:0] [&:where(.segmented)_input]:[inset:0] [&:where(.segmented)_input]:[margin:0] [&:where(.segmented)_input]:cursor-pointer [&:where(.segmented)_label:has(input:checked)]:[background:var(--surface)] [&:where(.segmented)_label:has(input:checked)]:[color:var(--text)] [&:where(.segmented)_label:has(input:checked)]:[box-shadow:var(--shadow-s)] [&:where(.segmented)_label:has(input:focus-visible)]:[box-shadow:var(--ring)] [&:where(.segmented).full]:flex [&:where(.segmented).full_label]:[flex:1] [&:where(.segmented).full_label]:justify-center",
  ".chip":
    "inline-flex items-center [gap:5px] [height:22px] [padding:0_8px] [border-radius:999px] [font-size:12px] font-semibold [line-height:1] whitespace-nowrap [border-width:1px] [border-style:solid] [border-color:var(--border)] [background:var(--surface-2)] [color:var(--text-2)] [&:where(.chip)_.icon]:[width:12px] [&:where(.chip)_.icon]:[height:12px]",
  ".chip-dot":
    '[&:where(.chip-dot)::before]:[content:""] [&:where(.chip-dot)::before]:[width:6px] [&:where(.chip-dot)::before]:[height:6px] [&:where(.chip-dot)::before]:[border-radius:50%] [&:where(.chip-dot)::before]:[background:currentColor]',
  ".chip-success":
    "[background:var(--success-soft)] [border-color:var(--success-border)] [color:var(--success)]",
  ".chip-warning":
    "[background:var(--warning-soft)] [border-color:var(--warning-border)] [color:var(--warning)]",
  ".chip-danger":
    "[background:var(--danger-soft)] [border-color:var(--danger-border)] [color:var(--danger-strong)]",
  ".chip-accent":
    "[background:var(--accent-soft)] [border-color:var(--accent-border)] [color:var(--accent-hover)]",
  ".chip-info": "[background:var(--info-soft)] [border-color:#b2ddff] [color:var(--info)]",
  ".kbd":
    "[font-family:var(--mono)] [font-size:11px] [padding:1px_5px] [border-radius:4px] [border-width:1px] [border-style:solid] [border-color:var(--border-strong)] [background:var(--surface-2)] [color:var(--text-3)]",
  ".card":
    "[background:var(--surface)] [border-width:1px] [border-style:solid] [border-color:var(--border)] [border-radius:var(--radius-l)] [box-shadow:var(--shadow-xs)]",
  ".card-pad": "[padding:16px]",
  ".callout":
    "flex [gap:10px] items-start [padding:10px_12px] [border-radius:var(--radius)] [border-width:1px] [border-style:solid] [border-color:var(--border)] [background:var(--surface-2)] [font-size:13px] [color:var(--text-2)] [&:where(.callout)_.icon]:[margin-top:2px]",
  ".callout-info": "[background:var(--info-soft)] [border-color:#b2ddff] [color:#194185]",
  ".callout-warning":
    "[background:var(--warning-soft)] [border-color:var(--warning-border)] [color:#93370d]",
  ".callout-danger":
    "[background:var(--danger-soft)] [border-color:var(--danger-border)] [color:#912018]",
  ".callout-success":
    "[background:var(--success-soft)] [border-color:var(--success-border)] [color:#05603a]",
  ".section-title":
    "[font-size:11.5px] font-bold [letter-spacing:0.04em] [text-transform:uppercase] [color:var(--text-3)] [margin:0_0_8px]",
  ".divider":
    "[height:1px] [background:var(--border)] [margin:16px_0] [border-width:0px] [border-style:none] [border-color:currentColor]",
  ".topbar":
    "sticky [top:0] [z-index:40] flex items-center [gap:12px] [height:var(--topbar-h)] [padding:0_12px_0_14px] [background:var(--surface)] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:var(--border)] max-[1600.02px]:[&:where(.topbar):has(#modes:not([hidden]))_.avatar-meta]:hidden max-[1600.02px]:[&:where(.topbar):has(#modes:not([hidden]))_.brand-name]:hidden max-[1440.02px]:[&:where(.topbar):has(#modes:not([hidden]))_.btn-collapse_.btn-label]:absolute max-[1440.02px]:[&:where(.topbar):has(#modes:not([hidden]))_.btn-collapse_.btn-label]:[width:1px] max-[1440.02px]:[&:where(.topbar):has(#modes:not([hidden]))_.btn-collapse_.btn-label]:[height:1px] max-[1440.02px]:[&:where(.topbar):has(#modes:not([hidden]))_.btn-collapse_.btn-label]:overflow-hidden max-[1440.02px]:[&:where(.topbar):has(#modes:not([hidden]))_.btn-collapse_.btn-label]:[clip:rect(0_0_0_0)] max-[1440.02px]:[&:where(.topbar):has(#modes:not([hidden]))_.btn-collapse_.btn-label]:whitespace-nowrap max-[1440.02px]:[&:where(.topbar):has(#modes:not([hidden]))_.btn-collapse]:[padding:0_9px] @max-[1250.02px]/studio:[&:where(.topbar)_.brand-name]:absolute @max-[1250.02px]/studio:[&:where(.topbar)_.brand-name]:[width:1px] @max-[1250.02px]/studio:[&:where(.topbar)_.brand-name]:[height:1px] @max-[1250.02px]/studio:[&:where(.topbar)_.brand-name]:[clip-path:inset(50%)] @max-[1250.02px]/studio:[&:where(.topbar)_.brand-name]:overflow-hidden @max-[1250.02px]/studio:[&:where(.topbar)_.brand-name]:whitespace-nowrap @max-[1250.02px]/studio:[gap:8px] @max-[1250.02px]/studio:[&:where(.topbar)_.btn-collapse_.btn-label]:absolute @max-[1250.02px]/studio:[&:where(.topbar)_.btn-collapse_.btn-label]:[width:1px] @max-[1250.02px]/studio:[&:where(.topbar)_.btn-collapse_.btn-label]:[height:1px] @max-[1250.02px]/studio:[&:where(.topbar)_.btn-collapse_.btn-label]:[clip-path:inset(50%)] @max-[1250.02px]/studio:[&:where(.topbar)_.btn-collapse_.btn-label]:overflow-hidden @max-[1250.02px]/studio:[&:where(.topbar)_.btn-collapse_.btn-label]:whitespace-nowrap @max-[540.02px]/studio:[&:where(.topbar):has(#modes:not([hidden]))]:[height:auto] @max-[540.02px]/studio:[&:where(.topbar):has(#modes:not([hidden]))]:[min-height:var(--topbar-h)] @max-[540.02px]/studio:[&:where(.topbar):has(#modes:not([hidden]))]:flex-wrap @max-[540.02px]/studio:[&:where(.topbar):has(#modes:not([hidden]))]:[padding:6px_8px] @max-[540.02px]/studio:[&:where(.topbar):has(#modes:not([hidden]))]:[gap:6px] @max-[540.02px]/studio:[&:where(.topbar):has(#modes:not([hidden]))_.crumbs]:[flex:1] @max-[540.02px]/studio:[&:where(.topbar):has(#modes:not([hidden]))_#modes]:[order:3] @max-[540.02px]/studio:[&:where(.topbar):has(#modes:not([hidden]))_#modes]:[width:100%] @max-[540.02px]/studio:[&:where(.topbar):has(#modes:not([hidden]))_#modes]:justify-between @max-[540.02px]/studio:[&:where(.topbar)_.crumbs_.crumb-select]:hidden @max-[540.02px]/studio:[&:where(.topbar)_.crumbs_.crumb-sep]:hidden @max-[540.02px]/studio:[&:where(.topbar)_.title-input]:min-w-0 @max-[540.02px]/studio:[&:where(.topbar)_.title-input]:[max-width:100%] @max-[540.02px]/studio:[&:where(.topbar)_.title-input]:[width:100%] @max-[540.02px]/studio:[&:where(.topbar)_#status-chip]:hidden",
  ".brand":
    "flex items-center [gap:9px] flex-none [border-width:0px] [border-style:none] [border-color:currentColor] [background:none] [padding:4px] [border-radius:var(--radius)] cursor-pointer [color:var(--text)] [&:where(.brand):hover]:[background:var(--surface-3)]",
  ".brand-mark":
    "grid [place-items:center] [width:28px] [height:28px] [border-radius:8px] [background:linear-gradient(135deg,_#6366f1,_#4338ca)] [color:#fff] [&:where(.brand-mark)_.icon]:[width:16px] [&:where(.brand-mark)_.icon]:[height:16px] [&:where(.brand-mark)_.icon]:[stroke-width:2.2]",
  ".brand-name": "font-bold [font-size:14.5px] [letter-spacing:-0.01em]",
  ".crumbs":
    "flex items-center [gap:4px] min-w-0 [flex:0_1_auto] max-[900.02px]:[&:where(.crumbs)_.crumb-select]:hidden max-[900.02px]:[&:where(.crumbs)_.crumb-sep:first-of-type]:hidden",
  ".crumb-sep": "[color:#c0c5cf] [font-size:18px] [font-weight:300] flex-none",
  ".crumb-select":
    "[flex:0_4_auto] [min-width:88px] [max-width:220px] [min-height:30px] [border-color:transparent] [box-shadow:none] [background-color:transparent] font-semibold [color:var(--text-2)] [font-size:13.5px] [&:where(.crumb-select):hover]:[background-color:var(--surface-3)] max-[1100.02px]:[max-width:150px] @max-[1000.02px]/studio:[max-width:140px]",
  ".crumb-link":
    "[border-width:0px] [border-style:none] [border-color:currentColor] [background:none] [padding:4px_8px] [border-radius:var(--radius-s)] font-semibold [color:var(--text-2)] cursor-pointer whitespace-nowrap [&:where(.crumb-link):hover]:[background:var(--surface-3)] [&:where(.crumb-link):hover]:[color:var(--text)]",
  ".title-input":
    "[flex:1_1_180px] [min-width:96px] [max-width:300px] font-bold [font-size:14.5px] [color:var(--text)] [text-overflow:ellipsis] max-[1240.02px]:[max-width:200px]",
  "#status-chip":
    "flex-none max-[1360.02px]:[gap:0] max-[1360.02px]:[padding:0_7px] max-[1360.02px]:[font-size:0]",
  ".modes":
    "flex-none flex [gap:2px] [margin:0_auto] [padding:3px] [border-radius:10px] [background:var(--surface-3)] [border-width:1px] [border-style:solid] [border-color:var(--border)] [&:where(.modes)_+_.topbar-actions]:[margin-left:0]",
  ".mode-tab":
    'inline-flex items-center [gap:6px] [height:30px] [padding:0_12px] [border-width:0px] [border-style:none] [border-color:currentColor] [border-radius:7px] [background:transparent] [color:var(--text-3)] font-semibold [font-size:13px] cursor-pointer whitespace-nowrap [&:where(.mode-tab):hover]:[color:var(--text)] [&:where(.mode-tab)[aria-selected="true"]]:[background:var(--surface)] [&:where(.mode-tab)[aria-selected="true"]]:[color:var(--text)] [&:where(.mode-tab)[aria-selected="true"]]:[box-shadow:var(--shadow-s)] max-[1360.02px]:[padding:0_9px] max-[1240.02px]:[&:where(.mode-tab)_.mode-label]:absolute max-[1240.02px]:[&:where(.mode-tab)_.mode-label]:[width:1px] max-[1240.02px]:[&:where(.mode-tab)_.mode-label]:[height:1px] max-[1240.02px]:[&:where(.mode-tab)_.mode-label]:overflow-hidden max-[1240.02px]:[&:where(.mode-tab)_.mode-label]:[clip:rect(0_0_0_0)] max-[1240.02px]:[&:where(.mode-tab)_.mode-label]:whitespace-nowrap max-[1240.02px]:[padding:0_10px] @max-[1250.02px]/studio:[&:where(.mode-tab)_.mode-label]:absolute @max-[1250.02px]/studio:[&:where(.mode-tab)_.mode-label]:[width:1px] @max-[1250.02px]/studio:[&:where(.mode-tab)_.mode-label]:[height:1px] @max-[1250.02px]/studio:[&:where(.mode-tab)_.mode-label]:[clip-path:inset(50%)] @max-[1250.02px]/studio:[&:where(.mode-tab)_.mode-label]:overflow-hidden @max-[1250.02px]/studio:[&:where(.mode-tab)_.mode-label]:whitespace-nowrap @max-[1250.02px]/studio:[padding:0_10px]',
  ".topbar-actions":
    "flex items-center [gap:8px] flex-none [margin-left:auto] @max-[540.02px]/studio:[gap:4px]",
  ".save-state":
    'inline-flex items-center [gap:6px] [height:30px] [padding:0_10px] [border-width:1px] [border-style:solid] [border-color:transparent] [border-radius:999px] [background:transparent] [color:var(--text-3)] [font-size:12.5px] font-semibold cursor-pointer whitespace-nowrap [&:where(.save-state):hover]:[background:var(--surface-3)] [&:where(.save-state)[data-state="dirty"]]:[color:var(--warning)] [&:where(.save-state)[data-state="saving"]_.icon]:[animation:spin_1s_linear_infinite] [&:where(.save-state)[data-state="error"]]:[color:var(--danger-strong)] [&:where(.save-state)[data-state="error"]]:[background:var(--danger-soft)] [&:where(.save-state)[data-state="error"]]:[border-color:var(--danger-border)] [&:where(.save-state)[data-state="conflict"]]:[color:var(--danger-strong)] [&:where(.save-state)[data-state="conflict"]]:[background:var(--danger-soft)] [&:where(.save-state)[data-state="conflict"]]:[border-color:var(--danger-border)] [&:where(.save-state)[data-state="saved"]]:[color:var(--success)]',
  ".avatar-btn":
    "inline-flex items-center [gap:8px] [height:36px] [padding:0_8px_0_4px] [border-width:1px] [border-style:solid] [border-color:transparent] [border-radius:999px] [background:none] cursor-pointer [max-width:230px] [&:where(.avatar-btn):hover]:[background:var(--surface-3)]",
  ".avatar":
    "grid [place-items:center] [width:28px] [height:28px] flex-none [border-radius:50%] [background:var(--accent-soft)] [color:var(--accent-hover)] font-bold [font-size:12px]",
  ".avatar-meta":
    "grid text-left [line-height:1.2] min-w-0 [&:where(.avatar-meta)_b]:[font-size:12.5px] [&:where(.avatar-meta)_b]:font-semibold [&:where(.avatar-meta)_b]:[color:var(--text)] [&:where(.avatar-meta)_b]:overflow-hidden [&:where(.avatar-meta)_b]:[text-overflow:ellipsis] [&:where(.avatar-meta)_b]:whitespace-nowrap [&:where(.avatar-meta)_small]:[font-size:11.5px] [&:where(.avatar-meta)_small]:[color:var(--text-3)] max-[1360.02px]:hidden",
  ".env-banner":
    "flex items-center justify-center [gap:8px] [height:26px] [font-size:12px] font-semibold [color:#93370d] [background:#fef6e7] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:var(--warning-border)]",
  ".popover":
    "fixed [z-index:80] [min-width:220px] [max-width:340px] [padding:6px] [border-width:1px] [border-style:solid] [border-color:var(--border)] [border-radius:var(--radius-l)] [background:var(--surface)] [box-shadow:var(--shadow-m)] [animation:pop-in_120ms_var(--ease)]",
  ".menu-label":
    "[padding:8px_10px_4px] [font-size:11.5px] font-bold [color:var(--text-3)] [letter-spacing:0.03em]",
  ".menu-item":
    'flex items-center [gap:10px] [width:100%] [min-height:34px] [padding:6px_10px] [border-width:0px] [border-style:none] [border-color:currentColor] [border-radius:var(--radius-s)] [background:none] text-left [font-size:13.5px] [color:var(--text-2)] cursor-pointer [&:where(.menu-item):hover]:[background:var(--surface-3)] [&:where(.menu-item):hover]:[color:var(--text)] [&:where(.menu-item):hover]:[outline:none] [&:where(.menu-item):focus-visible]:[background:var(--surface-3)] [&:where(.menu-item):focus-visible]:[color:var(--text)] [&:where(.menu-item):focus-visible]:[outline:none] [&:where(.menu-item)[aria-checked="true"]]:[color:var(--accent-hover)] [&:where(.menu-item)[aria-checked="true"]]:font-semibold [&:where(.menu-item)_.menu-meta]:[margin-left:auto] [&:where(.menu-item)_.menu-meta]:[font-size:12px] [&:where(.menu-item)_.menu-meta]:[color:var(--text-3)] [&:where(.menu-item).danger]:[color:var(--danger-strong)] [&:where(.menu-item):disabled]:[opacity:0.45] [&:where(.menu-item):disabled]:cursor-not-allowed',
  ".menu-sep": "[height:1px] [margin:6px_4px] [background:var(--border)]",
  ".menu-block": "[padding:8px_10px]",
  ".menu-account-sub": "block [font-size:11.5px] [color:var(--text-3)]",
  ".dialog":
    "[width:min(520px,_calc(100vw_-_32px))] [max-height:calc(100vh_-_64px)] [padding:0] [border-width:1px] [border-style:solid] [border-color:var(--border)] [border-radius:14px] [background:var(--surface)] [color:var(--text)] [box-shadow:var(--shadow-l)] [&:where(.dialog)::backdrop]:[background:rgb(16_24_40_/_42%)] [&:where(.dialog)::backdrop]:[backdrop-filter:blur(2px)] [&:where(.dialog)[open]]:[animation:dialog-in_160ms_var(--ease)]",
  ".dialog-wide": "[width:min(760px,_calc(100vw_-_32px))]",
  ".dialog-head": "flex items-start [gap:12px] [padding:20px_20px_4px]",
  ".dialog-icon":
    "grid [place-items:center] [width:40px] [height:40px] flex-none [border-radius:50%] [background:var(--accent-soft)] [color:var(--accent)] [&:where(.dialog-icon).danger]:[background:var(--danger-soft)] [&:where(.dialog-icon).danger]:[color:var(--danger-strong)] [&:where(.dialog-icon).success]:[background:var(--success-soft)] [&:where(.dialog-icon).success]:[color:var(--success)]",
  ".dialog-title": "[font-size:16.5px] font-bold [line-height:1.4]",
  ".dialog-sub": "[margin-top:4px] [font-size:13.5px] [color:var(--text-3)]",
  ".dialog-body": "[padding:12px_20px_4px] overflow-auto [max-height:calc(100vh_-_240px)]",
  ".dialog-foot": "flex justify-end [gap:8px] [padding:16px_20px_20px]",
  ".toast-host":
    "fixed [left:50%] [bottom:20px] [z-index:90] [transform:translateX(-50%)] [pointer-events:none]",
  ".toast":
    'flex items-center [gap:10px] [max-width:min(560px,_calc(100vw_-_32px))] [padding:10px_14px] [border-radius:10px] [background:#1d2433] [color:#fff] [font-size:13.5px] font-medium [box-shadow:var(--shadow-l)] [transition:opacity_240ms_var(--ease),_transform_240ms_var(--ease)] [&:where(.toast):empty]:[opacity:0] [&:where(.toast)[data-fade="true"]]:[opacity:0] [&:where(.toast)[data-fade="true"]]:[transform:translateY(8px)]',
  ".alert-bar":
    "flex items-start [gap:10px] [padding:9px_14px] [background:var(--danger-soft)] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:var(--danger-border)] [color:#912018] [font-size:13px] [&:where(.alert-bar):empty]:hidden [&:where(.alert-bar)_.alert-text]:[flex:1] [&:where(.alert-bar)_.alert-text]:[white-space:pre-line] [&:where(.alert-bar)_.alert-code]:[font-family:var(--mono)] [&:where(.alert-bar)_.alert-code]:[font-size:11.5px] [&:where(.alert-bar)_.alert-code]:[padding:1px_6px] [&:where(.alert-bar)_.alert-code]:[border-radius:4px] [&:where(.alert-bar)_.alert-code]:[background:rgb(180_35_24_/_10%)] [&:where(.alert-bar).ok]:[background:var(--success-soft)] [&:where(.alert-bar).ok]:[border-color:var(--success-border)] [&:where(.alert-bar).ok]:[color:#05603a]",
  ".conflict-bar":
    "grid [gap:10px] [padding:12px_16px] [background:var(--warning-soft)] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:var(--warning-border)] [color:#7a2e0e] [&:where(.conflict-bar)_h2]:[font-size:14px] [&:where(.conflict-bar)_h2]:font-bold [&:where(.conflict-bar)_details_pre]:[max-height:200px] [&:where(.conflict-bar)_details_pre]:overflow-auto [&:where(.conflict-bar)_details_pre]:[font-size:11.5px] [&:where(.conflict-bar)_details_pre]:[background:#fff] [&:where(.conflict-bar)_details_pre]:[border-width:1px] [&:where(.conflict-bar)_details_pre]:[border-style:solid] [&:where(.conflict-bar)_details_pre]:[border-color:var(--warning-border)] [&:where(.conflict-bar)_details_pre]:[border-radius:var(--radius-s)] [&:where(.conflict-bar)_details_pre]:[padding:8px]",
  ".conflict-cols":
    "grid [grid-template-columns:repeat(auto-fit,_minmax(220px,_1fr))] [gap:12px] [&:where(.conflict-cols)_ul]:[margin:4px_0_0] [&:where(.conflict-cols)_ul]:[padding-left:18px] [&:where(.conflict-cols)_ul]:[font-size:13px]",
  ".signin":
    "[min-height:calc(100vh_-_var(--topbar-h)_-_26px)] grid [place-items:center] [padding:32px_16px] [background:radial-gradient(circle_at_20%_10%,_rgb(99_102_241_/_10%),_transparent_40%),_radial-gradient(circle_at_80%_90%,_rgb(15_118_110_/_8%),_transparent_40%),_var(--bg)]",
  ".signin-card":
    "[width:min(560px,_100%)] [padding:28px] [&:where(.signin-card)_h1]:[font-size:22px] [&:where(.signin-card)_h1]:[font-weight:750] [&:where(.signin-card)_h1]:[letter-spacing:-0.01em] [&:where(.signin-card)_>_p]:[margin-top:6px] [&:where(.signin-card)_>_p]:[color:var(--text-3)]",
  ".account-list": "grid [gap:8px] [margin-top:18px]",
  ".account-card":
    'flex items-center [gap:12px] [width:100%] [padding:12px_14px] [border-width:1px] [border-style:solid] [border-color:var(--border)] [border-radius:var(--radius-l)] [background:var(--surface)] text-left cursor-pointer [transition:border-color_120ms_var(--ease),_box-shadow_120ms_var(--ease),_transform_120ms_var(--ease)] [&:where(.account-card):hover]:[border-color:var(--accent-border)] [&:where(.account-card):hover]:[box-shadow:var(--shadow-s)] [&:where(.account-card):focus-visible]:[outline:none] [&:where(.account-card):focus-visible]:[border-color:var(--accent)] [&:where(.account-card):focus-visible]:[box-shadow:var(--ring)] [&:where(.account-card)_.account-text]:grid [&:where(.account-card)_.account-text]:[flex:1] [&:where(.account-card)_.account-text]:min-w-0 [&:where(.account-card)_b]:[font-size:14px] [&:where(.account-card)_small]:[font-size:12.5px] [&:where(.account-card)_small]:[color:var(--text-3)] [&:where(.account-card)_.chevron]:[color:var(--text-3)] [&:where(.account-card)[aria-current="true"]]:[color:var(--accent-hover)]',
  ".home": "[max-width:1120px] [margin:0_auto] [padding:28px_24px_64px]",
  ".home-head":
    "flex [align-items:flex-end] [gap:16px] [margin-bottom:20px] flex-wrap [&:where(.home-head)_h1]:[font-size:22px] [&:where(.home-head)_h1]:[font-weight:750] [&:where(.home-head)_h1]:[letter-spacing:-0.01em] [&:where(.home-head)_p]:[color:var(--text-3)] [&:where(.home-head)_p]:[margin-top:2px]",
  ".search":
    "relative [width:min(280px,_100%)] [&:where(.search)_.icon]:absolute [&:where(.search)_.icon]:[left:10px] [&:where(.search)_.icon]:[top:9px] [&:where(.search)_.icon]:[color:var(--text-3)] [&:where(.search)_.input]:[padding-left:32px]",
  ".form-grid":
    "grid [grid-template-columns:repeat(auto-fill,_minmax(260px,_1fr))] [gap:14px] [padding:0] [margin:0] [list-style:none] [&:where(.form-grid)_>_.form-grid-empty]:[grid-column:1_/_-1]",
  ".form-card":
    "grid [grid-template-rows:auto_1fr_auto] [gap:10px] [width:100%] [min-height:150px] [padding:16px] [border-width:1px] [border-style:solid] [border-color:var(--border)] [border-radius:var(--radius-l)] [background:var(--surface)] [box-shadow:var(--shadow-xs)] text-left cursor-pointer [transition:border-color_140ms_var(--ease),_box-shadow_140ms_var(--ease),_transform_140ms_var(--ease)] [&:where(.form-card):hover]:[border-color:var(--accent-border)] [&:where(.form-card):hover]:[box-shadow:var(--shadow-m)] [&:where(.form-card):hover]:[transform:translateY(-1px)] [&:where(.form-card):focus-visible]:[outline:none] [&:where(.form-card):focus-visible]:[border-color:var(--accent)] [&:where(.form-card):focus-visible]:[box-shadow:var(--ring)] [&:where(.form-card)_h3]:[font-size:15px] [&:where(.form-card)_h3]:font-bold [&:where(.form-card)_h3]:[line-height:1.4] [&:where(.form-card)_h3]:[overflow-wrap:anywhere]",
  ".form-thumb":
    "grid [gap:5px] [padding:10px] [border-radius:var(--radius)] [background:var(--surface-3)] [&:where(.form-thumb)_span]:block [&:where(.form-thumb)_span]:[height:6px] [&:where(.form-thumb)_span]:[border-radius:3px] [&:where(.form-thumb)_span]:[background:#d9dde5] [&:where(.form-thumb)_span:nth-child(1)]:[width:55%] [&:where(.form-thumb)_span:nth-child(1)]:[background:#c3c8d4] [&:where(.form-thumb)_span:nth-child(2)]:[width:85%] [&:where(.form-thumb)_span:nth-child(3)]:[width:70%]",
  ".form-card-meta":
    "flex items-center [gap:8px] [font-size:12px] [color:var(--text-3)] min-w-0 [&:where(.form-card-meta)_.mono]:overflow-hidden [&:where(.form-card-meta)_.mono]:[text-overflow:ellipsis] [&:where(.form-card-meta)_.mono]:whitespace-nowrap [&:where(.form-card-meta)_.mono]:[font-size:11px]",
  ".new-card":
    "grid [place-items:center] [align-content:center] [gap:8px] [min-height:150px] [border-width:1.5px] [border-style:dashed] [border-color:var(--border-strong)] [border-radius:var(--radius-l)] [background:transparent] [color:var(--text-2)] font-semibold cursor-pointer [width:100%] [&:where(.new-card):hover]:[border-color:var(--accent)] [&:where(.new-card):hover]:[color:var(--accent)] [&:where(.new-card):hover]:[background:var(--accent-soft)] [&:where(.new-card)_.plus]:grid [&:where(.new-card)_.plus]:[place-items:center] [&:where(.new-card)_.plus]:[width:36px] [&:where(.new-card)_.plus]:[height:36px] [&:where(.new-card)_.plus]:[border-radius:50%] [&:where(.new-card)_.plus]:[background:var(--surface)] [&:where(.new-card)_.plus]:[border-width:1px] [&:where(.new-card)_.plus]:[border-style:solid] [&:where(.new-card)_.plus]:[border-color:var(--border)]",
  ".empty":
    "grid [justify-items:center] [gap:8px] [padding:48px_16px] text-center [color:var(--text-3)] [&:where(.empty)_h3]:[font-size:15.5px] [&:where(.empty)_h3]:[color:var(--text)]",
  ".empty-art":
    "grid [place-items:center] [width:56px] [height:56px] [border-radius:16px] [background:var(--accent-soft)] [color:var(--accent)] [margin-bottom:4px] [&:where(.empty-art)_.icon]:[width:26px] [&:where(.empty-art)_.icon]:[height:26px]",
  ".skeleton":
    "[border-radius:var(--radius-l)] [background:linear-gradient(90deg,_#eceef2_25%,_#f5f6f8_50%,_#eceef2_75%)] [background-size:200%_100%] [animation:shimmer_1.2s_linear_infinite] [min-height:150px]",
  ".editor": "[height:calc(100vh_-_var(--topbar-h)_-_26px)] flex flex-col [min-height:480px]",
  ".workspace":
    '[flex:1] min-h-0 grid [grid-template-columns:272px_minmax(0,_1fr)_340px] max-[1240.02px]:[grid-template-columns:248px_minmax(0,_1fr)_312px] max-[1100.02px]:[grid-template-columns:232px_minmax(0,_1fr)_300px] max-[900.02px]:[grid-template-columns:minmax(0,_1fr)] min-w-0 @max-[1250.02px]/studio:[grid-template-columns:224px_minmax(0,_1fr)_292px] @max-[1000.02px]/studio:[grid-template-columns:200px_minmax(0,_1fr)_268px] @max-[820.02px]/studio:[grid-template-columns:minmax(0,_1fr)] @max-[820.02px]/studio:[&:where(.workspace)[data-panel="left"]_.panel-left]:flex @max-[820.02px]/studio:[&:where(.workspace)[data-panel="right"]_.panel-right]:flex max-[900.02px]:relative max-[900.02px]:[&:where(.workspace)[data-panel="left"]_.panel-left]:flex max-[900.02px]:[&:where(.workspace)[data-panel="right"]_.panel-right]:flex relative overflow-hidden',
  ".panel":
    'min-h-0 flex flex-col [background:var(--surface)] max-[900.02px]:[&:where(.panel)[data-open="true"]]:[transform:none] min-w-0 [padding:0] justify-start',
  ".panel-left":
    "[border-right-width:1px] [border-right-style:solid] [border-right-color:var(--border)] max-[900.02px]:fixed max-[900.02px]:[top:calc(var(--topbar-h)_+_26px)] max-[900.02px]:[bottom:0] max-[900.02px]:[z-index:30] max-[900.02px]:[width:min(340px,_90vw)] max-[900.02px]:[box-shadow:var(--shadow-l)] max-[900.02px]:[transform:translateX(-105%)] max-[900.02px]:[transition:transform_200ms_var(--ease)] max-[900.02px]:[left:0] @max-[820.02px]/studio:hidden @max-[820.02px]/studio:absolute @max-[820.02px]/studio:[inset:58px_0_0_auto] @max-[820.02px]/studio:[width:min(360px,_100%)] @max-[820.02px]/studio:[z-index:10] @max-[820.02px]/studio:[transform:none] @max-[820.02px]/studio:[box-shadow:var(--shadow-l)] @max-[820.02px]/studio:[left:0] @max-[820.02px]/studio:[right:auto] max-[900.02px]:hidden max-[900.02px]:absolute max-[900.02px]:[inset:58px_0_0_auto] max-[900.02px]:[width:min(360px,_100%)] max-[900.02px]:[transform:none] max-[900.02px]:[right:auto]",
  ".panel-right":
    "[border-left-width:1px] [border-left-style:solid] [border-left-color:var(--border)] max-[900.02px]:fixed max-[900.02px]:[top:calc(var(--topbar-h)_+_26px)] max-[900.02px]:[bottom:0] max-[900.02px]:[z-index:30] max-[900.02px]:[width:min(340px,_90vw)] max-[900.02px]:[box-shadow:var(--shadow-l)] max-[900.02px]:[transform:translateX(-105%)] max-[900.02px]:[transition:transform_200ms_var(--ease)] max-[900.02px]:[right:0] max-[900.02px]:[transform:translateX(105%)] @max-[820.02px]/studio:hidden @max-[820.02px]/studio:absolute @max-[820.02px]/studio:[inset:58px_0_0_auto] @max-[820.02px]/studio:[width:min(360px,_100%)] @max-[820.02px]/studio:[z-index:10] @max-[820.02px]/studio:[transform:none] @max-[820.02px]/studio:[box-shadow:var(--shadow-l)] max-[900.02px]:hidden max-[900.02px]:absolute max-[900.02px]:[inset:58px_0_0_auto] max-[900.02px]:[width:min(360px,_100%)] max-[900.02px]:[transform:none] [&:where(.panel-right)_>_.tabs]:grid [&:where(.panel-right)_>_.tabs]:[grid-template-columns:repeat(2,_minmax(0,_1fr))] [&:where(.panel-right)_>_.tabs]:[overflow:visible] [&:where(.panel-right)_>_.tabs]:[mask-image:none] [&:where(.panel-right)_>_.tabs_.tab]:justify-center [&:where(.panel-right)_>_.tabs_.tab]:[height:34px] [&:where(.panel-right)_>_.tabs_.tab]:min-w-0 [&:where(.panel-right)_>_.tabs_.tab]:[padding:0_6px]",
  ".panel-head":
    "flex items-center [gap:8px] [padding:10px_12px] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:var(--border)] [min-height:48px] [flex-shrink:0]",
  ".panel-title": "[font-size:13.5px] font-bold",
  ".panel-body":
    "[flex:1] min-h-0 overflow-auto [padding:12px] min-w-0 relative [overflow-x:hidden] [overscroll-behavior:contain] [scrollbar-gutter:stable]",
  ".tabs":
    'flex [gap:2px] [padding:0_10px] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:var(--border)] overflow-x-auto [scrollbar-width:none] [&:where(.tabs)[data-more="end"]]:[mask-image:linear-gradient(to_right,_#000_calc(100%_-_32px),_transparent)] [&:where(.tabs)[data-more="start"]]:[mask-image:linear-gradient(to_left,_#000_calc(100%_-_32px),_transparent)] [&:where(.tabs)[data-more="both"]]:[mask-image:linear-gradient(_to_right,_transparent,_#000_32px,_#000_calc(100%_-_32px),_transparent_)] [flex-shrink:0] @max-[540.02px]/studio:[padding:0_4px]',
  ".stepper":
    '[&:where(.stepper)[data-more="end"]]:[mask-image:linear-gradient(to_right,_#000_calc(100%_-_32px),_transparent)] [&:where(.stepper)[data-more="start"]]:[mask-image:linear-gradient(to_left,_#000_calc(100%_-_32px),_transparent)] [&:where(.stepper)[data-more="both"]]:[mask-image:linear-gradient(_to_right,_transparent,_#000_32px,_#000_calc(100%_-_32px),_transparent_)] flex items-center [gap:4px] min-w-0 overflow-x-auto [scrollbar-width:thin] [flex:1]',
  ".tab":
    'relative inline-flex items-center [gap:6px] [height:38px] [padding:0_10px] [border-width:0px] [border-style:none] [border-color:currentColor] [background:none] [color:var(--text-3)] font-semibold [font-size:13px] cursor-pointer whitespace-nowrap [&:where(.tab):hover]:[color:var(--text)] [&:where(.tab)[aria-selected="true"]]:[color:var(--accent-hover)] [&:where(.tab)[aria-selected="true"]::after]:[content:""] [&:where(.tab)[aria-selected="true"]::after]:absolute [&:where(.tab)[aria-selected="true"]::after]:[left:8px] [&:where(.tab)[aria-selected="true"]::after]:[right:8px] [&:where(.tab)[aria-selected="true"]::after]:[bottom:-1px] [&:where(.tab)[aria-selected="true"]::after]:[height:2px] [&:where(.tab)[aria-selected="true"]::after]:[border-radius:2px] [&:where(.tab)[aria-selected="true"]::after]:[background:var(--accent)] [&:where(.tab)_.count]:[font-size:11px] [&:where(.tab)_.count]:[padding:0_5px] [&:where(.tab)_.count]:[border-radius:999px] [&:where(.tab)_.count]:[background:var(--surface-3)] [&:where(.tab)_.count]:[color:var(--text-3)]',
  ".outline": "[list-style:none] [margin:0] [padding:0] grid [gap:2px] min-w-0",
  ".ol-step":
    '[border-radius:var(--radius)] [&:where(.ol-step)[data-current="true"]_>_.ol-step-head]:[background:var(--accent-soft)] [&:where(.ol-step)[data-current="true"]_.ol-num]:[background:var(--accent)] [&:where(.ol-step)[data-current="true"]_.ol-num]:[border-color:var(--accent)] [&:where(.ol-step)[data-current="true"]_.ol-num]:[color:#fff] [&:where(.ol-step)[data-system="true"]_.ol-step-head]:[color:var(--text-3)] [&:where(.ol-step)[data-system="true"]_.ol-step-head]:font-medium min-w-0',
  ".ol-step-head":
    'flex items-center [gap:6px] [width:100%] [min-height:34px] [padding:4px_6px_4px_4px] [border-width:1px] [border-style:solid] [border-color:transparent] [border-radius:var(--radius)] [background:none] text-left font-semibold [font-size:13px] [color:var(--text)] cursor-pointer [&:where(.ol-step-head):hover]:[background:var(--surface-3)] [&:where(.ol-step-head)[aria-pressed="true"]]:[border-color:var(--accent)] [&:where(.ol-step-head)[aria-pressed="true"]]:[background:var(--accent-soft)]',
  ".ol-num":
    "grid [place-items:center] [width:20px] [height:20px] flex-none [border-radius:6px] [background:var(--surface-3)] [border-width:1px] [border-style:solid] [border-color:var(--border)] [font-size:11px] font-bold [color:var(--text-3)]",
  ".ol-name": "[flex:1] min-w-0 overflow-hidden [text-overflow:ellipsis] whitespace-nowrap",
  ".ol-count": "[font-size:11.5px] [color:var(--text-3)] font-medium",
  ".ol-items":
    "[list-style:none] [margin:2px_0_6px_14px] [padding:0_0_0_8px] [border-left-width:1px] [border-left-style:solid] [border-left-color:var(--border)] grid [gap:1px] min-w-0",
  ".ol-item":
    "relative flex items-center [gap:4px] [border-radius:var(--radius-s)] [&:where(.ol-item)_.ol-tools]:hidden [&:where(.ol-item)_.ol-tools]:[gap:0] [&:where(.ol-item)_.ol-tools]:absolute [&:where(.ol-item)_.ol-tools]:[right:2px] [&:where(.ol-item)_.ol-tools]:[background:var(--surface)] [&:where(.ol-item)_.ol-tools]:[border-radius:var(--radius-s)] [&:where(.ol-item):hover_.ol-tools]:flex [&:where(.ol-item):focus-within_.ol-tools]:flex min-w-0",
  ".ol-item-btn":
    'flex items-center [gap:8px] [flex:1] min-w-0 [min-height:30px] [padding:3px_6px] [border-width:1px] [border-style:solid] [border-color:transparent] [border-radius:var(--radius-s)] [background:none] text-left [font-size:13px] [color:var(--text-2)] cursor-pointer [&:where(.ol-item-btn):hover]:[background:var(--surface-3)] [&:where(.ol-item-btn):hover]:[color:var(--text)] [&:where(.ol-item-btn)[aria-pressed="true"]]:[background:var(--accent-soft)] [&:where(.ol-item-btn)[aria-pressed="true"]]:[border-color:var(--accent-border)] [&:where(.ol-item-btn)[aria-pressed="true"]]:[color:var(--accent-hover)] [&:where(.ol-item-btn)[aria-pressed="true"]]:font-semibold [&:where(.ol-item-btn)[aria-pressed="true"]_.ol-type]:[background:#fff] [&:where(.ol-item-btn)[aria-pressed="true"]_.ol-type]:[color:var(--accent)] [&:where(.ol-item-btn)_>_.ol-name]:block',
  ".ol-type":
    "grid [place-items:center] [width:22px] [height:22px] flex-none [border-radius:6px] [background:var(--surface-3)] [color:var(--text-3)] [&:where(.ol-type)_.icon]:[width:13px] [&:where(.ol-type)_.icon]:[height:13px]",
  ".ol-empty": "[padding:4px_8px] [font-size:12px] [color:var(--text-3)]",
  ".drag-handle": "[cursor:grab] [color:#98a2b3]",
  ".dragging": "[opacity:0.45]",
  ".palette-group": "[margin-bottom:16px]",
  ".palette-grid": "grid [grid-template-columns:1fr_1fr] [gap:6px]",
  ".palette-item":
    "flex items-center [gap:8px] [min-height:40px] [padding:6px_8px] [border-width:1px] [border-style:solid] [border-color:var(--border)] [border-radius:var(--radius)] [background:var(--surface)] [font-size:12.5px] font-semibold [color:var(--text-2)] text-left cursor-pointer [line-height:1.3] [transition:border-color_120ms_var(--ease),_box-shadow_120ms_var(--ease),_background-color_120ms_var(--ease)] [&:where(.palette-item):hover]:[border-color:var(--accent-border)] [&:where(.palette-item):hover]:[background:var(--accent-soft)] [&:where(.palette-item):hover]:[color:var(--accent-hover)] [&:where(.palette-item):focus-visible]:[outline:none] [&:where(.palette-item):focus-visible]:[border-color:var(--accent)] [&:where(.palette-item):focus-visible]:[box-shadow:var(--ring)] [&:where(.palette-item)_.ol-type]:[background:var(--surface-3)] [&:where(.palette-item):hover_.ol-type]:[background:#fff] [&:where(.palette-item):hover_.ol-type]:[color:var(--accent)]",
  ".block-card":
    "grid [gap:8px] [padding:10px_12px] [border-width:1px] [border-style:solid] [border-color:var(--border)] [border-radius:var(--radius)] [background:var(--surface)] [margin-bottom:8px] [&:where(.block-card)_h4]:[font-size:13px] [&:where(.block-card)_h4]:font-bold",
  ".stage":
    "min-w-0 min-h-0 flex flex-col [background-color:var(--bg)] [background-image:radial-gradient(rgb(16_24_40_/_9%)_1px,_transparent_1px)] [background-size:18px_18px]",
  ".stage-bar":
    "flex items-center [gap:8px] [padding:8px_14px] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:var(--border)] [background:rgb(255_255_255_/_85%)] [backdrop-filter:blur(6px)] [min-height:48px] [min-height:58px] [flex-shrink:0] @max-[540.02px]/studio:[padding:8px] @max-[540.02px]/studio:[gap:6px]",
  ".step-pill":
    'inline-flex items-center [gap:6px] [height:30px] [padding:0_10px_0_6px] [border-width:1px] [border-style:solid] [border-color:var(--border)] [border-radius:999px] [background:var(--surface)] [color:var(--text-2)] [font-size:12.5px] font-semibold cursor-pointer whitespace-nowrap [max-width:200px] [&:where(.step-pill)_span:last-child]:overflow-hidden [&:where(.step-pill)_span:last-child]:[text-overflow:ellipsis] [&:where(.step-pill):hover]:[border-color:var(--border-strong)] [&:where(.step-pill)[aria-current="step"]]:[border-color:var(--accent)] [&:where(.step-pill)[aria-current="step"]]:[background:var(--accent-soft)] [&:where(.step-pill)[aria-current="step"]]:[color:var(--accent-hover)] [&:where(.step-pill)_.ol-num]:[width:20px] [&:where(.step-pill)_.ol-num]:[height:20px] [&:where(.step-pill)_.ol-num]:[border-radius:50%] [&:where(.step-pill)[aria-current="step"]_.ol-num]:[background:var(--accent)] [&:where(.step-pill)[aria-current="step"]_.ol-num]:[border-color:var(--accent)] [&:where(.step-pill)[aria-current="step"]_.ol-num]:[color:#fff] [&:where(.step-pill)[data-system="true"]]:[color:var(--text-3)] @max-[540.02px]/studio:[max-width:120px]',
  ".step-arrow": "[color:#c0c5cf] flex-none",
  ".stage-scroll":
    "[flex:1] min-h-0 overflow-auto [padding:28px_24px_96px] max-[1100.02px]:[padding:24px_14px_96px] [padding-bottom:32px] [overscroll-behavior:contain] [scrollbar-gutter:stable] @max-[1000.02px]/studio:[padding:20px_12px_32px] @max-[540.02px]/studio:[padding:12px_8px_24px]",
  ".canvas-frame":
    '[margin:0_auto] [max-width:720px] [transition:max-width_220ms_var(--ease)] [&:where(.canvas-frame)[data-device="mobile"]]:[max-width:390px] [&:where(.canvas-frame)[data-device="mobile"]_.form-page-head]:[padding-left:16px] [&:where(.canvas-frame)[data-device="mobile"]_.form-page-head]:[padding-right:16px] [&:where(.canvas-frame)[data-device="mobile"]_.form-page-body]:[padding-left:16px] [&:where(.canvas-frame)[data-device="mobile"]_.form-page-body]:[padding-right:16px] [&:where(.canvas-frame)[data-device="mobile"]_.form-page]:[padding:var(--fb-mobile-padding,_var(--fb-padding,_0px))] [&:where(.canvas-frame)[data-device="mobile"]_.form-page]:[font-size:var(--fb-mobile-font-size,_var(--fb-font-size,_inherit))] [&:where(.canvas-frame)[data-device="mobile"]_.form-page]:[color:var(--fb-mobile-color,_var(--fb-color,_inherit))] [&:where(.canvas-frame)[data-device="mobile"]_.form-page]:[background:var(--fb-mobile-background,_var(--fb-background,_#fff))] [&:where(.canvas-frame)[data-device="mobile"]_.form-page]:[text-align:var(--fb-mobile-align,_var(--fb-align,_left))] [&:where(.canvas-frame)[data-device="mobile"]_.cv-list]:[grid-template-columns:repeat(var(--fb-mobile-columns,_1),_minmax(0,_1fr))] [&:where(.canvas-frame)[data-device="mobile"]_.cv-list]:[gap:var(--fb-mobile-gap,_var(--fb-gap,_0px))] [&:where(.canvas-frame)[data-device="mobile"]_.cv-list]:[row-gap:calc(var(--fb-mobile-gap,_var(--fb-gap,_4px))_/_2)]',
  ".form-page":
    "[border-radius:16px] [background:var(--form-background)] [color:var(--form-foreground)] [box-shadow:var(--shadow-m),_0_0_0_1px_rgb(16_24_40_/_6%)] overflow-hidden [max-width:var(--fb-max-width,_100%)] [padding:var(--fb-padding,_0px)] [border-width:var(--fb-border-width,_0px)] [border-style:solid] [border-color:var(--fb-border-color,_#cbd5e1)] [border-radius:var(--fb-radius,_16px)] [box-shadow:var(--fb-shadow,_none)] [background:var(--fb-background,_#fff)] [color:var(--fb-color,_inherit)] [font-size:var(--fb-font-size,_inherit)] [font-weight:var(--fb-font-weight,_inherit)] [text-align:var(--fb-align,_left)] [&:where(.form-page)_.cv-list]:grid [&:where(.form-page)_.cv-list]:[grid-template-columns:repeat(var(--fb-columns,_1),_minmax(0,_1fr))] [&:where(.form-page)_.cv-list]:[gap:var(--fb-gap,_0px)] [&:where(.form-page)_.cv-insert]:[grid-column:1/-1] [&:where(.form-page)_.cv-list]:[row-gap:calc(var(--fb-gap,_4px)_/_2)] [&:where(.form-page)_.cv-insert]:[height:0]",
  ".form-page-head":
    "[padding:22px_28px_14px] [border-top-width:4px] [border-top-style:solid] [border-top-color:var(--form-accent)] max-[1100.02px]:[padding-left:20px] max-[1100.02px]:[padding-right:20px]",
  ".form-page-title":
    "[font-size:20px] [font-weight:750] [letter-spacing:-0.01em] [line-height:1.35]",
  ".form-page-desc": "[margin-top:4px] [font-size:13.5px] [opacity:0.8]",
  ".form-progress":
    'flex [gap:4px] [margin-top:14px] [&:where(.form-progress)_span]:[flex:1] [&:where(.form-progress)_span]:[height:4px] [&:where(.form-progress)_span]:[border-radius:2px] [&:where(.form-progress)_span]:[background:color-mix(in_srgb,_var(--form-foreground)_14%,_transparent)] [&:where(.form-progress)_span[data-done="true"]]:[background:var(--form-accent)]',
  ".form-page-body":
    "[padding:8px_28px_28px] max-[1100.02px]:[padding-left:20px] max-[1100.02px]:[padding-right:20px]",
  ".step-title-input":
    "[width:100%] [margin:6px_0_12px_-6px] [font-size:16px] font-bold [color:var(--form-foreground)]",
  ".cv-list": "grid [gap:4px]",
  ".cv-block":
    'relative [padding:12px_14px] [border-radius:10px] [border-width:1.5px] [border-style:solid] [border-color:transparent] [transition:border-color_120ms_var(--ease),_background-color_120ms_var(--ease)] [&:where(.cv-block):hover]:[border-color:color-mix(in_srgb,_var(--accent)_45%,_transparent)] [&:where(.cv-block):hover]:[border-style:dashed] [&:where(.cv-block)[data-selected="true"]]:[border-color:var(--accent)] [&:where(.cv-block)[data-selected="true"]]:[border-style:solid] [&:where(.cv-block)[data-selected="true"]]:[background:color-mix(in_srgb,_#fff_55%,_transparent)] [&:where(.cv-block)[data-warn="true"]:not([data-selected="true"])]:[border-color:var(--warning-border)] [&:where(.cv-block)[data-warn="true"]:not([data-selected="true"])]:[border-style:solid] [&:where(.cv-block)[data-selected="true"]_.cv-type-tag]:inline-flex [padding:var(--fb-field-padding,_12px)] [margin:var(--fb-field-margin,_0px)] [border-width:var(--fb-field-border-width,_1px)] [border-color:var(--fb-field-border-color,_transparent)] [border-radius:var(--fb-field-radius,_8px)] [color:var(--fb-field-color,_inherit)] [background:var(--fb-field-background,_transparent)] [font-size:var(--fb-field-font-size,_inherit)] [font-weight:var(--fb-field-font-weight,_inherit)] [text-align:var(--fb-field-align,_left)] [box-shadow:var(--fb-field-shadow,_none)]',
  ".cv-hit":
    "absolute [inset:0] [z-index:1] [width:100%] [border-width:0px] [border-style:none] [border-color:currentColor] [border-radius:10px] [background:transparent] cursor-pointer [&:where(.cv-hit):focus-visible]:[outline:2px_solid_var(--accent)] [&:where(.cv-hit):focus-visible]:[outline-offset:2px]",
  ".cv-content": "relative [pointer-events:none]",
  ".cv-label-row": "flex items-center [gap:6px] flex-wrap [margin-bottom:6px]",
  ".cv-label": "[font-weight:650] [font-size:14px] [color:var(--form-foreground)]",
  ".cv-req": "[color:#d92d20] font-bold",
  ".cv-badges":
    "inline-flex [gap:4px] flex-wrap [&:where(.cv-badges)_.chip]:[height:20px] [&:where(.cv-badges)_.chip]:[font-size:11px] [&:where(.cv-badges)_.chip]:[padding:0_6px]",
  ".cv-help": "[margin-top:6px] [font-size:12.5px] [opacity:0.75]",
  ".cv-control":
    "[width:100%] [min-height:38px] [padding:8px_12px] [border-width:1px] [border-style:solid] [border-color:color-mix(in_srgb,_var(--form-foreground)_22%,_transparent)] [border-radius:8px] [background:#fff] [color:color-mix(in_srgb,_var(--form-foreground)_50%,_transparent)] [font-size:13.5px] [&:where(.cv-control).tall]:[min-height:72px] [&:where(.cv-control).select-like]:flex [&:where(.cv-control).select-like]:justify-between [&:where(.cv-control).select-like]:items-center",
  ".cv-options": "grid [gap:6px]",
  ".cv-option": "flex items-center [gap:8px] [font-size:13.5px] [color:var(--form-foreground)]",
  ".cv-dot":
    "[width:16px] [height:16px] flex-none [border-width:1.5px] [border-style:solid] [border-color:color-mix(in_srgb,_var(--form-foreground)_40%,_transparent)] [border-radius:50%] [background:#fff]",
  ".cv-box":
    "[width:16px] [height:16px] flex-none [border-width:1.5px] [border-style:solid] [border-color:color-mix(in_srgb,_var(--form-foreground)_40%,_transparent)] [border-radius:50%] [background:#fff] [border-radius:4px]",
  ".cv-plugin":
    "flex items-center [gap:10px] [padding:12px] [border-width:1px] [border-style:dashed] [border-color:color-mix(in_srgb,_var(--form-foreground)_30%,_transparent)] [border-radius:8px] [font-size:13px] [background:color-mix(in_srgb,_#fff_60%,_transparent)]",
  ".cv-block-group":
    "grid [gap:8px] [padding:10px] [border-radius:8px] [background:color-mix(in_srgb,_#fff_50%,_transparent)] [border-width:1px] [border-style:solid] [border-color:color-mix(in_srgb,_var(--form-foreground)_12%,_transparent)]",
  ".cv-block-group-head": "flex items-center [gap:8px] [font-size:12.5px] font-bold",
  ".cv-toolbar":
    "absolute [top:-15px] [right:10px] [z-index:3] flex [gap:1px] [padding:2px] [border-radius:8px] [background:#1d2433] [box-shadow:var(--shadow-m)] [&:where(.cv-toolbar)_button]:grid [&:where(.cv-toolbar)_button]:[place-items:center] [&:where(.cv-toolbar)_button]:[width:26px] [&:where(.cv-toolbar)_button]:[height:24px] [&:where(.cv-toolbar)_button]:[border-width:0px] [&:where(.cv-toolbar)_button]:[border-style:none] [&:where(.cv-toolbar)_button]:[border-color:currentColor] [&:where(.cv-toolbar)_button]:[border-radius:6px] [&:where(.cv-toolbar)_button]:[background:transparent] [&:where(.cv-toolbar)_button]:[color:#e4e7ec] [&:where(.cv-toolbar)_button]:cursor-pointer [&:where(.cv-toolbar)_button:hover]:[background:rgb(255_255_255_/_14%)] [&:where(.cv-toolbar)_button:hover]:[color:#fff] [&:where(.cv-toolbar)_button:hover]:[outline:none] [&:where(.cv-toolbar)_button:focus-visible]:[background:rgb(255_255_255_/_14%)] [&:where(.cv-toolbar)_button:focus-visible]:[color:#fff] [&:where(.cv-toolbar)_button:focus-visible]:[outline:none] [&:where(.cv-toolbar)_button:disabled]:[opacity:0.35] [&:where(.cv-toolbar)_button:disabled]:[cursor:default] [&:where(.cv-toolbar)_.icon]:[width:14px] [&:where(.cv-toolbar)_.icon]:[height:14px]",
  ".cv-type-tag":
    "absolute [top:-11px] [left:10px] [z-index:2] hidden items-center [gap:4px] [height:20px] [padding:0_7px] [border-radius:6px] [background:var(--accent)] [color:#fff] [font-size:11px] font-bold",
  ".cv-inline-edit":
    "relative [z-index:4] [pointer-events:auto] [width:min(100%,_420px)] [font-weight:650] [font-size:14px]",
  ".cv-insert":
    'relative [height:14px] flex items-center justify-center [&:where(.cv-insert)_button]:relative [&:where(.cv-insert)_button]:[z-index:2] [&:where(.cv-insert)_button]:grid [&:where(.cv-insert)_button]:[place-items:center] [&:where(.cv-insert)_button]:[width:22px] [&:where(.cv-insert)_button]:[height:22px] [&:where(.cv-insert)_button]:[border-radius:50%] [&:where(.cv-insert)_button]:[border-width:1px] [&:where(.cv-insert)_button]:[border-style:solid] [&:where(.cv-insert)_button]:[border-color:var(--accent-border)] [&:where(.cv-insert)_button]:[background:#fff] [&:where(.cv-insert)_button]:[color:var(--accent)] [&:where(.cv-insert)_button]:cursor-pointer [&:where(.cv-insert)_button]:[opacity:0] [&:where(.cv-insert)_button]:[transition:opacity_120ms_var(--ease)] [&:where(.cv-insert)::before]:[content:""] [&:where(.cv-insert)::before]:absolute [&:where(.cv-insert)::before]:[left:14px] [&:where(.cv-insert)::before]:[right:14px] [&:where(.cv-insert)::before]:[top:50%] [&:where(.cv-insert)::before]:[height:1.5px] [&:where(.cv-insert)::before]:[background:var(--accent)] [&:where(.cv-insert)::before]:[opacity:0] [&:where(.cv-insert)::before]:[transition:opacity_120ms_var(--ease)] [&:where(.cv-insert):hover_button]:[opacity:1] [&:where(.cv-insert):hover::before]:[opacity:1] [&:where(.cv-insert)_button:focus-visible]:[opacity:1] [&:where(.cv-insert):has(button:focus-visible)::before]:[opacity:1] [&:where(.cv-insert)_.icon]:[width:13px] [&:where(.cv-insert)_.icon]:[height:13px]',
  ".cv-empty":
    "grid [justify-items:center] [gap:10px] [padding:36px_16px] [border-width:1.5px] [border-style:dashed] [border-color:color-mix(in_srgb,_var(--form-foreground)_22%,_transparent)] [border-radius:12px] text-center [color:color-mix(in_srgb,_var(--form-foreground)_70%,_transparent)] [&:where(.cv-empty)_h3]:[font-size:15px] [&:where(.cv-empty)_h3]:[color:var(--form-foreground)]",
  ".cv-system":
    "grid [gap:10px] [padding:18px] [border-radius:12px] [background:color-mix(in_srgb,_#fff_55%,_transparent)] [border-width:1px] [border-style:solid] [border-color:color-mix(in_srgb,_var(--form-foreground)_12%,_transparent)] [font-size:13.5px]",
  ".cv-nav": "flex justify-between [gap:8px] [margin-top:18px]",
  ".cv-btn":
    "inline-flex items-center [height:38px] [padding:0_18px] [border-radius:8px] font-bold [font-size:13.5px] [border-width:1px] [border-style:solid] [border-color:color-mix(in_srgb,_var(--form-foreground)_22%,_transparent)] [background:#fff] [color:var(--form-foreground)] [&:where(.cv-btn).primary]:[margin-left:auto] [&:where(.cv-btn).primary]:[background:var(--form-accent)] [&:where(.cv-btn).primary]:[border-color:var(--form-accent)] [&:where(.cv-btn).primary]:[color:#fff]",
  ".canvas-readonly":
    "[&:where(.canvas-readonly)_.cv-insert]:hidden [&:where(.canvas-readonly)_.cv-toolbar]:hidden",
  ".insp-head":
    "flex items-center [gap:10px] [padding:12px_14px] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:var(--border)] [min-height:60px]",
  ".insp-icon":
    "grid [place-items:center] [width:32px] [height:32px] flex-none [border-radius:8px] [background:var(--accent-soft)] [color:var(--accent)]",
  ".insp-title": "[font-size:14px] font-bold [line-height:1.3] [overflow-wrap:anywhere]",
  ".insp-crumb":
    "[font-size:12px] [color:var(--text-3)] overflow-hidden [text-overflow:ellipsis] whitespace-nowrap",
  ".insp-body":
    "[flex:1] min-h-0 overflow-auto [padding:16px_14px_32px] [&:where(.insp-body)_fieldset]:[border-width:0px] [&:where(.insp-body)_fieldset]:[border-style:none] [&:where(.insp-body)_fieldset]:[border-color:currentColor] [&:where(.insp-body)_fieldset]:[margin:0] [&:where(.insp-body)_fieldset]:[padding:0] [&:where(.insp-body)_fieldset]:min-w-0 min-w-0 relative [overflow-x:hidden] [overscroll-behavior:contain] [scrollbar-gutter:stable]",
  ".insp-section":
    "[padding-bottom:14px] [margin-bottom:14px] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:var(--border)] [&:where(.insp-section):last-child]:[border-bottom-width:0px] [&:where(.insp-section):last-child]:[border-bottom-style:none] [&:where(.insp-section):last-child]:[border-bottom-color:currentColor] [&:where(.insp-section):last-child]:[margin-bottom:0] [&:where(.insp-section)_>_h3]:[font-size:13px] [&:where(.insp-section)_>_h3]:font-bold [&:where(.insp-section)_>_h3]:[margin-bottom:10px] [&:where(.insp-section)_>_h3]:flex [&:where(.insp-section)_>_h3]:items-center [&:where(.insp-section)_>_h3]:[gap:6px]",
  ".guide":
    "grid [gap:10px] [padding:14px] [margin-bottom:16px] [border-radius:var(--radius-l)] [background:linear-gradient(135deg,_var(--accent-soft),_#f5f3ff)] [border-width:1px] [border-style:solid] [border-color:var(--accent-border)] [&:where(.guide)_h3]:[font-size:14px] [&:where(.guide)_h3]:font-bold [&:where(.guide)_h3]:[color:#312e81] [&:where(.guide)_p]:[font-size:12.5px] [&:where(.guide)_p]:[color:#3730a3] [&:where(.guide)_ol]:[margin:0] [&:where(.guide)_ol]:[padding-left:18px] [&:where(.guide)_ol]:[font-size:12.5px] [&:where(.guide)_ol]:[color:#3730a3] [&:where(.guide)_ol]:grid [&:where(.guide)_ol]:[gap:2px]",
  ".opt-list": "grid [gap:6px] [margin-bottom:8px]",
  ".opt-row":
    "grid [grid-template-columns:18px_minmax(0,_1fr)_92px_auto] items-center [gap:6px] [&:where(.opt-row)_.opt-mark]:[width:14px] [&:where(.opt-row)_.opt-mark]:[height:14px] [&:where(.opt-row)_.opt-mark]:[border-width:1.5px] [&:where(.opt-row)_.opt-mark]:[border-style:solid] [&:where(.opt-row)_.opt-mark]:[border-color:var(--border-strong)] [&:where(.opt-row)_.opt-mark]:[border-radius:50%] [&:where(.opt-row)_.opt-mark.box]:[border-radius:3px]",
  ".opt-tools": "flex",
  ".choice-grid": "grid [gap:8px]",
  ".choice-card":
    'relative flex [gap:12px] items-center [padding:10px] [border-width:1.5px] [border-style:solid] [border-color:var(--border)] [border-radius:var(--radius-l)] [background:var(--surface)] cursor-pointer [transition:border-color_120ms_var(--ease),_box-shadow_120ms_var(--ease)] [&:where(.choice-card):hover]:[border-color:var(--border-strong)] [&:where(.choice-card):has(input:checked)]:[border-color:var(--accent)] [&:where(.choice-card):has(input:checked)]:[box-shadow:0_0_0_3px_rgb(79_70_229_/_12%)] [&:where(.choice-card):has(input:focus-visible)]:[box-shadow:var(--ring)] [&:where(.choice-card)_input]:absolute [&:where(.choice-card)_input]:[opacity:0] [&:where(.choice-card)_input]:[inset:0] [&:where(.choice-card)_input]:[margin:0] [&:where(.choice-card)_input]:cursor-pointer [&:where(.choice-card)_.check]:[margin-left:auto] [&:where(.choice-card)_.check]:grid [&:where(.choice-card)_.check]:[place-items:center] [&:where(.choice-card)_.check]:[width:20px] [&:where(.choice-card)_.check]:[height:20px] [&:where(.choice-card)_.check]:[border-radius:50%] [&:where(.choice-card)_.check]:[border-width:1.5px] [&:where(.choice-card)_.check]:[border-style:solid] [&:where(.choice-card)_.check]:[border-color:var(--border-strong)] [&:where(.choice-card)_.check]:[color:transparent] [&:where(.choice-card)_.check]:flex-none [&:where(.choice-card):has(input:checked)_.check]:[background:var(--accent)] [&:where(.choice-card):has(input:checked)_.check]:[border-color:var(--accent)] [&:where(.choice-card):has(input:checked)_.check]:[color:#fff] [&:where(.choice-card)_.check_.icon]:[width:12px] [&:where(.choice-card)_.check_.icon]:[height:12px] [&:where(.choice-card)_.check_.icon]:[stroke-width:3] [@media((prefers-reduced-motion:_no-preference))]:[&:where(.choice-card):hover_.motion-demo[data-preset="subtle"]_i]:[animation:demo-fade-slide_calc(160ms_*_var(--speed,_1)_*_6)_var(--ease)_infinite_alternate] [@media((prefers-reduced-motion:_no-preference))]:[&:where(.choice-card):has(input:checked)_.motion-demo[data-preset="subtle"]_i]:[animation:demo-fade-slide_calc(160ms_*_var(--speed,_1)_*_6)_var(--ease)_infinite_alternate] [@media((prefers-reduced-motion:_no-preference))]:[&:where(.choice-card):hover_.motion-demo[data-preset="guided"]_i]:[animation:demo-slide_calc(200ms_*_var(--speed,_1)_*_6)_var(--ease)_infinite_alternate] [@media((prefers-reduced-motion:_no-preference))]:[&:where(.choice-card):has(input:checked)_.motion-demo[data-preset="guided"]_i]:[animation:demo-slide_calc(200ms_*_var(--speed,_1)_*_6)_var(--ease)_infinite_alternate]',
  ".choice-text":
    "grid [gap:2px] min-w-0 [&:where(.choice-text)_b]:[font-size:13.5px] [&:where(.choice-text)_small]:[font-size:12px] [&:where(.choice-text)_small]:[color:var(--text-3)]",
  ".theme-swatch":
    "[width:64px] [height:48px] flex-none [border-radius:8px] [padding:6px] grid [gap:4px] [align-content:start] [border-width:1px] [border-style:solid] [border-color:rgb(16_24_40_/_10%)] [background:var(--sw-bg)] [&:where(.theme-swatch)_i]:block [&:where(.theme-swatch)_i]:[height:5px] [&:where(.theme-swatch)_i]:[border-radius:3px] [&:where(.theme-swatch)_i]:[background:var(--sw-fg)] [&:where(.theme-swatch)_i]:[opacity:0.75] [&:where(.theme-swatch)_i:nth-child(2)]:[width:70%] [&:where(.theme-swatch)_i:nth-child(2)]:[opacity:0.35] [&:where(.theme-swatch)_b]:block [&:where(.theme-swatch)_b]:[width:28px] [&:where(.theme-swatch)_b]:[height:9px] [&:where(.theme-swatch)_b]:[margin-top:3px] [&:where(.theme-swatch)_b]:[border-radius:3px] [&:where(.theme-swatch)_b]:[background:var(--sw-accent)]",
  ".motion-demo":
    "relative [width:64px] [height:48px] flex-none [border-radius:8px] [background:var(--surface-3)] [border-width:1px] [border-style:solid] [border-color:var(--border)] overflow-hidden [&:where(.motion-demo)_i]:absolute [&:where(.motion-demo)_i]:[left:10px] [&:where(.motion-demo)_i]:[right:10px] [&:where(.motion-demo)_i]:[height:8px] [&:where(.motion-demo)_i]:[border-radius:3px] [&:where(.motion-demo)_i]:[background:var(--accent)] [&:where(.motion-demo)_i]:[opacity:0.85] [&:where(.motion-demo)_i:nth-child(1)]:[top:11px] [&:where(.motion-demo)_i:nth-child(2)]:[top:25px] [&:where(.motion-demo)_i:nth-child(2)]:[right:22px] [&:where(.motion-demo)_i:nth-child(2)]:[opacity:0.4] [@media((prefers-reduced-motion:_no-preference))]:[&:where(.motion-demo)_i:nth-child(2)]:[animation-delay:80ms]!",
  ".rule":
    "grid [gap:8px] [padding:10px] [border-width:1px] [border-style:solid] [border-color:var(--border)] [border-radius:var(--radius)] [background:var(--surface-2)]",
  ".rule-sentence":
    "flex items-center flex-wrap [gap:6px] [font-size:13px] [color:var(--text-2)] [&:where(.rule-sentence)_.select]:[width:auto] [&:where(.rule-sentence)_.select]:[max-width:100%] [&:where(.rule-sentence)_.select]:[min-height:30px] [&:where(.rule-sentence)_.select]:[font-size:13px] [&:where(.rule-sentence)_.select]:[padding-top:3px] [&:where(.rule-sentence)_.select]:[padding-bottom:3px] [&:where(.rule-sentence)_.input]:[width:auto] [&:where(.rule-sentence)_.input]:[max-width:100%] [&:where(.rule-sentence)_.input]:[min-height:30px] [&:where(.rule-sentence)_.input]:[font-size:13px] [&:where(.rule-sentence)_.input]:[padding-top:3px] [&:where(.rule-sentence)_.input]:[padding-bottom:3px]",
  ".rule-atom":
    "grid [gap:6px] [padding:8px] [border-radius:var(--radius-s)] [background:var(--surface)] [border-width:1px] [border-style:solid] [border-color:var(--border)]",
  ".rule-atom-head":
    "flex items-center [gap:6px] [font-size:12px] [color:var(--text-3)] font-semibold",
  ".rule-join": "[font-size:11.5px] font-bold [color:var(--accent-hover)] [padding-left:4px]",
  ".rule-summary":
    "flex [gap:8px] items-start [padding:8px_10px] [border-radius:var(--radius-s)] [background:var(--accent-soft)] [color:#312e81] [font-size:12.5px] [line-height:1.5] [&:where(.rule-summary)_.icon]:[margin-top:2px] [&:where(.rule-summary)_.icon]:[color:var(--accent)]",
  ".q": "font-bold",
  ".branch":
    "grid [gap:8px] [padding:10px] [border-width:1px] [border-style:solid] [border-color:var(--border)] [border-radius:var(--radius)] [background:var(--surface)] [margin-bottom:8px]",
  ".branch-head": "flex items-center [gap:6px] [font-size:12.5px] font-bold",
  ".branch-target":
    "flex items-center [gap:8px] [font-size:13px] [&:where(.branch-target)_.select]:[flex:1]",
  ".named":
    "grid [gap:10px] [padding:12px] [border-width:1px] [border-style:solid] [border-color:var(--border)] [border-radius:var(--radius-l)] [margin-bottom:10px] [background:var(--surface)] [&:where(.named)_>_legend]:[float:left] [&:where(.named)_>_legend]:[width:100%] [&:where(.named)_>_legend]:[padding:0] [&:where(.named)_>_legend]:[font-size:12px] [&:where(.named)_>_legend]:[color:var(--text-3)]",
  ".page": "[flex:1] min-h-0 overflow-auto [padding:24px]",
  ".page-inner": "[max-width:1080px] [margin:0_auto]",
  ".page-head":
    "flex [align-items:flex-end] [gap:12px] [margin-bottom:18px] flex-wrap [&:where(.page-head)_h2]:[font-size:20px] [&:where(.page-head)_h2]:[font-weight:750] [&:where(.page-head)_h2]:[letter-spacing:-0.01em] [&:where(.page-head)_p]:[color:var(--text-3)] [&:where(.page-head)_p]:[margin-top:2px] [&:where(.page-head)_p]:[font-size:13.5px]",
  ".flow": "grid [gap:0] [max-width:760px] [margin:0_auto] [padding:0] [list-style:none]",
  ".flow-node":
    "grid [gap:10px] [padding:14px_16px] [border-width:1px] [border-style:solid] [border-color:var(--border)] [border-radius:var(--radius-l)] [background:var(--surface)] [box-shadow:var(--shadow-xs)] [&:where(.flow-node)_>_.callout]:[margin-top:8px]",
  ".flow-node-head":
    "flex items-center [gap:10px] [&:where(.flow-node-head)_h3]:[font-size:14.5px] [&:where(.flow-node-head)_h3]:font-bold",
  ".flow-edges": "grid [gap:6px] [margin:0] [padding:0] [list-style:none]",
  ".flow-edge":
    "flex items-start [gap:8px] [font-size:13px] [color:var(--text-2)] [padding:6px_8px] [border-radius:var(--radius-s)] [background:var(--surface-2)] [&:where(.flow-edge)_.icon]:[margin-top:2px] [&:where(.flow-edge)_.icon]:[color:var(--accent)]",
  ".flow-link":
    "[height:22px] [margin-left:28px] [border-left-width:2px] [border-left-style:dashed] [border-left-color:var(--border-strong)]",
  ".preview-layout":
    "[flex:1] min-h-0 grid [grid-template-columns:minmax(0,_1fr)_300px] max-[1100.02px]:[grid-template-columns:minmax(0,_1fr)_260px] max-[900.02px]:[grid-template-columns:1fr]",
  ".preview-stage": "min-w-0 overflow-auto [padding:20px] flex flex-col items-center [gap:14px]",
  ".device":
    '[width:100%] [max-width:980px] [border-radius:14px] [background:var(--surface)] [border-width:1px] [border-style:solid] [border-color:var(--border-strong)] [box-shadow:var(--shadow-m)] overflow-hidden [transition:max-width_220ms_var(--ease)] [&:where(.device)[data-device="mobile"]]:[max-width:390px] [&:where(.device)[data-device="mobile"]]:[border-radius:28px] [&:where(.device)[data-device="mobile"]]:[border-width:8px] [&:where(.device)[data-device="mobile"]]:[border-color:#1d2433] [&:where(.device)[data-device="mobile"]_.device-bar]:justify-center [&:where(.device)[data-device="mobile"]_.device-bar_i]:hidden [&:where(.device)[data-device="mobile"]_#preview-frame]:[height:720px]',
  ".device-bar":
    "flex items-center [gap:6px] [height:32px] [padding:0_12px] [background:var(--surface-2)] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:var(--border)] [font-size:11.5px] [color:var(--text-3)] [&:where(.device-bar)_i]:[width:9px] [&:where(.device-bar)_i]:[height:9px] [&:where(.device-bar)_i]:[border-radius:50%] [&:where(.device-bar)_i]:[background:#d0d5dd]",
  "#preview-container": "[min-height:560px] grid",
  "#preview-frame":
    "[width:100%] [height:680px] [border-width:0px] [border-style:none] [border-color:currentColor] [background:#fff] block",
  ".preview-empty":
    "grid [place-items:center] [align-content:center] [gap:10px] [min-height:560px] text-center [color:var(--text-3)] [padding:24px]",
  ".side-panel":
    "[border-left-width:1px] [border-left-style:solid] [border-left-color:var(--border)] [background:var(--surface)] overflow-auto [padding:16px] max-[900.02px]:[border-left-width:0px] max-[900.02px]:[border-left-style:none] max-[900.02px]:[border-left-color:currentColor] max-[900.02px]:[border-top-width:1px] max-[900.02px]:[border-top-style:solid] max-[900.02px]:[border-top-color:var(--border)]",
  ".diag-list": "grid [gap:8px] [margin:0] [padding:0] [list-style:none]",
  ".diag":
    "flex [gap:8px] items-start [padding:8px_10px] [border-radius:var(--radius)] [border-width:1px] [border-style:solid] [border-color:var(--warning-border)] [background:var(--warning-soft)] [font-size:12.5px] [color:#7a2e0e] [&:where(.diag).error]:[border-color:var(--danger-border)] [&:where(.diag).error]:[background:var(--danger-soft)] [&:where(.diag).error]:[color:#912018] [&:where(.diag)_button]:[margin-left:auto]",
  ".lifecycle":
    'grid [grid-template-columns:repeat(4,_1fr)] [gap:0] [margin-bottom:20px] [padding:0] [list-style:none] [counter-reset:lc] [&:where(.lifecycle)_li]:relative [&:where(.lifecycle)_li]:grid [&:where(.lifecycle)_li]:[justify-items:center] [&:where(.lifecycle)_li]:[gap:6px] [&:where(.lifecycle)_li]:[font-size:12.5px] [&:where(.lifecycle)_li]:font-semibold [&:where(.lifecycle)_li]:[color:var(--text-3)] [&:where(.lifecycle)_li]:text-center [&:where(.lifecycle)_li::before]:[counter-increment:lc] [&:where(.lifecycle)_li::before]:[content:counter(lc)] [&:where(.lifecycle)_li::before]:grid [&:where(.lifecycle)_li::before]:[place-items:center] [&:where(.lifecycle)_li::before]:[width:28px] [&:where(.lifecycle)_li::before]:[height:28px] [&:where(.lifecycle)_li::before]:[border-radius:50%] [&:where(.lifecycle)_li::before]:[background:var(--surface)] [&:where(.lifecycle)_li::before]:[border-width:2px] [&:where(.lifecycle)_li::before]:[border-style:solid] [&:where(.lifecycle)_li::before]:[border-color:var(--border-strong)] [&:where(.lifecycle)_li::before]:[color:var(--text-3)] [&:where(.lifecycle)_li::before]:font-bold [&:where(.lifecycle)_li::before]:relative [&:where(.lifecycle)_li::before]:[z-index:1] [&:where(.lifecycle)_li::after]:[content:""] [&:where(.lifecycle)_li::after]:absolute [&:where(.lifecycle)_li::after]:[top:13px] [&:where(.lifecycle)_li::after]:[left:calc(50%_+_14px)] [&:where(.lifecycle)_li::after]:[right:calc(-50%_+_14px)] [&:where(.lifecycle)_li::after]:[height:2px] [&:where(.lifecycle)_li::after]:[background:var(--border-strong)] [&:where(.lifecycle)_li:last-child::after]:hidden [&:where(.lifecycle)_li[data-state="done"]]:[color:var(--success)] [&:where(.lifecycle)_li[data-state="done"]::before]:[content:"✓"] [&:where(.lifecycle)_li[data-state="done"]::before]:[background:var(--success)] [&:where(.lifecycle)_li[data-state="done"]::before]:[border-color:var(--success)] [&:where(.lifecycle)_li[data-state="done"]::before]:[color:#fff] [&:where(.lifecycle)_li[data-state="done"]::after]:[background:var(--success)] [&:where(.lifecycle)_li[data-state="current"]]:[color:var(--accent-hover)] [&:where(.lifecycle)_li[data-state="current"]::before]:[border-color:var(--accent)] [&:where(.lifecycle)_li[data-state="current"]::before]:[background:var(--accent-soft)] [&:where(.lifecycle)_li[data-state="current"]::before]:[color:var(--accent-hover)]',
  ".pub-grid":
    "grid [grid-template-columns:minmax(0,_1.4fr)_minmax(0,_1fr)] [gap:16px] [align-items:start] max-[1100.02px]:[grid-template-columns:1fr]",
  ".pub-card":
    "[padding:16px] [&:where(.pub-card)_>_h3]:flex [&:where(.pub-card)_>_h3]:items-center [&:where(.pub-card)_>_h3]:[gap:8px] [&:where(.pub-card)_>_h3]:[font-size:14.5px] [&:where(.pub-card)_>_h3]:font-bold [&:where(.pub-card)_>_h3]:[margin-bottom:12px]",
  ".item-list": "grid [gap:8px] [margin:0] [padding:0] [list-style:none]",
  ".item":
    'grid [gap:8px] [padding:12px] [border-width:1px] [border-style:solid] [border-color:var(--border)] [border-radius:var(--radius)] [background:var(--surface)] [&:where(.item)[data-active="true"]]:[border-color:var(--success-border)] [&:where(.item)[data-active="true"]]:[background:var(--success-soft)]',
  ".item-head": "flex items-center [gap:8px] flex-wrap [&:where(.item-head)_b]:[font-size:13.5px]",
  ".item-actions": "flex [gap:6px] flex-wrap",
  ".live-card":
    "grid [gap:10px] [padding:16px] [border-radius:var(--radius-l)] [border-width:1px] [border-style:solid] [border-color:var(--success-border)] [background:linear-gradient(135deg,_var(--success-soft),_#fff)] [&:where(.live-card)_a]:font-semibold [&:where(.live-card)_a]:[word-break:break-all]",
  ".kv":
    "grid [grid-template-columns:max-content_1fr] [gap:4px_12px] [font-size:12.5px] [&:where(.kv)_dt]:[color:var(--text-3)] [&:where(.kv)_dd]:[margin:0] [&:where(.kv)_dd]:min-w-0 [&:where(.kv)_dd]:[overflow-wrap:anywhere]",
  ".data-table":
    "[width:100%] border-collapse [font-size:12.5px] [&:where(.data-table)_th]:text-left [&:where(.data-table)_th]:font-bold [&:where(.data-table)_th]:[color:var(--text-3)] [&:where(.data-table)_th]:[padding:6px_8px] [&:where(.data-table)_th]:[border-bottom-width:1px] [&:where(.data-table)_th]:[border-bottom-style:solid] [&:where(.data-table)_th]:[border-bottom-color:var(--border)] [&:where(.data-table)_th]:[background:var(--surface-2)] [&:where(.data-table)_td]:[padding:6px_8px] [&:where(.data-table)_td]:[border-bottom-width:1px] [&:where(.data-table)_td]:[border-bottom-style:solid] [&:where(.data-table)_td]:[border-bottom-color:var(--border)] [&:where(.data-table)_td]:[vertical-align:top]",
  ".audit": "[max-height:260px] overflow-auto",
  ".grow": "[flex:1] min-w-0",
  ".stack": "grid [gap:16px] [align-content:start]",
  "#publish-summary":
    "grid [gap:16px] [margin-bottom:16px] [&:where(#publish-summary)_.lifecycle]:[margin-bottom:0]",
  "#history":
    "[&:where(#history)_>_*_+_*]:[margin-top:16px] [&:where(#history)_details_>_summary]:cursor-pointer [&:where(#history)_details_>_summary]:font-semibold [&:where(#history)_details[open]_>_summary]:[margin-bottom:8px]",
  "#flow-overview":
    "[&:where(#flow-overview)_>_.callout]:[max-width:760px] [&:where(#flow-overview)_>_.callout]:[margin:0_auto_16px]",
  ".check-list": "flex flex-wrap [gap:6px]",
  ".check-item":
    "inline-flex items-center [gap:6px] [padding:4px_10px] [border-width:1px] [border-style:solid] [border-color:var(--border)] [border-radius:999px] [background:var(--surface)] [font-size:12.5px] cursor-pointer [&:where(.check-item):has(input:checked)]:[border-color:var(--accent-border)] [&:where(.check-item):has(input:checked)]:[background:var(--accent-soft)] [&:where(.check-item):has(input:checked)]:[color:var(--accent-hover)] [&:where(.check-item):focus-within]:[box-shadow:var(--ring)]",
  ".branch-default": "[border-style:dashed] [background:var(--surface-2)]",
  ".account-item":
    '[&:where(.account-item)_.avatar]:[width:26px] [&:where(.account-item)_.avatar]:[height:26px] [&:where(.account-item)_.avatar]:[font-size:11px] [&:where(.account-item)_.avatar]:flex-none [&:where(.account-item)_.account-text]:grid [&:where(.account-item)_.account-text]:[flex:1] [&:where(.account-item)_.account-text]:min-w-0 [&:where(.account-item)_.account-text_b]:[font-size:13px] [&:where(.account-item)_.account-text_b]:font-semibold [&:where(.account-item)_.account-text_small]:[font-size:11.5px] [&:where(.account-item)_.account-text_small]:[color:var(--text-3)] [&:where(.account-item)[aria-current="true"]]:[color:var(--accent-hover)]',
  "#user-menu": "[min-width:280px]",
  ".shortcuts":
    "[grid-template-columns:max-content_1fr] [gap:8px_16px] [font-size:13px] [&:where(.shortcuts)_kbd]:inline-block [&:where(.shortcuts)_kbd]:[padding:2px_6px] [&:where(.shortcuts)_kbd]:[border-width:1px] [&:where(.shortcuts)_kbd]:[border-style:solid] [&:where(.shortcuts)_kbd]:[border-color:var(--border-strong)] [&:where(.shortcuts)_kbd]:[border-bottom-width:2px] [&:where(.shortcuts)_kbd]:[border-radius:5px] [&:where(.shortcuts)_kbd]:[background:var(--surface-2)] [&:where(.shortcuts)_kbd]:[font:600_12px/1.4_var(--font-mono,_ui-monospace,_monospace)] [&:where(.shortcuts)_kbd]:[color:var(--text)]",
  "#preview-empty": "[min-height:560px]",
  ".insp-hint":
    "[margin:0_0_14px] [padding:10px_12px] [border-radius:var(--radius)] [background:var(--surface-2)]",
  ".btn-collapse":
    "max-[1240.02px]:[&:where(.btn-collapse)_.btn-label]:absolute max-[1240.02px]:[&:where(.btn-collapse)_.btn-label]:[width:1px] max-[1240.02px]:[&:where(.btn-collapse)_.btn-label]:[height:1px] max-[1240.02px]:[&:where(.btn-collapse)_.btn-label]:overflow-hidden max-[1240.02px]:[&:where(.btn-collapse)_.btn-label]:[clip:rect(0_0_0_0)] max-[1240.02px]:[&:where(.btn-collapse)_.btn-label]:whitespace-nowrap max-[1240.02px]:[padding:0_9px]",
  ".drawer-toggle": "max-[900.02px]:inline-flex! hidden! @max-[820.02px]/studio:inline-flex!",
  "#inspector": "min-w-0",
  "#inspector-head": "min-w-0 [flex-shrink:0]",
  "#device-toggle":
    "flex-none @max-[540.02px]/studio:[&:where(#device-toggle)_.segmented_label]:[padding:0_8px]",
  ".drawer-head":
    "hidden @max-[820.02px]/studio:flex @max-[820.02px]/studio:items-center @max-[820.02px]/studio:justify-between @max-[820.02px]/studio:flex-none @max-[820.02px]/studio:[padding:8px_12px] @max-[820.02px]/studio:[border-bottom-width:1px] @max-[820.02px]/studio:[border-bottom-style:solid] @max-[820.02px]/studio:[border-bottom-color:var(--border)] max-[900.02px]:flex max-[900.02px]:items-center max-[900.02px]:justify-between max-[900.02px]:flex-none max-[900.02px]:[padding:8px_12px] max-[900.02px]:[border-bottom-width:1px] max-[900.02px]:[border-bottom-style:solid] max-[900.02px]:[border-bottom-color:var(--border)]",
  "#primary-cta":
    "@max-[540.02px]/studio:[&:where(#primary-cta)_.btn-label]:absolute @max-[540.02px]/studio:[&:where(#primary-cta)_.btn-label]:[width:1px] @max-[540.02px]/studio:[&:where(#primary-cta)_.btn-label]:[height:1px] @max-[540.02px]/studio:[&:where(#primary-cta)_.btn-label]:[clip-path:inset(50%)] @max-[540.02px]/studio:[&:where(#primary-cta)_.btn-label]:overflow-hidden @max-[540.02px]/studio:[&:where(#primary-cta)_.btn-label]:whitespace-nowrap @max-[540.02px]/studio:[width:34px] @max-[540.02px]/studio:[padding:0]",
  "#save-label":
    "@max-[540.02px]/studio:absolute @max-[540.02px]/studio:[width:1px] @max-[540.02px]/studio:[height:1px] @max-[540.02px]/studio:[clip-path:inset(50%)] @max-[540.02px]/studio:overflow-hidden @max-[540.02px]/studio:whitespace-nowrap",
};
export function classes(value, id) {
  const hooks = value.split(/\s+/).filter(Boolean);
  return mergeUtilities(
    ...hooks,
    ...hooks.map((key) => recipes["." + key] ?? ""),
    id ? (recipes["#" + id] ?? "") : "",
  );
}
