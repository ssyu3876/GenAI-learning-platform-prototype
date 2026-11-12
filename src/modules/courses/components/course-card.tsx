'use client';

import Link from 'next/link';
import { Clock } from 'lucide-react';
import { asTint, Badge, Card, ProgressBar, TINT_SOLID } from '@/components/ui';
import { useT } from '@/i18n/client';
import type { CourseCardData } from '../queries';
import { courseDuration } from './duration';

export function CourseCard({ course, highlight }: { course: CourseCardData; highlight?: string }) {
  const t = useT();

  const LEVEL_LABEL = {
    beginner: t.courses.card.beginner,
    intermediate: t.courses.card.intermediate,
    advanced: t.courses.card.advanced,
  } as const;

  const AUDIENCE_LABEL = {
    everyone: t.courses.card.forEveryone,
    non_cs: t.courses.card.noCodingNeeded,
    cs: t.courses.card.forCS,
  } as const;

  const tint = asTint(course.color);

  return (
    <Link href={`/courses/${course.slug}`} className="group block focus-visible:outline-none">
      <Card tint={tint} interactive className="flex h-full flex-col overflow-hidden group-focus-visible:ring-4 group-focus-visible:ring-sky">
        <div className="flex items-start gap-3 p-5">
          <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-2 border-line text-3xl ${TINT_SOLID[tint]}`} aria-hidden>
            {course.emoji}
          </div>
          <div className="min-w-0">
            {highlight ? <Badge tint="coral" className="mb-1">{highlight}</Badge> : null}
            <h3 className="text-lg leading-snug font-bold">{course.title}</h3>
            <p className="mt-0.5 text-xs font-semibold text-ink-soft">{course.subject}</p>
          </div>
        </div>
        <p className="line-clamp-3 px-5 text-sm text-ink-soft">{course.summary}</p>
        <div className="mt-auto flex flex-col gap-3 p-5">
          <div className="flex flex-wrap gap-1.5">
            <Badge tint="paper">{LEVEL_LABEL[course.level]}</Badge>
            <Badge tint="paper">{AUDIENCE_LABEL[course.audience]}</Badge>
            <Badge tint="paper">
              <Clock className="h-3 w-3" /> {courseDuration(course.estimatedMinutes, t)}
            </Badge>
          </div>
          {course.progress && (course.enrolled || course.progress.done > 0) ? (
            <div>
              <div className="mb-1 flex justify-between text-xs font-semibold">
                <span>{course.progress.percent === 100 ? t.courses.card.completed : t.courses.card.inProgress}</span>
                <span>
                  {course.progress.done}/{course.progress.total} {t.chrome.common.lessons}
                </span>
              </div>
              <ProgressBar
                value={course.progress.percent}
                label={t.courses.card.progressLabel.replace('{title}', course.title)}
                size="sm"
                tint={course.progress.percent === 100 ? 'mint' : 'butter'}
              />
            </div>
          ) : null}
        </div>
      </Card>
    </Link>
  );
}
