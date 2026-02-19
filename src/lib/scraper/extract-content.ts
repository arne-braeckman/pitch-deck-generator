import * as cheerio from "cheerio";
import type { PageContent } from "@/types";

export function extractContent(url: string, html: string): PageContent {
  const $ = cheerio.load(html);

  // Remove noise
  $("script, style, nav, footer, aside, iframe, noscript, svg, header").remove();

  const headings: PageContent["headings"] = [];
  $("h1, h2, h3, h4").each((_, el) => {
    const text = $(el).text().trim();
    if (text) {
      headings.push({
        level: parseInt(el.tagName.replace("h", ""), 10),
        text,
      });
    }
  });

  const paragraphs = $("p")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter((t) => t.length > 20);

  const listItems = $("li")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter((t) => t.length > 10 && t.length < 300);

  const metaDescription =
    $('meta[name="description"]').attr("content") || "";

  // Hero: first h1 + first paragraph nearby
  const h1Text = $("h1").first().text().trim();
  const firstP = $("p").first().text().trim();
  const heroText = [h1Text, firstP].filter(Boolean).join(" — ");

  // Features: look for common patterns
  const features: string[] = [];
  $('[class*="feature"], [class*="benefit"], [class*="card"], [class*="service"], [class*="advantage"]').each((_, el) => {
    const text = $(el).text().trim().slice(0, 200);
    if (text.length > 20 && text.length < 500) features.push(text);
  });

  // Testimonials
  const testimonials: string[] = [];
  $('blockquote, [class*="testimonial"], [class*="quote"], [class*="review"]').each((_, el) => {
    const text = $(el).text().trim().slice(0, 300);
    if (text.length > 20) testimonials.push(text);
  });

  // CTA text
  const ctaText = $(
    'a[class*="btn"], button, a[class*="cta"], [class*="button"], a[class*="action"]'
  )
    .map((_, el) => $(el).text().trim())
    .get()
    .filter((t) => t.length > 1 && t.length < 50);

  return {
    url,
    title: cheerio.load(html)("title").text().trim(),
    headings,
    paragraphs,
    listItems,
    metaDescription,
    heroText,
    features: features.slice(0, 10),
    testimonials: testimonials.slice(0, 5),
    ctaText: [...new Set(ctaText)].slice(0, 8),
  };
}
