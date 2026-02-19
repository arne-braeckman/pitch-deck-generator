import axios from "axios";
import * as cheerio from "cheerio";
import type { BrandingData } from "@/types";

export async function extractBranding(
  baseUrl: string,
  pages: Array<{ url: string; html: string }>
): Promise<BrandingData> {
  const allColors = new Map<string, number>();
  const allFonts = new Map<string, number>();
  const logos: string[] = [];
  const images: string[] = [];
  let favicon = "";
  let ogImage = "";

  for (const page of pages) {
    const $ = cheerio.load(page.html);

    // Collect CSS from <style> blocks and inline styles
    const styleContent: string[] = [];
    $("style").each((_, el) => {
      styleContent.push($(el).text());
    });
    $("[style]").each((_, el) => {
      styleContent.push($(el).attr("style") || "");
    });

    // Fetch first 3 external stylesheets
    const externalCSS: string[] = [];
    $('link[rel="stylesheet"]').each((_, el) => {
      const href = $(el).attr("href");
      if (href) {
        try {
          externalCSS.push(new URL(href, page.url).href);
        } catch { /* skip invalid URLs */ }
      }
    });

    for (const cssUrl of externalCSS.slice(0, 3)) {
      try {
        const resp = await axios.get(cssUrl, {
          timeout: 3000,
          responseType: "text",
          headers: { "User-Agent": "Mozilla/5.0 (compatible; PitchDeckBot/1.0)" },
        });
        if (typeof resp.data === "string") {
          styleContent.push(resp.data);
        }
      } catch { /* skip */ }
    }

    const cssText = styleContent.join("\n");
    extractColorsFromCSS(cssText, allColors);
    extractFontsFromCSS(cssText, allFonts);

    // Google Fonts link tags
    $('link[href*="fonts.googleapis.com"]').each((_, el) => {
      const href = $(el).attr("href") || "";
      const families = href.match(/family=([^&]+)/)?.[1];
      if (families) {
        families.split("|").forEach((f) => {
          const name = decodeURIComponent(f.split(":")[0].replace(/\+/g, " "));
          if (name) allFonts.set(name, (allFonts.get(name) || 0) + 10);
        });
      }
    });

    // Logos: images with "logo" in src, alt, class, or id
    $("img").each((_, el) => {
      const src = $(el).attr("src") || "";
      const alt = $(el).attr("alt") || "";
      const cls = $(el).attr("class") || "";
      const id = $(el).attr("id") || "";
      const combined = `${src} ${alt} ${cls} ${id}`.toLowerCase();

      let absoluteSrc = "";
      try {
        absoluteSrc = src ? new URL(src, page.url).href : "";
      } catch { /* skip */ }

      if (combined.includes("logo") && absoluteSrc) {
        logos.push(absoluteSrc);
      }
    });

    // Favicon
    $('link[rel*="icon"]').each((_, el) => {
      const href = $(el).attr("href");
      if (href && !favicon) {
        try {
          favicon = new URL(href, page.url).href;
        } catch { /* skip */ }
      }
    });

    // OG image
    const og = $('meta[property="og:image"]').attr("content");
    if (og && !ogImage) {
      try {
        ogImage = new URL(og, page.url).href;
      } catch { /* skip */ }
    }

    // Key images (larger ones, hero images)
    $("img[src]").each((_, el) => {
      const src = $(el).attr("src") || "";
      const width = parseInt($(el).attr("width") || "0", 10);
      const cls = $(el).attr("class") || "";
      const alt = $(el).attr("alt") || "";
      const combined = `${src} ${cls} ${alt}`.toLowerCase();

      if (
        src &&
        (width > 200 ||
          combined.includes("hero") ||
          combined.includes("banner") ||
          combined.includes("featured"))
      ) {
        try {
          images.push(new URL(src, page.url).href);
        } catch { /* skip */ }
      }
    });
  }

  // Sort colors by frequency, filter monochrome
  const sortedColors = [...allColors.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([color]) => color)
    .filter((c) => !isMonochrome(c));

  const sortedFonts = [...allFonts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([font]) => font);

  return {
    colors: {
      primary: sortedColors[0] || "#2563eb",
      secondary: sortedColors[1] || "#1e40af",
      accent: sortedColors[2] || "#f59e0b",
      background: "#ffffff",
      text: "#1f2937",
      all: sortedColors.slice(0, 10),
    },
    fonts: {
      heading: sortedFonts[0] || "system-ui",
      body: sortedFonts[1] || sortedFonts[0] || "system-ui",
      all: sortedFonts.slice(0, 5),
    },
    logos: [...new Set(logos)].slice(0, 3),
    favicon,
    images: [...new Set(images)].slice(0, 15),
    ogImage,
  };
}

function extractColorsFromCSS(css: string, map: Map<string, number>): void {
  // Hex colors
  const hexPattern = /#(?:[0-9a-fA-F]{3,4}){1,2}\b/g;
  let match;
  while ((match = hexPattern.exec(css)) !== null) {
    const color = match[0].toLowerCase();
    map.set(color, (map.get(color) || 0) + 1);
  }

  // rgb/rgba
  const rgbPattern = /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)/g;
  while ((match = rgbPattern.exec(css)) !== null) {
    map.set(match[0], (map.get(match[0]) || 0) + 1);
  }

  // CSS custom properties with color values (extra weight)
  const varPattern = /--[\w-]+:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/g;
  while ((match = varPattern.exec(css)) !== null) {
    const color = match[1].toLowerCase();
    map.set(color, (map.get(color) || 0) + 5);
  }
}

function extractFontsFromCSS(css: string, map: Map<string, number>): void {
  const fontPattern = /font-family\s*:\s*([^;}{]+)/gi;
  let match;
  while ((match = fontPattern.exec(css)) !== null) {
    const families = match[1].split(",").map((f) =>
      f.trim().replace(/["']/g, "")
    );
    for (const family of families) {
      if (family && !isGenericFont(family)) {
        map.set(family, (map.get(family) || 0) + 1);
      }
    }
  }
}

function isGenericFont(font: string): boolean {
  const generics = [
    "serif", "sans-serif", "monospace", "cursive", "fantasy",
    "system-ui", "inherit", "initial", "unset", "revert",
    "ui-serif", "ui-sans-serif", "ui-monospace", "ui-rounded",
  ];
  return generics.includes(font.toLowerCase());
}

function isMonochrome(hex: string): boolean {
  const clean = hex.replace("#", "");
  let r: number, g: number, b: number;

  if (clean.length === 3) {
    r = parseInt(clean[0] + clean[0], 16);
    g = parseInt(clean[1] + clean[1], 16);
    b = parseInt(clean[2] + clean[2], 16);
  } else if (clean.length === 6) {
    r = parseInt(clean.slice(0, 2), 16);
    g = parseInt(clean.slice(2, 4), 16);
    b = parseInt(clean.slice(4, 6), 16);
  } else {
    return false;
  }

  return Math.abs(r - g) < 20 && Math.abs(g - b) < 20;
}
