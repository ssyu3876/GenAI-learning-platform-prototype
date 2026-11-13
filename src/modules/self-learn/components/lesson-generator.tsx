'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, LoaderCircle, RotateCcw } from 'lucide-react';
import { Button, Card, Notice, ProgressBar } from '@/components/ui';
import { useT } from '@/i18n/client';
import { fmt } from '@/i18n/format';
import { generateLessonForSession } from '../actions';

export function LessonGenerator({
  sessionId,
  lessonTitles,
  initialGenerated,
}: {
  sessionId: string;
  lessonTitles: string[];
  initialGenerated: number;
}) {
  const t = useT();
  const router = useRouter();
  const [generated, setGenerated] = useState(initialGenerated);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const started = useRef(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    if (!started.current && initialGenerated < lessonTitles.length) {
      started.current = true;
      void run();
    }
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run() {
    if (running) return;
    setRunning(true);
    setError(null);
    try {
      while (alive.current) {
        const result = await generateLessonForSession(sessionId);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setGenerated(result.data?.generated ?? generated);
        if (result.data?.done) {
          router.push(`/create/feedback/${sessionId}`);
          router.refresh();
          return;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.selfLearn.generate.error);
    } finally {
      setRunning(false);
    }
  }

  const percent = lessonTitles.length ? Math.round((generated / lessonTitles.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      <Card tint="lilac" className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{t.selfLearn.generate.title}</h1>
            <p className="mt-1 text-sm text-ink-soft">{t.selfLearn.generate.subtitle}</p>
          </div>
          <span className="text-sm font-bold">
            {fmt(t.selfLearn.generate.progress, { done: generated, total: lessonTitles.length })}
          </span>
        </div>
        <div className="mt-4">
          <ProgressBar value={percent} label={t.selfLearn.generate.progressLabel} />
        </div>
        <p className="mt-2 text-xs text-ink-soft">{running ? t.selfLearn.generate.waiting : t.selfLearn.generate.ready}</p>
      </Card>

      {error ? (
        <Notice tone="error">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{error}</span>
            <Button type="button" variant="butter" size="sm" onClick={() => void run()}>
              <RotateCcw className="h-4 w-4" /> {t.selfLearn.generate.retry}
            </Button>
          </div>
        </Notice>
      ) : null}

      <ol className="flex flex-col gap-2">
        {lessonTitles.map((title, index) => {
          const done = index < generated;
          const current = index === generated && running;
          return (
            <li key={`${title}-${index}`}>
              <Card className="flex items-center gap-3 p-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-line bg-paper">
                  {done ? <Check className="h-4 w-4" /> : current ? <LoaderCircle className="h-4 w-4 animate-spin" /> : index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display font-semibold">{title}</span>
                  <span className="text-xs text-ink-soft">
                    {done ? t.selfLearn.generate.lessonDone : current ? t.selfLearn.generate.lessonWriting : t.selfLearn.generate.lessonWaiting}
                  </span>
                </span>
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
