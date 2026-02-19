"use client";

import { useState, useRef } from "react";
import { ApiKeyInput } from "./ApiKeyInput";
import { ProviderSelect } from "./ProviderSelect";
import { ProgressStream } from "./ProgressStream";
import type { LLMProvider } from "@/types";

type GenerationState = "idle" | "scraping" | "generating" | "done" | "error";

export function GeneratorForm() {
  const [url, setUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [provider, setProvider] = useState<LLMProvider>("openai");
  const [state, setState] = useState<GenerationState>("idle");
  const [streamedHtml, setStreamedHtml] = useState("");
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const isLoading = state === "scraping" || state === "generating";

  async function handleGenerate() {
    if (!url || !apiKey) return;

    setError("");
    setStreamedHtml("");
    setState("scraping");

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

      setState("generating");

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setStreamedHtml(accumulated);
      }

      setState("done");
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      const message = err instanceof Error ? err.message : "Generation failed";
      setError(message);
      setState("error");
    }
  }

  function handleCancel() {
    abortRef.current?.abort();
    setState("idle");
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
          state={state as "scraping" | "generating"}
          htmlLength={streamedHtml.length}
        />
      )}

      {/* Error */}
      {state === "error" && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100">
          <p className="font-medium">Generation failed</p>
          <p className="mt-1 text-red-600">{error}</p>
        </div>
      )}

      {/* File size indicator when done */}
      {state === "done" && (
        <p className="text-center text-xs text-gray-400">
          Generated {(streamedHtml.length / 1024).toFixed(1)} KB presentation
        </p>
      )}
    </div>
  );
}
