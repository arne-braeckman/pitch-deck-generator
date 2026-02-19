"use client";

type ProgressState = "scraping" | "generating";

export function ProgressStream({
  state,
  htmlLength,
}: {
  state: ProgressState;
  htmlLength: number;
}) {
  return (
    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin flex-shrink-0" />
      <div className="text-sm text-gray-700">
        {state === "scraping" ? (
          "Crawling website and extracting content..."
        ) : (
          <>
            Generating presentation
            <span className="ml-1.5 font-mono text-gray-500">
              {(htmlLength / 1024).toFixed(1)} KB
            </span>
          </>
        )}
      </div>
    </div>
  );
}
