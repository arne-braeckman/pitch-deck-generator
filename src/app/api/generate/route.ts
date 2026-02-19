import { generateText, streamText } from "ai";
import { createLLMProvider, getModelId } from "@/lib/llm/providers";
import { crawlSite } from "@/lib/scraper/crawl";
import { generateStylesMd } from "@/lib/scraper/generate-styles-md";
import { generateContentMd } from "@/lib/scraper/generate-content-md";
import { buildContentRestructurePrompt } from "@/lib/llm/prompt-content-restructure";
import { buildPresentationPrompt } from "@/lib/llm/prompt-presentation-build";
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

  try {
    new URL(url);
  } catch {
    return Response.json({ error: "Invalid URL format" }, { status: 400 });
  }

  // Custom ReadableStream with step progress markers interleaved with HTML.
  // Progress markers: __STEP:<num>:<message>__
  // Error markers: __ERROR:<message>__
  // The client strips these out for progress display.
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // ────────────────────────────────────────────────
        // STEP 1: Crawl & Extract (styles.md + content.md)
        // ────────────────────────────────────────────────
        controller.enqueue(
          encoder.encode("__STEP:1:Crawling website...__\n")
        );

        const pages = await crawlSite(url, {
          maxPages: 8,
          maxDepth: 2,
          timeoutMs: 6000,
        });

        if (pages.length === 0) {
          controller.enqueue(
            encoder.encode(
              "__ERROR:Could not fetch any pages from the provided URL. The site may be blocking automated requests.__\n"
            )
          );
          controller.close();
          return;
        }

        controller.enqueue(
          encoder.encode(
            `__STEP:1:Found ${pages.length} pages. Extracting styles and content...__\n`
          )
        );

        // Generate styles.md and content.md in parallel
        const pagesData = pages.map((p) => ({ url: p.url, html: p.html }));
        const [stylesMd, contentMd] = await Promise.all([
          generateStylesMd(url, pagesData),
          Promise.resolve(generateContentMd(url, pagesData)),
        ]);

        // ────────────────────────────────────────────────
        // STEP 2: Restructure content with LLM
        // ────────────────────────────────────────────────
        controller.enqueue(
          encoder.encode(
            "__STEP:2:Analyzing and restructuring content with AI...__\n"
          )
        );

        const llmProvider = createLLMProvider(provider, apiKey);
        const modelId = getModelId(provider);

        const contentPrompt = buildContentRestructurePrompt(contentMd);

        const restructureResult = await generateText({
          model: llmProvider(modelId),
          prompt: contentPrompt,
          maxOutputTokens: 8000,
          temperature: 0.5,
        });

        const presentationContentMd = restructureResult.text;

        // ────────────────────────────────────────────────
        // STEP 3: Generate final HTML presentation
        // ────────────────────────────────────────────────
        controller.enqueue(
          encoder.encode(
            "__STEP:3:Generating presentation with brand styling...__\n"
          )
        );

        const presentationPrompt = buildPresentationPrompt(
          stylesMd,
          presentationContentMd,
          url
        );

        const presentationResult = streamText({
          model: llmProvider(modelId),
          prompt: presentationPrompt,
          maxOutputTokens: 16000,
          temperature: 0.7,
        });

        // Stream the HTML output
        for await (const chunk of presentationResult.textStream) {
          controller.enqueue(encoder.encode(chunk));
        }

        controller.close();
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Generation failed";
        try {
          controller.enqueue(encoder.encode(`__ERROR:${message}__\n`));
          controller.close();
        } catch {
          // Controller may already be closed
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
