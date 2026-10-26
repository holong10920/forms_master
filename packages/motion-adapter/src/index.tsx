import { createElement, useLayoutEffect, useRef, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { LazyMotion, domAnimation, m } from "motion/react";
import type { Recipe } from "@platform/motion-presets";
export interface Notice {
  sequence: number;
  kind: Recipe["kind"];
  direction: number;
}
// Motion receives only value-free notice + opaque React children. No engine/network/storage.
function Region(p: { notice: Notice; recipes: readonly Recipe[]; children?: ReactNode }) {
  const recipe = p.recipes.find((r) => r.kind === p.notice.kind);
  return createElement(
    LazyMotion,
    { features: domAnimation, strict: true },
    createElement(
      m.div,
      {
        key: p.notice.sequence,
        id: "motion-region",

        initial: {
          opacity: 0.8,
          x: (recipe?.x ?? 0) * p.notice.direction,
          scale: recipe?.scale ?? 1,
        },
        animate: { opacity: 1, x: 0, scale: 1 },
        transition: { type: "tween", duration: (recipe?.durationMs ?? 0) / 1000 },
      },
      p.children,
    ),
  );
}
// Trusted presentation bridge owns DOM movement; never passes DOM/state into Region.
function Content(p: { content: HTMLElement }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    ref.current?.append(p.content);
  }, [p.content]);
  return createElement("div", { ref });
}
export function mountRegion(host: HTMLElement, content: HTMLElement, recipes: readonly Recipe[]) {
  const root = createRoot(host);
  return {
    update(notice: Notice) {
      flushSync(() => {
        root.render(
          createElement(Region, { notice, recipes }, createElement(Content, { content })),
        );
      });
    },
    unmount() {
      flushSync(() => {
        root.unmount();
      });
    },
  };
}
