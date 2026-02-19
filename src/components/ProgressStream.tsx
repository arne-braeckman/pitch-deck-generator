"use client";

interface StepInfo {
  step: number;
  message: string;
}

const STEP_LABELS: Record<number, string> = {
  1: "Extracting",
  2: "Analyzing",
  3: "Generating",
};

export function ProgressStream({
  currentStep,
  stepMessage,
  htmlLength,
}: {
  currentStep: StepInfo | null;
  stepMessage: string;
  htmlLength: number;
}) {
  const step = currentStep?.step ?? 0;

  return (
    <div className="space-y-3">
      {/* Step indicators */}
      <div className="flex items-center gap-1">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div className="flex items-center gap-2 flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                  s < step
                    ? "bg-gray-900 text-white"
                    : s === step
                      ? "bg-gray-900 text-white ring-2 ring-gray-300 ring-offset-1"
                      : "bg-gray-200 text-gray-400"
                }`}
              >
                {s < step ? "✓" : s}
              </div>
              <span
                className={`text-xs font-medium hidden sm:block ${
                  s <= step ? "text-gray-700" : "text-gray-400"
                }`}
              >
                {STEP_LABELS[s]}
              </span>
            </div>
            {s < 3 && (
              <div
                className={`h-px flex-1 mx-2 ${
                  s < step ? "bg-gray-900" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Current status */}
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin flex-shrink-0" />
        <div className="text-sm text-gray-700 flex-1">
          {stepMessage || "Starting..."}
        </div>
        {step === 3 && htmlLength > 0 && (
          <span className="font-mono text-xs text-gray-500">
            {(htmlLength / 1024).toFixed(1)} KB
          </span>
        )}
      </div>
    </div>
  );
}
