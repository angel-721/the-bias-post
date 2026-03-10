"use client";

import type { SharedPhrase } from "@/types";

interface PhraseWithHighlightProps {
  sharedPhrase: SharedPhrase;
  showInA?: boolean; // If true, highlight when phrase is in A
  showInB?: boolean; // If true, highlight when phrase is in B
}

export function PhraseWithHighlight({
  sharedPhrase,
  showInA = true,
  showInB = true,
}: PhraseWithHighlightProps) {
  const shouldHighlight = showInA && showInB
    ? sharedPhrase.inA && sharedPhrase.inB
    : showInA
    ? sharedPhrase.inA
    : showInB
    ? sharedPhrase.inB
    : false;

  return (
    <span
      className={
        shouldHighlight
          ? "shared-phrase border-b-2 border-accent-hover pb-0.5"
          : ""
      }
    >
      {sharedPhrase.phrase.length > 100
        ? `${sharedPhrase.phrase.slice(0, 100)}...`
        : sharedPhrase.phrase}
    </span>
  );
}
