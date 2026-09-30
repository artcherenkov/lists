import { Toaster } from "@lists/ui/components/ui/sonner";
import { StrictMode } from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";

import "./styles.css";
import { App } from "./App.tsx";

// ponytail: тема просто следует за системной. Переключатель – когда понадобится.
document.documentElement.classList.toggle(
  "dark",
  matchMedia("(prefers-color-scheme: dark)").matches,
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    {/* Сверху: снизу тосты перекрывает форма и кнопка «плюс». Портал наружу из
        #root: у обёртки постоянный will-change-transform, и fixed внутри неё
        позиционируется от обёртки, а не от вьюпорта. */}
    {createPortal(<Toaster position="top-center" />, document.body)}
  </StrictMode>,
);
