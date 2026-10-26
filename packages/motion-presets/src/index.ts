export interface Recipe {
  id: string;
  kind: "step" | "reveal" | "validation" | "submit";
  durationMs: number;
  x: number;
  scale: number;
}
export const subtle: readonly Recipe[] = [
  { id: "fade-slide", kind: "step", durationMs: 160, x: 6, scale: 1 },
  { id: "fade", kind: "reveal", durationMs: 120, x: 0, scale: 1 },
  { id: "outline-pulse-once", kind: "validation", durationMs: 160, x: 0, scale: 1 },
  { id: "fade", kind: "submit", durationMs: 120, x: 0, scale: 1 },
];
export const guided: readonly Recipe[] = [
  { id: "slide-directional", kind: "step", durationMs: 200, x: 12, scale: 1 },
  { id: "scale-in", kind: "reveal", durationMs: 160, x: 0, scale: 0.98 },
  { id: "outline-pulse-once", kind: "validation", durationMs: 160, x: 0, scale: 1 },
  { id: "fade", kind: "submit", durationMs: 120, x: 0, scale: 1 },
];
