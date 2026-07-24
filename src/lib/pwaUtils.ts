// PWA foundation utilities for the Mentor section.
// Pure helpers only — no UI. Intended to be consumed by future UI work
// (install prompts, update banners) and by analytics/chat payloads via
// `getPwaAnalyticsContext()`.

const SHARE_TARGET_PAYLOAD_KEY = "/__share-target-payload";
const SHARE_TARGET_FILE_PREFIX = "/__share-target-file-";
const SHARE_CACHE_NAME = "mentor-share-target-v1";

/** True when the app is running installed/standalone (Android/desktop or iOS home-screen). */
export function isPwaStandalone(): boolean {
  if (typeof window === "undefined") return false;

  const displayModeStandalone =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches;

  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  return Boolean(displayModeStandalone || iosStandalone);
}

/** Flag to merge into Supabase analytics / chat message payloads. */
export function getPwaAnalyticsContext(): { is_pwa: boolean } {
  return { is_pwa: isPwaStandalone() };
}

/**
 * Listens for the browser's `appinstalled` event and logs it.
 * Returns an unsubscribe function.
 */
export function trackPwaInstall(onInstalled?: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  const handler = () => {
    // eslint-disable-next-line no-console
    console.log("[pwa] app installed");
    onInstalled?.();
  };

  window.addEventListener("appinstalled", handler);
  return () => window.removeEventListener("appinstalled", handler);
}

/**
 * Registers /service-worker.js and wires up the update-detection mechanism.
 * Dispatches a `PWA_UPDATE_AVAILABLE` CustomEvent on `window` when a new
 * service worker has installed and taken over — the UI layer can listen for
 * this later to show a "new version available" banner. Not called
 * automatically anywhere; call explicitly once the app is ready to go live
 * with the service worker.
 */
export function registerServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const dispatchUpdateAvailable = () => {
    window.dispatchEvent(new CustomEvent("PWA_UPDATE_AVAILABLE"));
  };

  navigator.serviceWorker.addEventListener("message", (event) => {
    if ((event.data as { type?: string })?.type === "PWA_UPDATE_AVAILABLE") {
      dispatchUpdateAvailable();
    }
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              dispatchUpdateAvailable();
            }
          });
        });
      })
      .catch((err) => {
        console.error("[pwa] service worker registration failed", err);
      });
  });
}

export interface PendingShare {
  title: string;
  text: string;
  url: string;
  receivedAt: number;
  fileCount: number;
  files: Blob[];
}

/**
 * Reads and clears any payload left by the service worker's share_target
 * handler (Android "share to Mentor" from WhatsApp etc). Returns null when
 * there is nothing pending. Safe to call even when caches are unsupported.
 */
export async function consumePendingShare(): Promise<PendingShare | null> {
  if (typeof window === "undefined" || !("caches" in window)) return null;

  try {
    const cache = await caches.open(SHARE_CACHE_NAME);
    const payloadResponse = await cache.match(SHARE_TARGET_PAYLOAD_KEY);
    if (!payloadResponse) return null;

    const payload = (await payloadResponse.json()) as Omit<PendingShare, "files">;
    const files: Blob[] = [];
    for (let i = 0; i < payload.fileCount; i++) {
      const fileResponse = await cache.match(`${SHARE_TARGET_FILE_PREFIX}${i}`);
      if (fileResponse) files.push(await fileResponse.blob());
    }

    await cache.delete(SHARE_TARGET_PAYLOAD_KEY);
    for (let i = 0; i < payload.fileCount; i++) {
      await cache.delete(`${SHARE_TARGET_FILE_PREFIX}${i}`);
    }

    return { ...payload, files };
  } catch (err) {
    console.error("[pwa] failed to read pending share", err);
    return null;
  }
}
