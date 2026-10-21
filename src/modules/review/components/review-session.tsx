'use client';

// One review sitting: the due cards one at a time, checked on the server so the answer
// key never reaches the browser before the learner commits.
import { Check, ChevronRight, RotateCcw, X, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Badge, Button, Card, cn, Notice, Pip, ProgressBar } from '@/components/ui';
import { answerReviewCard, type ReviewAnswer } from '../actions';

export interface SessionCard {
  id: string;
  prompt: string;
  options: string[];
  wrongAnswer: number | null;
  courseEmoji: string;
  courseTitle: string;
  lessonTitle: string;
}

const letter = (i: number) => String.fromCharCode(65 + i);

export function ReviewSession({ cards }: { cards: SessionCard[] }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [result, setResult] = useState<ReviewAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tally, setTally] = useState({ right: 0, xp: 0, mastered: 0 });
  const [finished, setFinished] = useState(false);
  const [checking, startChecking] = useTransition();
  const [leaving, startLeaving] = useTransition();

  const card = cards[index];
  const total = cards.length;

  function check() {
    if (picked === null || !card) return;
    setError(null);
    startChecking(async () => {
      try {
        const res = await answerReviewCard({ itemId: card.id, picked });
        if (!res.ok) {
          setError(res.error);
          return;
        }
        const data = res.data!;
        setResult(data);
        setTally((t) => ({
          right: t.right + (data.correct ? 1 : 0),
          xp: t.xp + data.xpGained,
          mastered: t.mastered + (data.mastered ? 1 : 0),
        }));
      } catch {
        setError('Could not check that answer. Check your connection and try again.');
      }
    });
  }

  function next() {
    if (index + 1 < total) {
      setIndex(index + 1);
      setPicked(null);
      setResult(null);
      setError(null);
      return;
    }
    setFinished(true);
  }

  function skip() {
    setError(null);
    next();
  }

  if (finished || !card) {
    return (
      <Card className="animate-pop p-5">
        <div className="flex flex-wrap items-center gap-4">
          <Pip mood={tally.right === total ? 'cheer' : tally.right > 0 ? 'happy' : 'think'} size={76} />
          <div>
            <div className="font-display text-4xl font-bold">
              {tally.right} / {total}
            </div>
            <p className="font-semibold">
              {tally.right === total
                ? 'All right this time. Those gaps are closing.'
                : 'The ones you missed come back tomorrow.'}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2" aria-live="polite">
          <Badge tint="butter">
            <Zap className="h-3.5 w-3.5" aria-hidden /> +{tally.xp} XP
          </Badge>
          {tally.mastered ? <Badge tint="mint">{tally.mastered} mastered</Badge> : null}
        </div>
        <div className="mt-4">
          <Button variant="secondary" onClick={() => startLeaving(() => router.refresh())} disabled={leaving}>
            <RotateCcw className="h-4 w-4" aria-hidden /> {leaving ? 'Updating…' : 'Back to my notebook'}
          </Button>
        </div>
      </Card>
    );
  }

  const checked = result !== null;
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-line bg-paper px-5 py-3">
        <div className="min-w-0">
          <div className="text-xs font-bold tracking-wide text-ink-soft uppercase">Review</div>
          <h3 className="truncate text-lg font-bold">
            <span aria-hidden>{card.courseEmoji}</span> {card.lessonTitle}
          </h3>
        </div>
        <Badge tint="coral">Missed before</Badge>
      </div>
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-ink-soft">
            Card {index + 1} / {total}
          </span>
          <ProgressBar value={(index / total) * 100} label="Review progress" size="sm" className="flex-1" />
        </div>
        <p className="font-display text-xl font-semibold">{card.prompt}</p>
        <div role="radiogroup" aria-label="Answer options" className="flex flex-col gap-2">
          {card.options.map((opt, i) => {
            const isAnswer = checked && i === result.answerIndex;
            const isPicked = i === picked;
            return (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={isPicked}
                disabled={checked || checking}
                onClick={() => setPicked(i)}
                className={cn(
                  'flex items-center gap-3 rounded-xl border-2 border-line bg-paper px-4 py-3 text-left font-semibold transition',
                  !checked && 'hover:-translate-y-0.5 hover:shadow-sticker-sm',
                  isPicked && !checked && 'bg-butter-soft shadow-sticker-sm',
                  isAnswer && 'bg-mint-soft',
                  checked && isPicked && !isAnswer && 'bg-coral-soft',
                )}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-line bg-paper font-display text-sm">
                  {isAnswer ? <Check className="h-4 w-4" /> : checked && isPicked ? <X className="h-4 w-4" /> : letter(i)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>

        {checked ? (
          <div
            className={cn('rounded-xl border-2 border-line px-4 py-3', result.correct ? 'bg-mint-soft' : 'bg-coral-soft')}
            aria-live="polite"
          >
            <p className="font-display font-bold">{result.correct ? 'Right this time!' : 'Not quite.'}</p>
            {result.explanation ? <p className="mt-1">{result.explanation}</p> : null}
            <p className="mt-2 text-sm text-ink-soft">
              {card.wrongAnswer !== null && card.wrongAnswer !== result.answerIndex
                ? `In the quiz you picked ${letter(card.wrongAnswer)}. `
                : ''}
              {result.mastered
                ? 'Mastered. This card leaves your review list.'
                : result.nextLabel
                  ? `Back ${result.nextLabel}.`
                  : ''}
            </p>
          </div>
        ) : null}
        {error ? <Notice tone="error">{error}</Notice> : null}

        <div className="flex flex-wrap justify-end gap-2">
          {checked ? (
            <Button onClick={next}>
              {index + 1 < total ? 'Next card' : 'See my result'} <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <>
              {error ? (
                <Button variant="ghost" onClick={skip}>
                  Skip this card
                </Button>
              ) : null}
              <Button onClick={check} disabled={picked === null || checking}>
                {checking ? 'Checking…' : 'Check answer'}
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
