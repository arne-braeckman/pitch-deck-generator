import { GeneratorForm } from "@/components/GeneratorForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            PitchDeck Generator
          </h1>
          <p className="mt-2 text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
            Turn any website into a pitch presentation. Paste a URL, bring your
            API key, and download a self-contained HTML slide deck.
          </p>
        </div>
        <GeneratorForm />
        <p className="mt-6 text-center text-xs text-gray-400">
          Presentations follow Patrick Winston&apos;s &ldquo;How to Speak&rdquo;
          methodology for maximum impact.
        </p>
      </div>
    </main>
  );
}
