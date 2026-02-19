import axios from "axios";
import * as cheerio from "cheerio";
import { normalizeUrl, isSameDomain } from "../utils/url";
import type { CrawlResult, CrawlOptions } from "@/types";

const DEFAULT_OPTIONS: CrawlOptions = {
  maxPages: 8,
  maxDepth: 2,
  timeoutMs: 6000,
  concurrency: 3,
};

const USER_AGENT = "Mozilla/5.0 (compatible; PitchDeckBot/1.0; +https://pitchdeck.app)";

export async function crawlSite(
  startUrl: string,
  options: Partial<CrawlOptions> = {}
): Promise<CrawlResult[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const visited = new Set<string>();
  const results: CrawlResult[] = [];
  const queue: Array<{ url: string; depth: number }> = [
    { url: normalizeUrl(startUrl), depth: 0 },
  ];

  // Try sitemap for better page discovery
  const sitemapUrls = await fetchSitemap(startUrl);
  for (const sUrl of sitemapUrls.slice(0, opts.maxPages)) {
    if (!visited.has(sUrl)) {
      queue.push({ url: sUrl, depth: 1 });
    }
  }

  while (queue.length > 0 && results.length < opts.maxPages) {
    const batch = queue.splice(0, opts.concurrency);
    const promises = batch
      .filter(({ url }) => !visited.has(url))
      .map(async ({ url, depth }) => {
        visited.add(url);
        try {
          const response = await axios.get(url, {
            timeout: opts.timeoutMs,
            headers: { "User-Agent": USER_AGENT },
            maxRedirects: 3,
            responseType: "text",
            // Only accept HTML responses
            validateStatus: (status) => status >= 200 && status < 300,
          });

          const contentType = response.headers["content-type"] || "";
          if (!contentType.includes("text/html")) return;

          const html = response.data as string;
          const $ = cheerio.load(html);
          const title = $("title").text().trim();

          results.push({ url, html, title, statusCode: response.status });

          // Discover new links if not at max depth
          if (depth < opts.maxDepth) {
            $("a[href]").each((_, el) => {
              const href = $(el).attr("href");
              if (!href) return;
              // Skip anchors, javascript:, mailto:, tel:
              if (href.startsWith("#") || href.startsWith("javascript:") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

              try {
                const absolute = new URL(href, url).href;
                const normalized = normalizeUrl(absolute);
                if (isSameDomain(startUrl, normalized) && !visited.has(normalized)) {
                  queue.push({ url: normalized, depth: depth + 1 });
                }
              } catch {
                // Invalid URL, skip
              }
            });
          }
        } catch {
          // Silently skip failed pages
        }
      });

    await Promise.all(promises);
  }

  return results;
}

async function fetchSitemap(baseUrl: string): Promise<string[]> {
  try {
    const origin = new URL(baseUrl).origin;
    const resp = await axios.get(`${origin}/sitemap.xml`, {
      timeout: 5000,
      headers: { "User-Agent": USER_AGENT },
      responseType: "text",
    });
    const $ = cheerio.load(resp.data, { xmlMode: true });
    return $("loc")
      .map((_, el) => $(el).text())
      .get()
      .slice(0, 20);
  } catch {
    return [];
  }
}
