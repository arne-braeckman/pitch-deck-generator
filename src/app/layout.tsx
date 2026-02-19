import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PitchDeck Generator",
  description:
    "Turn any website into a stunning pitch presentation. Paste a URL, bring your API key, download an HTML slide deck.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
