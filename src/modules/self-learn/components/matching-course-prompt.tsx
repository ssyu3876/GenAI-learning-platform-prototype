'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { ArrowRight, BookOpen, Save } from 'lucide-react';
import { Badge, Button, buttonClasses, Card, CardBody, Notice } from '@/components/ui';
import { useT } from '@/i18n/client';
import { saveCourseRequestDraft } from '../actions';
import type { CourseMatch } from '../library-match';
import type { GenerationRequest } from '../types';

export function MatchingCoursePrompt({
  matches,
  request,
}: {
  matches: CourseMatch[];
  request: GenerationRequest;
}) {
  const t = useT();
  const router = useRouter();
  const [saving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function saveDraft() {
    setError(null);
    startSaving(async () => {
      const result = await saveCourseRequestDraft(request);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.data?.id) router.push(`/create/draft/${result.data.id}`);
    });
  }

  return (
    <Card tint="butter">
      <CardBody className="flex flex-col gap-3">
        <div>
          <p className="font-display text-xl font-bold">{t.selfLearn.matches.title}</p>
          <p className="mt-1 text-sm text-ink-soft">{t.selfLearn.matches.subtitle}</p>
        </div>
        <ul className="flex flex-col gap-2">
          {matches.map((match) => (
            <li key={match.id} className="rounded-xl border-2 border-line/50 bg-paper p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold">
                    <span aria-hidden>{match.emoji}</span> {match.title}
                  </p>
                  <p className="text-sm text-ink-soft">{match.summary}</p>
                  <Badge tint="paper" className="mt-1">
                    {match.subject}
                  </Badge>
                </div>
                <Link href={`/courses/${match.slug}?from=create`} className={buttonClasses('secondary', 'sm')}>
                  <BookOpen className="h-4 w-4" aria-hidden /> {t.selfLearn.matches.view}
                </Link>
              </div>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-3 border-t-2 border-line/30 pt-3">
          <Button type="button" variant="primary" onClick={saveDraft} disabled={saving}>
            <Save className="h-4 w-4" aria-hidden /> {saving ? t.selfLearn.matches.saving : t.selfLearn.matches.none}
          </Button>
          <button
            type="button"
            onClick={() => document.getElementById('topic')?.focus()}
            className="text-sm font-semibold text-ink-soft underline underline-offset-2"
          >
            {t.selfLearn.matches.keepEditing}
          </button>
          <p className="inline-flex items-center gap-1 text-xs text-ink-soft">
            {t.selfLearn.matches.noneHint} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </p>
        </div>
        {error ? <Notice tone="error">{error}</Notice> : null}
      </CardBody>
    </Card>
  );
}
