import { streamText } from "ai";
import { createLLMProvider, getModelId } from "@/lib/llm/providers";
import { crawlSite } from "@/lib/scraper/crawl";
import { extractContent } from "@/lib/scraper/extract-content";
import { extractBranding } from "@/lib/scraper/extract-branding";
import { buildPrompt } from "@/lib/llm/prompt-builder";
import type { GenerateRequest } from "@/types";

export const maxDuration = 300;

export async function POST(request: Request) {
  let body: GenerateRequest;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { url, apiKey, provider } = body;

  if (!url || !apiKey || !provider) {
    return Response.json(
      { error: "Missing required fields: url, apiKey, provider" },
      { status: 400 }
    );
  }

  if (provider !== "openai" && provider !== "anthropic") {
    return Response.json(
      { error: 'Provider must be "openai" or "anthropic"' },
      { status: 400 }
    );
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    return Response.json({ error: "Invalid URL format" }, { status: 400 });
  }

  try {
    // Phase 1: Crawl the website
    const pages = await crawlSite(url, {
      maxPages: 8,
      maxDepth: 2,
      timeoutMs: 6000,
    });

    if (pages.length === 0) {
      return Response.json(
        { error: "Could not fetch any pages from the provided URL. The site may be blocking automated requests." },
        { status: 422 }
      );
    }

    // Phase 2: Extract content and branding
    const contents = pages.map((p) => extractContent(p.url, p.html));
    const branding = await extractBranding(
      url,
      pages.map((p) => ({ url: p.url, html: p.html }))
    );

    // Phase 3: Build prompt and stream LLM response
    const prompt = buildPrompt({ contents, branding, sourceUrl: url });

    const llmProvider = createLLMProvider(provider, apiKey);
    const modelId = getModelId(provider);

    const result = streamText({
      model: llmProvider(modelId),
      prompt,
      maxOutputTokens: 16000,
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Generation failed";
    console.error("Generation error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
