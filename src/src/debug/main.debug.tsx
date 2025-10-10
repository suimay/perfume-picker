import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import SmokeApp from "./SmokeApp";

const el = document.getElementById("root");
if (!el) {
  console.error("[FATAL][debug] root not found");
} else {
  console.log("[mount][debug] mounting <SmokeApp/>");
  createRoot(el).render(
    <StrictMode>
      <SmokeApp />
    </StrictMode>
  );
}
