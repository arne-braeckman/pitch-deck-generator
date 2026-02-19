import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { LLMProvider } from "@/types";

export function createLLMProvider(provider: LLMProvider, apiKey: string) {
  if (provider === "openai") {
    return createOpenAI({ apiKey });
  }
  return createAnthropic({ apiKey });
}

export function getModelId(provider: LLMProvider): string {
  if (provider === "openai") {
    return "gpt-4o";
  }
  return "claude-sonnet-4-20250514";
}
