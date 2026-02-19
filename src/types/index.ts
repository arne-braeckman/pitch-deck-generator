export type LLMProvider = "openai" | "anthropic";

export interface CrawlResult {
  url: string;
  html: string;
  title: string;
  statusCode: number;
}

export interface CrawlOptions {
  maxPages: number;
  maxDepth: number;
  timeoutMs: number;
  concurrency: number;
}

export interface PageContent {
  url: string;
  title: string;
  headings: Array<{ level: number; text: string }>;
  paragraphs: string[];
  listItems: string[];
  metaDescription: string;
  heroText: string;
  features: string[];
  testimonials: string[];
  ctaText: string[];
}

export interface BrandingData {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    all: string[];
  };
  fonts: {
    heading: string;
    body: string;
    all: string[];
  };
  logos: string[];
  favicon: string;
  images: string[];
  ogImage: string;
}

export interface GenerateRequest {
  url: string;
  apiKey: string;
  provider: LLMProvider;
}
