import Link from 'next/link';
import { Play } from 'lucide-react';
import type { HomeWidgetProps } from '@/core/types';
import { asTint, buttonClasses, Card, CardBody, CardHeader, EmptyState, ProgressBar } from '@/components/ui';
import { getT } from '@/i18n';
import { fmt } from '@/i18n/format';
import { getContinueTarget } from '../queries';

export async function ContinueWidget({ user }: HomeWidgetProps) {
  const { t } = await getT();

  const target = await getContinueTarget(user.id);
  if (!target) {
    return (
      <Card className="h-full">
        <CardHeader title={t.courses.continue.title} />
        <CardBody>
          <EmptyState
            title={t.courses.continue.nothingInProgress}
            mood="sleepy"
            action={
              <Link href="/courses" className={buttonClasses('primary', 'sm')}>
                {t.courses.continue.pickCourse}
              </Link>
            }
          >
            {t.courses.continue.hint}
          </EmptyState>
        </CardBody>
      </Card>
    );
  }
  const { course, lesson, lessonNumber, percent } = target;
  return (
    <Card tint={asTint(course.color)} className="h-full">
      <CardHeader title={t.courses.continue.title} subtitle={`${course.emoji} ${course.title}`} />
      <CardBody className="flex flex-col gap-4">
        <div>
          <div className="text-sm font-semibold text-ink-soft">
            {fmt(t.courses.continue.lessonOf, { current: lessonNumber, total: course.lessons.length })}
          </div>
          <div className="font-display text-xl font-bold">{lesson.title}</div>
        </div>
        <ProgressBar value={percent} label={t.courses.continue.progressLabel} />
        <Link href={`/courses/${course.slug}/lessons/${lesson.id}`} className={buttonClasses('primary', 'md', 'self-start')}>
          <Play className="h-4 w-4" /> {t.courses.continue.button} ({lesson.estimatedMinutes} {t.chrome.common.minutes})
        </Link>
      </CardBody>
    </Card>
  );
}
