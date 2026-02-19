"use client";

import type { LLMProvider } from "@/types";

const providers: Array<{ id: LLMProvider; label: string }> = [
  { id: "openai", label: "OpenAI (GPT-4o)" },
  { id: "anthropic", label: "Claude (Sonnet)" },
];

export function ProviderSelect({
  value,
  onChange,
}: {
  value: LLMProvider;
  onChange: (v: LLMProvider) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        AI Provider
      </label>
      <div className="grid grid-cols-2 gap-2">
        {providers.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onChange(p.id)}
            className={`py-2.5 px-4 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
              value === p.id
                ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
