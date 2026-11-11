'use client';

// Five quick questions from Pip. Answers build the learner profile and recommended path.
import { ChevronLeft } from 'lucide-react';
import { useState, useTransition } from 'react';
import { Button, Card, cn, Notice, PipSays, type PipMood } from '@/components/ui';
import { useT } from '@/i18n/client';
import type { Translations } from '@/i18n';
import { fmt } from '@/i18n/format';
import { completeOnboarding } from '../actions';
import { INTEREST_OPTIONS, type OnboardingAnswers } from '../recommend';

type Step =
  | { key: 'background'; question: string; mood: PipMood; options: { value: OnboardingAnswers['background']; label: string; note: string }[] }
  | { key: 'codingLevel'; question: string; mood: PipMood; options: { value: OnboardingAnswers['codingLevel']; label: string; note: string }[] }
  | { key: 'goal'; question: string; mood: PipMood; options: { value: OnboardingAnswers['goal']; label: string; note: string }[] }
  | { key: 'interests'; question: string; mood: PipMood }
  | { key: 'style'; question: string; mood: PipMood; options: { value: OnboardingAnswers['style']; label: string; note: string }[] };

function buildSteps(t: Translations): Step[] {
  const q = t.onboarding.flow.questions;
  return [
    {
      key: 'background',
      question: q.background.greeting,
      mood: 'happy',
      options: [
        { value: 'non_cs', ...q.background.options.outsideComputing },
        { value: 'cs_student', ...q.background.options.csStudent },
        { value: 'cs_graduate', ...q.background.options.csGraduate },
        { value: 'other', ...q.background.options.somethingElse },
      ],
    },
    {
      key: 'codingLevel',
      question: q.codingLevel.question,
      mood: 'think',
      options: [
        { value: 0, ...q.codingLevel.options.never },
        { value: 1, ...q.codingLevel.options.aLittle },
        { value: 2, ...q.codingLevel.options.someProjects },
        { value: 3, ...q.codingLevel.options.regularly },
      ],
    },
    {
      key: 'goal',
      question: q.goal.question,
      mood: 'wow',
      options: [
        { value: 'understand', ...q.goal.options.understand },
        { value: 'career', ...q.goal.options.career },
        { value: 'build', ...q.goal.options.build },
        { value: 'ai_skills', ...q.goal.options.aiSkills },
      ],
    },
    { key: 'interests', question: q.interests.question, mood: 'cheer' },
    {
      key: 'style',
      question: q.style.question,
      mood: 'happy',
      options: [
        { value: 'concepts', ...q.style.options.concepts },
        { value: 'hands_on', ...q.style.options.handsOn },
      ],
    },
  ];
}

export function OnboardingFlow({ name }: { name: string }) {
  const t = useT();
  const STEPS = buildSteps(t);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<OnboardingAnswers>>({ interests: [] });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const current = STEPS[step]!;
  const first = name.split(' ')[0] ?? name;

  function choose(key: keyof OnboardingAnswers, value: unknown) {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    if (step < STEPS.length - 1) setStep(step + 1);
    else finish(next);
  }

  function toggleInterest(id: string) {
    const list = answers.interests ?? [];
    setAnswers({ ...answers, interests: list.includes(id) ? list.filter((i) => i !== id) : list.length < 3 ? [...list, id] : list });
  }

  function finish(final: Partial<OnboardingAnswers>) {
    setError(null);
    startTransition(async () => {
      try {
        await completeOnboarding(final as OnboardingAnswers);
      } catch (err) {
        // redirect() surfaces as an error with a NEXT_REDIRECT digest; Next handles it, so ignore it
        const digest = err && typeof err === 'object' && 'digest' in err ? String(err.digest) : '';
        if (!digest.startsWith('NEXT_REDIRECT')) setError(t.onboarding.flow.saveError);
      }
    });
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-6">
      <div
        className="flex items-center gap-2"
        aria-label={fmt(t.onboarding.flow.questionProgress, { current: step + 1, total: STEPS.length })}
      >
        {STEPS.map((s, i) => (
          <span key={s.key} className={cn('h-3 flex-1 rounded-pill border-2 border-line', i < step ? 'bg-mint' : i === step ? 'bg-butter' : 'bg-paper')} />
        ))}
      </div>

      <PipSays mood={pending ? 'think' : current.mood} size={96} className="animate-pop" key={current.key}>
        <p className="font-display text-xl font-bold">
          {step === 0 ? fmt(current.question, { name: first }) : current.question}
        </p>
      </PipSays>

      <Card className="p-5">
        {pending ? (
          <p className="py-8 text-center font-display text-lg font-semibold">{t.onboarding.flow.planting}</p>
        ) : current.key === 'interests' ? (
          <div className="flex flex-col gap-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {INTEREST_OPTIONS.map((o) => {
                const on = answers.interests?.includes(o.id);
                return (
                  <button
                    key={o.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleInterest(o.id)}
                    className={cn('rounded-xl border-2 border-line px-4 py-3 text-left font-display font-semibold transition', on ? 'bg-butter shadow-sticker-sm' : 'bg-paper hover:bg-butter-soft')}
                  >
                    {on ? '✓ ' : ''}
                    {t.onboarding.flow.questions.interests.options[o.id]}
                  </button>
                );
              })}
            </div>
            <Button className="self-end" onClick={() => setStep(step + 1)}>
              {answers.interests?.length ? t.chrome.common.next : t.onboarding.flow.skipForNow}
            </Button>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {current.options.map((o) => (
              <button
                key={String(o.value)}
                type="button"
                onClick={() => choose(current.key, o.value)}
                className={cn(
                  'flex flex-col rounded-xl border-2 border-line bg-paper px-4 py-3 text-left transition hover:-translate-y-0.5 hover:bg-butter-soft hover:shadow-sticker-sm',
                  answers[current.key] === o.value && 'bg-butter-soft',
                )}
              >
                <span className="font-display font-semibold">{o.label}</span>
                <span className="text-sm text-ink-soft">{o.note}</span>
              </button>
            ))}
          </div>
        )}
        {error ? <Notice tone="error" className="mt-4">{error}</Notice> : null}
      </Card>

      {step > 0 && !pending ? (
        <Button variant="ghost" className="self-start" onClick={() => setStep(step - 1)}>
          <ChevronLeft className="h-4 w-4" /> {t.chrome.common.back}
        </Button>
      ) : null}
    </div>
  );
}
