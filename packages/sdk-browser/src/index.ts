import type { ReactNode } from "react";
export interface StoreOption {
  id: string;
  name: string;
  prefecture?: string;
}
export interface StoreConfig {
  filterByPrefecture?: boolean;
  placeholder?: string;
}
export type QueryState<O> =
  | { state: "idle" }
  | { state: "pending" }
  | { state: "ready"; value: O }
  | { state: "error"; code: string; retry(): void };
export interface FieldProps<V, C, I> {
  value: V | undefined;
  onChange(next: V | undefined): void;
  onCommit(): void;
  status: { disabled: boolean; invalid: boolean };
  config: Readonly<C>;
  inputs: Readonly<Partial<I>>;
  options?: QueryState<StoreOption[]>;
  ids: { input: string; label: string };
}
export interface FieldTypeBrowser<V, C, I> {
  Component: (props: FieldProps<V, C, I>) => ReactNode;
  Summary?: (props: {
    value: V | undefined;
    config: Readonly<C>;
    options?: QueryState<StoreOption[]>;
  }) => ReactNode;
}
export interface StoreModule {
  mount(
    host: HTMLElement,
    props: FieldProps<string, StoreConfig, { prefecture: string }>,
  ): () => void;
}
export interface MotionNotice {
  sequence: number;
  kind: "step" | "reveal" | "validation" | "submit";
  direction: number;
}
export interface MotionModule {
  mount(
    host: HTMLElement,
    content: HTMLElement,
  ): { update(notice: MotionNotice): void; unmount(): void };
}
