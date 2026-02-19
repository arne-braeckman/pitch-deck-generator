import { WINSTON_GUIDELINES } from "./winston-guidelines";
import { SLIDE_FRAMEWORK } from "../presentation/slide-framework";

/**
 * Step 3: Build the final prompt that combines:
 * - styles.md (look & feel / branding)
 * - presentationcontent.md (restructured content from LLM)
 * - Winston guidelines
 * - Slide framework
 *
 * to produce the final self-contained HTML presentation.
 */
export function buildPresentationPrompt(
  stylesMd: string,
  presentationContentMd: string,
  sourceUrl: string
): string {
  return `You are an expert presentation designer. Your job is to create a stunning,
modern, self-contained HTML presentation file.

You will receive TWO inputs:
1. **STYLES** — The complete visual branding extracted from ${sourceUrl}
2. **CONTENT** — The restructured presentation content, already analyzed and organized

Your task: combine them into a polished HTML slide deck that looks like it was
designed by a professional agency that deeply understands the brand.

---

## STYLES (Brand Identity)

${stylesMd}

---

## CONTENT (Presentation Structure)

${presentationContentMd}

---

${WINSTON_GUIDELINES}

---

## Slide Framework

Use this exact HTML/CSS/JS framework as the base. Your output must be a complete
HTML file using this structure. Each slide is a \`<section class="slide">\` inside
\`<div id="deck">\`. Customize the CSS custom properties in \`:root\` with the
brand colors and fonts from the STYLES section.

\`\`\`html
${SLIDE_FRAMEWORK}
\`\`\`

---

## Design Requirements

### Branding Fidelity
1. **MATCH THE WEBSITE EXACTLY**: Use the exact colors from the STYLES section — primary,
   secondary, accent — in the CSS custom properties. Do NOT use generic blues/grays.
2. **USE THEIR FONTS**: Import the exact fonts listed in the STYLES section via Google Fonts
   @import. Set them in --font-heading and --font-body.
3. **INCLUDE THE LOGO**: If logo URLs are provided, display the logo on the title slide
   and optionally as a small watermark on other slides.
4. **REPRODUCE THEIR VISUAL STYLE**: If the STYLES section shows specific border-radius,
   box-shadow, or transition values, use them in the presentation for buttons, cards, etc.

### Modern Layout
5. **FULL-BLEED SLIDES**: Some slides should use the primary or secondary color as
   a full background with white text for visual variety.
6. **ASYMMETRIC LAYOUTS**: Use the .two-col grid for content slides. Don't center
   everything — left-align text where it creates a stronger visual hierarchy.
7. **LARGE HERO NUMBERS**: For stats or metrics, use the .stat class with massive
   font sizes. One number per slide is powerful.
8. **IMAGE INTEGRATION**: Where key images are available from the STYLES section,
   use them as background images (with overlays) or inline content images.
9. **WHITESPACE IS DESIGN**: Leave generous padding. Empty space is intentional.
10. **VISUAL RHYTHM**: Alternate between text-heavy and visual slides. Never have
    3 bullet-point slides in a row.

### Content Structure
11. Determine the number of slides from the CONTENT section (typically 8-15).
12. Follow the Winston philosophy: empowerment promise → problem → vision →
    approach → evidence → contributions.
13. One idea per slide. Split if needed.
14. Add \`<!-- SPEAKER NOTE: ... -->\` HTML comments on every slide.

### Technical
15. Output a COMPLETE valid HTML file. Start with \`<!DOCTYPE html>\`, end with \`</html>\`.
16. The file must work offline when saved and opened in a browser.
17. Keep the slide navigation JavaScript intact from the framework.
18. Add any extra CSS you need inside the existing \`<style>\` block.

Output ONLY the HTML file content. No markdown fences, no explanation, no preamble.
Start directly with <!DOCTYPE html>.`;
}
