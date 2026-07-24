// Mentor PWA service worker — lightweight, safety-first.
//
// Scope of responsibility:
//   1. Cache the static app shell (icons, manifest, the SPA HTML entry) so the
//      app can boot offline / on a flaky connection.
//   2. NEVER cache anything that touches Supabase, auth, or AI/API calls —
//      those must always hit the network so data and auth state stay correct.
//   3. Handle the Android "share to Mentor" target (from manifest.json).
//   4. Tell the page when a new version has been installed so the UI can
//      show a "new version available" banner.
//
// Bump this on every meaningful change to force cache invalidation.
const SW_VERSION = "v1";
const SHELL_CACHE = `mentor-shell-${SW_VERSION}`;
const RUNTIME_CACHE = `mentor-runtime-${SW_VERSION}`;
const SHARE_CACHE = "mentor-share-target-v1";

// Known-stable shell assets we can safely precache at install time.
// Hashed build output (JS/CSS chunks) is intentionally NOT precached here —
// this is a hand-rolled, lightweight SW (no build-time manifest injection),
// so those are picked up opportunistically via the runtime cache instead.
const SHELL_ASSETS = [
  "/manifest.json",
  "/favicon.ico",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-512-maskable.png",
  "/icons/apple-touch-icon.png",
];

// Any request matching one of these must NEVER be cached and must always
// go straight to the network untouched.
const NEVER_CACHE_PATTERNS = [
  /supabase\.co/i,
  /\/functions\/v1\//i,
  /\/auth\/v1\//i,
  /\/rest\/v1\//i,
  /\/realtime\/v1\//i,
  /\/storage\/v1\//i,
];

function isNeverCache(url) {
  return NEVER_CACHE_PATTERNS.some((pattern) => pattern.test(url.href));
}

function isStaticAsset(request, url) {
  if (url.origin !== self.location.origin) return false;
  if (isNeverCache(url)) return false;
  if (request.method !== "GET") return false;
  return (
    /\.(?:js|css|woff2?|ttf|png|jpg|jpeg|svg|webp|ico)$/i.test(url.pathname) ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/assets/")
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL_CACHE);
      await cache.addAll(SHELL_ASSETS).catch((err) => {
        // Never let a missing shell asset block installation.
        console.warn("[mentor-sw] shell precache partial failure", err);
      });
      // Activate this SW as soon as it finishes installing.
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (key) =>
              key !== SHELL_CACHE && key !== RUNTIME_CACHE && key !== SHARE_CACHE
          )
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
      await notifyClientsOfUpdate();
    })()
  );
});

async function notifyClientsOfUpdate() {
  const clientList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of clientList) {
    client.postMessage({ type: "PWA_UPDATE_AVAILABLE", version: SW_VERSION });
  }
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Share target: Android "share to" flow lands here as a POST to /mentor.
  if (request.method === "POST" && url.pathname === "/mentor") {
    event.respondWith(handleShareTarget(request));
    return;
  }

  // Anything Supabase/auth/AI-related, or any non-GET request, bypasses the
  // service worker entirely — go straight to the network, no interception.
  if (request.method !== "GET" || isNeverCache(url)) {
    return;
  }

  if (url.origin !== self.location.origin) {
    return;
  }

  // SPA navigations: network-first so users always get the latest shell,
  // falling back to the cached shell only when truly offline.
  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // Static app-shell assets: cache-first, refreshed in the background.
  if (isStaticAsset(request, url)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Everything else: default network behavior, untouched.
});

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (err) {
    const cache = await caches.open(SHELL_CACHE);
    const cached = await cache.match("/") || (await cache.match(request));
    if (cached) return cached;
    throw err;
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  const networkFetch = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => undefined);

  return cached || (await networkFetch) || fetch(request);
}

async function handleShareTarget(request) {
  try {
    const formData = await request.formData();
    const payload = {
      title: formData.get("title") || "",
      text: formData.get("text") || "",
      url: formData.get("url") || "",
      receivedAt: Date.now(),
      fileCount: 0,
    };

    const cache = await caches.open(SHARE_CACHE);

    // Store up to 5 shared images as blobs so the app can read them after redirect.
    const files = formData.getAll("images").filter((item) => item instanceof File);
    const maxFiles = Math.min(files.length, 5);
    for (let i = 0; i < maxFiles; i++) {
      const file = files[i];
      await cache.put(
        `/__share-target-file-${i}`,
        new Response(file, { headers: { "Content-Type": file.type || "application/octet-stream" } })
      );
    }
    payload.fileCount = maxFiles;

    await cache.put(
      "/__share-target-payload",
      new Response(JSON.stringify(payload), { headers: { "Content-Type": "application/json" } })
    );

    return Response.redirect("/mentor?shared=1", 303);
  } catch (err) {
    console.warn("[mentor-sw] share target handling failed", err);
    return Response.redirect("/mentor", 303);
  }
}
