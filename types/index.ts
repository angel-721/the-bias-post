export type SignalPhrase = {
  phrase: string;
  weight: number;
};

export type AnalysisResult = {
  prediction: string;
  confidence: {
    Unlikely: number;
    Likely: number;
  };
  signal_phrases: SignalPhrase[];
  weight_std: number;
};

export type ArticleState = {
  headline: string;
  author: string;
  body: string;
};

export type SignalPhraseMatch = {
  start: number;
  end: number;
  phrase: string;
  weight: number;
  index: number;
  found: boolean;
  context?: string; // surrounding paragraph(s) for LLM context
  llmExplanation: string | null; // stored after first LLM call
  llmAnalyzed: boolean; // true once explanation received
  llmLoading: boolean; // true while streaming
};

export type Step = "input" | "formatted" | "results";

export type LibraryArticle = {
  id: string;
  created_at: string;
  headline: string;
  author: string | null;
  source_name: string | null;
  source_url: string | null;
  image_url: string | null;
  prediction: string;
  likelihood: number;
  weight_std: number;
  signal_phrases: Array<{
    rank: number;
    phrase: string;
    weight: number;
    context: string;
    llmExplanation: string | null;
  }>;
  ai_summary: string | null;
  ai_summary_generated: boolean;
};

export type SharedPhrase = {
  phrase: string;
  inA: boolean;
  inB: boolean;
};

export type ComparisonStep = 'selection' | 'comparison';
