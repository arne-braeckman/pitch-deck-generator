import axios from "axios";
import * as cheerio from "cheerio";

/**
 * Step 1a: Generate a styles.md string from scraped pages.
 * Copies branding fonts, styles, background colors, button layouts,
 * and all other CSS components found on the website.
 */
export async function generateStylesMd(
  baseUrl: string,
  pages: Array<{ url: string; html: string }>
): Promise<string> {
  const cssVariables: Map<string, string> = new Map();
  const colorUsages: Map<string, number> = new Map();
  const fontFamilies: Map<string, number> = new Map();
  const fontImports: string[] = [];
  const buttonStyles: string[] = [];
  const layoutPatterns: string[] = [];
  const rawCSSBlocks: string[] = [];
  const logos: string[] = [];
  const images: string[] = [];
  let favicon = "";
  let ogImage = "";

  for (const page of pages) {
    const $ = cheerio.load(page.html);

    // ── Collect all CSS sources ──────────────────────────────────
    const styleContent: string[] = [];

    // Inline <style> blocks
    $("style").each((_, el) => {
      const css = $(el).text().trim();
      if (css) styleContent.push(css);
    });

    // Inline style attributes
    $("[style]").each((_, el) => {
      const style = $(el).attr("style") || "";
      if (style) styleContent.push(`inline { ${style} }`);
    });

    // External stylesheets (first 3 per page)
    const externalCSS: string[] = [];
    $('link[rel="stylesheet"]').each((_, el) => {
      const href = $(el).attr("href");
      if (href) {
        try {
          externalCSS.push(new URL(href, page.url).href);
        } catch { /* skip */ }
      }
    });

    for (const cssUrl of externalCSS.slice(0, 3)) {
      try {
        const resp = await axios.get(cssUrl, {
          timeout: 4000,
          responseType: "text",
          headers: { "User-Agent": "Mozilla/5.0 (compatible; PitchDeckBot/1.0)" },
        });
        if (typeof resp.data === "string") {
          styleContent.push(resp.data);
        }
      } catch { /* skip */ }
    }

    const allCSS = styleContent.join("\n");

    // ── Extract CSS custom properties (:root variables) ──────────
    const rootVarPattern = /--([\w-]+)\s*:\s*([^;}{]+)/g;
    let match;
    while ((match = rootVarPattern.exec(allCSS)) !== null) {
      const name = `--${match[1]}`;
      const value = match[2].trim();
      if (!cssVariables.has(name)) {
        cssVariables.set(name, value);
      }
    }

    // ── Extract colors ───────────────────────────────────────────
    // Hex
    const hexPattern = /#(?:[0-9a-fA-F]{3,4}){1,2}\b/g;
    while ((match = hexPattern.exec(allCSS)) !== null) {
      const c = match[0].toLowerCase();
      colorUsages.set(c, (colorUsages.get(c) || 0) + 1);
    }
    // rgb/rgba
    const rgbPattern = /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)/g;
    while ((match = rgbPattern.exec(allCSS)) !== null) {
      colorUsages.set(match[0], (colorUsages.get(match[0]) || 0) + 1);
    }
    // hsl/hsla
    const hslPattern = /hsla?\(\s*\d+\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?\s*(?:,\s*[\d.]+\s*)?\)/g;
    while ((match = hslPattern.exec(allCSS)) !== null) {
      colorUsages.set(match[0], (colorUsages.get(match[0]) || 0) + 1);
    }

    // ── Extract font families ────────────────────────────────────
    const fontFamilyPattern = /font-family\s*:\s*([^;}{]+)/gi;
    while ((match = fontFamilyPattern.exec(allCSS)) !== null) {
      const families = match[1].split(",").map((f) =>
        f.trim().replace(/["']/g, "")
      );
      for (const family of families) {
        if (family && !isGenericFont(family)) {
          fontFamilies.set(family, (fontFamilies.get(family) || 0) + 1);
        }
      }
    }

    // Google Fonts imports
    $('link[href*="fonts.googleapis.com"]').each((_, el) => {
      const href = $(el).attr("href") || "";
      if (href && !fontImports.includes(href)) {
        fontImports.push(href);
      }
    });
    // @import in CSS
    const importPattern = /@import\s+url\(["']?([^"')]+fonts[^"')]+)["']?\)/g;
    while ((match = importPattern.exec(allCSS)) !== null) {
      if (!fontImports.includes(match[1])) {
        fontImports.push(match[1]);
      }
    }

    // ── Extract button styles ────────────────────────────────────
    const btnPattern = /(?:\.btn[^{]*|\.button[^{]*|button[^{]*|\[class\*="btn"\][^{]*)\{([^}]+)\}/gi;
    while ((match = btnPattern.exec(allCSS)) !== null) {
      const props = match[1].trim();
      if (props.length > 10 && !buttonStyles.includes(props)) {
        buttonStyles.push(props);
      }
    }

    // ── Extract layout/grid/flex patterns ────────────────────────
    const layoutPattern = /(?:\.(container|wrapper|grid|flex|row|col|section|hero|card|header|footer|nav)[^{]*)\{([^}]+)\}/gi;
    while ((match = layoutPattern.exec(allCSS)) !== null) {
      const selector = match[0].split("{")[0].trim();
      const props = match[2].trim();
      if (props.length > 15) {
        layoutPatterns.push(`${selector} { ${props} }`);
      }
    }

    // ── Extract full raw CSS blocks (border-radius, shadows, transitions) ──
    // Key visual properties
    const visualProps: string[] = [];
    const borderRadiusPattern = /border-radius\s*:\s*([^;}{]+)/gi;
    while ((match = borderRadiusPattern.exec(allCSS)) !== null) {
      visualProps.push(`border-radius: ${match[1].trim()}`);
    }
    const boxShadowPattern = /box-shadow\s*:\s*([^;}{]+)/gi;
    while ((match = boxShadowPattern.exec(allCSS)) !== null) {
      visualProps.push(`box-shadow: ${match[1].trim()}`);
    }
    const transitionPattern = /transition\s*:\s*([^;}{]+)/gi;
    while ((match = transitionPattern.exec(allCSS)) !== null) {
      visualProps.push(`transition: ${match[1].trim()}`);
    }
    if (visualProps.length > 0) {
      rawCSSBlocks.push(...[...new Set(visualProps)].slice(0, 20));
    }

    // ── Extract logos and key images ─────────────────────────────
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

      if (!absoluteSrc) return;

      if (combined.includes("logo")) {
        logos.push(absoluteSrc);
      }
    });

    // Key images (hero, banner, featured)
    $("img[src]").each((_, el) => {
      const src = $(el).attr("src") || "";
      const width = parseInt($(el).attr("width") || "0", 10);
      const cls = $(el).attr("class") || "";
      const alt = $(el).attr("alt") || "";
      const combined = `${src} ${cls} ${alt}`.toLowerCase();

      if (
        src &&
        (width > 200 || combined.includes("hero") || combined.includes("banner") || combined.includes("featured"))
      ) {
        try {
          images.push(new URL(src, page.url).href);
        } catch { /* skip */ }
      }
    });

    if (!favicon) {
      $('link[rel*="icon"]').each((_, el) => {
        const href = $(el).attr("href");
        if (href && !favicon) {
          try { favicon = new URL(href, page.url).href; } catch { /* skip */ }
        }
      });
    }

    if (!ogImage) {
      const og = $('meta[property="og:image"]').attr("content");
      if (og) {
        try { ogImage = new URL(og, page.url).href; } catch { /* skip */ }
      }
    }
  }

  // ── Sort and rank colors ─────────────────────────────────────
  const sortedColors = [...colorUsages.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([color]) => color);

  const nonMonochromeColors = sortedColors.filter((c) => !isMonochrome(c));
  const monochromeColors = sortedColors.filter((c) => isMonochrome(c));

  const sortedFonts = [...fontFamilies.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([font]) => font);

  // ── Build the styles.md document ─────────────────────────────
  const sections: string[] = [];

  sections.push(`# Website Styles — ${baseUrl}\n`);

  // CSS Custom Properties
  if (cssVariables.size > 0) {
    sections.push(`## CSS Custom Properties (Design Tokens)\n`);
    sections.push("```css");
    sections.push(":root {");
    for (const [name, value] of cssVariables) {
      sections.push(`  ${name}: ${value};`);
    }
    sections.push("}");
    sections.push("```\n");
  }

  // Color Palette
  sections.push(`## Color Palette\n`);
  sections.push(`### Brand Colors (by frequency)`);
  if (nonMonochromeColors.length > 0) {
    sections.push(`- **Primary**: ${nonMonochromeColors[0]}`);
    if (nonMonochromeColors[1]) sections.push(`- **Secondary**: ${nonMonochromeColors[1]}`);
    if (nonMonochromeColors[2]) sections.push(`- **Accent**: ${nonMonochromeColors[2]}`);
    sections.push(`- **Full palette**: ${nonMonochromeColors.slice(0, 15).join(", ")}`);
  } else {
    sections.push(`- No brand colors detected, use defaults`);
  }
  sections.push(`\n### Neutrals / Monochrome`);
  sections.push(`- ${monochromeColors.slice(0, 8).join(", ") || "none detected"}`);
  sections.push("");

  // Typography
  sections.push(`## Typography\n`);
  if (sortedFonts.length > 0) {
    sections.push(`- **Primary font**: ${sortedFonts[0]}`);
    if (sortedFonts[1]) sections.push(`- **Secondary font**: ${sortedFonts[1]}`);
    sections.push(`- **All fonts**: ${sortedFonts.join(", ")}`);
  } else {
    sections.push(`- No custom fonts detected (uses system-ui)`);
  }
  if (fontImports.length > 0) {
    sections.push(`\n### Font Imports`);
    for (const url of fontImports) {
      sections.push(`- ${url}`);
    }
  }
  sections.push("");

  // Button Styles
  if (buttonStyles.length > 0) {
    sections.push(`## Button Styles\n`);
    sections.push("```css");
    for (const style of [...new Set(buttonStyles)].slice(0, 5)) {
      sections.push(`.btn { ${style} }\n`);
    }
    sections.push("```\n");
  }

  // Layout Patterns
  if (layoutPatterns.length > 0) {
    sections.push(`## Layout Patterns\n`);
    sections.push("```css");
    for (const pattern of [...new Set(layoutPatterns)].slice(0, 10)) {
      sections.push(`${pattern}\n`);
    }
    sections.push("```\n");
  }

  // Visual Properties (shadows, radii, transitions)
  if (rawCSSBlocks.length > 0) {
    sections.push(`## Visual Properties\n`);
    sections.push("```css");
    for (const prop of [...new Set(rawCSSBlocks)].slice(0, 15)) {
      sections.push(`${prop};`);
    }
    sections.push("```\n");
  }

  // Images & Logos
  sections.push(`## Brand Assets\n`);
  sections.push(`### Logos`);
  if (logos.length > 0) {
    for (const logo of [...new Set(logos)].slice(0, 3)) {
      sections.push(`- ${logo}`);
    }
  } else {
    sections.push(`- No logos detected`);
  }
  sections.push(`\n### Key Images`);
  if (images.length > 0) {
    for (const img of [...new Set(images)].slice(0, 15)) {
      sections.push(`- ${img}`);
    }
  } else {
    sections.push(`- No key images detected`);
  }
  if (favicon) sections.push(`\n### Favicon\n- ${favicon}`);
  if (ogImage) sections.push(`\n### OG Image\n- ${ogImage}`);

  return sections.join("\n");
}

function isGenericFont(font: string): boolean {
  const generics = [
    "serif", "sans-serif", "monospace", "cursive", "fantasy",
    "system-ui", "inherit", "initial", "unset", "revert",
    "ui-serif", "ui-sans-serif", "ui-monospace", "ui-rounded",
  ];
  return generics.includes(font.toLowerCase());
}

function isMonochrome(color: string): boolean {
  // Only check hex colors for simplicity
  if (!color.startsWith("#")) return false;
  const clean = color.replace("#", "");
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
