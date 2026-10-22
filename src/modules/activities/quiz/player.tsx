'use client';

import { Check, ChevronRight, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ActivityPlayerProps } from '@/core/activity-types';
import { Button, cn, ProgressBar } from '@/components/ui';
import { ActivityFrame, ResultPanel } from '../components/activity-frame';
import { seededShuffle, useCompletion } from '../components/use-completion';
import type { QuizConfig } from './schema';

export function QuizPlayer({ activity, config, onComplete, previousBest, preview }: ActivityPlayerProps<QuizConfig>) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const { submit, submitting, outcome, error, reset } = useCompletion(onComplete);
  // Options are shown in a shuffled order so the right answer is not always in the same
  // place. Seeded per activity and question: stable across renders, server and client.
  // `picked` and `answers` always hold the ORIGINAL option index (what grading, the review
  // notebook and class insights read from detail.answers).
  const optionOrder = useMemo(
    () => config.questions.map((qq, qi) => seededShuffle(qq.options.map((_, i) => i), `${activity.id}:${qi}`)),
    [config.questions, activity.id],
  );

  const q = config.questions[index]!;
  const total = config.questions.length;
  const checked = picked !== null && answers.length > index;
  const correctCount = answers.filter((a, i) => a === config.questions[i]?.answerIndex).length;
  const score = Math.round((correctCount / total) * 100);

  function check() {
    if (picked === null) return;
    setAnswers((prev) => [...prev, picked]);
  }

  function next() {
    if (index + 1 < total) {
      setIndex(index + 1);
      setPicked(null);
      return;
    }
    setFinished(true);
    const finalCorrect = answers.filter((a, i) => a === config.questions[i]?.answerIndex).length;
    void submit({ score: Math.round((finalCorrect / total) * 100), detail: { answers } });
  }

  function retry() {
    setIndex(0);
    setPicked(null);
    setAnswers([]);
    setFinished(false);
    reset();
  }

  return (
    <ActivityFrame kind="Quiz" title={activity.title} xpReward={activity.xpReward} previousBest={previousBest} preview={preview}>
      {finished ? (
        <ResultPanel score={score} outcome={outcome} submitting={submitting} error={error} preview={preview} onRetry={retry}>
          <p className="text-ink-soft">
            {correctCount} of {total} correct.
          </p>
        </ResultPanel>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-ink-soft">
              Question {index + 1} / {total}
            </span>
            <ProgressBar value={(index / total) * 100} label="Quiz progress" size="sm" className="flex-1" />
          </div>
          <p className="font-display text-xl font-semibold">{q.prompt}</p>
          <div role="radiogroup" aria-label="Answer options" className="flex flex-col gap-2">
            {optionOrder[index]!.map((i, pos) => {
              const opt = q.options[i]!;
              const isAnswer = i === q.answerIndex;
              const isPicked = i === picked;
              return (
                <button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={isPicked}
                  disabled={checked}
                  onClick={() => setPicked(i)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border-2 border-line bg-paper px-4 py-3 text-left font-semibold transition',
                    !checked && 'hover:-translate-y-0.5 hover:shadow-sticker-sm',
                    isPicked && !checked && 'bg-butter-soft shadow-sticker-sm',
                    checked && isAnswer && 'bg-mint-soft',
                    checked && isPicked && !isAnswer && 'bg-coral-soft',
                  )}
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-line bg-paper font-display text-sm">
                    {checked && isAnswer ? <Check className="h-4 w-4" /> : checked && isPicked ? <X className="h-4 w-4" /> : String.fromCharCode(65 + pos)}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
          {checked ? (
            <div
              className={cn('rounded-xl border-2 border-line px-4 py-3', picked === q.answerIndex ? 'bg-mint-soft' : 'bg-coral-soft')}
              aria-live="polite"
            >
              <p className="font-display font-bold">{picked === q.answerIndex ? 'Correct!' : 'Not quite.'}</p>
              {q.explanation ? <p className="mt-1">{q.explanation}</p> : null}
            </div>
          ) : null}
          <div className="flex justify-end">
            {checked ? (
              <Button onClick={next}>
                {index + 1 < total ? 'Next question' : 'See my result'} <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={check} disabled={picked === null}>
                Check answer
              </Button>
            )}
          </div>
        </div>
      )}
    </ActivityFrame>
  );
}
