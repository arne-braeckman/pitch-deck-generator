export function normalizeUrl(raw: string): string {
  try {
    const url = new URL(raw);
    // Remove trailing slash, hash, and common tracking params
    let normalized = url.origin + url.pathname.replace(/\/+$/, "") + url.search;
    // Remove common tracking params
    const cleaned = new URL(normalized);
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ref", "fbclid", "gclid"].forEach((p) =>
      cleaned.searchParams.delete(p)
    );
    const search = cleaned.searchParams.toString();
    return cleaned.origin + cleaned.pathname.replace(/\/+$/, "") + (search ? "?" + search : "");
  } catch {
    return raw;
  }
}

export function isSameDomain(base: string, candidate: string): boolean {
  try {
    const baseHost = new URL(base).hostname.replace(/^www\./, "");
    const candidateHost = new URL(candidate).hostname.replace(/^www\./, "");
    return baseHost === candidateHost;
  } catch {
    return false;
  }
}

export function ensureAbsoluteUrl(href: string, pageUrl: string): string {
  try {
    return new URL(href, pageUrl).href;
  } catch {
    return href;
  }
}
