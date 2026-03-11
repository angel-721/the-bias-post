export interface SignalPhrase {
  phrase: string;
  weight: number;
  rank?: number;
}

export interface Article {
  headline: string;
  source_name?: string | null;
  likelihood: number;
  ai_summary?: string | null;
  signal_phrases: SignalPhrase[];
}

export interface ArticleSummaryInput {
  signalPhrases: SignalPhrase[];
  likelihood: number;
  headline?: string;
  articleLede?: string;
  isLowBias: boolean;
}

export interface SignalPhraseExplanationInput {
  signalPhrase: string;
  context: string;
  likelyPercent: number;
}
