"use client";

import { useState, useRef, useCallback } from "react";
import { ApiKeyInput } from "./ApiKeyInput";
import { ProviderSelect } from "./ProviderSelect";
import { ProgressStream } from "./ProgressStream";
import type { LLMProvider } from "@/types";

type GenerationState = "idle" | "generating" | "done" | "error";

interface StepInfo {
  step: number;
  message: string;
}

// Regex to detect progress markers: __STEP:1:message__ or __ERROR:message__
const STEP_PATTERN = /__STEP:(\d+):(.+?)__\n?/g;
const ERROR_PATTERN = /__ERROR:(.+?)__\n?/g;

export function GeneratorForm() {
  const [url, setUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [provider, setProvider] = useState<LLMProvider>("openai");
  const [state, setState] = useState<GenerationState>("idle");
  const [streamedHtml, setStreamedHtml] = useState("");
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState<StepInfo | null>(null);
  const [stepMessage, setStepMessage] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const isLoading = state === "generating";

  const parseStreamChunk = useCallback(
    (raw: string): string => {
      // Extract and remove step markers
      let cleaned = raw;

      // Process step markers
      let match;
      const stepRegex = /__STEP:(\d+):(.+?)__\n?/g;
      while ((match = stepRegex.exec(raw)) !== null) {
        const stepNum = parseInt(match[1], 10);
        const msg = match[2];
        setCurrentStep({ step: stepNum, message: msg });
        setStepMessage(msg);
      }
      cleaned = cleaned.replace(STEP_PATTERN, "");

      // Process error markers
      const errorRegex = /__ERROR:(.+?)__\n?/g;
      while ((match = errorRegex.exec(raw)) !== null) {
        setError(match[1]);
        setState("error");
      }
      cleaned = cleaned.replace(ERROR_PATTERN, "");

      return cleaned;
    },
    []
  );

  async function handleGenerate() {
    if (!url || !apiKey) return;

    setError("");
    setStreamedHtml("");
    setCurrentStep(null);
    setStepMessage("");
    setState("generating");

    abortRef.current = new AbortController();

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, apiKey, provider }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Generation failed");
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let rawAccumulated = "";
      let htmlAccumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        rawAccumulated += decoder.decode(value, { stream: true });

        // Parse the full accumulated stream each time to extract markers
        htmlAccumulated = parseStreamChunk(rawAccumulated);
        setStreamedHtml(htmlAccumulated);
      }

      // Final parse
      htmlAccumulated = parseStreamChunk(rawAccumulated);
      setStreamedHtml(htmlAccumulated);

      if (state !== "error" && htmlAccumulated.trim().length > 0) {
        setState("done");
      } else if (htmlAccumulated.trim().length === 0 && !error) {
        setError("No presentation was generated. The LLM returned empty content.");
        setState("error");
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setState("idle");
        return;
      }
      const message =
        err instanceof Error ? err.message : "Generation failed";
      setError(message);
      setState("error");
    }
  }

  function handleCancel() {
    abortRef.current?.abort();
    setState("idle");
    setCurrentStep(null);
    setStepMessage("");
  }

  function handleDownload() {
    const blob = new Blob([streamedHtml], { type: "text/html" });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `pitch-deck-${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(downloadUrl);
  }

  function handlePreview() {
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(streamedHtml);
      win.document.close();
    }
  }

  function handleReset() {
    setState("idle");
    setStreamedHtml("");
    setError("");
    setCurrentStep(null);
    setStepMessage("");
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 space-y-6">
      {/* URL Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Website URL
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm
                     focus:ring-2 focus:ring-gray-900 focus:border-transparent
                     outline-none transition-all placeholder:text-gray-400
                     disabled:bg-gray-50 disabled:text-gray-500"
          disabled={isLoading}
        />
      </div>

      {/* Provider + API Key */}
      <ProviderSelect value={provider} onChange={setProvider} />
      <ApiKeyInput value={apiKey} onChange={setApiKey} provider={provider} />

      {/* Generate / Cancel Button */}
      {isLoading ? (
        <button
          onClick={handleCancel}
          className="w-full py-3 px-6 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold
                     hover:bg-gray-300 transition-colors cursor-pointer"
        >
          Cancel
        </button>
      ) : state === "done" ? (
        <div className="space-y-3">
          <button
            onClick={handleDownload}
            className="w-full py-3 px-6 bg-gray-900 text-white rounded-lg text-sm font-semibold
                       hover:bg-gray-800 transition-colors cursor-pointer"
          >
            Download Presentation (.html)
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handlePreview}
              className="py-2.5 px-4 bg-white text-gray-700 rounded-lg text-sm font-medium
                         border border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Preview in New Tab
            </button>
            <button
              onClick={handleReset}
              className="py-2.5 px-4 bg-white text-gray-700 rounded-lg text-sm font-medium
                         border border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Generate Another
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleGenerate}
          disabled={!url || !apiKey}
          className="w-full py-3 px-6 bg-gray-900 text-white rounded-lg text-sm font-semibold
                     hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors cursor-pointer"
        >
          Generate Pitch Deck
        </button>
      )}

      {/* Progress */}
      {isLoading && (
        <ProgressStream
          currentStep={currentStep}
          stepMessage={stepMessage}
          htmlLength={streamedHtml.length}
        />
      )}

      {/* Error */}
      {state === "error" && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
          <p className="font-medium">Generation failed</p>
          <p className="mt-1 text-red-600">{error}</p>
          <button
            onClick={handleReset}
            className="mt-2 text-xs font-medium text-red-800 underline cursor-pointer"
          >
            Try again
          </button>
        </div>
      )}

      {/* File size indicator when done */}
      {state === "done" && (
        <p className="text-center text-xs text-gray-400">
          Generated {(streamedHtml.length / 1024).toFixed(1)} KB presentation in
          3 steps
        </p>
      )}
    </div>
  );
}
