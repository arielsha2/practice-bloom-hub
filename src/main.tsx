import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

// Pages are lazy-loaded chunks. After a deploy, a tab opened on the previous
// version asks for chunk files that no longer exist; reload once to pick up
// the new version instead of showing a blank page.
window.addEventListener("vite:preloadError", (event) => {
  const key = "chunk-reload-at";
  try {
    const last = Number(sessionStorage.getItem(key) || 0);
    if (Date.now() - last < 10_000) return; // already tried: avoid a reload loop
    sessionStorage.setItem(key, String(Date.now()));
  } catch {
    // storage blocked: still reload once
  }
  event.preventDefault();
  window.location.reload();
});

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
