import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

/**
 * Step 1b: Generate a content.md string from scraped pages.
 * Contains the raw textual content of every page, structured with
 * correct heading tags, output as markdown (not HTML).
 */
export function generateContentMd(
  baseUrl: string,
  pages: Array<{ url: string; html: string }>
): string {
  const sections: string[] = [];

  sections.push(`# Website Content — ${baseUrl}\n`);

  for (const page of pages) {
    const $ = cheerio.load(page.html);

    const title = $("title").text().trim();
    const metaDescription = $('meta[name="description"]').attr("content") || "";

    // Remove scripts, styles, and non-content elements
    // But keep nav, header, footer for full content extraction
    $("script, style, iframe, noscript, svg").remove();

    sections.push(`---\n`);
    sections.push(`## Page: ${title || page.url}\n`);
    sections.push(`**URL**: ${page.url}`);
    if (metaDescription) {
      sections.push(`**Description**: ${metaDescription}`);
    }
    sections.push("");

    // Walk through the body content in DOM order, preserving structure
    const body = $("body");
    const content = extractNodeContent($, body);

    if (content.trim()) {
      sections.push(content);
    }

    sections.push("");
  }

  return sections.join("\n");
}

/**
 * Recursively walks the DOM tree and converts to markdown,
 * preserving heading hierarchy and text structure.
 */
function extractNodeContent(
  $: cheerio.CheerioAPI,
  root: cheerio.Cheerio<AnyNode>
): string {
  const lines: string[] = [];
  const seen = new Set<string>(); // Deduplicate

  // Process key content-bearing elements in order
  root.find("h1, h2, h3, h4, h5, h6, p, li, blockquote, figcaption, td, th, dt, dd, a[class*='btn'], a[class*='cta'], button").each((_, el) => {
    const $el = $(el);
    const tag = el.tagName.toLowerCase();
    const text = $el.text().trim();

    // Skip empty or duplicate content
    if (!text || text.length < 3) return;
    // Deduplicate by first 80 chars
    const key = text.slice(0, 80);
    if (seen.has(key)) return;
    seen.add(key);

    switch (tag) {
      case "h1":
        lines.push(`\n### ${text}\n`);
        break;
      case "h2":
        lines.push(`\n#### ${text}\n`);
        break;
      case "h3":
        lines.push(`\n##### ${text}\n`);
        break;
      case "h4":
      case "h5":
      case "h6":
        lines.push(`\n**${text}**\n`);
        break;
      case "p":
        if (text.length > 15) {
          lines.push(`${text}\n`);
        }
        break;
      case "li":
        if (text.length > 5) {
          lines.push(`- ${text}`);
        }
        break;
      case "blockquote":
        lines.push(`\n> ${text}\n`);
        break;
      case "figcaption":
        lines.push(`*${text}*\n`);
        break;
      case "td":
      case "th":
        // Tables: just capture cell text
        if (text.length > 3) {
          lines.push(`| ${text} |`);
        }
        break;
      case "dt":
        lines.push(`\n**${text}**`);
        break;
      case "dd":
        lines.push(`${text}\n`);
        break;
      case "a":
      case "button":
        // CTAs / buttons
        if (text.length > 1 && text.length < 60) {
          lines.push(`[CTA: ${text}]`);
        }
        break;
    }
  });

  return lines.join("\n");
}
