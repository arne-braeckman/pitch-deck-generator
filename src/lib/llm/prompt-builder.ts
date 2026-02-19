import type { PageContent, BrandingData } from "@/types";
import { WINSTON_GUIDELINES } from "./winston-guidelines";
import { SLIDE_FRAMEWORK } from "../presentation/slide-framework";

export interface PromptInput {
  contents: PageContent[];
  branding: BrandingData;
  sourceUrl: string;
}

export function buildPrompt(input: PromptInput): string {
  const { contents, branding, sourceUrl } = input;

  // Compress page contents to fit context window
  const contentSummary = contents
    .map((page) => {
      const sections = [
        `### Page: ${page.title} (${page.url})`,
        page.metaDescription ? `Meta: ${page.metaDescription}` : "",
        page.heroText ? `Hero: ${page.heroText}` : "",
        page.headings.length > 0
          ? `Headings:\n${page.headings.map((h) => `${"#".repeat(h.level)} ${h.text}`).join("\n")}`
          : "",
        page.features.length > 0
          ? `Features/Benefits:\n${page.features.slice(0, 5).map((f) => `- ${f}`).join("\n")}`
          : "",
        page.testimonials.length > 0
          ? `Testimonials:\n${page.testimonials.slice(0, 3).map((t) => `"${t}"`).join("\n")}`
          : "",
        page.ctaText.length > 0
          ? `CTA Text: ${page.ctaText.join(", ")}`
          : "",
        page.paragraphs.length > 0
          ? `Key Content:\n${page.paragraphs.slice(0, 8).join("\n\n")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      return sections;
    })
    .join("\n\n---\n\n");

  const brandingInstructions = `
## Branding to Apply

Colors:
- Primary: ${branding.colors.primary}
- Secondary: ${branding.colors.secondary}
- Accent: ${branding.colors.accent}
- Full palette: ${branding.colors.all.join(", ") || "none detected, use the primary/secondary/accent"}

Typography:
- Heading font: ${branding.fonts.heading}
- Body font: ${branding.fonts.body}
${branding.fonts.all.length > 0 ? `- Available fonts: ${branding.fonts.all.join(", ")}` : ""}

Logo URLs: ${branding.logos.length > 0 ? branding.logos.join(", ") : "None found — use the company name as text instead"}
Favicon: ${branding.favicon || "None"}
OG Image: ${branding.ogImage || "None"}
Key Images: ${branding.images.length > 0 ? branding.images.slice(0, 8).join(", ") : "None found"}

IMPORTANT:
- Use Google Fonts @import for the heading and body fonts if they are not system fonts.
  Include the @import at the top of the <style> block.
- Use the exact brand colors for backgrounds, buttons, and accents by updating
  the CSS custom properties in :root.
- Include the logo image on the title slide if a URL was found.
- Reference key images from the site where relevant (use the absolute URLs provided).
`;

  return `You are an expert presentation designer creating a pitch deck. Generate a complete,
self-contained HTML file that is a pitch presentation about the company/product at:
${sourceUrl}

${WINSTON_GUIDELINES}

## Scraped Website Content

${contentSummary}

${brandingInstructions}

## Slide Framework

Use this exact HTML/CSS/JS framework as the base. Your output should be a complete HTML
file using this structure. Each slide is a <section class="slide"> inside <div id="deck">.
Customize the CSS custom properties in :root with the brand colors and fonts.
Add Google Fonts @import if needed.

\`\`\`html
${SLIDE_FRAMEWORK}
\`\`\`

## Output Requirements

1. Output a COMPLETE, valid HTML file. Start with <!DOCTYPE html> and end with </html>.
2. The file must work when saved and opened locally in a modern browser.
3. Auto-determine the number of slides based on content richness. Typically 8-15 slides.
4. Apply the brand colors and fonts throughout. Update the CSS custom properties in :root.
5. Include images from the scraped site using their absolute URLs where relevant.
6. Use the slide framework provided — keep the same navigation JS and CSS structure.
7. Add <!-- SPEAKER NOTE: ... --> HTML comments for suggested talking points.
8. Make it visually striking: large typography, generous whitespace, bold color blocks.
9. Include subtle CSS animations or transitions for slide content (fade-in, slide-up, etc.).
10. Ensure proper contrast ratios for readability.
11. Use layout helpers like .two-col, .stat, .subtitle, blockquote where appropriate.
12. The title slide should include the company logo (if URL found) and company name.
13. Follow the Winston presentation philosophy for structure and content flow.

Output ONLY the HTML file content. No markdown code fences, no explanations, no preamble.
Start directly with <!DOCTYPE html>.`;
}
