import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./tailwind.css";
import { rootUtilities } from "./recipes";
document.documentElement.classList.add(...rootUtilities.split(/\s+/));
const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(<App />);
