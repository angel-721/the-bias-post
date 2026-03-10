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
