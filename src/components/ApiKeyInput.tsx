"use client";

import { useState } from "react";
import type { LLMProvider } from "@/types";

export function ApiKeyInput({
  value,
  onChange,
  provider,
}: {
  value: string;
  onChange: (v: string) => void;
  provider: LLMProvider;
}) {
  const [visible, setVisible] = useState(false);

  const placeholder = provider === "openai" ? "sk-..." : "sk-ant-...";
  const providerName = provider === "openai" ? "OpenAI" : "Anthropic";

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {providerName} API Key
      </label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-16 border border-gray-300 rounded-lg text-sm
                     focus:ring-2 focus:ring-gray-900 focus:border-transparent
                     outline-none transition-all placeholder:text-gray-400"
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400
                     hover:text-gray-600 text-xs font-medium px-2 py-1 rounded
                     hover:bg-gray-100 transition-all cursor-pointer"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      <p className="mt-1.5 text-xs text-gray-400">
        Your key is sent directly to {providerName} and is never stored on our
        servers.
      </p>
    </div>
  );
}
