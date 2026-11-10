'use client';

import { useState } from 'react';
import type { ActivityCompletion, ActivityOutcome } from '@/core/activity-types';
import { useT } from '@/i18n/client';

/** Wraps a player's onComplete: tracks submitting state, the saved outcome and errors. */
export function useCompletion(onComplete: (r: ActivityCompletion) => Promise<ActivityOutcome | null>) {
  const t = useT();
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<ActivityOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(result: ActivityCompletion) {
    setSubmitting(true);
    setError(null);
    try {
      setOutcome(await onComplete(result));
    } catch {
      setError(t.activities.completion.saveFailed);
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setOutcome(null);
    setError(null);
  }

  return { submit, submitting, outcome, error, reset };
}

/** Deterministic shuffle so server and client render the same order (no hydration mismatch). */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const rand = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}
