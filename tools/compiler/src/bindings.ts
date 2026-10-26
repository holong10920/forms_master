export const storeEntry = `import {createElement} from "react";import {createRoot} from "react-dom/client";import {flushSync} from "react-dom";import {StoreSelectorField} from "@platform/store-selector/browser";export function mount(host,props){const root=createRoot(host);flushSync(()=>root.render(createElement(StoreSelectorField.Component,props)));return ()=>flushSync(()=>root.unmount());}`;
export function motionEntry(preset: "subtle" | "guided") {
  return `import {mountRegion} from "@fb/motion-adapter";import {${preset} as recipes} from "@platform/motion-presets";export function mount(host,content){return mountRegion(host,content,recipes);}`;
}
