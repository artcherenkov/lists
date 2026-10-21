import { Toaster } from "@lists/ui/components/ui/sonner";
import { StrictMode } from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";

import "./styles.css";
import { App } from "./App.tsx";
import { startJournal } from "./journal/journal.ts";
import { startSession } from "./session/session.ts";

startJournal();
startSession();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    {/* Сверху: снизу тосты перекрывает форма и кнопка «плюс». Портал наружу из #root:
        причина – в комментарии к обёртке в index.html. */}
    {createPortal(<Toaster position="top-center" />, document.body)}
  </StrictMode>,
);
