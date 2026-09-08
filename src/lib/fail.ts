/**
 * A failed asset load must be visible. Three things on this page would
 * otherwise fail silently: a model that never decodes leaves the veil up
 * forever at 70%, a portrait map that never arrives leaves an empty stage
 * behind a finished masthead, and a photograph that never arrives leaves a
 * plate with only its outline.
 */
let banner: HTMLElement | null = null;
const seen = new Set<string>();

export function reportAssetFailure(url: string, detail?: unknown) {
  if (seen.has(url)) return;
  seen.add(url);
  console.error("[assets] failed to load", url, detail ?? "");
  if (!banner) {
    banner = document.createElement("div");
    banner.className = "asset-banner";
    banner.setAttribute("role", "alert");
    document.body.appendChild(banner);
  }
  const line = document.createElement("p");
  line.textContent = "Asset failed to load: " + url;
  banner.appendChild(line);
}

/** Wraps any image so a 404 is reported rather than swallowed. */
export function watchImage(img: HTMLImageElement) {
  const fail = () => reportAssetFailure(img.currentSrc || img.src);
  if (img.complete && img.naturalWidth === 0 && img.src) fail();
  else img.addEventListener("error", fail, { once: true });
}
