/**
 * Step 2: Build the prompt that sends content.md to the LLM
 * along with the Promptcontent.md instructions to produce
 * a structured presentationcontent.md.
 */

const PROMPTCONTENT_TEMPLATE = `You are analyzing scraped website content to extract and structure its core concepts for use in an automated presentation deck. Your goal is to distill the raw content into organized, actionable insights about the website's purpose, messaging, structure, and offerings.

Here is the website content that has been scraped and saved:

<content>
{{CONTENT}}
</content>

Your task is to analyze this content thoroughly and identify the following key elements:

1. **Core Message & Purpose**: What is the fundamental idea or mission of this website? Why does it exist?
2. **Tone & Voice**: How does the website communicate? (e.g., professional, casual, technical, friendly, authoritative)
3. **Vocabulary & Language Style**: What type of language is used? Are there industry-specific terms, jargon, or a particular reading level?
4. **Structure & Pages**: Are there multiple distinct pages or sections? What are they and how are they organized?
5. **Services/Products**: Are services or products offered? If so, how many, what are they, and how are they structured or categorized?
6. **Target Audience**: Who is this website speaking to?
7. **Key Themes**: What are the recurring topics or themes throughout the content?

Before providing your structured analysis, use the scratchpad below to work through your observations:

<scratchpad>
- Read through the content and note the main topics
- Identify any repeated phrases or concepts that indicate core messaging
- Look for section headers or navigation elements that indicate site structure
- List out any services, products, or offerings mentioned
- Note the style and tone of the writing
- Identify the intended audience based on language and content
</scratchpad>

Now provide your structured analysis in the following format:

<core_message>
Write a concise statement (2-4 sentences) that captures the fundamental purpose and reason for existence of this website.
</core_message>

<tone_and_voice>
Describe the communication style, tone, and voice used throughout the website. Include specific observations about formality level, personality, and approach.
</tone_and_voice>

<vocabulary_and_language>
Describe the vocabulary choices, language complexity, and any specialized terminology. Note whether the language is technical, accessible, industry-specific, etc.
</vocabulary_and_language>

<site_structure>
List and describe the different pages, sections, or content areas identified. For each, provide:
- Page/Section name
- Primary purpose or focus
- Key content elements
</site_structure>

<services_or_products>
If services or products are offered, list them with:
- Total count
- Name of each service/product
- Brief description
- How they are categorized or grouped (if applicable)

If no services or products are identified, state "No specific services or products identified."
</services_or_products>

<target_audience>
Describe who the intended audience appears to be based on the content, language, and messaging.
</target_audience>

<key_themes>
List the 3-5 most prominent themes or topics that recur throughout the website content.
</key_themes>

<additional_insights>
Include any other notable observations about the website that would be valuable for creating a presentation, such as unique value propositions, calls-to-action, brand positioning, or distinctive features.
</additional_insights>`;

export function buildContentRestructurePrompt(contentMd: string): string {
  return PROMPTCONTENT_TEMPLATE.replace("{{CONTENT}}", contentMd);
}
