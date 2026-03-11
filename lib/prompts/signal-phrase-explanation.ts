import type { SignalPhraseExplanationInput } from './types';

function trimContext(context: string): string {
  const paragraphs = context.split('\n\n').slice(0, 2);
  return paragraphs.join('\n\n').trim().replace(/\s+/g, ' ');
}

export function SignalPhraseExplanationPrompt(
  inputs: SignalPhraseExplanationInput
): {
  system: string;
  user: string;
} {
  const { signalPhrase, context, likelyPercent } = inputs;

  const system = `You explain why machine learning classifiers flag phrases as politically biased.
Focus only on wording, tone, and framing.
Do not add outside context or political opinions.
Be concise and objective.
Maximum 3 sentences.`;

  const trimmedContext = trimContext(context);

  const user = `A bias classifier flagged this phrase as one of the more biased phrases in an article: "${signalPhrase}"

The classifier rated the full article as ${likelyPercent}% likely to be biased.

Give an objective, concise explanation of why a classifier might flag this phrase as biased, and what perspective or agenda it may favor or oppose. Be specific to the language used. Keep it to 2-3 short paragraphs.

Signal phrase context:
"${trimmedContext}"`;

  return { system, user };
}
