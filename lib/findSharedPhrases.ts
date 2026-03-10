import type { SharedPhrase } from "@/types";

/**
 * Finds shared signal phrases between two articles.
 *
 * Algorithm:
 * 1. Normalize all phrases from both articles (lowercase, trim)
 * 2. Create a Set of normalized phrases from article A
 * 3. Check each phrase from article B against the Set
 * 4. Return objects with phrase text and presence flags
 *
 * @param phrasesA - Signal phrases from article A
 * @param phrasesB - Signal phrases from article B
 * @returns Array of shared phrases with presence flags
 */
export function findSharedPhrases(
  phrasesA: Array<{ phrase: string }>,
  phrasesB: Array<{ phrase: string }>
): SharedPhrase[] {
  // Minimum word length to avoid noise (e.g., "the", "and")
  const MIN_WORD_LENGTH = 4;

  // Normalize and filter phrases from article A
  const normalizedPhrasesA = new Map<string, string>(); // normalized -> original
  for (const item of phrasesA) {
    const normalized = item.phrase.toLowerCase().trim();
    // Check if phrase has words longer than minimum length
    const words = normalized.split(/\s+/).filter(w => w.length >= MIN_WORD_LENGTH);
    if (words.length > 0) {
      normalizedPhrasesA.set(normalized, item.phrase);
    }
  }

  // Check phrases from article B
  const sharedPhrases: SharedPhrase[] = [];
  const processedNormPhrases = new Set<string>();

  // First pass: find phrases that exist in both
  for (const itemB of phrasesB) {
    const normalizedB = itemB.phrase.toLowerCase().trim();
    const wordsB = normalizedB.split(/\s+/).filter(w => w.length >= MIN_WORD_LENGTH);

    if (wordsB.length === 0) continue;

    // Check if this normalized phrase (or very similar) exists in A
    let foundInA = false;
    for (const [normA, origA] of normalizedPhrasesA.entries()) {
      // Check for exact match or very close match (allowing for minor differences)
      if (normalizedB === normA || areSimilarPhrases(normalizedB, normA)) {
        foundInA = true;
        if (!processedNormPhrases.has(normA)) {
          sharedPhrases.push({
            phrase: origA, // Use the original phrasing from article A
            inA: true,
            inB: true,
          });
          processedNormPhrases.add(normA);
        }
        break;
      }
    }

    // If not found in A, it's unique to B (we'll track unique phrases too)
    if (!foundInA && !processedNormPhrases.has(normalizedB)) {
      // For now, we only include shared phrases, so skip unique ones
      // But we could include them with inA: false, inB: true if needed
    }
  }

  // Also include phrases that are only in A (for completeness)
  for (const [normA, origA] of normalizedPhrasesA.entries()) {
    if (!processedNormPhrases.has(normA)) {
      sharedPhrases.push({
        phrase: origA,
        inA: true,
        inB: false,
      });
    }
  }

  return sharedPhrases;
}

/**
 * Check if two normalized phrases are similar enough to be considered the same.
 * This handles minor differences like punctuation, extra spaces, etc.
 */
function areSimilarPhrases(norm1: string, norm2: string): boolean {
  // Remove all non-alphanumeric characters and extra spaces for comparison
  const clean1 = norm1.replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
  const clean2 = norm2.replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();

  if (clean1 === clean2) return true;

  // Check if one is a substring of the other (for partial matches)
  const minLen = Math.min(clean1.length, clean2.length);
  if (minLen < 10) return false; // Too short for meaningful substring matching

  // If 85% of the shorter phrase is contained in the longer one, consider them similar
  const longer = clean1.length > clean2.length ? clean1 : clean2;
  const shorter = clean1.length > clean2.length ? clean2 : clean1;
  const overlapRatio = (longer.includes(shorter) ? shorter.length : 0) / longer.length;

  return overlapRatio >= 0.7;
}
