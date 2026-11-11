// Sentence-level pacing for narrated slides. The player speaks one sentence at a time, which
// lets it highlight the matching caption line and bullet without a timing file.
//
// Splitting is deliberately simple: narration is short, conversational text, not prose full
// of abbreviations. A trailing sentence without punctuation still counts.

export function splitSentences(text: string): string[] {
  const parts = text.match(/[^.!?。！？]+[.!?。！？]+|[^.!?。！？]+$/g) ?? [text];
  const cleaned = parts.map((part) => part.trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned : [text.trim()];
}

/**
 * Which bullet a sentence belongs to. Sentences are spread evenly over the bullets, so two
 * bullets and three sentences still give each bullet a turn. Sentences without bullets return
 * null.
 */
export function bulletForSentence(
  sentenceIndex: number,
  sentenceCount: number,
  bulletCount: number,
): number | null {
  if (bulletCount <= 0 || sentenceCount <= 0) return null;
  const i = Math.max(0, Math.min(sentenceIndex, sentenceCount - 1));
  return Math.min(bulletCount - 1, Math.floor((i * bulletCount) / sentenceCount));
}
