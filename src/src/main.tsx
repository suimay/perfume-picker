import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

function installGlobalGuards() {
  if (typeof window !== "undefined") {
    window.addEventListener("error", (e) => {
      console.error("[window.onerror]", e.error || e.message || e);
    });
    window.addEventListener("unhandledrejection", (e) => {
      console.error("[unhandledrejection]", e.reason || e);
    });
  }
}

installGlobalGuards();

const el = document.getElementById("root");
if (!el) {
  console.error('[FATAL] <div id="root"> not found in index.html');
} else {
  console.log("[mount] main.tsx mounting <App/>");
  createRoot(el).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
